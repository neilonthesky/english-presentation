// The confidence cascade: an offline analysis of the recorded answers, zero model calls.
//
// Jev answers every request first. When the chance that gates the request is below a threshold, the request goes to
// the next stage instead. Two next stages are measured:
//   - "llm":   the reference run of the LLM classifier (same flow, same fixed rules check) answers instead;
//   - "staff": support staff handle the request (the Level 1 assumption: 90 s, no error, no API cost).
// The flow of a request after the classifier is the recorded flow of the system that answered, so the outcome, the
// Final message, the time, and the cost are recorded values, never estimates. Every model call is already in
// per_case.json, so the analysis costs nothing and never touches the network.
//
// The gate reads the chance of Jev on the fields that the fixed code reads. Two gates are reported:
//   - "action":   the chance of the action answer;
//   - "decision": the lowest chance among action, topic (the Security rule reads it) and injection flag (the rule of
//                 Triage reads it). A field without a chance (an invalid answer) counts as 0, so it escalates.
//
// Three views over the same paired records (one record per request of the set):
//
//   1. Outcome: what the customer gets (served, stopped, errors), the machine time, and the API cost. A request
//      handled by staff is reported in its own column `staffHandled` and is never folded into `served`: the study
//      assumes that staff give every request the result it needs, so their outcome is an assumption, not a
//      measurement. The invariant of every row is served + stopped + errors + staffHandled = the number of requests.
//
//   2. Label quality (the real result of the cascade): the action-label accuracy and the all-field correctness of
//      the answers of the machine stage that finally answered (the label of Jev when its chance is at or above the
//      threshold, the label of the LLM otherwise), plus the coverage, the share of the requests that Jev answered
//      alone. The label grade is the label of the classifier against the gold label of the dataset, not the outcome
//      of the flow: the fixed rules of Level 3 absorb many classifier mistakes, so the outcome view is blind to
//      them (see experiment/notes/cascade.md).
//
//   3. Jev alone with abstention: the risk-coverage curve over every distinct chance value (the action-label error
//      rate of the answered requests against the coverage), its area, and the precision and recall of the rule
//      "escalate when the answer is below the threshold" against the Jev action errors.
//
// The requests that fix the curve are the same that measure it, so the curve is a description of this data,
// not a tuned result: no threshold is chosen here and the paper reads the whole curve.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { cascadeChart, writeChart } from "./figures"
import { decisionCost, requestCost } from "./metrics"
import { STAFF_SECONDS, type ClassifierRequestRecord } from "./pipeline"

export type Gate = "action" | "decision"
export type Next = "llm" | "staff"
/** The fields of the answer that the gate reads: the action, and the two fields that the fixed code reads. */
export type GatedField = "action" | "queue" | "injection"

export const GATES: readonly Gate[] = ["action", "decision"]
export const NEXTS: readonly Next[] = ["llm", "staff"]

/** The thresholds of the curve. 0 escalates nothing (Jev alone); a value above 1 escalates every request (LLM alone). */
export const THRESHOLDS: readonly number[] = [0, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99, 1.0000001]

const FIELDS_OF_GATE: Record<Gate, readonly GatedField[]> = {
  action: ["action"],
  decision: ["action", "queue", "injection"],
}

/** The chance that gates the request: the lowest chance of the fields of the gate. A missing chance (invalid answer) is 0. */
export function gateChance(record: ClassifierRequestRecord, gate: Gate): number {
  if (record.classifier.invalid) return 0
  let lowest = 1
  for (const field of FIELDS_OF_GATE[gate]) lowest = Math.min(lowest, record.classifier.fields[field].chance ?? 0)
  return lowest
}

/** True when the action label of the classifier equals the gold action label of the dataset. */
const actionRight = (record: ClassifierRequestRecord): boolean =>
  record.classifier.fields.action.value === record.gold.action

/** True when every scored field of the classifier equals the gold answer (an invalid answer is wrong in every field). */
const allFieldsRight = (record: ClassifierRequestRecord): boolean => record.classifierWrongFields.length === 0

const thresholdLabel = (threshold: number): string =>
  threshold === 0 ? "Jev alone" : threshold > 1 ? "LLM alone" : `< ${threshold}`

// ---------------------------------------------------------------- the outcome view

/** The outcome of a set of requests: what the customer gets, the time, and the API cost. */
export interface Outcome {
  n: number
  /** The outcome of the requests that a machine stage answered (the whole set when the next stage is the LLM). */
  served: number
  stopped: number
  errors: number
  harmful: number
  /** Errors over the requests that a machine stage answered. */
  errorRateOfMachine: number
  /** Mean seconds of one request: the machine time of the stages that ran, plus 90 s for a request that staff handled. */
  meanTotalS: number
  /** Mean machine seconds only: the staff time is excluded. */
  meanMachineS: number
  /** API dollars per 1,000 requests of every model call of the request, the Jev call that gates it included. */
  costPer1k: number
  /** The ids of the requests that end as an error. */
  errorIds: string[]
}

/** The outcome of one system alone, over its own recorded requests and with no gate in front of it. */
export type AlonePoint = Outcome

export interface CascadePoint extends Outcome {
  gate: Gate
  next: Next
  /** The requests with a chance below this value go to the next stage. */
  threshold: number
  escalated: number
  /** The escalated requests, when the next stage is staff. They are assumed to need 90 s and to make no error. */
  staffHandled: number
  /** The requests that a machine stage answered: n - staffHandled. */
  machineHandled: number
}

/** One point of the curve over the paired records (the same requests, in the same order). */
export function cascadePoint(
  jev: readonly ClassifierRequestRecord[], llm: readonly ClassifierRequestRecord[], gate: Gate, next: Next, threshold: number,
): CascadePoint {
  if (jev.length !== llm.length) throw new Error("jev and llm records must pair up")
  let escalated = 0, staffHandled = 0, served = 0, stopped = 0, errors = 0, harmful = 0, machineS = 0, totalS = 0, cost = 0
  const errorIds: string[] = []
  jev.forEach((j, i) => {
    const l = llm[i]
    if (j.id !== l.id) throw new Error(`records out of order: ${j.id} / ${l.id}`)
    const goes = gateChance(j, gate) < threshold
    if (goes) escalated++
    if (goes && next === "staff") {
      // The Jev call was made and paid for before the gate could read it; the staff then handle the request.
      staffHandled++
      machineS += j.decision.latencyS
      totalS += j.decision.latencyS + STAFF_SECONDS
      cost += decisionCost(j)
      return
    }
    const final = goes ? l : j
    if (final.outcome === "served") served++
    else if (final.outcome === "stopped") stopped++
    else {
      errors++
      errorIds.push(final.id)
    }
    if (final.harmful) harmful++
    const machine = goes ? j.decision.latencyS + l.timings.machineS : j.timings.machineS
    machineS += machine
    totalS += machine
    cost += goes ? decisionCost(j) + requestCost(l) : requestCost(j)
  })
  const n = jev.length
  const machineHandled = n - staffHandled
  if (served + stopped + errors + staffHandled !== n) throw new Error(`row does not add up to n: ${served}+${stopped}+${errors}+${staffHandled}`)
  return {
    gate, next, threshold, n, escalated, staffHandled, machineHandled, served, stopped, errors, harmful,
    errorRateOfMachine: machineHandled === 0 ? 0 : errors / machineHandled,
    meanTotalS: totalS / n, meanMachineS: machineS / n,
    costPer1k: (cost / n) * 1000, errorIds,
  }
}

/** The end of the curve of one system alone: the recorded flow of its own requests, with no gate in front of it. */
export function alonePoint(records: readonly ClassifierRequestRecord[]): AlonePoint {
  let served = 0, stopped = 0, errors = 0, harmful = 0, machineS = 0, cost = 0
  const errorIds: string[] = []
  for (const record of records) {
    if (record.outcome === "served") served++
    else if (record.outcome === "stopped") stopped++
    else {
      errors++
      errorIds.push(record.id)
    }
    if (record.harmful) harmful++
    machineS += record.timings.machineS
    cost += requestCost(record)
  }
  const n = records.length
  if (served + stopped + errors !== n) throw new Error("alone point does not add up to n")
  return {
    n, served, stopped, errors, harmful, errorRateOfMachine: n === 0 ? 0 : errors / n,
    meanTotalS: machineS / n, meanMachineS: machineS / n, costPer1k: (cost / n) * 1000, errorIds,
  }
}

// ---------------------------------------------------------------- the label-quality view

/**
 * The label quality of one group of requests: the action label against the gold action, and every scored field.
 * The two shares are 0 when the group is empty (every request escalated), never NaN.
 */
export interface StageLabels {
  n: number
  actionCorrect: number
  actionAccuracy: number
  allFieldsCorrect: number
  allFieldsAccuracy: number
}

const stageLabels = (records: readonly ClassifierRequestRecord[]): StageLabels => {
  const actionCorrect = records.filter(actionRight).length
  const allFieldsCorrect = records.filter(allFieldsRight).length
  return {
    n: records.length,
    actionCorrect, actionAccuracy: records.length === 0 ? 0 : actionCorrect / records.length,
    allFieldsCorrect, allFieldsAccuracy: records.length === 0 ? 0 : allFieldsCorrect / records.length,
  }
}

export interface LabelQuality extends StageLabels {
  gate: Gate
  threshold: number
  /** The share of the requests that Jev answered alone (the chance of the gate is at or above the threshold). */
  coverage: number
  escalated: number
  /** The label quality of the requests that Jev answered. */
  jevAnswered: StageLabels
  /** The label quality of the requests that the LLM answered instead. */
  llmAnswered: StageLabels
}

/**
 * The label quality of the cascade to the LLM: the label of Jev stands when the gate chance is at or above the
 * threshold, the label of the LLM stands otherwise. The mixed numbers at the top count the answers of both stages.
 */
export function labelQuality(
  jev: readonly ClassifierRequestRecord[], llm: readonly ClassifierRequestRecord[], gate: Gate, threshold: number,
): LabelQuality {
  if (jev.length !== llm.length) throw new Error("jev and llm records must pair up")
  const covered: ClassifierRequestRecord[] = []
  const escalated: ClassifierRequestRecord[] = []
  jev.forEach((j, i) => {
    const l = llm[i]
    if (j.id !== l.id) throw new Error(`records out of order: ${j.id} / ${l.id}`)
    if (gateChance(j, gate) < threshold) escalated.push(l)
    else covered.push(j)
  })
  const coveredLabels = stageLabels(covered)
  const escalatedLabels = stageLabels(escalated)
  const n = jev.length
  const actionCorrect = coveredLabels.actionCorrect + escalatedLabels.actionCorrect
  const allFieldsCorrect = coveredLabels.allFieldsCorrect + escalatedLabels.allFieldsCorrect
  return {
    gate, threshold, n, coverage: covered.length / n, escalated: escalated.length,
    actionCorrect, actionAccuracy: actionCorrect / n,
    allFieldsCorrect, allFieldsAccuracy: allFieldsCorrect / n,
    jevAnswered: coveredLabels, llmAnswered: escalatedLabels,
  }
}

// ---------------------------------------------------------------- Jev alone with abstention

export interface RiskCoveragePoint {
  /** The abstention cut: a request whose action chance is below this value is not answered. */
  cut: number
  coverage: number
  answered: number
  wrong: number
  /** The action-label error rate of the answered requests. */
  risk: number
  /** The errors of the flow (the outcome of the request) among the answered requests. */
  outcomeErrors: number
  riskOutcome: number
}

export interface RiskCoverage {
  gate: Gate
  field: GatedField
  /** One point per distinct chance value, plus the two ends (every request answered, nothing answered). */
  points: RiskCoveragePoint[]
  /** The number of distinct chance values that the cut can take. */
  distinctCuts: number
  /** The area under the risk-coverage curve (trapezoid over the coverage, 0 is a perfect selective classifier). */
  aurc: number
  /** The error rate with no abstention (every request answered). */
  riskFull: number
  /** The risk of the points whose coverage is the largest value at or below each target. */
  riskAt: { target: number; coverage: number; risk: number }[]
  /** The chance of every wrong action label, ascending: the high values are the confident errors. */
  wrongChances: number[]
  /** The chance of every action label above the given value that is still wrong. */
  confidentErrors: { above: number; count: number }
  /** The highest coverage at which the answered requests hold no action error. */
  zeroErrorCoverage: number | null
}

/**
 * The risk-coverage curve of Jev alone: a request is answered when its action chance is at or above the cut, and the
 * risk is the action-label error rate of the answered requests. The curve is a step function, so it is computed at
 * every distinct chance value; a cut above every chance answers nothing (coverage 0, risk 0).
 */
export function riskCoverage(jev: readonly ClassifierRequestRecord[], gate: Gate = "action"): RiskCoverage {
  const field = FIELDS_OF_GATE[gate][0]
  const rows = jev.map((record) => ({
    chance: record.classifier.invalid ? 0 : record.classifier.fields[field].chance ?? 0,
    wrong: !actionRight(record),
    outcomeError: record.outcome === "error",
  }))
  const n = rows.length
  const cuts = [...new Set(rows.map((r) => r.chance))].sort((a, b) => a - b)
  const points: RiskCoveragePoint[] = [0, ...cuts].map((cut) => {
    const answered = rows.filter((r) => r.chance >= cut)
    const wrong = answered.filter((r) => r.wrong).length
    const outcomeErrors = answered.filter((r) => r.outcomeError).length
    return {
      cut, coverage: answered.length / n, answered: answered.length, wrong, risk: answered.length === 0 ? 0 : wrong / answered.length,
      outcomeErrors, riskOutcome: answered.length === 0 ? 0 : outcomeErrors / answered.length,
    }
  })
  points.push({ cut: 1.0000001, coverage: 0, answered: 0, wrong: 0, risk: 0, outcomeErrors: 0, riskOutcome: 0 })
  const ordered = [...points].sort((a, b) => a.coverage - b.coverage)
  let aurc = 0
  for (let i = 1; i < ordered.length; i++)
    aurc += ((ordered[i].coverage - ordered[i - 1].coverage) * (ordered[i].risk + ordered[i - 1].risk)) / 2
  const at = (target: number): { target: number; coverage: number; risk: number } => {
    const below = ordered.filter((p) => p.coverage <= target)
    const point = below.length > 0 ? below[below.length - 1] : ordered[0]
    return { target, coverage: point.coverage, risk: point.risk }
  }
  return {
    gate, field, points, distinctCuts: cuts.length, aurc,
    riskFull: points[0].risk,
    riskAt: [0.9, 0.75, 0.5].map(at),
    wrongChances: rows.filter((r) => r.wrong).map((r) => r.chance).sort((a, b) => a - b),
    confidentErrors: { above: 0.9, count: rows.filter((r) => r.wrong && r.chance >= 0.9).length },
    zeroErrorCoverage: points.filter((p) => p.wrong === 0).reduce<number | null>((best, p) => (best === null || p.coverage > best ? p.coverage : best), null),
  }
}

// ---------------------------------------------------------------- the escalate-when-wrong view

export interface EscalationPoint {
  gate: Gate
  threshold: number
  escalated: number
  /** The escalated requests whose Jev action label was correct. */
  escalatedCorrect: number
  /** The escalated requests whose Jev action label was wrong. */
  escalatedWrong: number
  /** escalatedWrong / escalated (null when nothing is escalated). */
  precision: number | null
  /** The Jev action errors that the threshold escalates. */
  caught: number
  missed: number
  /** caught / (every Jev action error). */
  recall: number
}

export interface Escalation {
  gate: Gate
  n: number
  /** Every Jev action error of the set. */
  wrongTotal: number
  correctTotal: number
  points: EscalationPoint[]
}

/** How many of the Jev action errors a threshold catches, and how many correct labels it escalates for nothing. */
export function escalation(jev: readonly ClassifierRequestRecord[], gate: Gate): Escalation {
  const wrongTotal = jev.filter((r) => !actionRight(r)).length
  const points = THRESHOLDS.map((threshold) => {
    const gone = jev.filter((r) => gateChance(r, gate) < threshold)
    const escalatedWrong = gone.filter((r) => !actionRight(r)).length
    return {
      gate, threshold, escalated: gone.length,
      escalatedCorrect: gone.length - escalatedWrong, escalatedWrong,
      precision: gone.length === 0 ? null : escalatedWrong / gone.length,
      caught: escalatedWrong, missed: wrongTotal - escalatedWrong,
      recall: wrongTotal === 0 ? 0 : escalatedWrong / wrongTotal,
    }
  })
  return { gate, n: jev.length, wrongTotal, correctTotal: jev.length - wrongTotal, points }
}

// ---------------------------------------------------------------- the whole analysis

export interface Cascade {
  generated_from: string
  thresholds: number[]
  gates: Gate[]
  /** Every gate, next stage, and threshold of the outcome view. */
  points: CascadePoint[]
  /** The two ends of the curve, each computed directly from the records of its own system. */
  ends: { jevAlone: AlonePoint; llmAlone: AlonePoint }
  /** The label quality of each system alone, over its own recorded answers. */
  labelEnds: { jev: StageLabels; llm: StageLabels }
  /** The label quality of the cascade to the LLM, for both gates. */
  labelQuality: LabelQuality[]
  /** The risk-coverage curve of Jev alone with abstention. */
  riskCoverage: RiskCoverage
  /** The escalate-when-wrong view, one entry per gate. */
  escalation: Escalation[]
  note: string
}

export function buildCascade(jev: readonly ClassifierRequestRecord[], llm: readonly ClassifierRequestRecord[], from: string): Cascade {
  const points: CascadePoint[] = []
  for (const gate of GATES)
    for (const next of NEXTS)
      for (const threshold of THRESHOLDS) points.push(cascadePoint(jev, llm, gate, next, threshold))
  const labelQualityPoints: LabelQuality[] = []
  for (const gate of GATES) for (const threshold of THRESHOLDS) labelQualityPoints.push(labelQuality(jev, llm, gate, threshold))
  return {
    generated_from: from,
    thresholds: [...THRESHOLDS],
    gates: [...GATES],
    points,
    ends: { jevAlone: alonePoint(jev), llmAlone: alonePoint(llm) },
    labelEnds: { jev: stageLabels(jev), llm: stageLabels(llm) },
    labelQuality: labelQualityPoints,
    riskCoverage: riskCoverage(jev),
    escalation: GATES.map((gate) => escalation(jev, gate)),
    note:
      "Offline over the recorded answers of per_case.json; zero model calls. A request handled by staff is reported " +
      "in staffHandled and never folded into served: the study assumes that staff give every request the result it " +
      "needs and make no error, so that outcome is an assumption. Every row satisfies " +
      `served + stopped + errors + staffHandled = ${jev.length}, the number of requests of the set. The requests that fix ` +
      "the thresholds are the same that measure them, so no threshold is a tuned winner and the paper reads the whole curve.",
  }
}

// ---------------------------------------------------------------- the LaTeX export

const pct = (v: number): string => (100 * v).toFixed(1)
const money = (v: number): string => v.toFixed(2)
const row = (cells: readonly (string | number)[]): string => `${cells.join(" & ")} \\\\`

/** The LaTeX tables of the cascade: the outcome to the LLM, the outcome to staff, the label quality, and the risk-coverage end of Jev alone. */
export function cascadeTable(c: Cascade): string {
  const lines: string[] = []
  const point = (gate: Gate, next: Next, threshold: number): CascadePoint => {
    const found = c.points.find((p) => p.gate === gate && p.next === next && p.threshold === threshold)
    if (!found) throw new Error(`no point ${gate}/${next}/${threshold}`)
    return found
  }

  // Table 1: the outcome of the cascade to the LLM, on the decision gate.
  lines.push(
    "\\begin{table}[t]",
    `\\caption{The confidence cascade to the LLM on the ${c.ends.llmAlone.n} requests (offline, recorded answers). A request goes to the LLM when the lowest chance of Jev on the action, topic, and injection answers is below the threshold. The outcome is what the customer gets; the fixed rules of Level 3 absorb the classifier mistakes, so it does not move. Machine s and API \\$/1k are the recorded values of the stages that ran; \`\`All to LLM'' pays the Jev call that gates every request, \`\`LLM alone'' is the reference run without the gate.}`,
    "\\label{tab:cascade}",
    "\\small",
    "\\begin{tabular}{lrrrrrrr}",
    "\\toprule",
    "Threshold & To LLM & Served & Stopped & Errors & Staff & Machine s & API \\$/1k \\\\",
    "\\midrule",
  )
  for (const threshold of THRESHOLDS.slice(0, -1)) {
    const p = point("decision", "llm", threshold)
    lines.push(row([thresholdLabel(threshold), p.escalated, p.served, p.stopped, p.errors, p.staffHandled, p.meanMachineS.toFixed(2), money(p.costPer1k)]))
  }
  const allToLlm = point("decision", "llm", 1.0000001)
  const llmAlone = c.ends.llmAlone
  lines.push(
    "\\midrule",
    row(["All to LLM", allToLlm.escalated, allToLlm.served, allToLlm.stopped, allToLlm.errors, allToLlm.staffHandled, allToLlm.meanMachineS.toFixed(2), money(allToLlm.costPer1k)]),
    row(["LLM alone", llmAlone.n, llmAlone.served, llmAlone.stopped, llmAlone.errors, 0, llmAlone.meanMachineS.toFixed(2), money(llmAlone.costPer1k)]),
  )
  lines.push("\\bottomrule", "\\end{tabular}", "\\end{table}", "")

  // Table 2: the outcome of the cascade to staff, on the decision gate.
  lines.push(
    "\\begin{table}[t]",
    "\\caption{The same cascade with support staff as the next stage. The staff requests are reported in their own column and are not folded into Served: 90 s each and no error are the Level 1 assumption, not a measurement, so the outcome columns cover only the requests that a machine stage answered.}",
    "\\label{tab:cascade-staff}",
    "\\small",
    "\\begin{tabular}{lrrrrrrrr}",
    "\\toprule",
    "Threshold & To staff & Served & Stopped & Errors & Staff & Machine s & Mean total s & API \\$/1k \\\\",
    "\\midrule",
  )
  for (const threshold of THRESHOLDS) {
    const p = point("decision", "staff", threshold)
    const label = threshold > 1 ? "All to staff" : thresholdLabel(threshold)
    lines.push(row([label, p.escalated, p.served, p.stopped, p.errors, p.staffHandled, p.meanMachineS.toFixed(2), p.meanTotalS.toFixed(2), money(p.costPer1k)]))
  }
  lines.push("\\bottomrule", "\\end{tabular}", "\\end{table}", "")

  // Table 3: the label quality of the cascade to the LLM, both gates.
  lines.push(
    "\\begin{table}[t]",
    `\\caption{The label quality of the cascade to the LLM. Coverage is the share of the requests that Jev answered alone; Action and All fields are the share of the ${c.ends.llmAlone.n} answers that are correct, with the label of Jev above the threshold and the label of the LLM below it. Jev alone: ${pct(c.labelEnds.jev.actionAccuracy)}\\% action, ${pct(c.labelEnds.jev.allFieldsAccuracy)}\\% all fields. LLM alone: ${pct(c.labelEnds.llm.actionAccuracy)}\\% action, ${pct(c.labelEnds.llm.allFieldsAccuracy)}\\% all fields.}`,
    "\\label{tab:cascade-label}",
    "\\small",
    "\\begin{tabular}{llrrrr}",
    "\\toprule",
    "Gate & Threshold & Coverage & Action (\\%) & All fields (\\%) & To LLM \\\\",
    "\\midrule",
  )
  for (const gate of GATES)
    for (const threshold of THRESHOLDS) {
      const l = c.labelQuality.find((p) => p.gate === gate && p.threshold === threshold)
      if (!l) throw new Error(`no label quality ${gate}/${threshold}`)
      lines.push(row([gate === "action" ? "Action" : "Decision", thresholdLabel(threshold), pct(l.coverage), pct(l.actionAccuracy), pct(l.allFieldsAccuracy), l.escalated]))
    }
  lines.push("\\bottomrule", "\\end{tabular}", "\\end{table}", "")

  // Table 4: the escalate-when-wrong view and the end of the risk-coverage curve of Jev alone.
  const esc = c.escalation.find((e) => e.gate === "action")
  const risk = c.riskCoverage
  if (!esc) throw new Error("no escalation view")
  lines.push(
    "\\begin{table}[t]",
    `\\caption{The escalate-when-wrong view of the action gate, and the risk-coverage end of Jev alone with abstention. Caught is the number of the ${esc.wrongTotal} Jev action errors that the threshold escalates; Needless is the number of correct labels that it escalates for nothing; Precision is Caught over everything escalated. Coverage and Risk are the risk-coverage curve read at the same threshold: the action-label error rate of the requests that stay with Jev.}`,
    "\\label{tab:cascade-escalate}",
    "\\small",
    "\\begin{tabular}{lrrrrrr}",
    "\\toprule",
    `Threshold & To LLM & Caught (of ${esc.wrongTotal}) & Needless & Precision (\\%) & Coverage & Risk (\\%) \\\\`,
    "\\midrule",
  )
  for (const e of esc.points) {
    const answered = esc.n - e.escalated
    const riskOfAnswered = answered === 0 ? 0 : (esc.wrongTotal - e.caught) / answered
    lines.push(row([
      e.threshold > 1 ? "All to LLM" : thresholdLabel(e.threshold), e.escalated, e.caught, e.escalatedCorrect,
      e.precision === null ? "--" : pct(e.precision), pct(answered / esc.n), pct(riskOfAnswered),
    ]))
  }
  lines.push("\\bottomrule", "\\end{tabular}", "\\end{table}", "")

  // Table 5: the end of the risk-coverage curve of Jev alone.
  lines.push(
    "\\begin{table}[t]",
    "\\caption{The risk-coverage end of Jev alone with abstention, on the action answer. Risk is the action-label error rate of the answered requests; a request is answered when its action chance is at or above the cut. The curve itself is in figures/cascade.pdf and every point is in results/cascade.json.}",
    "\\label{tab:cascade-risk}",
    "\\small",
    "\\begin{tabular}{lr}",
    "\\toprule",
    "Quantity & Value \\\\",
    "\\midrule",
    row(["Distinct action chances (the cuts of the curve)", risk.distinctCuts]),
    row(["Error rate, no abstention", `${pct(risk.riskFull)}\\%`]),
    ...risk.riskAt.map((a) => row([`Error rate at coverage ${pct(a.coverage)}\\%`, `${pct(a.risk)}\\%`])),
    row([`Action errors with a chance of at least ${risk.confidentErrors.above}`, `${risk.confidentErrors.count} of ${risk.wrongChances.length}`]),
    row(["Coverage when every action error is abstained", risk.zeroErrorCoverage === null ? "--" : `${pct(risk.zeroErrorCoverage)}\\%`]),
    row(["$\\mathrm{AURC}$ (area under the risk-coverage curve)", risk.aurc.toFixed(3)]),
    "\\bottomrule", "\\end{tabular}", "\\end{table}", "",
  )
  return lines.join("\n")
}

// ---------------------------------------------------------------- the command line

async function main(): Promise<void> {
  const dir = process.argv[2] ?? join(import.meta.dir, "results")
  const perCase = JSON.parse(await readFile(join(dir, "per_case.json"), "utf8")) as {
    jev: ClassifierRequestRecord[]
    llm: ClassifierRequestRecord[]
  }
  const cascade = buildCascade(perCase.jev, perCase.llm, "per_case.json")
  await mkdir(join(dir, "tables"), { recursive: true })
  await writeFile(join(dir, "cascade.json"), JSON.stringify(cascade, null, 2) + "\n")
  await writeFile(join(dir, "tables", "cascade.tex"), cascadeTable(cascade))
  await writeChart(dir, "cascade", cascadeChart(cascade))

  console.log("gate     next   thr    to next staff served stopped errors harmful machine_s $/1k")
  for (const p of cascade.points)
    console.log(
      `${p.gate.padEnd(8)} ${p.next.padEnd(6)} ${p.threshold.toFixed(2).padStart(5)} ${String(p.escalated).padStart(7)} ${String(p.staffHandled).padStart(5)} ${String(p.served).padStart(6)} ${String(p.stopped).padStart(7)} ${String(p.errors).padStart(6)} ${String(p.harmful).padStart(7)} ${p.meanMachineS.toFixed(2).padStart(9)} ${p.costPer1k.toFixed(3).padStart(6)}`,
    )
  console.log("")
  console.log("label quality (cascade to LLM):")
  console.log("gate     thr    coverage action% all%   jev action%  llm action%")
  for (const l of cascade.labelQuality)
    console.log(
      `${l.gate.padEnd(8)} ${l.threshold.toFixed(2).padStart(5)} ${pct(l.coverage).padStart(8)} ${pct(l.actionAccuracy).padStart(7)} ${pct(l.allFieldsAccuracy).padStart(6)} ${pct(l.jevAnswered.actionAccuracy).padStart(11)} ${pct(l.llmAnswered.actionAccuracy).padStart(11)}`,
    )
  console.log("")
  console.log(`Jev alone: action ${pct(cascade.labelEnds.jev.actionAccuracy)}%, all fields ${pct(cascade.labelEnds.jev.allFieldsAccuracy)}%, outcome ${cascade.ends.jevAlone.served}/${cascade.ends.jevAlone.stopped}/${cascade.ends.jevAlone.errors}`)
  console.log(`LLM alone: action ${pct(cascade.labelEnds.llm.actionAccuracy)}%, all fields ${pct(cascade.labelEnds.llm.allFieldsAccuracy)}%, outcome ${cascade.ends.llmAlone.served}/${cascade.ends.llmAlone.stopped}/${cascade.ends.llmAlone.errors}`)
  const rc = cascade.riskCoverage
  console.log(`risk-coverage of Jev alone: ${rc.distinctCuts} distinct chances, AURC ${rc.aurc.toFixed(3)}, risk at full coverage ${pct(rc.riskFull)}%, risk ${rc.riskAt.map((a) => `${pct(a.risk)}% at coverage ${pct(a.coverage)}%`).join(", ")}`)
  console.log(`${rc.confidentErrors.count} of the ${rc.wrongChances.length} Jev action errors carry an action chance of at least ${rc.confidentErrors.above}`)
  for (const e of cascade.escalation) {
    console.log(`escalate-when-wrong, ${e.gate} gate (${e.wrongTotal} errors):`)
    for (const p of e.points)
      console.log(`  thr ${p.threshold.toFixed(2).padStart(5)}: escalated ${String(p.escalated).padStart(2)} (${String(p.escalatedCorrect).padStart(2)} correct for nothing), caught ${p.caught}/${e.wrongTotal}, precision ${p.precision === null ? "--" : pct(p.precision)}%, recall ${pct(p.recall)}%`)
  }
  console.log("")
  console.log(`wrote ${join(dir, "cascade.json")}, ${join(dir, "tables", "cascade.tex")}, ${join(dir, "figures", "cascade.svg")} and cascade.pdf`)
}

if (import.meta.main) await main()
