// The recording / replaying transport of the experiment. It replaces `transport.post` of
// web/server/models.ts, so every network call of the system under test goes through this file.
//
//   * a successful call is written to <cache>/<service>/<sha256>.json, where the key is the
//     sha256 of the canonical JSON {service, url, body};
//   * a cache hit, and an offline replay, return the recorded response with the latency of the
//     original call, so a live run and an offline replay give exactly the same numbers;
//   * a provider error (a bad HTTP status, a broken connection, or a chat answer with no text) is tried again at most
//     MAX_RETRIES times, after a short pause;
//   * a call that still fails is never cached: the failure is written under <out>/failures/ with the number of attempts, the
//     run continues with the other requests, and a later run makes the call again;
//   * at most `jevWorkers` Jev calls and `llmWorkers` LLM calls are in flight at the same time.
//
// The real network call is the `post` of web/server/models.ts that this file replaces, so the
// credentials, the timeout, and the error messages of the demo are the ones that run here.
//
// `withCallLog` gives the calls made inside one step. The pipeline uses it for the tokens of the
// LLM calls (`models.ts` `chat()` returns the text only) and for the raw Jev JSON (`models.ts`
// `classify()` drops the `confidence` that Jev reports, which the calibration table needs).
import { AsyncLocalStorage } from "node:async_hooks"
import { createHash } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { ACTIONS, PRIORITIES, QUEUES } from "../web/src/types"
import { ApiError, JEV_URL, LLM_URL, transport } from "../web/server/models"

export type Service = "jev" | "llm"

/** One call of a model, as the transport saw it. */
export interface CallNote {
  service: Service
  latencyS: number
  inputTokens: number
  outputTokens: number
  /** True when the answer came from the cache (or from an offline replay) instead of the network. */
  cached: boolean
  /** The response JSON as the provider sent it. */
  raw: unknown
}

/** A call that the provider failed, or whose body was unusable, after MAX_RETRIES new tries. Never cached. */
export interface FailureRecord {
  service: Service
  url: string
  error: string
  started_utc: string
}

export interface ServiceCounters {
  live: number
  cacheHits: number
  failures: number
  maxInFlight: number
}

export interface TransportOptions {
  /** The evidence directory of the run: the failures are written to <out>/failures/. */
  out: string
  /** The directory of the recorded calls: <cache>/<service>/<sha256>.json. All runs of one experiment share it. */
  cache: string
  offline: boolean
  jevWorkers: number
  llmWorkers: number
}

export interface TransportHandle {
  counters: Record<Service, ServiceCounters>
  failures: readonly FailureRecord[]
  /** The `model` field of every answer the provider sent, in the sequence they were seen. */
  modelsSeen: () => string[]
}

const callLog = new AsyncLocalStorage<CallNote[]>()

/** How many times one call is tried again after a provider error or an empty answer, and the pause before each new try, in ms. */
export const MAX_RETRIES = 2
const RETRY_PAUSE_MS = 500

/** Run `fn` and collect the model calls it makes. Nested calls collect their own calls only. */
export function withCallLog<T>(fn: () => Promise<T>): Promise<{ result: T; calls: CallNote[] }> {
  const calls: CallNote[] = []
  return callLog.run(calls, async () => ({ result: await fn(), calls }))
}

/** The stable JSON of a value: object keys sorted, so the same request always gives the same key. */
function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted)
  if (typeof value === "object" && value !== null) {
    const source = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(source).sort()) out[key] = sorted(source[key])
    return out
  }
  return value
}

/** The id of a call in the cache: the sha256 of the canonical JSON {service, url, body}. */
export function cacheKey(service: Service, url: string, body: unknown): string {
  return createHash("sha256").update(JSON.stringify(sorted({ service, url, body }))).digest("hex")
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

const numberOf = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : 0
}

function serviceOf(url: string): Service {
  if (url === JEV_URL) return "jev"
  if (url === LLM_URL) return "llm"
  throw new ApiError(`the experiment knows no service for ${url}`)
}

/** The tokens of one answer, in the names the provider uses. */
function usageOf(service: Service, json: unknown): { inputTokens: number; outputTokens: number } {
  if (!isObject(json)) return { inputTokens: 0, outputTokens: 0 }
  const usage = isObject(json.usage) ? json.usage : {}
  return service === "jev"
    ? { inputTokens: numberOf(usage.input_tokens), outputTokens: numberOf(usage.output_tokens) }
    : { inputTokens: numberOf(usage.prompt_tokens), outputTokens: numberOf(usage.completion_tokens) }
}

interface CacheRecord {
  service: Service
  url: string
  body: unknown
  response: unknown
  latency_s: number
  started_utc: string
  http_status: number
}

interface State {
  out: string
  cache: string
  offline: boolean
  live: <T>(url: string, body: unknown) => Promise<{ json: T; latencyS: number }>
  gates: Record<Service, <T>(fn: () => Promise<T>) => Promise<T>>
  inFlight: Record<Service, number>
  counters: Record<Service, ServiceCounters>
  modelsSeen: Set<string>
  failures: FailureRecord[]
}

let state: State | null = null

/** A gate that lets at most `size` calls run at the same time. */
function gate(size: number): <T>(fn: () => Promise<T>) => Promise<T> {
  let free = Math.max(1, Math.floor(size))
  const waiters: (() => void)[] = []
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (free > 0) free--
    else {
      const { promise, resolve } = Promise.withResolvers<void>()
      waiters.push(resolve)
      await promise
    }
    try {
      return await fn()
    } finally {
      const next = waiters.shift()
      if (next) next()
      else free++
    }
  }
}

/** Put the recording transport in place of the one of web/server/models.ts. */
export function installRecordedTransport(options: TransportOptions): TransportHandle {
  if (state) throw new Error("the recording transport is already installed")
  state = {
    out: options.out,
    cache: options.cache,
    offline: options.offline,
    live: transport.post,
    gates: { jev: gate(options.jevWorkers), llm: gate(options.llmWorkers) },
    inFlight: { jev: 0, llm: 0 },
    counters: {
      jev: { live: 0, cacheHits: 0, failures: 0, maxInFlight: 0 },
      llm: { live: 0, cacheHits: 0, failures: 0, maxInFlight: 0 },
    },
    modelsSeen: new Set<string>(),
    failures: [],
  }
  transport.post = recordedPost
  const installed = state
  return {
    counters: installed.counters,
    failures: installed.failures,
    modelsSeen: () => [...installed.modelsSeen],
  }
}

function note(service: Service, response: unknown, latencyS: number, cached: boolean): void {
  const { inputTokens, outputTokens } = usageOf(service, response)
  callLog.getStore()?.push({ service, latencyS, inputTokens, outputTokens, cached, raw: response })
  if (state && isObject(response) && typeof response.model === "string") state.modelsSeen.add(response.model)
}

/** The shape the system under test reads. A body that does not match is a failed call, not a cache hit. */
function validate(service: Service, json: unknown): void {
  if (!isObject(json)) throw new ApiError(`${service}: the response body is not a JSON object`)
  if (service === "jev") {
    const answers = json.answers
    if (!isObject(answers)) throw new ApiError("jev: the response has no answers")
    const choice = (name: string, options: readonly string[]): void => {
      const a = answers[name]
      if (!isObject(a)) throw new ApiError(`jev: the response has no answer for ${name}`)
      if (typeof a.choice !== "string" || !options.includes(a.choice)) throw new ApiError(`jev: answer ${name} is not a valid choice`)
      if (!isObject(a.probabilities)) throw new ApiError(`jev: answer ${name} has no probabilities`)
    }
    choice("queue", QUEUES)
    choice("action", ACTIONS)
    choice("priority", PRIORITIES)
    for (const name of ["risk", "injection"]) {
      const a = answers[name]
      const p = isObject(a) ? a.noul : undefined
      if (typeof p !== "number" && typeof p !== "string") throw new ApiError(`jev: the response has no answer for ${name}`)
      if (!(numberOf(p) >= 0 && numberOf(p) <= 1)) throw new ApiError(`jev: answer ${name} is not a chance`)
    }
    if (!isObject(json.usage)) throw new ApiError("jev: the response has no usage")
    return
  }
  if (isObject(json.error)) throw new ApiError(`the LLM returned an error: ${String(json.error.message ?? "provider error")}`)
  const choice = Array.isArray(json.choices) ? json.choices[0] : undefined
  const content = isObject(choice) && isObject(choice.message) ? choice.message.content : undefined
  if (typeof content !== "string" || !content.trim()) throw new ApiError("the LLM returned no text")
}

async function readRecord(path: string, service: Service, url: string, body: unknown): Promise<CacheRecord | null> {
  let text: string
  try {
    text = await readFile(path, "utf8")
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null
    throw new ApiError(`cannot read the cache record ${path}: ${String(err)}`)
  }
  let record: unknown
  try {
    record = JSON.parse(text)
  } catch (err) {
    throw new ApiError(`the cache record ${path} is not JSON: ${String(err)}`)
  }
  if (!isObject(record) || record.service !== service || record.url !== url) throw new ApiError(`the cache record ${path} is not for this call`)
  if (JSON.stringify(sorted(record.body)) !== JSON.stringify(sorted(body))) throw new ApiError(`the cache record ${path} holds another request`)
  const latencyS = typeof record.latency_s === "number" ? record.latency_s : 0
  return { service, url, body, response: record.response, latency_s: latencyS, started_utc: String(record.started_utc), http_status: 200 }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true })
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tmp, `${JSON.stringify(value, null, 1)}\n`, "utf8")
  await rename(tmp, path)
}

async function recordFailure(s: State, failure: FailureRecord & { body: unknown }): Promise<void> {
  s.counters[failure.service].failures++
  s.failures.push({ service: failure.service, url: failure.url, error: failure.error, started_utc: failure.started_utc })
  const name = `${failure.service}-${cacheKey(failure.service, failure.url, failure.body).slice(0, 16)}.json`
  try {
    await writeJson(join(s.out, "failures", name), failure)
  } catch {
    // The failure is kept in memory (provenance) even when the file cannot be written.
  }
}

/** The transport that web/server/models.ts uses from now on: record once, replay for free. */
async function recordedPost<T>(url: string, body: unknown): Promise<{ json: T; latencyS: number }> {
  const s = state
  if (!s) throw new ApiError("the recording transport is not installed")
  const service = serviceOf(url)
  const key = cacheKey(service, url, body)
  const path = join(s.cache, service, `${key}.json`)

  const hit = await readRecord(path, service, url, body)
  if (hit) {
    s.counters[service].cacheHits++
    note(service, hit.response, hit.latency_s, true)
    return { json: hit.response as T, latencyS: hit.latency_s }
  }
  if (s.offline) throw new ApiError(`offline replay: no recorded ${service} call for ${key.slice(0, 16)}`)

  const startedUtc = new Date().toISOString()
  let json: unknown
  let latencyS: number
  let tries = 0
  for (; ;) {
    tries++
    try {
      const answer = await s.gates[service](async () => {
        s.inFlight[service]++
        s.counters[service].maxInFlight = Math.max(s.counters[service].maxInFlight, s.inFlight[service])
        try {
          return await s.live<unknown>(url, body)
        } finally {
          s.inFlight[service]--
        }
      })
      json = answer.json
      latencyS = answer.latencyS
      validate(service, json)
      break
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // A provider error is tried again, at most MAX_RETRIES times, after a short pause: a bad HTTP status, a chat answer with
      // no text, or a broken connection (fetch raises its own error for a closed socket, a timeout, a reset, or a failed TLS
      // handshake).
      const transient = /answered HTTP \d+|the LLM returned no text|socket|fetch failed|timed out|timeout|aborted|ECONNRESET|certificate/i.test(message)
      if (tries <= MAX_RETRIES && transient) {
        const { promise, resolve } = Promise.withResolvers<void>()
        setTimeout(resolve, RETRY_PAUSE_MS * tries)
        await promise
        continue
      }
      const attempts = tries > 1 ? `${tries} attempts: ` : ""
      await recordFailure(s, { service, url, body, error: `${attempts}${message}`, started_utc: startedUtc })
      throw err instanceof ApiError ? err : new ApiError(message)
    }
  }

  s.counters[service].live++
  const record: CacheRecord = { service, url, body, response: json, latency_s: latencyS, started_utc: startedUtc, http_status: 200 }
  await writeJson(path, record)
  note(service, json, latencyS, false)
  return { json: json as T, latencyS }
}
