#!/usr/bin/env bun
// The statistics of the recorded run: a Wilson interval for every accuracy proportion, an exact paired test for the two
// comparisons of the paper, a bootstrap of the paired difference in error count, and the power of the set of requests.
// Zero model calls: every number is computed from the separate results/level2/per_case.json and results/level3/per_case.json files and the separate results/level2/results.json and results/level3/results.json files, and the size of the set
// is read from per_case.json, never from a constant.
//
// Why these numbers. The paper reports counts of requests (served, stopped, and errors per level, and an action accuracy
// per classifier), and a count of 100 carries a wide interval. The Wilson interval is the interval of a binomial
// proportion; it is reported here beside every proportion so that the paper cannot read a difference of a few requests as
// a difference of systems. The paired tests are exact: every request is one pair, and only the requests where the two
// systems disagree carry information (the discordant pairs), so the two-sided sign test (McNemar's exact test on one
// pair per request) is the right test. The bootstrap resamples the requests with replacement and reports the
// interval of the paired difference in the count of errors, which is the quantity the ladder reports. The power
// statement answers the question that the counts raise: with this many requests, how large a real difference could this
// set have detected at all?
//
// Table: results/tables/robustness.tex (the LaTeX tables of this file). Evidence: results/robustness.json (the
// robustness probes of experiment/robustness.ts), the separate results/level2/per_case.json and results/level3/per_case.json files, the separate results/level2/results.json and results/level3/results.json files.
//
// Run: bun run experiment/stats.ts [--offline]   (no model is called, with or without the flag)
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { ClassifierRequestRecord, AgentRequestRecord } from "./pipeline"
import type { Field } from "./types"

const HERE = import.meta.dir
const OUT = join(HERE, "results")
/** The two-sided z of a 95% interval. */
const Z = 1.959963984540054
/** The seed of the bootstrap. The resamples are the same on every run. */
const SEED = 20261008
const RESAMPLES = 10_000
/** The paired comparisons of the paper, in the order of the report. */
const FIELDS: readonly Field[] = ["action", "queue", "priority", "risk", "injection"]

// ---------------------------------------------------------------- the proportions

interface Interval {
  n: number
  successes: number
  /** The share of successes, and the two ends of its Wilson 95% interval. */
  rate: number
  low: number
  high: number
}

/** The Wilson score interval of a binomial proportion: the interval that the paper reports beside every count. */
function wilson(successes: number, n: number): Interval {
  if (n === 0) return { n: 0, successes: 0, rate: 0, low: 0, high: 0 }
  const p = successes / n
  const z2 = Z * Z
  const centre = (p + z2 / (2 * n)) / (1 + z2 / n)
  const half = (Z / (1 + z2 / n)) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))
  return { n, successes, rate: p, low: Math.max(0, centre - half), high: Math.min(1, centre + half) }
}

/** The chance of exactly k successes in n trials at a chance p, computed in logs so a set of 100 never overflows. */
function binomialPmf(n: number, k: number, p: number): number {
  if (k < 0 || k > n) return 0
  let log = 0
  for (let i = 1; i <= k; i++) log += Math.log((n - k + i) / i)
  if (k > 0) log += k * Math.log(p)
  if (n - k > 0) log += (n - k) * Math.log(1 - p)
  return Math.exp(log)
}

/**
 * The two-sided exact sign test on the discordant pairs (McNemar's exact test): p = 2 * P(X <= min(b, c)) with
 * X ~ Binomial(b + c, 0.5). The same test as `signTest` of metrics.ts, on any pair of per-request answers.
 */
function signTestExact(againstFirst: number, againstSecond: number): { discordant: number; pValue: number } {
  const n = againstFirst + againstSecond
  if (n === 0) return { discordant: 0, pValue: 1 }
  let tail = 0
  for (let i = 0; i <= Math.min(againstFirst, againstSecond); i++) tail += binomialPmf(n, i, 0.5)
  return { discordant: n, pValue: Math.min(1, 2 * tail) }
}

/** The chance that a test of this size sees a real difference d: P(Binomial(n, d) >= cut). */
function powerToSee(n: number, cut: number, d: number): number {
  let cumulative = 0
  for (let k = 0; k < cut; k++) cumulative += binomialPmf(n, k, d)
  return 1 - cumulative
}

/** The smallest number of discordant pairs, every one against the same system, that the test can call significant. */
function minimalDiscordant(n: number, alpha = 0.05): number {
  for (let pairs = 1; pairs <= n; pairs++) if (signTestExact(pairs, 0).pValue < alpha) return pairs
  return n + 1
}

/** The smallest real difference d that the test reaches the target power on, in the same-direction case. */
function minimalDetectable(n: number, cut: number, targetPower: number): number {
  for (let step = 1; step <= 1000; step++) {
    const d = step / 1000
    if (powerToSee(n, cut, d) >= targetPower) return d
  }
  return 1
}

/** A fixed-seed generator (mulberry32), so the bootstrap gives the same interval on every run. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The bootstrap of the paired difference in the count of errors: the requests of the set are resampled with replacement, and
 * every resample reports the count of errors of the first system minus the count of the second. The interval is the
 * percentile interval (2.5% and 97.5%), and `share_at_or_below_zero` is the share of the resamples in which the first
 * system is not worse than the second.
 */
function bootstrapPairedDifference(errorsFirst: readonly number[], errorsSecond: readonly number[]) {
  const random = mulberry32(SEED)
  const n = errorsFirst.length
  const differences: number[] = []
  for (let r = 0; r < RESAMPLES; r++) {
    let first = 0
    let second = 0
    for (let i = 0; i < n; i++) {
      const pick = Math.floor(random() * n)
      first += errorsFirst[pick]
      second += errorsSecond[pick]
    }
    differences.push(first - second)
  }
  differences.sort((a, b) => a - b)
  const at = (q: number): number => differences[Math.round(q * (differences.length - 1))]
  const observed = errorsFirst.reduce((sum, v) => sum + v, 0) - errorsSecond.reduce((sum, v) => sum + v, 0)
  return {
    resamples: RESAMPLES,
    seed: SEED,
    pairs: n,
    observed,
    mean: differences.reduce((sum, v) => sum + v, 0) / differences.length,
    low: at(0.025),
    high: at(0.975),
    share_at_or_below_zero: differences.filter((d) => d <= 0).length / differences.length,
    share_worse: differences.filter((d) => d < 0).length / differences.length,
    note:
      `The first system minus the second, in the count of errors over the ${n} requests. The interval is a percentile ` +
      "interval, so it can only take whole counts; a difference of 0 is an interval of 0.",
  }
}

// ---------------------------------------------------------------- the recorded run

interface PerCase {
  jev: ClassifierRequestRecord[]
  llm_agent: AgentRequestRecord[]
}

/** The recorded run, checked just enough to be read: the file is the evidence of this experiment. */
function readPerCase(value: unknown): PerCase {
  const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null
  if (!isObject(value)) throw new Error("the separate results/level2/per_case.json and results/level3/per_case.json files is not a JSON object")
  const lists: Record<string, unknown[]> = {}
  for (const name of ["jev", "llm_agent"]) {
    const list = value[name]
    if (!Array.isArray(list) || list.length === 0) throw new Error(`the separate results/level2/per_case.json and results/level3/per_case.json files holds no ${name} records`)
    for (const record of list) {
      if (!isObject(record) || typeof record.id !== "string" || typeof record.outcome !== "string") {
        throw new Error(`the separate results/level2/per_case.json and results/level3/per_case.json files holds a ${name} record that cannot be read`)
      }
    }
    lists[name] = list
  }
  // The records are the shape that pipeline.ts wrote into this file; the check above covers the parts read here.
  return { jev: lists.jev as ClassifierRequestRecord[], llm_agent: lists.llm_agent as AgentRequestRecord[] }
}

interface Results {
  ladder: { name: string; served: number; stopped: number; errors: number }[]
  classifier: Record<string, { requests: number; perField: Record<string, { n: number; correct: number; accuracy: number }> }>
}

async function readResults(path: string): Promise<Results> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"))
  const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null
  if (!isObject(value) || !Array.isArray(value.ladder) || !isObject(value.classifier)) {
    throw new Error(`${path} is not the results file of this experiment`)
  }
  // The file is the evidence of this experiment; the check above covers the parts read here.
  return value as unknown as Results
}

/** The answer of one field of the classifier run, as "true"/"false" for a flag and as the label otherwise. */
const answerOf = (record: ClassifierRequestRecord, field: Field): string | null => {
  const value = record.classifier.fields[field].value
  return typeof value === "boolean" ? (value ? "true" : "false") : value
}
/** The gold answer of one field. */
const goldOf = (record: ClassifierRequestRecord, field: Field): string | null => {
  const value = record.gold[field]
  return typeof value === "boolean" ? (value ? "true" : "false") : value
}
/** True when the answer of this field is the gold answer. */
const fieldRight = (record: ClassifierRequestRecord, field: Field): boolean => {
  const gold = goldOf(record, field)
  return gold !== null && answerOf(record, field) === gold
}

// ---------------------------------------------------------------- the LaTeX tables

const pct = (value: number, digits = 1): string => (100 * value).toFixed(digits)
const formatP = (value: number): string => value < 0.001 ? value.toExponential(2) : value.toFixed(4)
const ci = (interval: Interval): string => `[${pct(interval.low)}, ${pct(interval.high)}]`
const row = (cells: readonly (string | number)[]): string => `${cells.join(" & ")} \\\\`

/** One LaTeX table, from rows that are already formatted with `row`. */
function table(caption: string, label: string, spec: string, header: readonly string[], rows: readonly string[]): string {
  return [
    "\\begin{table}[t]",
    `\\caption{${caption}}`,
    `\\label{${label}}`,
    "\\small",
    "\\setlength{\\tabcolsep}{3pt}",
    `\\begin{tabular}{${spec}}`,
    "\\toprule",
    `${header.join(" & ")} \\\\`,
    "\\midrule",
    ...rows,
    "\\bottomrule",
    "\\end{tabular}",
    "\\end{table}",
    "",
  ].join("\n")
}

// ---------------------------------------------------------------- the analysis

const log = (message: string): void => void process.stderr.write(`${message}\n`)

async function main(): Promise<void> {
  const perCase = readPerCase({
    jev: JSON.parse(await readFile(join(OUT, "level3", "per_case.json"), "utf8")).jev,
    llm_agent: JSON.parse(await readFile(join(OUT, "level2", "per_case.json"), "utf8")).llm_agent,
  })
  const level3Results = await readResults(join(OUT, "level3", "results.json"))
  const level2Results = await readResults(join(OUT, "level2", "results.json"))
  const results = { classifier: level3Results.classifier, ladder: [...level2Results.ladder, ...level3Results.ladder] }
  const n = perCase.jev.length
  if (n !== perCase.llm_agent.length) throw new Error("the separate results/level2/per_case.json and results/level3/per_case.json files holds sets of different sizes")

  // The classifier proportions: every field of the first Jev call against the gold answer.
  const classifier: Record<string, Interval> = {}
  for (const field of FIELDS) {
    const scored = perCase.jev.filter((record) => goldOf(record, field) !== null)
    classifier[field] = wilson(scored.filter((record) => fieldRight(record, field)).length, scored.length)
  }

  // The outcome proportions of the two automated levels: served, stopped, and errors.
  const outcome = (records: readonly { outcome: string }[], want: string): number => records.filter((record) => record.outcome === want).length
  const levels = {
    level2: {
      name: "2 LLM agent",
      served: wilson(outcome(perCase.llm_agent, "served"), n),
      stopped: wilson(outcome(perCase.llm_agent, "stopped"), n),
      errors: wilson(outcome(perCase.llm_agent, "error"), n),
    },
    level3: {
      name: "3 Jev + LLM + rules",
      served: wilson(outcome(perCase.jev, "served"), n),
      stopped: wilson(outcome(perCase.jev, "stopped"), n),
      errors: wilson(outcome(perCase.jev, "error"), n),
    },
  }

  // The paired tests. One pair for each request; only the discordant pairs carry information.
  const errorAtLevel2 = perCase.llm_agent.map((record) => (record.outcome === "error" ? 1 : 0))
  const errorAtLevel3 = perCase.jev.map((record) => (record.outcome === "error" ? 1 : 0))
  let level2Only = 0
  let level3Only = 0
  perCase.llm_agent.forEach((record, index) => {
    const other = perCase.jev[index]
    if (!other || other.id !== record.id) throw new Error("the separate results/level2/per_case.json and results/level3/per_case.json files is not paired by request id")
    if (errorAtLevel2[index] === 1 && errorAtLevel3[index] === 0) level2Only++
    if (errorAtLevel2[index] === 0 && errorAtLevel3[index] === 1) level3Only++
  })
  const outcomeTest = {
    comparison: "errors, Level 2 (LLM agent) against Level 3 (Jev + LLM + rules)",
    against_first: level2Only,
    against_second: level3Only,
    ...signTestExact(level2Only, level3Only),
  }

  const bootstrap = bootstrapPairedDifference(errorAtLevel2, errorAtLevel3)
  const cut = minimalDiscordant(n)
  const atCut = signTestExact(cut, 0).pValue
  const underCut = signTestExact(cut - 1, 0).pValue
  const detectable = minimalDetectable(n, cut, 0.8)
  const detectableRequests = Math.ceil(detectable * n)
  /** The reading of a p value that the paper can quote: the test separates the two systems at 5%, or it does not. */
  const significance = (p: number): string => (p < 0.05 ? "significant at 5\\%" : "not significant at 5\\%")

  // The numbers of this file are recomputed from per_case.json; they must equal the record of the run in results.json.
  const ladderOf = (name: string) => {
    const step = results.ladder.find((entry) => entry.name === name)
    if (!step) throw new Error(`results.json holds no level named ${name}`)
    return step
  }
  const crossChecks = [
    { quantity: "action correct, Jev", per_case: classifier.action.successes, results_json: results.classifier.jev.perField.action.correct },
    { quantity: "errors, Level 2", per_case: levels.level2.errors.successes, results_json: ladderOf("LLM agent").errors },
    { quantity: "errors, Level 3", per_case: levels.level3.errors.successes, results_json: ladderOf("Jev + LLM + rules").errors },
  ]
  const mismatches = crossChecks.filter((check) => Math.abs(check.per_case - check.results_json) > 1e-9)
  if (mismatches.length) throw new Error(`results.json disagrees with the separate results/level2/per_case.json and results/level3/per_case.json files: ${mismatches.map((check) => check.quantity).join("; ")}`)

  // The LaTeX tables: the outcome rates, the classifier accuracies, and the tests.
  const outcomeRows = [levels.level2, levels.level3].flatMap((level) =>
    (["served", "stopped", "errors"] as const).map((want) => {
      const interval = level[want]
      return row([level.name, want, `${interval.successes}/${interval.n}`, pct(interval.rate), ci(interval)])
    }),
  )
  const tableOutcome = table(
    `The outcome of the two automated levels over the ${n} requests, as the ladder reports it (served, stopped, and errors), with ` +
      `the Wilson 95\\% interval of every rate. Level 3 ends ${levels.level3.stopped.successes} requests as stopped and makes ` +
      `${levels.level3.errors.successes} errors; Level 2 stops ${levels.level2.stopped.successes} and makes ${levels.level2.errors.successes} errors. The interval of the errors of Level 2 ` +
      `([${pct(levels.level2.errors.low)}, ${pct(levels.level2.errors.high)}]) and the interval of the errors of ` +
      `Level 3 ([${pct(levels.level3.errors.low)}, ${pct(levels.level3.errors.high)}]) describe marginal error rates. ` +
      `The paired test of the next table uses only the discordant requests and reads the difference of the errors as ` +
      `${significance(outcomeTest.pValue)} (p = ${formatP(outcomeTest.pValue)}).`,
    "tab:robustness-outcome",
    "llrrl",
    ["Level", "Outcome", "Count", "\\%", "Wilson 95\\% CI"],
    outcomeRows,
  )

  const classifierRows = FIELDS.map((field) =>
    row([
      `${field === "queue" ? "Topic" : field.charAt(0).toUpperCase() + field.slice(1)}${field === "action" ? " (the headline)" : ""}`,
      `${classifier[field].successes}/${classifier[field].n}`,
      pct(classifier[field].rate),
      ci(classifier[field]),
    ]),
  )
  const tableClassifier = table(
    "The accuracy of the first Jev call over the scored requests, field by field, with the Wilson 95\\% interval of every proportion.",
    "tab:robustness-classifier",
    "lrrl",
    ["Field", "Jev", "\\%", "95\\% CI"],
    classifierRows,
  )

  const tableTests = table(
    `The paired tests and the power of the set. Every request is one pair, so only the discordant requests carry information: ` +
      `the two-sided exact sign test (McNemar's exact test) on the errors of Level 2 against Level 3 (${outcomeTest.against_first} ` +
      `against ${outcomeTest.against_second}, p = ${formatP(outcomeTest.pValue)}, ${significance(outcomeTest.pValue)}). The bootstrap ` +
      `resamples the ${n} requests with replacement (seed ${SEED}, ${RESAMPLES} resamples) and reports the interval of the paired ` +
      `difference in the count of errors (Level 2 minus Level 3); Level 3 makes no error on this set, so the difference is never ` +
      `negative and the interval describes the sampling of the ${levels.level2.errors.successes} errors of Level 2. The last rows state the power of the set: at least ${cut} discordant requests, every one ` +
      `against the same system, are needed for the test to reach p < 0.05, so this set can only detect a real difference above ` +
      `${pct(detectable)}\\% of the requests (${detectableRequests} requests of ${n}). Every number is recomputed from ` +
      `the separate results/level2/per_case.json and results/level3/per_case.json files and equals the record of the run in results.json.`,
    "tab:robustness-tests",
    "lrrrl",
    ["Test", "First", "Second", "p", "Note"],
    [
      row(["Sign test, errors, Level 2 against Level 3", outcomeTest.against_first, outcomeTest.against_second, formatP(outcomeTest.pValue), significance(outcomeTest.pValue)]),
      row(["Bootstrap, the paired difference in errors", bootstrap.observed, "", "", `95\\% CI [${bootstrap.low}, ${bootstrap.high}], seed ${SEED}, ${RESAMPLES} resamples`]),
      row(["Bootstrap, the share of resamples with no worse result", pct(bootstrap.share_at_or_below_zero), "\\%", "", "Level 3 makes no error, so the difference is 0 only in the resamples that draw no error of Level 2"]),
      row(["Power, the smallest significant split", cut, `/ ${n}`, atCut.toFixed(3), "all discordant against one system"]),
      row(["Power, the smallest detectable difference", pct(detectable), "\\%", "", `at 80\\% power, ${detectableRequests} requests of ${n}`]),
    ],
  )

  await mkdir(join(OUT, "tables"), { recursive: true })
  await writeFile(join(OUT, "tables", "robustness.tex"), `${tableOutcome}\n${tableClassifier}\n${tableTests}`, "utf8")

  // The reading on the console.
  log(`outcome rates over ${n} requests (Wilson 95% CI):`)
  for (const level of [levels.level2, levels.level3]) {
    log(
      `  ${level.name}: served ${level.served.successes} (${pct(level.served.rate)}%, ${ci(level.served)}), ` +
        `stopped ${level.stopped.successes} (${pct(level.stopped.rate)}%), errors ${level.errors.successes} (${pct(level.errors.rate)}%, ${ci(level.errors)})`,
    )
  }
  log(`classifier accuracy (Wilson 95% CI):`)
  for (const field of FIELDS) log(`  ${field.padEnd(10)} jev ${classifier[field].successes}/${classifier[field].n} (${pct(classifier[field].rate)}%, ${ci(classifier[field])})`)
  log(`paired tests:`)
  log(`  errors, Level 2 against Level 3: ${outcomeTest.against_first} against ${outcomeTest.against_second} of ${outcomeTest.discordant} discordant, p = ${formatP(outcomeTest.pValue)}`)
  log(`bootstrap of the paired difference in errors (Level 2 minus Level 3): observed ${bootstrap.observed}, mean ${bootstrap.mean.toFixed(3)}, 95% CI [${bootstrap.low}, ${bootstrap.high}], ${pct(bootstrap.share_at_or_below_zero)}% of resamples at or below 0`)
  log(`power: the smallest significant split is ${cut} of ${n} discordant pairs, all against one system (p = ${atCut.toFixed(4)}; ${cut - 1} pairs give p = ${underCut.toFixed(3)}); a real difference below ${pct(detectable)}% of the requests (${detectableRequests} of ${n}) leaves the test under 80% power`)
  log(`cross-check: ${crossChecks.length} of ${crossChecks.length} quantities recomputed here equal results.json`)
  log("written: results/tables/robustness.tex")
}

if (import.meta.main) {
  main().then(
    () => process.exit(0),
    (err: unknown) => {
      log(`the statistics failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`)
      process.exit(1)
    },
  )
}
