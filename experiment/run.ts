#!/usr/bin/env bun
// Run the request triage experiment and write the evidence files.
//
//   bun run experiment/run.ts --help
//   bun run experiment/run.ts                      # the whole request set, live calls (recorded on disk)
//   bun run experiment/run.ts --offline            # replay the recorded calls, no network
//   bun run experiment/run.ts --limit 20 --out /tmp/twenty
//
// The run reads <data>/world.csv and <data>/requests.csv (written by experiment/build_dataset.ts), installs the recording
// transport, runs every system through the same pipeline (pipeline.ts) -- Level 2 (the LLM agent of the chat and the written
// rules; no rule of Triage) and Level 3 (Jev with one question per written rule, and the LLM for the final message); --level 3
// runs only Level 3 -- then writes results.json, per_case.json,
// provenance.json, tables/*.tex, and figures/ into <out>. The recorded calls are in <cache>/<service>/<sha256>.json
// (default: <out>/requests). Every request of every system is logged as it finishes.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { useWorld } from "../web/server/saas"
import { LLM_MODEL } from "../web/server/models"
import { classifyWithJev } from "./jev_classifier"
import {
  processAgentRequest, processClassifierRequest,
  type RunRecord, type SystemName,
} from "./pipeline"
import { buildResults, type Results } from "./metrics"
import { pmap } from "./pmap"
import { installRecordedTransport } from "./transport"
import { writeTables } from "./tables"
import { writeFigures } from "./figures"
import { loadDataset, REQUESTS_FILE, WORLD_FILE } from "./dataset"
import type { TestRequest } from "./types"

const HERE = import.meta.dir
const ALL_SYSTEMS: readonly SystemName[] = ["jev", "llm_agent"]
/** The level of the ladder that each system is (Level 1 is the staff reference: no model runs). */
const LEVEL_OF: Record<SystemName, number> = { llm_agent: 2, jev: 3 }

interface Args {
  limit: number | null
  offline: boolean
  jevWorkers: number
  llmWorkers: number
  out: string
  cache: string | null
  data: string
  requests: string
  report: boolean
  systems: readonly SystemName[]
  help: boolean
}

const USAGE = `Usage: bun run experiment/run.ts [options]

Runs the request triage experiment on the requests of experiment/data/requests.csv and writes the evidence files:
results.json, per_case.json, provenance.json, tables/*.tex, figures/.

Options:
  --limit N          use only the first N requests of the set
  --offline          replay the recorded calls; no network, no credentials
  --jev-workers N    Jev calls in flight at the same time (default: 4)
  --llm-workers N    LLM calls in flight at the same time (default: 3)
  --out DIR          evidence directory (default: experiment/results)
  --cache DIR        directory of the recorded calls (default: <out>/requests)
  --data DIR         directory with world.csv and the requests file (default: experiment/data)
  --requests FILE    the requests file of that directory (default: requests.csv)
  --level N          run only Level N (2 or 3); default: both levels
  --no-report        write no tables and no figures
  --help             print this text

A live run records every model answer under <cache>/<service>/<id>.json, with the latency of the
original call, so --offline replays the same numbers. A failed call is never cached: it is
written under <out>/failures/ and the next run makes the call again.
`

function parseArgs(argv: readonly string[]): Args {
  const args: Args = {
    limit: null,
    offline: false,
    jevWorkers: 4,
    llmWorkers: 3,
    out: join(HERE, "results"),
    cache: null,
    data: join(HERE, "data"),
    requests: REQUESTS_FILE,
    report: true,
    systems: ALL_SYSTEMS,
    help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    const value = argv[i + 1]
    const count = (): number => {
      const n = Number(value)
      if (!Number.isInteger(n) || n < 1) throw new Error(`${flag} needs a positive whole number`)
      i++
      return n
    }
    switch (flag) {
      case "--limit":
        args.limit = count()
        break
      case "--jev-workers":
        args.jevWorkers = count()
        break
      case "--llm-workers":
        args.llmWorkers = count()
        break
      case "--level": {
        const system = ALL_SYSTEMS.find((s) => String(LEVEL_OF[s]) === value)
        if (!system) throw new Error("--level needs 2 or 3")
        args.systems = [system]
        i++
        break
      }
      case "--offline":
        args.offline = true
        break
      case "--no-report":
        args.report = false
        break
      case "--out":
        if (!value) throw new Error("--out needs a directory")
        args.out = resolve(value)
        i++
        break
      case "--cache":
        if (!value) throw new Error("--cache needs a directory")
        args.cache = resolve(value)
        i++
        break
      case "--data":
        if (!value) throw new Error("--data needs a directory")
        args.data = resolve(value)
        i++
        break
      case "--requests":
        if (!value) throw new Error("--requests needs a file name")
        args.requests = value
        i++
        break
      case "--help":
      case "-h":
        args.help = true
        break
      default:
        throw new Error(`unknown option ${flag}`)
    }
  }
  return args
}

/** The live calls and the cache hits of the two services, at one moment of the run. */
const snapshot = (c: { jev: { live: number; cacheHits: number }; llm: { live: number; cacheHits: number } }) =>
  ({ jevLive: c.jev.live, jevCacheHits: c.jev.cacheHits, llmLive: c.llm.live, llmCacheHits: c.llm.cacheHits })

const diff = (c: Parameters<typeof snapshot>[0], was: ReturnType<typeof snapshot>) => {
  const now = snapshot(c)
  return {
    jevLive: now.jevLive - was.jevLive, jevCacheHits: now.jevCacheHits - was.jevCacheHits,
    llmLive: now.llmLive - was.llmLive, llmCacheHits: now.llmCacheHits - was.llmCacheHits,
  }
}

const countersText = (c: Parameters<typeof snapshot>[0]): string =>
  `Jev ${c.jev.live} live / ${c.jev.cacheHits} cached, LLM ${c.llm.live} live / ${c.llm.cacheHits} cached`

const log = (message: string): void => void process.stderr.write(`${message}\n`)

/** A request whose model call failed. The run keeps it in per_case.json and goes on. */
interface FailedRecord {
  id: string
  system: SystemName
  category: string
  text: string
  failure: string
}

type CaseEntry = RunRecord | FailedRecord

const isFailedRecord = (entry: CaseEntry): entry is FailedRecord => "failure" in entry

/** One request through one system. A model failure is recorded and does not stop the run. */
async function runOne(request: TestRequest, system: SystemName): Promise<CaseEntry> {
  try {
    return system === "llm_agent" ? await processAgentRequest(request) : await processClassifierRequest(request, classifyWithJev)
  } catch (err) {
    return {
      id: request.id,
      system,
      category: request.category,
      text: request.text,
      failure: err instanceof Error ? err.message : String(err),
    }
  }
}

async function sha256File(path: string): Promise<string> {
  const hasher = new Bun.CryptoHasher("sha256")
  hasher.update(await readFile(path))
  return hasher.digest("hex")
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 1)}\n`, "utf8")
}

async function main(): Promise<number> {
  let args: Args
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (err) {
    log(`${err instanceof Error ? err.message : String(err)}\n\n${USAGE}`)
    return 2
  }
  if (args.help) {
    log(USAGE)
    return 0
  }

  const worldPath = join(args.data, WORLD_FILE)
  const requestsPath = join(args.data, args.requests)
  const dataset = await loadDataset(args.data, args.requests).catch((err: unknown) => {
    log(err instanceof Error ? err.message : String(err))
    return null
  })
  if (dataset === null) return 2
  const { world, requests: all } = dataset
  useWorld(world)
  const requests = args.limit === null ? all : all.slice(0, args.limit)
  if (!requests.length) {
    log(`no request in ${requestsPath}`)
    return 2
  }

  const cache = args.cache ?? join(args.out, "requests")
  await mkdir(args.out, { recursive: true })
  const handle = installRecordedTransport({ out: args.out, cache, offline: args.offline, jevWorkers: args.jevWorkers, llmWorkers: args.llmWorkers })
  log(`${requests.length} requests, ${args.offline ? "offline replay" : "live calls"}; evidence in ${args.out}`)

  // The calls of each phase of the run: the live calls and the cache hits that each system made.
  const phases: { phase: string; jevLive: number; jevCacheHits: number; llmLive: number; llmCacheHits: number }[] = []
  let before = snapshot(handle.counters)
  const cases: Record<SystemName, CaseEntry[]> = { jev: [], llm_agent: [] }
  const ran: Record<SystemName, number> = { jev: 0, llm_agent: 0 }
  for (const system of args.systems) {
    let finished = 0
    const entries = await pmap(requests, Math.max(args.jevWorkers, args.llmWorkers), async (request) => {
      const entry = await runOne(request, system)
      finished++
      log(`  ${system} ${finished}/${requests.length} ${request.id}${isFailedRecord(entry) ? ` FAILED: ${entry.failure}` : ""}`)
      return entry
    })
    cases[system] = entries
    ran[system] = entries.filter((entry) => !isFailedRecord(entry)).length
    log(`  ${system}: ${ran[system]}/${entries.length} requests ran (${countersText(handle.counters)} so far)`)
    phases.push({ phase: system, ...diff(handle.counters, before) })
    before = snapshot(handle.counters)
  }

  const records = args.systems.flatMap((system) => cases[system].filter((entry): entry is RunRecord => !isFailedRecord(entry)))
  const failedRequests = args.systems.reduce((total, system) => total + cases[system].filter(isFailedRecord).length, 0)
  const results: Results = buildResults({
    limit: args.limit,
    offline: args.offline,
    records,
    failedRequests,
    requests,
    world,
  })

  await writeJson(join(args.out, "results.json"), results)
  await writeJson(join(args.out, "per_case.json"), {
    generated_utc: results.generated_utc,
    offline: args.offline,
    jev: cases.jev,
    llm_agent: cases.llm_agent,
  })
  const written = args.report ? [...(await writeTables(args.out, results)), ...(await writeFigures(args.out, results))] : []

  const codeFiles = [
    ...(await readdir(HERE)).filter((name) => name.endsWith(".ts")).map((name) => join(HERE, name)),
    join(HERE, "..", "web", "server", "saas.ts"),
    join(HERE, "..", "web", "server", "steps.ts"),
    join(HERE, "..", "web", "server", "models.ts"),
    join(HERE, "..", "web", "src", "types.ts"),
  ]
  const codeSha = Object.fromEntries(await Promise.all(codeFiles.map(async (path) => [path.slice(path.lastIndexOf("/") + 1), await sha256File(path)] as const)))
  await writeJson(join(args.out, "provenance.json"), {
    finished_utc: new Date().toISOString(),
    runtime: `bun ${Bun.version}`,
    offline: args.offline,
    limit: args.limit,
    data_dir: args.data,
    out_dir: args.out,
    cache_dir: cache,
    requests: { selected: requests.length, ran, failed: failedRequests },
    models_seen: handle.modelsSeen().sort(),
    jev_request_model: "jev-latest",
    llm_model: LLM_MODEL,
    llm_settings: { temperature: 0.3, max_tokens: 4000, reasoning_effort: "high", stream: false },
    dataset_sha256: { [WORLD_FILE]: await sha256File(worldPath), [args.requests]: await sha256File(requestsPath) },
    code_sha256: codeSha,
    calls: {
      jev_live: handle.counters.jev.live,
      jev_cache_hits: handle.counters.jev.cacheHits,
      llm_live: handle.counters.llm.live,
      llm_cache_hits: handle.counters.llm.cacheHits,
      by_phase: phases,
      jev_max_in_flight: handle.counters.jev.maxInFlight,
      llm_max_in_flight: handle.counters.llm.maxInFlight,
    },
    failure_records: handle.failures.length,
    failures: handle.failures,
    tables: written,
    note:
      "Latencies in a cached record are those of the original call, so an offline replay gives the same numbers. " +
      "A failure record is a call that the provider answered with an error or with a body the system cannot read; " +
      "it is never cached. The llm_settings are the ones of web/server/models.ts chat().",
  })

  for (const system of args.systems) {
    const summary = results.systems[system]
    log(
      `  ${system}: served ${summary.served}, stopped ${summary.stopped}, errors ${summary.errors}, ` +
        `harmful ${summary.harmful}, nothing ran ${(100 * summary.blockRate).toFixed(1)}%, ` +
        `machine ${summary.machineSeconds.mean.toFixed(2)} s, API $${summary.apiCostPer1000.toFixed(2)} per 1000 requests, ` +
        `decision ${(1000 * summary.decisionLatency.median).toFixed(0)} ms median`,
    )
  }
  if (failedRequests) log(`WARNING: ${failedRequests} request(s) failed; the failures are listed in provenance.json and per_case.json`)
  log(`done: results.json, per_case.json, provenance.json${args.report ? `, ${written.length} tables and figures` : ""} in ${args.out}`)
  return failedRequests ? 1 : 0
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    log(`the run failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`)
    process.exit(1)
  },
)
