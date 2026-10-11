// The payload inspector of the demo: every model call that the server makes is recorded with the exact JSON that went out and
// the exact JSON that came back. The recording sits around `transport.post` of models.ts, so the flow code is not changed and the
// experiment (a separate process with its own transport) is not touched.
import { AsyncLocalStorage } from "node:async_hooks"
import { callCost } from "../../experiment/pipeline"
import type { CallTrace } from "../src/types"
import { JEV_URL, transport } from "./models"

const log = new AsyncLocalStorage<CallTrace[]>()

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null
const count = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0)

/** Record every call of `transport.post` into the log of the `traced()` call that is running. Call it once, at the start of the server. */
export function installTrace(): void {
  const inner = transport.post
  transport.post = async <T>(url: string, body: unknown) => {
    const out = await inner<T>(url, body)
    const calls = log.getStore()
    if (calls) {
      const service = url === JEV_URL ? "jev" : "llm"
      const json = out.json as unknown
      const usage = isObject(json) && isObject(json.usage) ? json.usage : {}
      const inputTokens = count(service === "jev" ? usage.input_tokens : usage.prompt_tokens)
      const outputTokens = count(service === "jev" ? usage.output_tokens : usage.completion_tokens)
      calls.push({
        service, url, model: isObject(json) && typeof json.model === "string" ? json.model : String(isObject(body) ? body.model : ""),
        request: body, response: json, latencyS: out.latencyS, inputTokens, outputTokens, costUsd: callCost(service, inputTokens, outputTokens),
      })
    }
    return out
  }
}

/** Run `fn` and return its result with the model calls that it made, in order. */
export async function traced<T>(fn: () => Promise<T>): Promise<{ result: T; calls: CallTrace[] }> {
  const calls: CallTrace[] = []
  const result = await log.run(calls, fn)
  return { result, calls }
}

/** The one call of a `traced()` run that must have made exactly one call. */
export function onlyCall(calls: readonly CallTrace[]): CallTrace {
  if (calls.length !== 1) throw new Error(`expected one model call, saw ${calls.length}`)
  return calls[0]
}
