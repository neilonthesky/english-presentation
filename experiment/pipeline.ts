// The flow of the demo for one request, run for the experiment. Every state calls the function of the demo, so the paper and
// the demo cannot drift apart:
//
//   New        the chat of the customer: the first message, then the clarification of the dataset after each Clarify question
//   Triage     the classifier (llm_classifier.ts) answers the five questions on the whole chat; triageStep (steps.ts) chooses the next state
//   Clarify    writeClarify (models.ts) asks one question; the reply of the customer is the clarification of the dataset
//   Gather     extractFacts, findArticles (saas.ts)
//   Rules      rulesStep (steps.ts): the written rules for the action
//   Do action  actStep (steps.ts)
//   Final      answerQuestion (action "Send reply") or writeReply (models.ts)
//   Queued     not simulated: no ticket summary is written, and support staff do not reply. The fixed message needs no model.
//
// Chat open (the popup, the silence timers) and a customer who writes again are not simulated: the experiment measures the
// first pass of one request.
//
// The experiment runs this flow in two routings:
//   triage   rung 2 (and the classifier reference run): the rules of Triage and the written rules run, and support staff take the
//            requests that need them.
//   rules    rung 1 (an LLM and the written rules): only the written rules run, on the action of the classifier. The rules of
//            Triage do not run (no Critical, no injection rule, no floor, no "Needs staff" rule, no risk rule, no Clarify), no
//            support staff take a request, and the injection flag is not read. See decideRules.
//
// Chat open (the popup, the silence timers) and a customer who writes again are not simulated: the experiment measures the
// first pass of one request.
//
// A classifier answer that is not valid fails closed. At rung 2 the request goes to Queued with the rule "classifier
// answer not valid" and nothing runs. At rung 1 there is no support staff, so nothing runs and the customer reads no message.
import { extractFacts, findArticles, requesterFor, staffWhy } from "../web/server/saas"
import { actStep, rulesStep, triageStep } from "../web/server/steps"
import { answerQuestion, writeClarify, writeReply } from "../web/server/models"
import type { Classifier, Executed, Facts, Requester, RulesResponse, TriageResponse, TriageRule } from "../web/src/types"
import type { Classify, ClassifierRun } from "./llm_classifier"
import { withCallLog, type Service } from "./transport"
import { FIELDS, type Field, type FinalResult, type TestRequest } from "./types"

/**
 * The systems that run a classifier: "llm_rules" is rung 1 (an LLM and the written rules, no support staff), "jev" is rung 2 (Jev
 * as the classifier, the rules of Triage, and support staff), and "llm" is the classifier reference run (the same LLM as rung 1,
 * with the rules of Triage and support staff) that gives the LLM side of the stage table.
 */
export type SystemName = "jev" | "llm" | "llm_rules"

/** How a request goes through the flow: with the rules of Triage and support staff, or with the written rules only (rung 1). */
export type Routing = "triage" | "rules"

/** The routing of each system. */
export const ROUTING: Record<SystemName, Routing> = { jev: "triage", llm: "triage", llm_rules: "rules" }

/** The assumed time of support staff to read one request that reached Queued. */
export const STAFF_SECONDS = 90

/**
 * The list price of one million tokens, in US dollars.
 * Jev: https://docs.typesafe.ai/models and https://typesafe.ai/blog/introducing-system-one-models-and-jev . One million input
 * tokens cost $0.042, and output tokens are free.
 * DeepSeek V4.1 Flash (the LLM of this project): https://api-docs.deepseek.com/quick_start/pricing/ . One million input tokens
 * cost $0.15 when the prompt is not cached, and one million output tokens cost $0.60; at peak the price is twice these values.
 * The experiment applies the off-peak list price of the two sources above and the cache-miss price: the provider reports 0
 * cached tokens, because the prompt cache is not used.
 */
export const PRICE: Record<Service, { input: number; output: number }> = {
  jev: { input: 0.042, output: 0 },
  llm: { input: 0.15, output: 0.6 },
}

/** The US dollars of one model call: the tokens of the call and the price of the service that made it. */
export const callCost = (service: Service, inputTokens: number, outputTokens: number): number =>
  (inputTokens * PRICE[service].input + outputTokens * PRICE[service].output) / 1_000_000

/** The service of the classifier of a system: Jev at rung 2, the LLM at rung 1 and in the classifier reference run. */
export const classifierService = (system: SystemName): Service => (system === "jev" ? "jev" : "llm")

/** The rule that sends a request to Queued when the classifier gave no usable answer. */
export const INVALID_ANSWER_RULE = "classifier answer not valid"

/** A state-changing action changes money or data. A silent error with one of them is harmful. */
export const isStateChanging = (action: string | null): boolean => action === "Start refund" || action === "Delete data"

/**
 * How a request ended. answer: the Final message answers ("Send reply"). action: Do action ran a refund or a deletion.
 * denied: nothing ran (the written rules deny the action, or they ask for support staff and there is none at rung 1), and the
 * Final message explains. queued: support staff take the request (rung 2 and the classifier reference run only). invalid: the classifier answer was not
 * valid, so nothing ran and the customer reads no message (rung 1 only, where there is no support staff to take the request).
 */
export type End = "answer" | "action" | "denied" | "queued" | "invalid"
export const ENDS: readonly End[] = ["answer", "action", "denied", "queued", "invalid"]

/** Where Triage and Rules check send a request after one classifier answer. No model runs here. */
export type Decision =
  | { next: "clarify"; triage: TriageResponse }
  | { next: "queued"; triage: TriageResponse; rule: TriageRule | "rules"; staffWhy: string; rules: RulesResponse | null }
  | { next: "final"; triage: TriageResponse; rules: RulesResponse; executed: Executed; end: Exclude<End, "queued"> }

/**
 * Triage (part 2), Rules check, and Do action on one classifier answer. This is the fixed part of the flow: the experiment, the
 * oracle of the dataset (build_dataset.ts, validate.ts), and the fault injection (faults.ts) all call it. Do action writes to `ledger`.
 * `round` is the number of Clarify rounds done so far.
 */
export function decide(c: Classifier, round: number, who: Requester, text: string, ledger: Set<string>, customerId: string): Decision {
  const triage = triageStep(c, round)
  if (triage.next === "clarify") return { next: "clarify", triage }
  if (triage.next === "queued") return { next: "queued", triage, rule: triage.rule, staffWhy: staffWhy(triage.rule), rules: null }
  const rules = rulesStep(triage.action, who, extractFacts(text), ledger, customerId)
  if (rules.next === "queued") return { next: "queued", triage, rule: "rules", staffWhy: rules.staffWhy ?? "", rules }
  const executed = actStep(triage.action, triage.queue, rules, ledger, customerId)
  const end = executed.action === null ? "denied" : executed.action === "Send reply" ? "answer" : "action"
  return { next: "final", triage, rules, executed, end }
}

/** Where the written rules send a request at rung 1: allow runs the action, deny and review run nothing, and no request reaches Queued. */
export interface PlainDecision {
  rules: RulesResponse
  executed: Executed
  end: "answer" | "action" | "denied"
}

/** The reason that the customer reads when the classifier asks for support staff at rung 1, where no support staff take a request. */
export const NO_STAFF_REASON =
  "The request needs work that the chatbot cannot do, and no support staff take a request at this rung, so nothing was done."

/**
 * Rung 1 (an LLM and the written rules): the action of the classifier goes to the written rules at once. The rules of Triage do
 * not run: no Critical, no injection rule (the injection flag is not read, so orders in the text are not ignored), no floor, no
 * "Needs staff" rule, no risk rule, and no Clarify. There is no support staff either, so the verdict review runs nothing, and an
 * action of "Needs staff" runs nothing. Do action writes to `ledger`.
 */
export function decideRules(c: Classifier, who: Requester, text: string, ledger: Set<string>, customerId: string): PlainDecision {
  const action = c.fields.action.value as string
  const rules = rulesStep(action, who, extractFacts(text), ledger, customerId)
  if (action === "Needs staff") {
    return { rules, executed: { action: null, queue: null, target: null, blocked: [NO_STAFF_REASON], details: [] }, end: "denied" }
  }
  const executed = actStep(action, c.fields.queue.value as string, rules, ledger, customerId)
  if (rules.next !== "act") return { rules, executed, end: "denied" }
  return { rules, executed, end: executed.action === "Send reply" ? "answer" : "action" }
}

/**
 * The result of Do action against the gold final result of the dataset. A gold Queued is never matched: a system that ran
 * something (even "nothing, denied") did not send the request to support staff.
 */
export const executedMatches = (executed: Pick<Executed, "action">, final: FinalResult): boolean => !final.toStaff && executed.action === final.action

/** One field of the classifier answer, with both confidence values that the reliability table needs. */
export interface ClassifierFieldRecord {
  value: string | boolean | null
  /** The chance that Jev gave to the answer it gave: the largest probability of a choice, or max(p, 1 - p) of a flag. Null for the baseline, which gives no chance. */
  chance: number | null
  /** The `confidence` that Jev reports for a choice field. Null for a flag and for the baseline. */
  reported: number | null
}

export interface ClassifierRecord {
  /** The service that answered: Jev or the LLM. */
  system: Service
  model: string
  latencyS: number
  inputTokens: number
  outputTokens: number
  invalid: boolean
  invalidReason: string | null
  fields: Record<Field, ClassifierFieldRecord>
  /** The answer as the model gave it: the JSON of Jev, or the text of the baseline. */
  raw: unknown
}

/** One pass through Triage: the classifier on the whole chat, and where Triage sends the request. */
export interface RoundRecord {
  /** Clarify rounds done before this pass. */
  round: number
  /** The customer text of the chat that the classifier got. */
  text: string
  classifier: ClassifierRecord
  /** null when the classifier answer was not valid. */
  triage: TriageResponse | null
  /** The question of Clarify, when Triage chose Clarify after this pass. */
  question: { text: string; latencyS: number } | null
}

export interface StepTimings {
  /** The classifier calls of every pass. */
  classifyS: number
  /** The LLM calls that write the questions of Clarify. */
  clarifyS: number
  /** The Final message. Zero in Queued. */
  finalS: number
  /** classify + clarify + final. Gather info, Rules check, and Do action are fixed code, so they add no machine time. */
  machineS: number
  /** machineS, plus STAFF_SECONDS when the request ends in Queued. */
  totalS: number
}

/** Everything that happened in one request, for one system. */
export interface RequestRecord {
  id: string
  system: SystemName
  split: string
  category: string
  hard: boolean
  customerId: string
  role: string
  text: string
  clarification: string
  startLedger: string[]
  scored: Field[]
  gold: TestRequest["gold"]
  final: FinalResult
  /** Read from the whole chat at Gather info. */
  facts: Facts
  /** Every pass through Triage. The first pass is the classifier on the text of the customer: the accuracy, the reliability, and the calibration table read it. */
  rounds: RoundRecord[]
  /** Clarify rounds that ran. */
  clarifyRounds: number
  end: End
  /** The rule that sent the request to Queued: a rule of Triage, "rules" (Rules check), or the rule for a classifier answer that is not valid. */
  queuedBy: string | null
  staffWhy: string | null
  /** The titles of the help articles given to the LLM at the Final message. */
  articles: string[]
  rules: RulesResponse | null
  /** Do action. null in Queued. */
  executed: Executed | null
  /** The Final message. null in Queued. */
  message: { text: string; kind: "answer" | "result"; sources: string[] } | null
  timings: StepTimings
  /** The tokens of every model call of the request: the classifier calls and the text calls. */
  tokens: { input: number; output: number }
  /** The tokens of the classifier calls only, which the cost of the classifier stage reads. */
  classifierTokens: { input: number; output: number }
  ledgerAfter: string[]
  /** The scored fields of the first pass that differ from the gold answers (an answer that is not valid: every scored field). */
  classifierWrongFields: Field[]
  /** Queued, and the gold final result is Queued too: support staff were needed. */
  staffNeeded: boolean
  /** Queued, or the result of Do action equals the gold final result. */
  finalCorrect: boolean
  /** The request did not reach Queued and the result differs from the gold final result. */
  silentError: boolean
  /** A silent error that ran a state-changing action. */
  harmfulSilentError: boolean
  note: string | null
}

/** The first pass of a request: the classifier on the text of the customer. */
export const firstPass = (record: RequestRecord): ClassifierRecord => record.rounds[0].classifier

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null

const asNumber = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null)

function classifierRecord(run: ClassifierRun): ClassifierRecord {
  const answers = run.system === "jev" && isObject(run.raw) && isObject(run.raw.answers) ? run.raw.answers : {}
  const fields = {} as Record<Field, ClassifierFieldRecord>
  for (const name of FIELDS) {
    const answer = answers[name]
    fields[name] = {
      value: run.classifier ? run.classifier.fields[name].value : null,
      chance: run.system === "jev" && run.classifier ? run.classifier.fields[name].confidence : null,
      reported: isObject(answer) ? asNumber(answer.confidence) : null,
    }
  }
  return {
    system: run.system,
    model: run.model,
    latencyS: run.latencyS,
    inputTokens: run.inputTokens,
    outputTokens: run.outputTokens,
    invalid: run.classifier === null,
    invalidReason: run.invalidReason,
    fields,
    raw: run.raw,
  }
}

/** One request through the flow. `classify` is the classifier of the system: it reads the whole chat of the customer. */
export async function processRequest(req: TestRequest, system: SystemName, classify: Classify): Promise<RequestRecord> {
  const routing = ROUTING[system]
  const who = requesterFor(req.customerId, req.role)
  const ledger = new Set(req.startLedger)
  const tokens = { input: 0, output: 0 }
  const classifierTokens = { input: 0, output: 0 }
  const timings: StepTimings = { classifyS: 0, clarifyS: 0, finalS: 0, machineS: 0, totalS: 0 }

  // New, Triage, and Clarify: the chat grows by the clarification of the dataset until Triage does not choose Clarify.
  const lines = [req.text]
  const rounds: RoundRecord[] = []
  let settled: Exclude<Decision, { next: "clarify" }> | null = null
  let plain: PlainDecision | null = null
  for (let round = 0; ; round += 1) {
    const text = lines.join("\n\n")
    const run = await classify(text, who)
    timings.classifyS += run.latencyS
    tokens.input += run.inputTokens
    tokens.output += run.outputTokens
    classifierTokens.input += run.inputTokens
    classifierTokens.output += run.outputTokens
    const pass: RoundRecord = { round, text, classifier: classifierRecord(run), triage: null, question: null }
    rounds.push(pass)
    if (!run.classifier) break
    if (routing === "rules") {
      // Rung 1 has no Clarify: the written rules settle the request on the first classifier answer.
      plain = decideRules(run.classifier, who, text, ledger, req.customerId)
      break
    }
    const decision = decide(run.classifier, round, who, text, ledger, req.customerId)
    pass.triage = decision.triage
    if (decision.next !== "clarify") {
      settled = decision
      break
    }
    const { result, calls } = await withCallLog(() => writeClarify(text, who))
    pass.question = { text: result.text, latencyS: result.latencyS }
    timings.clarifyS += result.latencyS
    for (const call of calls) {
      tokens.input += call.inputTokens
      tokens.output += call.outputTokens
    }
    lines.push(req.clarification)
  }

  const text = lines.join("\n\n")
  let end: End = routing === "rules" ? "invalid" : "queued"
  let queuedBy: string | null = routing === "rules" ? null : INVALID_ANSWER_RULE
  let why: string | null = routing === "rules" ? null : "The classifier answer was not valid, so support staff must read the request."
  let rules: RulesResponse | null = null
  let executed: Executed | null = null
  let message: RequestRecord["message"] = null
  let articles: string[] = []
  const writeFinal = async (checked: RulesResponse, done: Executed, answer: string): Promise<void> => {
    // Final message: the LLM answers a question (action "Send reply"), or tells the result of Do action or why nothing ran.
    const found = findArticles(text)
    const answered = answer === "Send reply"
    const { result, calls } = await withCallLog(() =>
      answered ? answerQuestion(text, who, req.customerId, found) : writeReply(text, who, req.customerId, checked.policy, done))
    articles = found.map((article) => article.title)
    message = { text: result.text, kind: answered ? "answer" : "result", sources: answered ? articles : [] }
    timings.finalS = result.latencyS
    for (const call of calls) {
      tokens.input += call.inputTokens
      tokens.output += call.outputTokens
    }
  }
  if (settled?.next === "queued") {
    queuedBy = settled.rule
    why = settled.staffWhy
    rules = settled.rules
  } else if (settled?.next === "final") {
    end = settled.end
    queuedBy = null
    why = null
    rules = settled.rules
    executed = settled.executed
    await writeFinal(settled.rules, settled.executed, settled.executed.action ?? "")
  } else if (plain) {
    end = plain.end
    rules = plain.rules
    executed = plain.executed
    await writeFinal(plain.rules, plain.executed, plain.executed.action ?? "")
  }

  const queued = end === "queued"
  timings.machineS = timings.classifyS + timings.clarifyS + timings.finalS
  timings.totalS = timings.machineS + (queued ? STAFF_SECONDS : 0)

  const first = rounds[0].classifier
  const last = rounds[rounds.length - 1].classifier
  const classifierWrongFields = req.scored.filter((field) => first.fields[field].value === null || first.fields[field].value !== req.gold[field])
  const matches = executed !== null && executedMatches(executed, req.final)
  // A request in Queued is never a silent error: nothing ran and support staff read it. Step 1 never reaches Queued.
  const silentError = !queued && !matches
  return {
    id: req.id,
    system,
    split: req.split,
    category: req.category,
    hard: req.hard,
    customerId: req.customerId,
    role: req.role,
    text: req.text,
    clarification: req.clarification,
    startLedger: req.startLedger,
    scored: req.scored,
    gold: req.gold,
    final: req.final,
    facts: extractFacts(text),
    rounds,
    clarifyRounds: rounds.filter((pass) => pass.question !== null).length,
    end,
    queuedBy,
    staffWhy: why,
    articles,
    rules,
    executed,
    message,
    timings,
    tokens,
    classifierTokens,
    ledgerAfter: [...ledger].sort(),
    classifierWrongFields,
    staffNeeded: queued && req.final.toStaff,
    finalCorrect: queued || matches,
    silentError,
    harmfulSilentError: silentError && isStateChanging(executed?.action ?? null),
    note: last.invalid
      ? routing === "rules"
        ? `the classifier answer was not valid (${last.invalidReason}): nothing ran and the customer reads no message`
        : `the classifier answer was not valid (${last.invalidReason}): the request went to Queued and nothing ran`
      : null,
  }
}
