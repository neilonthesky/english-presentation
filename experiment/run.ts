#!/usr/bin/env bun
// Run the request triage experiment and write the evidence files.
//
//   bun run experiment/run.ts --help
//   bun run experiment/run.ts                      # the test split, live calls (recorded on disk)
//   bun run experiment/run.ts --offline            # replay the recorded calls, no network
//   bun run experiment/run.ts --split dev --limit 20 --out /tmp/dev
//   CONFIDENCE_FLOOR=0.7 CLARIFY_ROUNDS=0 bun run experiment/run.ts --split dev --out /tmp/dev
//
// The run reads <data>/world.csv and <data>/requests.csv (written by experiment/build_dataset.ts), installs the recording
// transport, runs every system through the same pipeline (pipeline.ts) -- rung 2 (Jev, the LLM, the rules of Triage, and
// support staff), rung 1 (the same LLM as the classifier, the written rules, and no support staff), and the classifier
// reference run "llm" (the same LLM with the rules of Triage and support staff; it is not a rung, it gives the LLM side of the
// stage table) -- then runs the fault injection and writes results.json, per_case.json,
// provenance.json, tables/*.tex, and figures/ into <out>. The two parameters of Triage are the environment variables
// CONFIDENCE_FLOOR and CLARIFY_ROUNDS (web/server/saas.ts): a sweep runs this file once per pair. The recorded calls are in
// <cache>/<service>/<sha256>.json (default: <out>/requests).
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { CLARIFY_ROUNDS, CONFIDENCE_FLOOR, useWorld } from "../web/server/saas"
import { LLM_MODEL } from "../web/server/models"
import { classifyWithJev, classifyWithLlm, type Classify } from "./llm_classifier"
import { classifierService, processRequest, type RequestRecord, type SystemName } from "./pipeline"
import { buildResults, type Results } from "./metrics"
import { runFaultInjection } from "./faults"
import { installRecordedTransport } from "./transport"
import { writeTables } from "./tables"
import { writeFigures } from "./figures"
import { loadDataset, REQUESTS_FILE, WORLD_FILE } from "./dataset"
import type { TestRequest } from "./types"

const HERE = import.meta.dir
const SYSTEMS: readonly SystemName[] = ["jev", "llm", "llm_rules"]

/** The classifier of a system: Jev at rung 2, the LLM at rung 1 and in the classifier reference run. */
const classifierOf = (system: SystemName): Classify => (system === "jev" ? classifyWithJev : classifyWithLlm)

interface Args {
  split: "test" | "dev"
  limit: number | null
  offline: boolean
  jevWorkers: number
  llmWorkers: number
  out: string
  cache: string | null
  data: string
  report: boolean
  help: boolean
}

const USAGE = `Usage: [CONFIDENCE_FLOOR=0.6] [CLARIFY_ROUNDS=1] bun run experiment/run.ts [options]

Runs the request triage experiment on the requests of one split and writes the evidence files:
results.json, per_case.json, provenance.json, tables/*.tex, figures/ (the last two read the sweeps in <out>/sweep and <out>/sweep_dev).

Options:
  --split test|dev   the split to run (default: test)
  --limit N          use only the first N requests of the split
  --offline          replay the recorded calls; no network, no credentials
  --jev-workers N    Jev calls in flight at the same time (default: 4)
  --llm-workers N    LLM calls in flight at the same time (default: 3)
  --out DIR          evidence directory (default: experiment/results)
  --cache DIR        directory of the recorded calls (default: <out>/requests)
  --data DIR         directory with world.csv and requests.csv (default: experiment/data)
  --no-report        write no tables and no figures (the runs of a sweep)
  --help             print this text

CONFIDENCE_FLOOR and CLARIFY_ROUNDS set the two parameters of Triage (web/server/saas.ts; defaults 0.6 and 1).

A live run records every model answer under <cache>/<service>/<id>.json, with the latency of the
original call, so --offline replays the same numbers. A failed call is never cached: it is
written under <out>/failures/ and the next run makes the call again.
`

function parseArgs(argv: readonly string[]): Args {
  const args: Args = {
    split: "test",
    limit: null,
    offline: false,
    jevWorkers: 4,
    llmWorkers: 3,
    out: join(HERE, "results"),
    cache: null,
    data: join(HERE, "data"),
    report: true,
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
      case "--split":
        if (value !== "test" && value !== "dev") throw new Error("--split must be test or dev")
        args.split = value
        i++
        break
      case "--limit":
        args.limit = count()
        break
      case "--jev-workers":
        args.jevWorkers = count()
        break
      case "--llm-workers":
        args.llmWorkers = count()
        break
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

const log = (message: string): void => void process.stderr.write(`${message}\n`)

/** A request whose model call failed. The run keeps it in per_case.json and goes on. */
interface FailedRecord {
  id: string
  system: SystemName
  category: string
  text: string
  failure: string
}

type CaseEntry = RequestRecord | FailedRecord

const isFailedRecord = (entry: CaseEntry): entry is FailedRecord => "failure" in entry

/** Run `fn` over the items with at most `workers` calls in flight; the results keep their sequence. */
async function pmap<T, R>(items: readonly T[], workers: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0
  const runner = async (): Promise<void> => {
    for (;;) {
      const index = next++
      if (index >= items.length) return
      out[index] = await fn(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, workers), items.length) }, runner))
  return out
}

/** One request through one system. A model failure is recorded and does not stop the run. */
async function runOne(request: TestRequest, system: SystemName): Promise<CaseEntry> {
  try {
    return await processRequest(request, system, classifierOf(system))
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
  // A mistyped value would switch the floor or Clarify off without a word.
  if (!Number.isFinite(CONFIDENCE_FLOOR) || CONFIDENCE_FLOOR < 0 || CONFIDENCE_FLOOR > 1) {
    log(`CONFIDENCE_FLOOR must be a number from 0 to 1 (got ${process.env.CONFIDENCE_FLOOR})`)
    return 2
  }
  if (!Number.isInteger(CLARIFY_ROUNDS) || CLARIFY_ROUNDS < 0) {
    log(`CLARIFY_ROUNDS must be a whole number, 0 or more (got ${process.env.CLARIFY_ROUNDS})`)
    return 2
  }

  const worldPath = join(args.data, WORLD_FILE)
  const requestsPath = join(args.data, REQUESTS_FILE)
  const dataset = await loadDataset(args.data).catch((err: unknown) => {
    log(err instanceof Error ? err.message : String(err))
    return null
  })
  if (dataset === null) return 2
  const { world, requests: all } = dataset
  useWorld(world)
  const split = all.filter((request) => request.split === args.split)
  const requests = args.limit === null ? split : split.slice(0, args.limit)
  if (!requests.length) {
    log(`no request of the ${args.split} split in ${requestsPath}`)
    return 2
  }

  const cache = args.cache ?? join(args.out, "requests")
  await mkdir(args.out, { recursive: true })
  const handle = installRecordedTransport({ out: args.out, cache, offline: args.offline, jevWorkers: args.jevWorkers, llmWorkers: args.llmWorkers })
  log(`${requests.length} requests of the ${args.split} split, floor ${CONFIDENCE_FLOOR}, Clarify rounds ${CLARIFY_ROUNDS}, ${args.offline ? "offline replay" : "live calls"}; evidence in ${args.out}`)

  const cases: Record<SystemName, CaseEntry[]> = { jev: [], llm: [], llm_rules: [] }
  const ran: Record<SystemName, number> = { jev: 0, llm: 0, llm_rules: 0 }
  for (const system of SYSTEMS) {
    const entries = await pmap(requests, Math.max(args.jevWorkers, args.llmWorkers), (request) => runOne(request, system))
    cases[system] = entries
    ran[system] = entries.filter((entry) => !isFailedRecord(entry)).length
    const counters = handle.counters[classifierService(system)]
    log(`  ${system}: ${ran[system]}/${entries.length} requests ran (${counters.live} live calls, ${counters.cacheHits} cache hits so far)`)
  }

  const records = SYSTEMS.flatMap((system) => cases[system].filter((entry): entry is RequestRecord => !isFailedRecord(entry)))
  const failedRequests = SYSTEMS.reduce((total, system) => total + cases[system].filter(isFailedRecord).length, 0)
  const fault = await runFaultInjection(world)
  const results: Results = buildResults({
    split: args.split,
    limit: args.limit,
    offline: args.offline,
    parameters: { floor: CONFIDENCE_FLOOR, rounds: CLARIFY_ROUNDS },
    records,
    failedRequests,
    requests,
    world,
    fault,
  })

  await writeJson(join(args.out, "results.json"), results)
  await writeJson(join(args.out, "per_case.json"), {
    split: args.split,
    parameters: results.parameters,
    generated_utc: results.generated_utc,
    offline: args.offline,
    jev: cases.jev,
    llm: cases.llm,
    llm_rules: cases.llm_rules,
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
    split: args.split,
    limit: args.limit,
    parameters: results.parameters,
    data_dir: args.data,
    out_dir: args.out,
    cache_dir: cache,
    requests: { selected: requests.length, ran, failed: failedRequests },
    models_seen: handle.modelsSeen().sort(),
    jev_request_model: "jev-latest",
    llm_model: LLM_MODEL,
    llm_settings: { temperature: 0.3, max_tokens: 4000, reasoning_effort: "high", stream: false },
    dataset_sha256: { [WORLD_FILE]: await sha256File(worldPath), [REQUESTS_FILE]: await sha256File(requestsPath) },
    code_sha256: codeSha,
    calls: {
      jev_live: handle.counters.jev.live,
      jev_cache_hits: handle.counters.jev.cacheHits,
      llm_live: handle.counters.llm.live,
      llm_cache_hits: handle.counters.llm.cacheHits,
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

  for (const system of SYSTEMS) {
    const summary = results.systems[system]
    log(
      `  ${system}: staff ${(100 * summary.staffRate).toFixed(1)}%, Clarify ${(100 * summary.clarifyRate).toFixed(1)}%, ` +
        `silent errors ${summary.silentErrors}, harmful ${summary.harmfulSilentErrors}, machine ${summary.machineSeconds.mean.toFixed(2)} s, ` +
        `API $${summary.apiCostPer1000.toFixed(2)} per 1000 requests, classifier ${(1000 * summary.classifierLatency.median).toFixed(0)} ms median`,
    )
  }
  if (failedRequests) log(`WARNING: ${failedRequests} request(s) failed; the failures are listed in provenance.json and per_case.json`)
  if (!fault.allInvariantsHold) log("WARNING: a fault group broke an invariant; see results.json")
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
