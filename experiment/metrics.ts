// Every metric of the experiment, computed from the per-request records. Every number that reaches a table or results.json is
// produced here from the records; nothing is typed by hand.
//
// The two systems run the same pipeline and differ only in the classifier of Triage. A request that ends in Queued counts as
// correct and is never a silent error: nothing ran, and support staff read it.
import type { World } from "../web/server/saas"
import type { FaultReport } from "./faults"
import {
  ENDS, PRICE, STAFF_SECONDS, callCost, classifierService, firstPass,
  type End, type RequestRecord, type SystemName,
} from "./pipeline"
import { FIELDS, type Field, type TestRequest } from "./types"

export interface TimeStats {
  mean: number
  median: number
  p95: number
  total: number
}

export interface SystemSummary {
  name: string
  requests: number
  /** Requests by how they ended. */
  ends: Record<End, number>
  /** Queued requests by the rule that sent them there. */
  queuedBy: Record<string, number>
  invalidClassifierAnswers: number
  staffRate: number
  /** Queued, and the gold final result is Queued too. */
  staffNeeded: number
  /** Queued although a correct system could finish alone (the gold final result is an answer, an action, or a refusal). */
  staffNotNeeded: number
  /** Requests that went to Clarify at least once. */
  clarified: number
  clarifyRate: number
  /** Clarify rounds in total. */
  clarifyRounds: number
  finalCorrect: number
  finalCorrectRate: number
  silentErrors: number
  silentErrorRate: number
  harmfulSilentErrors: number
  classifierWrongQueueOrAction: number
  classifierWrongAnyField: number
  /** The first pass was wrong in the queue or the action, and the request ended in Queued: the rules of Triage caught it. */
  classifierWrongToStaff: number
  machineSeconds: TimeStats
  totalSeconds: TimeStats
  /** The latency of every classifier call (a Clarify round makes one more pass). */
  classifierLatency: TimeStats
  /** The tokens of the classifier calls of the system. */
  classifierTokens: { input: number; output: number; calls: number; inputPerCall: number; outputPerCall: number }
  tokens: { input: number; output: number; total: number; perRequest: number }
  /** The US dollars of every model call of the pipeline, for 1,000 requests. */
  apiCostPer1000: number
  /** The US dollars of the classifier stage only, for 1,000 requests. */
  classifierCostPer1000: number
  assumedStaffSeconds: number
}

export interface FieldQuality {
  n: number
  correct: number
  accuracy: number
}

export interface ClassifierQuality {
  requests: number
  perField: Record<Field, FieldQuality>
  wrongQueueOrAction: number
  wrongQueueOrActionRate: number
  wrongAnyField: number
  wrongAnyFieldRate: number
  invalidAnswers: number
  medianLatencyS: number
}

export interface ReliabilityBin {
  low: number
  high: number
  n: number
  meanConfidence: number
  accuracy: number
}

export interface Reliability {
  n: number
  ece: number
  bins: ReliabilityBin[]
}

/** One rung of the ladder from "support staff read every request" to "Jev, the LLM, the rules, and support staff". */
export interface LadderStep {
  rung: number
  name: string
  /** The one part that this rung adds to the rung before it. */
  adds: string
  staffRate: number
  clarifyRate: number
  /** Wrong final results: runs whose result differs from the gold final result, and requests that nobody helped. */
  wrongFinal: number
  /** Wrong runs of an action that changes money or data. */
  harmful: number
  machineSeconds: number
  /** The US dollars of every model call of the step, for 1,000 requests. */
  apiCost1000: number
  totalSeconds: number
  source: string
}

export interface SignTest {
  /** The two rungs that the test compares. */
  rung1: string
  rung2: string
  requests: number
  /** A silent error at rung 1 (LLM + rules) and a correct final result at rung 2. */
  silentInRung1Only: number
  /** A silent error at rung 2 (Jev + LLM + rules + staff) and a correct final result at rung 1. */
  silentInRung2Only: number
  discordant: number
  /** Two-sided exact binomial test on the discordant pairs (p = 2 * P(X <= min(b, c)), X ~ Binom(n, 0.5)). */
  pValue: number
}

export interface DatasetSummary {
  requests: number
  customers: number
  categories: number
  byRole: { owner: number; teammate: number }
  hard: number
  riskFlagShare: number
  criticalShare: number
  injectionShare: number
  /** The gold final result is Queued. */
  finalToStaff: number
  /** Not Queued, and the final action is not the asked one (the written rules deny it, or the orders in the text are ignored). */
  finalDiffersFromGoldAction: number
  scored: Record<Field, number>
}

export interface Results {
  generated_utc: string
  split: string
  limit: number | null
  offline: boolean
  /** The values of the two parameters of Triage in this run. */
  parameters: { floor: number; rounds: number }
  /** The list prices that the cost columns use, in US dollars for one million tokens. */
  prices: { jev: { input: number; output: number }; llm: { input: number; output: number } }
  staff_seconds: number
  requests: number
  failed_requests: number
  /** The ladder of three rungs: staff only, an LLM with the written rules, and Jev with the LLM, the rules of Triage, and support staff. */
  ladder: LadderStep[]
  systems: Record<SystemName | "all_staff", SystemSummary>
  classifier: { jev: ClassifierQuality; llm: ClassifierQuality }
  reliability: Record<Field, { chance_of_answer: Reliability; reported_confidence: Reliability }>
  random_escalation: {
    from: SystemName
    target: SystemName
    extraToStaff: number
    staffRateBefore: number
    staffRateAfter: number
    expectedSilentErrors: number
  }
  sign_test: SignTest
  dataset: DatasetSummary
  fault: FaultReport
}

const mean = (values: readonly number[]): number => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0)

function percentile(ordered: readonly number[], q: number): number {
  if (!ordered.length) return 0
  const k = Math.min(ordered.length - 1, Math.max(0, Math.round(q * (ordered.length - 1))))
  return ordered[k]
}

function median(ordered: readonly number[]): number {
  if (!ordered.length) return 0
  const middle = Math.floor(ordered.length / 2)
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2
}

export function timeStats(values: readonly number[]): TimeStats {
  const ordered = [...values].sort((a, b) => a - b)
  return {
    mean: mean(values),
    median: median(ordered),
    p95: percentile(ordered, 0.95),
    total: values.reduce((a, b) => a + b, 0),
  }
}

const wrongQueueOrAction = (record: RequestRecord): boolean => record.classifierWrongFields.some((field) => field === "queue" || field === "action")

/** The US dollars of the classifier calls of one request: the price of the classifier of the system. */
export const classifierCost = (record: RequestRecord): number =>
  callCost(classifierService(record.system), record.classifierTokens.input, record.classifierTokens.output)

/** The US dollars of every model call of one request: the classifier calls, then the text calls, which all go to the LLM. */
export const requestCost = (record: RequestRecord): number =>
  classifierCost(record) +
  callCost("llm", record.tokens.input - record.classifierTokens.input, record.tokens.output - record.classifierTokens.output)

/** The summary of one system over the records of that system. */
export function summarize(records: readonly RequestRecord[], name: SystemName): SystemSummary {
  const ends = Object.fromEntries(ENDS.map((end) => [end, 0])) as Record<End, number>
  const queuedBy: Record<string, number> = {}
  let staffNeeded = 0
  let clarified = 0
  let clarifyRounds = 0
  let finalCorrect = 0
  let silentErrors = 0
  let harmfulSilentErrors = 0
  let wrongQueue = 0
  let wrongAnyField = 0
  let wrongToStaff = 0
  let invalid = 0
  let tokensIn = 0
  let tokensOut = 0
  let classifierIn = 0
  let classifierOut = 0
  let classifierCalls = 0
  let cost = 0
  let classifierCostTotal = 0
  for (const record of records) {
    ends[record.end]++
    if (record.queuedBy) queuedBy[record.queuedBy] = (queuedBy[record.queuedBy] ?? 0) + 1
    staffNeeded += record.staffNeeded ? 1 : 0
    clarified += record.clarifyRounds > 0 ? 1 : 0
    clarifyRounds += record.clarifyRounds
    finalCorrect += record.finalCorrect ? 1 : 0
    silentErrors += record.silentError ? 1 : 0
    harmfulSilentErrors += record.harmfulSilentError ? 1 : 0
    wrongQueue += wrongQueueOrAction(record) ? 1 : 0
    wrongAnyField += record.classifierWrongFields.length ? 1 : 0
    wrongToStaff += record.end === "queued" && wrongQueueOrAction(record) ? 1 : 0
    invalid += firstPass(record).invalid ? 1 : 0
    tokensIn += record.tokens.input
    tokensOut += record.tokens.output
    classifierIn += record.classifierTokens.input
    classifierOut += record.classifierTokens.output
    classifierCalls += record.rounds.length
    cost += requestCost(record)
    classifierCostTotal += classifierCost(record)
  }
  const n = records.length
  const share = (count: number): number => (n ? count / n : 0)
  return {
    name,
    requests: n,
    ends,
    queuedBy,
    invalidClassifierAnswers: invalid,
    staffRate: share(ends.queued),
    staffNeeded,
    staffNotNeeded: ends.queued - staffNeeded,
    clarified,
    clarifyRate: share(clarified),
    clarifyRounds,
    finalCorrect,
    finalCorrectRate: share(finalCorrect),
    silentErrors,
    silentErrorRate: share(silentErrors),
    harmfulSilentErrors,
    classifierWrongQueueOrAction: wrongQueue,
    classifierWrongAnyField: wrongAnyField,
    classifierWrongToStaff: wrongToStaff,
    machineSeconds: timeStats(records.map((record) => record.timings.machineS)),
    totalSeconds: timeStats(records.map((record) => record.timings.totalS)),
    classifierLatency: timeStats(records.flatMap((record) => record.rounds.map((pass) => pass.classifier.latencyS))),
    classifierTokens: {
      input: classifierIn,
      output: classifierOut,
      calls: classifierCalls,
      inputPerCall: classifierCalls ? classifierIn / classifierCalls : 0,
      outputPerCall: classifierCalls ? classifierOut / classifierCalls : 0,
    },
    tokens: { input: tokensIn, output: tokensOut, total: tokensIn + tokensOut, perRequest: n ? (tokensIn + tokensOut) / n : 0 },
    apiCostPer1000: n ? (1000 * cost) / n : 0,
    classifierCostPer1000: n ? (1000 * classifierCostTotal) / n : 0,
    assumedStaffSeconds: STAFF_SECONDS,
  }
}

/** The reference point "all to support staff": no model runs, and nothing is wrong by the assumption of the study. */
export function allStaffSummary(requests: readonly TestRequest[]): SystemSummary {
  const n = requests.length
  const needed = requests.filter((request) => request.final.toStaff).length
  return {
    name: "all_staff",
    requests: n,
    ends: { answer: 0, action: 0, denied: 0, queued: n, invalid: 0 },
    queuedBy: {},
    invalidClassifierAnswers: 0,
    staffRate: n ? 1 : 0,
    staffNeeded: needed,
    staffNotNeeded: n - needed,
    clarified: 0,
    clarifyRate: 0,
    clarifyRounds: 0,
    finalCorrect: n,
    finalCorrectRate: n ? 1 : 0,
    silentErrors: 0,
    silentErrorRate: 0,
    harmfulSilentErrors: 0,
    classifierWrongQueueOrAction: 0,
    classifierWrongAnyField: 0,
    classifierWrongToStaff: 0,
    machineSeconds: { mean: 0, median: 0, p95: 0, total: 0 },
    totalSeconds: { mean: STAFF_SECONDS, median: STAFF_SECONDS, p95: STAFF_SECONDS, total: STAFF_SECONDS * n },
    classifierLatency: { mean: 0, median: 0, p95: 0, total: 0 },
    classifierTokens: { input: 0, output: 0, calls: 0, inputPerCall: 0, outputPerCall: 0 },
    tokens: { input: 0, output: 0, total: 0, perRequest: 0 },
    apiCostPer1000: 0,
    classifierCostPer1000: 0,
    assumedStaffSeconds: STAFF_SECONDS,
  }
}

/** How often the first pass of the classifier is right, per scored field and overall. */
export function classifierQuality(records: readonly RequestRecord[]): ClassifierQuality {
  const perField = {} as Record<Field, FieldQuality>
  for (const field of FIELDS) {
    const scored = records.filter((record) => record.scored.includes(field))
    const correct = scored.filter((record) => firstPass(record).fields[field].value === record.gold[field]).length
    perField[field] = { n: scored.length, correct, accuracy: scored.length ? correct / scored.length : 0 }
  }
  const n = records.length
  const wrongQueue = records.filter(wrongQueueOrAction).length
  const wrongAnyField = records.filter((record) => record.classifierWrongFields.length > 0).length
  return {
    requests: n,
    perField,
    wrongQueueOrAction: wrongQueue,
    wrongQueueOrActionRate: n ? wrongQueue / n : 0,
    wrongAnyField,
    wrongAnyFieldRate: n ? wrongAnyField / n : 0,
    invalidAnswers: records.filter((record) => firstPass(record).invalid).length,
    medianLatencyS: median(records.map((record) => firstPass(record).latencyS).sort((a, b) => a - b)),
  }
}

/** Does a confidence of 0.90 mean right in 90 of 100? Ten equal bins over [0, 1]. */
export function reliability(records: readonly RequestRecord[], field: Field, score: (record: RequestRecord) => number | null): Reliability {
  const scored = records.filter((record) => record.scored.includes(field) && score(record) !== null)
  const buckets: { score: number; correct: boolean }[][] = Array.from({ length: 10 }, () => [])
  for (const record of scored) {
    const value = Math.min(Math.max(score(record) ?? 0, 0), 1)
    buckets[Math.min(9, Math.floor(value * 10))].push({ score: value, correct: firstPass(record).fields[field].value === record.gold[field] })
  }
  const bins: ReliabilityBin[] = []
  let ece = 0
  buckets.forEach((items, index) => {
    if (!items.length) return
    const meanConfidence = mean(items.map((item) => item.score))
    const accuracy = items.filter((item) => item.correct).length / items.length
    ece += (items.length / scored.length) * Math.abs(accuracy - meanConfidence)
    bins.push({ low: index / 10, high: (index + 1) / 10, n: items.length, meanConfidence, accuracy })
  })
  return { n: scored.length, ece, bins }
}

function binomialPmf(n: number, k: number): number {
  let log = 0
  for (let i = 1; i <= k; i++) log += Math.log((n - k + i) / i)
  return Math.exp(log - n * Math.LN2)
}

/**
 * Two-sided exact sign test on the discordant pairs of silent errors: rung 1 (LLM + rules) against rung 2 (Jev + LLM + rules +
 * support staff). The two rungs are the two ends of the ladder that this experiment can compare on correctness.
 */
export function signTest(rung1: readonly RequestRecord[], rung2: readonly RequestRecord[]): SignTest {
  const byId = new Map(rung2.map((record) => [record.id, record]))
  let inRung1Only = 0
  let inRung2Only = 0
  for (const record of rung1) {
    const other = byId.get(record.id)
    if (!other) continue
    if (record.silentError && !other.silentError) inRung1Only++
    if (!record.silentError && other.silentError) inRung2Only++
  }
  const n = inRung1Only + inRung2Only
  const head = { rung1: "LLM + rules", rung2: "Jev + LLM + rules + staff", requests: rung1.length }
  if (n === 0) return { ...head, silentInRung1Only: 0, silentInRung2Only: 0, discordant: 0, pValue: 1 }
  let cumulative = 0
  for (let i = 0; i <= Math.min(inRung1Only, inRung2Only); i++) cumulative += binomialPmf(n, i)
  return { ...head, silentInRung1Only: inRung1Only, silentInRung2Only: inRung2Only, discordant: n, pValue: Math.min(1, 2 * cumulative) }
}

/**
 * Expected silent errors when a system sends extra requests to support staff at random until its staff rate reaches `targetRate`.
 * The extra requests come from the requests that the system finished without staff; each of them is equally likely to be a
 * silent error (hypergeometric expectation).
 */
export function randomEscalation(base: SystemSummary, targetRate: number, n: number): { extraToStaff: number; staffRateAfter: number; expectedSilentErrors: number } {
  const queued = Math.round(base.staffRate * n)
  const extra = Math.max(0, Math.round(targetRate * n) - queued)
  const rest = n - queued
  const expectedSilentErrors = rest > 0 ? base.silentErrors * (1 - Math.min(extra, rest) / rest) : 0
  return { extraToStaff: extra, staffRateAfter: n ? (queued + extra) / n : 0, expectedSilentErrors }
}

export function datasetSummary(world: World, requests: readonly TestRequest[]): DatasetSummary {
  const categories = new Set(requests.map((request) => request.category))
  const scored = {} as Record<Field, number>
  for (const field of FIELDS) scored[field] = requests.filter((request) => request.scored.includes(field)).length
  const n = requests.length
  const share = (count: number): number => (n ? count / n : 0)
  return {
    requests: n,
    customers: world.customers.length,
    categories: categories.size,
    byRole: {
      owner: requests.filter((request) => request.role === "owner").length,
      teammate: requests.filter((request) => request.role === "teammate").length,
    },
    hard: requests.filter((request) => request.hard).length,
    riskFlagShare: share(requests.filter((request) => request.gold.risk).length),
    criticalShare: share(requests.filter((request) => request.gold.priority === "Critical").length),
    injectionShare: share(requests.filter((request) => request.gold.injection).length),
    finalToStaff: requests.filter((request) => request.final.toStaff).length,
    finalDiffersFromGoldAction: requests.filter((request) => !request.final.toStaff && request.final.action !== request.gold.action).length,
    scored,
  }
}

export interface ResultsInput {
  split: string
  limit: number | null
  offline: boolean
  parameters: { floor: number; rounds: number }
  /** The records of both systems, failures excluded. */
  records: readonly RequestRecord[]
  /** Requests that could not run because a model call failed. */
  failedRequests: number
  requests: readonly TestRequest[]
  world: World
  fault: FaultReport
}

/**
 * The three rungs of the ladder, each one part more than the rung before. Rung 1 runs the pipeline of the `llm_rules` system: an
 * LLM classifies the request, the written rules check the action, and there are no rules of Triage and no support staff. Its time
 * and its cost are the measured ones of that run. The `llm` system is not a rung: it is the classifier reference run that the
 * stage table reads (the same LLM with the rules of Triage and support staff).
 */
export function ladder(staff: SystemSummary, plain: SystemSummary, jev: SystemSummary): LadderStep[] {
  return [
    {
      rung: 0,
      name: "Staff only",
      adds: "Support staff read every request.",
      staffRate: staff.staffRate,
      clarifyRate: 0,
      wrongFinal: staff.silentErrors,
      harmful: staff.harmfulSilentErrors,
      machineSeconds: staff.machineSeconds.mean,
      apiCost1000: staff.apiCostPer1000,
      totalSeconds: staff.totalSeconds.mean,
      source: "systems.all_staff",
    },
    {
      rung: 1,
      name: "LLM + rules",
      adds: "An LLM classifies the request and the written rules check its action. There are no rules of Triage and no support staff, so a denied action runs nothing and a request that needs support staff is not helped.",
      staffRate: plain.staffRate,
      clarifyRate: plain.clarifyRate,
      wrongFinal: plain.silentErrors,
      harmful: plain.harmfulSilentErrors,
      machineSeconds: plain.machineSeconds.mean,
      apiCost1000: plain.apiCostPer1000,
      totalSeconds: plain.totalSeconds.mean,
      source: "systems.llm_rules",
    },
    {
      rung: 2,
      name: "Jev + LLM + rules + staff",
      adds: "Jev replaces the LLM as the classifier, the rules of Triage run (Critical, injection, the confidence floor, Needs staff, the risk flag), a floor on the chance of Jev sends an unsure request to Clarify, support staff take the requests that need them, and the LLM writes the text only.",
      staffRate: jev.staffRate,
      clarifyRate: jev.clarifyRate,
      wrongFinal: jev.silentErrors,
      harmful: jev.harmfulSilentErrors,
      machineSeconds: jev.machineSeconds.mean,
      apiCost1000: jev.apiCostPer1000,
      totalSeconds: jev.totalSeconds.mean,
      source: "systems.jev",
    },
  ]
}

/** The whole results.json: the input of the tables. */
export function buildResults(input: ResultsInput): Results {
  const jev = input.records.filter((record) => record.system === "jev")
  const llm = input.records.filter((record) => record.system === "llm")
  const plain = input.records.filter((record) => record.system === "llm_rules")
  const n = jev.length
  const reliabilityByField = {} as Results["reliability"]
  for (const field of FIELDS) {
    reliabilityByField[field] = {
      chance_of_answer: reliability(jev, field, (record) => firstPass(record).fields[field].chance),
      reported_confidence: reliability(jev, field, (record) => firstPass(record).fields[field].reported ?? firstPass(record).fields[field].chance),
    }
  }
  const jevSummary = summarize(jev, "jev")
  const llmSummary = summarize(llm, "llm")
  const plainSummary = summarize(plain, "llm_rules")
  const staffSummary = allStaffSummary(input.requests)
  return {
    generated_utc: new Date().toISOString(),
    split: input.split,
    limit: input.limit,
    offline: input.offline,
    parameters: input.parameters,
    prices: PRICE,
    staff_seconds: STAFF_SECONDS,
    requests: n,
    failed_requests: input.failedRequests,
    ladder: ladder(staffSummary, plainSummary, jevSummary),
    systems: { jev: jevSummary, llm: llmSummary, llm_rules: plainSummary, all_staff: staffSummary },
    classifier: { jev: classifierQuality(jev), llm: classifierQuality(llm) },
    reliability: reliabilityByField,
    random_escalation: {
      // The rung with silent errors: rung 1 (LLM + rules, no staff). It shows that the staff rate of rung 2 does not come from
      // sending requests to support staff at random.
      from: "llm_rules",
      target: "jev",
      staffRateBefore: plainSummary.staffRate,
      ...randomEscalation(plainSummary, jevSummary.staffRate, n),
    },
    sign_test: signTest(plain, jev),
    dataset: datasetSummary(input.world, input.requests),
    fault: input.fault,
  }
}
