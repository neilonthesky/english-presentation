// The side-by-side compare of the demo: one customer message through Level 2 (one LLM call chooses the action and applies the
// written rules itself, nothing checks it) and through Level 3 (Jev, fixed rules, and the LLM that only writes the text).
// Both levels run the code of the experiment: Level 3 calls the functions of the demo flow, and Level 2 calls `agentDecision`
// of experiment/llm_agent.ts and then does what `processAgentRequest` of experiment/pipeline.ts does with its answer.
// Nothing here changes the account of the session: each level works on its own copy of the ledger.
import { ACCOUNT_FIELDS } from "../src/types"
import type { CallTrace, CompareLevel, CompareStep, Executed, PresetGold, RequestOutcome, RulesResponse, Requester } from "../src/types"
import { actionOfRule, agentDecision } from "../../experiment/llm_agent"
import { requestOutcome } from "../../experiment/pipeline"
import { ApiError, NO_RULE, answerQuestion, classify, writeReply } from "./models"
import {
  accountFieldsFor, accountText, extractFacts, findArticles, misuseReport, requesterFor, rulingPolicy, triage,
} from "./saas"
import { INVALID_REASON, actStep, deniedReasons, nothingRuns, rulesStep, runAction } from "./steps"
import { traced } from "./trace"

/** A step of fixed code: its time is measured in milliseconds, it has no tokens and no cost. */
function codeStep<T>(steps: CompareStep[], name: string, summary: (value: T) => string, fn: () => T): T {
  const start = performance.now()
  const value = fn()
  steps.push({ name, kind: "code", latencyS: (performance.now() - start) / 1000, inputTokens: 0, outputTokens: 0, costUsd: 0, summary: summary(value), trace: null })
  return value
}

function modelStep(steps: CompareStep[], name: string, summary: string, trace: CallTrace): void {
  steps.push({
    name, kind: "model", latencyS: trace.latencyS, inputTokens: trace.inputTokens, outputTokens: trace.outputTokens,
    costUsd: trace.costUsd, summary, trace,
  })
}

const totalsOf = (steps: readonly CompareStep[]) => ({
  latencyS: steps.reduce((n, s) => n + s.latencyS, 0),
  inputTokens: steps.reduce((n, s) => n + s.inputTokens, 0),
  outputTokens: steps.reduce((n, s) => n + s.outputTokens, 0),
  costUsd: steps.reduce((n, s) => n + s.costUsd, 0),
})

/** The Security rule denied the request and nothing ran: the request ends in the answer with the security steps. */
const stoppedBySecurity = (rules: RulesResponse | null, executed: Pick<Executed, "action">): boolean =>
  executed.action === null && (rules?.policy.rules.some((r) => r.source === "Security rule" && r.outcome === "deny") ?? false)

const deniedNames = (rules: RulesResponse | null): string[] => rules?.policy.rules.filter((r) => r.outcome === "deny").map((r) => r.name) ?? []

/** The Final message of both levels: the LLM answers a question, or tells the result or why nothing ran. */
async function finalMessage(steps: CompareStep[], text: string, account: string, executed: Executed, rules: RulesResponse | null): Promise<string> {
  const articles = findArticles(text)
  const answered = executed.action === "Send reply"
  const { result, calls } = await traced(() => (answered ? answerQuestion(text, account, articles) : writeReply(text, executed, rules?.policy ?? null, articles, account)))
  modelStep(steps, "Final message", answered ? "The LLM answers from the help articles and the account" : executed.blocked ? "The LLM tells why nothing ran" : "The LLM tells the result of the action", calls[0])
  return result.text
}

const failure = (level: 2 | 3, name: string, steps: CompareStep[], err: unknown): CompareLevel => ({
  level, name, steps, chosen: null, decision: "failed", end: "invalid", executed: null, stoppedBy: [], message: null, outcome: null,
  totals: totalsOf(steps), error: err instanceof Error ? err.message : String(err),
})

const NAME_2 = "LLM agent"
const NAME_3 = "Jev + LLM + rules"

/** Level 3: Jev classifies, fixed rules decide, the LLM writes the text. The flow of the demo, in one call. */
async function level3(text: string, who: Requester, customerId: string, ledger: Set<string>, gold: PresetGold | null): Promise<CompareLevel> {
  const steps: CompareStep[] = []
  try {
    const { result: c, calls } = await traced(() => classify(text, who))
    const f = c.fields
    modelStep(
      steps, "Triage: Jev",
      `${f.queue.value} · ${f.action.value} (${f.action.confidence.toFixed(2)}) · ${f.priority.value} · risk ${f.risk.value ? "on" : "off"} · injection ${f.injection.value ? "on" : "off"} (${f.injection.confidence.toFixed(2)})`,
      calls[0],
    )
    const triaged = codeStep(steps, "Triage rules", (t) => `${t.rule}: ${t.reason}`, () => triage(f))
    const fields = accountFieldsFor(triaged.action)
    codeStep(steps, "Gather info", () => `reads ${fields.join(", ")}`, () => extractFacts(text))
    const rules = codeStep(
      steps, "Rules check",
      (r) => (r.next === "act" ? "allowed" : `denied: ${deniedNames(r).join("; ") || "no rule"}`),
      () => rulesStep(triaged.action, who, extractFacts(text), ledger, customerId, fields, misuseReport(f)),
    )
    const executed = codeStep(steps, "Do action", (e) => (e.action ? `ran ${e.action}` : "nothing ran"), () => actStep(triaged.action, triaged.queue, rules, ledger, customerId, who))
    const message = await finalMessage(steps, text, accountText(customerId, who, fields), executed, rules)
    const end = rules.next !== "act" ? "blocked" : executed.action === "Send reply" ? "answer" : "act"
    return {
      level: 3, name: NAME_3, steps, chosen: triaged.action,
      decision: `Jev: action ${f.action.value}${triaged.ignoredOrders ? "; Triage ignored the orders and used Send reply" : ""}`,
      end, executed, stoppedBy: deniedNames(rules), message,
      outcome: gold ? requestOutcome(executed, gold.finalAction, false, stoppedBySecurity(rules, executed)) : null,
      totals: totalsOf(steps), error: null,
    }
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return failure(3, NAME_3, steps, err)
  }
}

/** Level 2: one LLM call reads the account, applies the written rules itself, and runs an action or refuses. Nothing checks it. */
async function level2(text: string, who: Requester, customerId: string, ledger: Set<string>, gold: PresetGold | null): Promise<CompareLevel> {
  const steps: CompareStep[] = []
  try {
    const facts = codeStep(steps, "Gather info", () => "reads every account field", () => extractFacts(text))
    const { result: run, calls } = await traced(() => agentDecision(text, who, customerId, ledger))
    const invalid = run.invalidReason !== null
    const decision = invalid ? `invalid answer: ${run.invalidReason}` : run.run ? `run ${run.run}` : `refuse: ${run.refuse}`
    modelStep(steps, "Agent call", decision, calls[0])

    const action = run.run ?? (run.refuse && run.refuse !== NO_RULE ? actionOfRule(run.refuse) : null)
    let rules: RulesResponse | null = null
    let executed: Executed
    let end: CompareLevel["end"]
    const start = performance.now()
    if (invalid) {
      end = "invalid"
      executed = nothingRuns([INVALID_REASON])
    } else if (run.refuse !== null && run.refuse !== NO_RULE) {
      const policy = rulingPolicy(action, run.refuse, who, facts, ledger, customerId)
      rules = { policy, next: "final" }
      executed = nothingRuns(deniedReasons(policy))
      end = "blocked"
    } else if (run.refuse !== null || run.run === "Send reply") {
      executed = runAction("Send reply", null, ledger, customerId, who)
      end = "answer"
    } else {
      rules = { policy: rulingPolicy(action!, null, who, facts, ledger, customerId), next: "act" }
      executed = runAction(action!, null, ledger, customerId, who)
      end = "act"
    }
    steps.push({
      name: "Do action", kind: "code", latencyS: (performance.now() - start) / 1000, inputTokens: 0, outputTokens: 0, costUsd: 0,
      summary: executed.action ? `ran ${executed.action}` : "nothing ran", trace: null,
    })
    const message = await finalMessage(steps, text, accountText(customerId, who, ACCOUNT_FIELDS), executed, rules)
    const outcome: RequestOutcome | null = gold ? requestOutcome(executed, gold.finalAction, invalid, stoppedBySecurity(rules, executed)) : null
    return {
      level: 2, name: NAME_2, steps, chosen: run.run, decision, end, executed,
      stoppedBy: run.refuse && run.refuse !== NO_RULE ? [run.refuse] : [], message, outcome, totals: totalsOf(steps), error: null,
    }
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return failure(2, NAME_2, steps, err)
  }
}

/** Both levels on the same message, at the same time. Each level works on its own copy of the ledger of the session. */
export async function compare(text: string, customerId: string, role: "owner" | "teammate", ledger: ReadonlySet<string>, gold: PresetGold | null) {
  const who = requesterFor(customerId, role)
  const [two, three] = await Promise.all([
    level2(text, who, customerId, new Set(ledger), gold),
    level3(text, who, customerId, new Set(ledger), gold),
  ])
  return { gold, level2: two, level3: three }
}
