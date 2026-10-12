// Every metric of the experiment, computed from the per-request records. Every number that reaches a table or results.json is
// produced here from the records; nothing is typed by hand.
//
// The systems run the same pipeline and differ only in the classifier and in the routing (Level 2 has no rules of Triage). Each
// request has one of three outcomes (see `requestOutcome` in pipeline.ts): served (the run gives the gold final action),
// stopped (a written rule denies the gold action, and the flow ran nothing and stopped the request by design), or an error
// (every other run). Level 1 is the reference: the study assumes that support staff handle every request.
import type { World } from "../web/server/saas"
import {
  ENDS, PRICE, STAFF_SECONDS, callCost, decisionService,
  type AgentRequestRecord, type ClassifierRequestRecord, type End, type RunRecord, type SystemName,
} from "./pipeline"
import { FIELDS, type Field, type TestRequest } from "./types"

export interface TimeStats {
  mean: number
  median: number
  p95: number
  total: number
}

export interface SystemSummary {
  name: SystemName | "all_staff"
  requests: number
  /** Requests by how they ended. */
  ends: Record<End, number>
  /** The answer of the step that chose the action was not valid, so nothing ran. */
  invalidAnswers: number
  /** Nothing ran: the flow stopped at the Final message, which explains why (blocked and invalid). */
  nothingRan: number
  /** Nothing ran, as a share of the requests. */
  blockRate: number
  /** The run ends with the gold final result: the gold action ran, or the gold answer was given (what the customer gets). */
  served: number
  /** A written rule denies the gold action and nothing that changes the state ran, whatever part stopped it. */
  stopped: number
  /** Every other run: the customer does not get the gold final result. */
  errors: number
  /** The share of the requests that are errors. */
  errorRate: number
  /** The strict label count of v31 to v34 (the secondary number): the requests whose action label differs from the gold action. */
  labelErrors: number
  /** An error that ran an action which changes money, a plan, stored data, or a password. */
  harmful: number
  /** The harmful runs of v31: an error that ran an action which changes money or stored data. */
  harmfulMoneyData: number
  machineSeconds: TimeStats
  totalSeconds: TimeStats
  /** The latency of the model call that chose the action: the classifier call, or the agent call. */
  decisionLatency: TimeStats
  /** The tokens of those calls and the mean of one call. */
  decisionTokens: { input: number; output: number; calls: number; inputPerCall: number; outputPerCall: number }
  tokens: { input: number; output: number; total: number; perRequest: number }
  /** The US dollars of every model call of the pipeline, for 1,000 requests. */
  apiCostPer1000: number
  /** The US dollars of the call that chose the action, for 1,000 requests. */
  decisionCostPer1000: number
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

/** One level of the ladder from "support staff read every request" to "Jev, the LLM, and the rules". */
export interface LadderStep {
  /** The position of the level in the ladder, counted from 0: 0 is Level 1, 1 is Level 2, 2 is Level 3. */
  level: number
  name: string
  /** The one part that this level adds to the level before it. */
  adds: string
  /** The gold final action ran as the written rules allow, or the answer is the gold "Send reply". */
  served: number
  /** A written rule denies the gold action, and the flow ran nothing and stopped the request by design. */
  stopped: number
  /** Every other run of the level. */
  errors: number
  /** The strict label count (the secondary number): the action label differs from the gold action. */
  labelErrors: number
  /** Errors that ran an action which changes money, a plan, stored data, or a password. */
  harmful: number
  /** The harmful runs of v31: errors that ran an action which changes money or stored data. */
  harmfulMoneyData: number
  machineSeconds: number
  /** The US dollars of every model call of the step, for 1,000 requests. */
  apiCost1000: number
  totalSeconds: number
  source: string
}

export interface SignTest {
  /** The two levels that the test compares. */
  level2: string
  level3: string
  /** The requests that the test compares, one pair for each request. */
  pairs: number
  /** An error at Level 2 (the LLM agent) and a correct result at Level 3. */
  errorsInLevel2Only: number
  /** An error at Level 3 and a correct result at Level 2. */
  errorsInLevel3Only: number
  discordant: number
  /** Two-sided exact binomial test on the discordant pairs (p = 2 * P(X <= min(b, c)), X ~ Binom(n, 0.5)). */
  pValue: number
}

export interface DatasetSummary {
  requests: number
  customers: number
  categories: number
  hard: number
  riskFlagShare: number
  /** The share of the requests whose gold priority is Critical. No rule of the flow reads the priority. */
  priorityCriticalShare: number
  injectionShare: number
  /** The gold final action is null: a written rule denies the action, so nothing runs at any level. */
  finalDenied: number
  /** The gold final action is not the asked action: the written rules deny it, or the orders in the text are ignored. */
  finalDiffersFromGoldAction: number
  scored: Record<Field, number>
}

/** How the yes/no answers of the rule questions agree with the written rules (policyFor of saas.ts, and the gold queue for the Security rule). */
export interface RuleQuestionQuality {
  /** Requests that got the second Jev call. */
  calls: number
  answers: number
  /** Answers that say what the written rules say. */
  matching: number
  /** The rule and the kind of each answer that differs: the answer says broken where the rules say met, or the reverse. */
  mismatches: { id: string; rule: string; jev: "broken" | "met"; written: "broken" | "met" }[]
}

export function ruleQuestionQuality(records: readonly ClassifierRequestRecord[]): RuleQuestionQuality {
  const mismatches: RuleQuestionQuality["mismatches"] = []
  let answers = 0
  let calls = 0
  for (const record of records) {
    if (!record.ruleCall) continue
    calls++
    for (const a of record.ruleCall.answers) {
      if (a.code === null) continue
      answers++
      if (a.broken !== a.code) mismatches.push({ id: record.id, rule: a.rule, jev: a.broken ? "broken" : "met", written: a.code ? "broken" : "met" })
    }
  }
  return { calls, answers, matching: answers - mismatches.length, mismatches }
}

export interface Results {
  generated_utc: string
  limit: number | null
  offline: boolean
  /** The list prices that the cost columns use, in US dollars for one million tokens. */
  prices: { jev: { input: number; output: number }; llm: { input: number; output: number } }
  /** The assumed time of support staff to handle one request at Level 1. It is a reference, not a measurement. */
  staff_seconds: number
  requests: number
  failed_requests: number
  /** The ladder of three levels: support staff only, an LLM with the written rules, and Jev with the LLM and the rules. */
  ladder: LadderStep[]
  systems: Record<SystemName | "all_staff", SystemSummary>
  classifier: { jev: ClassifierQuality }
  /** The second Jev call of Level 3: the rule questions scored against the written rules. */
  ruleQuestions: RuleQuestionQuality
  reliability: Record<Field, { chance_of_answer: Reliability; reported_confidence: Reliability }>
  sign_test: SignTest
  dataset: DatasetSummary
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

const wrongQueueOrAction = (record: ClassifierRequestRecord): boolean => record.classifierWrongFields.some((field) => field === "queue" || field === "action")

/** The US dollars of the call that chose the action: the classifier call, or the agent call. */
export const decisionCost = (record: RunRecord): number =>
  callCost(decisionService(record.system), record.decision.inputTokens, record.decision.outputTokens)

/** The US dollars of every model call of one request: the call that chose the action, then the text call, which goes to the LLM. */
export const requestCost = (record: RunRecord): number =>
  decisionCost(record) + callCost("llm", record.tokens.input - record.decision.inputTokens, record.tokens.output - record.decision.outputTokens)

/** The summary of one system over the records of that system. */
export function summarize(records: readonly RunRecord[], name: SystemName): SystemSummary {
  const ends = Object.fromEntries(ENDS.map((end) => [end, 0])) as Record<End, number>
  let served = 0
  let stopped = 0
  let errors = 0
  let labelErrors = 0
  let harmful = 0
  let harmfulMoneyData = 0
  let tokensIn = 0
  let tokensOut = 0
  let decisionIn = 0
  let decisionOut = 0
  let cost = 0
  let decisionCostTotal = 0
  for (const record of records) {
    ends[record.end]++
    // One request has exactly one outcome: served, stopped by design, or an error.
    served += record.outcome === "served" ? 1 : 0
    stopped += record.outcome === "stopped" ? 1 : 0
    errors += record.outcome === "error" ? 1 : 0
    labelErrors += record.labelOutcome === "error" ? 1 : 0
    harmful += record.harmful ? 1 : 0
    harmfulMoneyData += record.harmfulMoneyData ? 1 : 0
    tokensIn += record.tokens.input
    tokensOut += record.tokens.output
    decisionIn += record.decision.inputTokens
    decisionOut += record.decision.outputTokens
    cost += requestCost(record)
    decisionCostTotal += decisionCost(record)
  }
  const n = records.length
  const share = (count: number): number => (n ? count / n : 0)
  const nothingRan = ends.blocked + ends.invalid
  return {
    name,
    requests: n,
    ends,
    invalidAnswers: ends.invalid,
    nothingRan,
    blockRate: share(nothingRan),
    served,
    stopped,
    errors,
    errorRate: share(errors),
    labelErrors,
    harmful,
    harmfulMoneyData,
    machineSeconds: timeStats(records.map((record) => record.timings.machineS)),
    // The flow has no support staff, so the total time of a request is its machine time.
    totalSeconds: timeStats(records.map((record) => record.timings.machineS)),
    decisionLatency: timeStats(records.map((record) => record.decision.latencyS)),
    decisionTokens: {
      input: decisionIn,
      output: decisionOut,
      calls: n,
      inputPerCall: n ? decisionIn / n : 0,
      outputPerCall: n ? decisionOut / n : 0,
    },
    tokens: { input: tokensIn, output: tokensOut, total: tokensIn + tokensOut, perRequest: n ? (tokensIn + tokensOut) / n : 0 },
    apiCostPer1000: n ? (1000 * cost) / n : 0,
    decisionCostPer1000: n ? (1000 * decisionCostTotal) / n : 0,
  }
}

/**
 * The reference point "all to support staff" (Level 1): support staff handle every request, no model runs, and the study
 * assumes that a request handled by support staff gives the customer the result that it needs. It is a reference, not a
 * measurement: the only measured quantity of this level is the assumed STAFF_SECONDS per request.
 */
export function allStaffSummary(requests: readonly TestRequest[]): SystemSummary {
  const n = requests.length
  return {
    name: "all_staff",
    requests: n,
    ends: { answer: 0, act: 0, blocked: 0, invalid: 0 },
    invalidAnswers: 0,
    nothingRan: 0,
    blockRate: 0,
    // Staff serve every request, and the study assumes that each request gets the result that it needs.
    served: n,
    stopped: 0,
    errors: 0,
    errorRate: 0,
    labelErrors: 0,
    harmful: 0,
    harmfulMoneyData: 0,
    machineSeconds: { mean: 0, median: 0, p95: 0, total: 0 },
    totalSeconds: { mean: STAFF_SECONDS, median: STAFF_SECONDS, p95: STAFF_SECONDS, total: STAFF_SECONDS * n },
    decisionLatency: { mean: 0, median: 0, p95: 0, total: 0 },
    decisionTokens: { input: 0, output: 0, calls: 0, inputPerCall: 0, outputPerCall: 0 },
    tokens: { input: 0, output: 0, total: 0, perRequest: 0 },
    apiCostPer1000: 0,
    decisionCostPer1000: 0,
  }
}

/** How often the first pass of the classifier is right, per scored field and overall. */
export function classifierQuality(records: readonly ClassifierRequestRecord[]): ClassifierQuality {
  const perField = {} as Record<Field, FieldQuality>
  for (const field of FIELDS) {
    const scored = records.filter((record) => record.scored.includes(field))
    const correct = scored.filter((record) => record.classifier.fields[field].value === record.gold[field]).length
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
    invalidAnswers: records.filter((record) => record.classifier.invalid).length,
    medianLatencyS: median(records.map((record) => record.decision.latencyS).sort((a, b) => a - b)),
  }
}

/** Does a confidence of 0.90 mean right in 90 of 100? Ten equal bins over [0, 1]. */
export function reliability(records: readonly ClassifierRequestRecord[], field: Field, score: (record: ClassifierRequestRecord) => number | null): Reliability {
  const scored = records.filter((record) => record.scored.includes(field) && score(record) !== null)
  const buckets: { score: number; correct: boolean }[][] = Array.from({ length: 10 }, () => [])
  for (const record of scored) {
    const value = Math.min(Math.max(score(record) ?? 0, 0), 1)
    buckets[Math.min(9, Math.floor(value * 10))].push({ score: value, correct: record.classifier.fields[field].value === record.gold[field] })
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
 * Two-sided exact sign test on the discordant pairs of errors: Level 2 (the LLM agent, which is also the guard) against Level 3
 * (Jev with the rules of Triage and the fixed rules check). The two levels are the two ends of the ladder that this experiment
 * compares on correctness.
 */
export function signTest(level2: readonly RunRecord[], level3: readonly RunRecord[]): SignTest {
  const byId = new Map(level3.map((record) => [record.id, record]))
  let inLevel2Only = 0
  let inLevel3Only = 0
  for (const record of level2) {
    const other = byId.get(record.id)
    if (!other) continue
    const error2 = record.outcome === "error"
    const error3 = other.outcome === "error"
    if (error2 && !error3) inLevel2Only++
    if (!error2 && error3) inLevel3Only++
  }
  const n = inLevel2Only + inLevel3Only
  const head = { level2: "LLM agent", level3: "Jev + LLM + rules", pairs: level2.length }
  if (n === 0) return { ...head, errorsInLevel2Only: 0, errorsInLevel3Only: 0, discordant: 0, pValue: 1 }
  let cumulative = 0
  for (let i = 0; i <= Math.min(inLevel2Only, inLevel3Only); i++) cumulative += binomialPmf(n, i)
  return { ...head, errorsInLevel2Only: inLevel2Only, errorsInLevel3Only: inLevel3Only, discordant: n, pValue: Math.min(1, 2 * cumulative) }
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
    hard: requests.filter((request) => request.hard).length,
    riskFlagShare: share(requests.filter((request) => request.gold.risk).length),
    priorityCriticalShare: share(requests.filter((request) => request.gold.priority === "Critical").length),
    injectionShare: share(requests.filter((request) => request.gold.injection).length),
    finalDenied: requests.filter((request) => request.finalAction === null).length,
    finalDiffersFromGoldAction: requests.filter((request) => request.finalAction !== request.gold.action).length,
    scored,
  }
}

export interface ResultsInput {
  limit: number | null
  offline: boolean
  /** The records of every system, failures excluded. */
  records: readonly RunRecord[]
  /** Requests that could not run because a model call failed. */
  failedRequests: number
  requests: readonly TestRequest[]
  world: World
}

/**
 * The three levels of the ladder, each one part more than the level before. Level 2 runs the pipeline of the `llm_agent` system:
 * the LLM agent of the chat reads the account of the customer, applies the written rules itself, and decides; there are no
 * rules of Triage and no fixed rule behind it. Level 1 is the reference: support staff handle every request, and the study assumes they give the result that
 * each customer needs.
 */
export function ladder(staff: SystemSummary, agent: SystemSummary, jev: SystemSummary): LadderStep[] {
  return [
    {
      level: 0,
      name: "Staff only",
      adds: "Support staff handle every request. No model runs, so no time and no cost are measured; the total time is the assumed 90 s of one request handled by support staff. The study assumes that staff give every customer the result that the request needs, so the outcome counts of this level are a reference and not a measurement: the ladder table marks them --.",
      served: staff.served,
      stopped: staff.stopped,
      errors: staff.errors,
      labelErrors: 0,
      harmful: 0,
      harmfulMoneyData: 0,
      machineSeconds: 0,
      apiCost1000: 0,
      totalSeconds: staff.totalSeconds.mean,
      source: "systems.all_staff",
    },
    {
      level: 1,
      name: "LLM agent",
      adds: "The LLM agent of the chat reads the request, the sender, the channel, the help articles, and the whole account of the customer. It applies the written rules itself and runs an action or refuses with the name of a rule. Nothing stands behind its answer: a named action runs. There are no rules of Triage, so the agent handles an order inside a text as it reads it.",
      served: agent.served,
      stopped: agent.stopped,
      errors: agent.errors,
      labelErrors: agent.labelErrors,
      harmful: agent.harmful,
      harmfulMoneyData: agent.harmfulMoneyData,
      machineSeconds: agent.machineSeconds.mean,
      apiCost1000: agent.apiCostPer1000,
      totalSeconds: agent.totalSeconds.mean,
      source: "systems.llm_agent",
    },
    {
      level: 2,
      name: "Jev + LLM + rules",
      adds: "Jev classifies the request and the Triage rule of injection runs, so the orders in a text are ignored and the action becomes \"Send reply\". For an action that changes the state, a second Jev call answers one question for each written rule of the action; Do action runs only when no answer says broken.",
      served: jev.served,
      stopped: jev.stopped,
      errors: jev.errors,
      labelErrors: jev.labelErrors,
      harmful: jev.harmful,
      harmfulMoneyData: jev.harmfulMoneyData,
      machineSeconds: jev.machineSeconds.mean,
      apiCost1000: jev.apiCostPer1000,
      totalSeconds: jev.totalSeconds.mean,
      source: "systems.jev",
    },
  ]
}

/** The whole results.json: the input of the tables. */
export function buildResults(input: ResultsInput): Results {
  // The shape of a record follows the system: only Level 3 has a classifier answer to grade.
  const jev = input.records.filter((record): record is ClassifierRequestRecord => record.system === "jev")
  const agent = input.records.filter((record): record is AgentRequestRecord => record.system === "llm_agent")
  const n = jev.length
  const reliabilityByField = {} as Results["reliability"]
  for (const field of FIELDS) {
    reliabilityByField[field] = {
      chance_of_answer: reliability(jev, field, (record) => record.classifier.fields[field].chance),
      reported_confidence: reliability(jev, field, (record) => record.classifier.fields[field].reported ?? record.classifier.fields[field].chance),
    }
  }
  const jevSummary = summarize(jev, "jev")
  const agentSummary = summarize(agent, "llm_agent")
  const staffSummary = allStaffSummary(input.requests)
  return {
    generated_utc: new Date().toISOString(),
    limit: input.limit,
    offline: input.offline,
    prices: PRICE,
    staff_seconds: STAFF_SECONDS,
    requests: n,
    failed_requests: input.failedRequests,
    ladder: ladder(staffSummary, agentSummary, jevSummary),
    systems: { jev: jevSummary, llm_agent: agentSummary, all_staff: staffSummary },
    classifier: { jev: classifierQuality(jev) },
    ruleQuestions: ruleQuestionQuality(jev),
    reliability: reliabilityByField,
    sign_test: signTest(agent, jev),
    dataset: datasetSummary(input.world, input.requests),
  }
}
