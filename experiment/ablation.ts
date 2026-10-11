#!/usr/bin/env bun
// Level 2b: the LLM agent of Level 2 with the fixed rules check of Level 3 behind it. The ablation that separates the
// benefit of the fixed rules code from the benefit of the classifier.
//
// The question of the ablation. Level 3 is better than Level 2 on the 100 requests (70 / 30 / 0 against 66 / 28 / 6, two-sided
// exact sign test p = 0.031). Two parts are behind that difference: the classifier (Jev classifies, and the rules of Triage
// run), and the fixed code of the written rules (Rules check, `policyFor`, and the Security rule) that the Level 2 agent
// applies itself. This file runs the missing cell of the 2x2 grid and reports the grid:
//
//   classifier  x  fixed rules check
//   LLM agent labels, no check      Level 2  (the recorded run: the agent itself is the guard)
//   LLM agent labels, with check    Level 2b (this file: the fixed check of Level 3 behind the recorded agent answers)
//   Jev labels, no check            Level 3 without the check (a counterfactual read of the recorded Jev answers)
//   Jev labels, with check          Level 3  (the recorded run of the paper)
//
// Level 2b, exactly:
//   1. The step that chooses the action is the recorded agent call of Level 2: its answer (`run`, or the written rule that
//      it named as not met) names one action. No new agent call runs; the decision latency and the decision tokens are the
//      recorded ones of that call.
//   2. That action goes through the same fixed code that Level 3 runs: `rulesStep` (`policyFor`) on the account fields of
//      that action (`accountFieldsFor`, the table of Level 3), and the Security rule. The agent that refused with the
//      Security rule reports the misuse of the account, so nothing runs (the Security rule belongs to no one action, so the
//      agent names no action to check; the ruling is the one of `rulingPolicy` that Level 2 reads). A refusal that names no
//      rule ("none") asks for no action, so the request is an answer.
//   3. Do action runs only what the check allows (`actStep`), and the Final message is written exactly as Level 3 writes it
//      (the account fields of the action, and the written policy of the check). The new Final messages are real: they run
//      through the recording transport of the experiment and are cached under the results cache.
//   4. Outcome, harmful, machine time, and API cost come from the helpers of the run (`requestOutcome`, `decisionCost`,
//      `requestCost`, `PRICE`) on those records.
//
// Level 3 without the check (the counterfactual, no new classifier call): the recorded Jev answer goes through Triage (the
// injection rule runs), and then the action of Triage runs with no Rules check at all; the Final message is written with
// the written policy when the check would allow the action (the same bytes as Level 3, so the cache serves it) and without
// a policy when the check would deny it. It is a counterfactual, never a product level: it exists to show what the check
// itself is worth when the classifier is Jev.
//
// The run replays Level 2 and Level 3 from the cache first (`processAgentRequest`, `processClassifierRequest`) and checks
// that replay against `results/per_case.json`, so the recorded answers that this file reads are the ones of the paper.
//
// Run: bun run experiment/ablation.ts [--offline]
//   The first run makes the live calls of the new Final messages only (a few cents, cached under results/requests); the
//   second run makes no live call at all.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { accountFieldsFor, accountText, extractFacts, findArticles, requesterFor, rulingPolicy, SECURITY_RULE, useWorld } from "../web/server/saas"
import { INVALID_REASON, actStep, deniedReasons, nothingRuns, rulesStep, runAction } from "../web/server/steps"
import { NO_RULE, answerQuestion, writeReply } from "../web/server/models"
import type { Executed, RulesResponse } from "../web/src/types"
import { loadDataset } from "./dataset"
import { actionOfRule } from "./llm_agent"
import { classifyWithJev } from "./llm_classifier"
import {
  type AgentFieldRecord, type AgentRequestRecord, type ClassifierRequestRecord, type End, type FinalMessage, type RunRecord,
  isHarmful, isStateChanging, labelOutcome, processAgentRequest, processClassifierRequest, requestOutcome,
} from "./pipeline"
import { type SignTest, type SystemSummary, signTest, summarize } from "./metrics"
import { installRecordedTransport, withCallLog, type CallNote } from "./transport"
import { pmap } from "./pmap"
import type { TestRequest } from "./types"

const HERE = import.meta.dir
const OUT = join(HERE, "results")
const CACHE = join(OUT, "requests")
const PER_CASE = join(OUT, "per_case.json")
const offline = process.argv.includes("--offline")

/** The number of requests in flight at the same time. Every call is a cache read or one new Final message. */
const WORKERS = 4

interface Level {
  key: string
  label: string
  note: string
  summary: SystemSummary
}

/** The step of one request at Level 2b: what the recorded agent answer names, and what the fixed check of Level 3 does with it. */
interface FixedCheck {
  /** The action that the agent named: what it ran, or the action of the written rule that it refused with; null when it named no action. */
  proposed: string | null
  rules: RulesResponse | null
  executed: Executed
  end: End
  /** The verdict of the fixed check on the action: allow (Do action) or deny (nothing runs). Null when no action was named to check. */
  verdict: "allow" | "deny" | null
  /** The verdict that the agent's own answer implies: it ran an action or asked for no action (allow), or it refused with a rule (deny). */
  agentVerdict: "allow" | "deny"
  /** The fixed check reached a different verdict than the agent's own answer. */
  disagrees: boolean
}

/** The final step of Level 3, byte for byte: the LLM writes the message the customer reads. */
async function finalStep(
  text: string, account: string, executed: Executed, policy: RulesResponse["policy"] | null,
): Promise<{ message: FinalMessage; latencyS: number; calls: CallNote[] }> {
  const found = findArticles(text)
  const answered = executed.action === "Send reply"
  const { result, calls } = await withCallLog(() =>
    answered ? answerQuestion(text, account, found) : writeReply(text, executed, policy, found, account))
  return {
    message: {
      text: result.text,
      kind: answered ? "answer" : "result",
      sources: answered ? found.map((article) => article.title) : [],
    },
    latencyS: result.latencyS,
    calls,
  }
}

/** The Security rule denied the request and nothing ran. The same reading as `stoppedBySecurity` of pipeline.ts. */
const securityStop = (rules: RulesResponse | null, executed: Executed): boolean =>
  executed.action === null && (rules?.policy.rules.some((r) => r.source === "Security rule" && r.outcome === "deny") ?? false)

/**
 * The fixed rules check of Level 3 (`rulesStep`, `policyFor`, and the Security rule) behind the action that the recorded
 * agent named. Nothing is enforced by the agent here: the check decides, and Do action runs only what it allows.
 */
function fixedCheck(req: TestRequest, agent: AgentFieldRecord, ledger: Set<string>): FixedCheck {
  const who = requesterFor(req.customerId, req.role)
  const facts = extractFacts(req.text)
  if (agent.invalid) {
    return { proposed: null, rules: null, executed: nothingRuns([INVALID_REASON]), end: "invalid", verdict: null, agentVerdict: "allow", disagrees: false }
  }
  if (agent.refuse === SECURITY_RULE.name) {
    // The agent reports that the account or the payment method was used by someone else. The Security rule belongs to no one
    // action, so the agent named no action to check: nothing runs, which is the ruling that Level 2 reads for the same answer.
    const policy = rulingPolicy(null, SECURITY_RULE.name, who, facts, ledger, req.customerId)
    return {
      proposed: null, rules: { policy, next: "final" }, executed: nothingRuns(deniedReasons(policy)), end: "blocked",
      verdict: "deny", agentVerdict: "deny", disagrees: false,
    }
  }
  // The action the agent named: the one it ran, the one of the written rule it refused with, or an answer when it refused
  // with no rule ("none"), which means that the request needs no action.
  const proposed = agent.run ?? (agent.refuse !== null && agent.refuse !== NO_RULE ? actionOfRule(agent.refuse) : "Send reply")
  if (proposed === null) {
    // Cannot happen on this set: the parse of the agent answer rejects a rule name that does not exist.
    return { proposed: null, rules: null, executed: nothingRuns([INVALID_REASON]), end: "invalid", verdict: null, agentVerdict: "deny", disagrees: false }
  }
  const rules = rulesStep(proposed, who, facts, ledger, req.customerId, accountFieldsFor(proposed), false)
  const executed = actStep(proposed, null, rules, ledger, req.customerId, who)
  const end: End = rules.next !== "act" ? "blocked" : executed.action === "Send reply" ? "answer" : "act"
  // What the agent's own answer implies: it ran an action, or it asked for no action, or a written rule stopped it.
  const agentVerdict: "allow" | "deny" = agent.run !== null || agent.refuse === NO_RULE ? "allow" : "deny"
  const verdict: "allow" | "deny" = rules.next === "act" ? "allow" : "deny"
  return { proposed, rules, executed, end, verdict, agentVerdict, disagrees: verdict !== agentVerdict }
}

/**
 * One request at Level 2b: the recorded agent answer of Level 2, the fixed check of Level 3, Do action, and the Final
 * message of Level 3. The record keeps the shape of the Level 2 record, so `summarize`, `decisionCost`, `requestCost`, and
 * `signTest` read it with the same code as every other run.
 */
async function level2bRecord(req: TestRequest, prior: AgentRequestRecord): Promise<AgentRequestRecord> {
  const who = requesterFor(req.customerId, req.role)
  const ledger = new Set(req.startLedger)
  const check = fixedCheck(req, prior.agent, ledger)
  const tokens = { input: prior.decision.inputTokens, output: prior.decision.outputTokens }
  const { message, latencyS, calls } = await finalStep(
    req.text, accountText(req.customerId, who, accountFieldsFor(check.proposed)), check.executed, check.rules?.policy ?? null)
  for (const call of calls) {
    tokens.input += call.inputTokens
    tokens.output += call.outputTokens
  }
  const invalid = check.end === "invalid"
  const outcome = requestOutcome(check.executed, req.finalAction, invalid, securityStop(check.rules, check.executed))
  return {
    ...prior,
    rules: check.rules,
    executed: check.executed,
    end: check.end,
    message,
    timings: { decisionS: prior.decision.latencyS, finalS: latencyS, machineS: prior.decision.latencyS + latencyS },
    tokens,
    ledgerAfter: [...ledger].sort(),
    outcome,
    // The same label rule as Level 2 (this level has no classifier answer to compare with the gold action).
    labelOutcome: labelOutcome(check.executed, req.finalAction, invalid, false),
    harmful: outcome === "error" && isStateChanging(check.executed.action),
    harmfulMoneyData: outcome === "error" && isHarmful(check.executed.action),
    note: invalid
      ? `the agent answer was not valid (${prior.agent.invalidReason}): nothing ran, and the Final message explains`
      : check.disagrees
        ? `the fixed check ruled "${check.verdict}" where the agent answer implies "${check.agentVerdict}"`
        : null,
  }
}

/**
 * One request at Level 3 without the fixed check (a counterfactual, never a product level): the recorded Jev answer goes
 * through Triage (so the rules of Triage run, the injection rule included), the action of Triage runs with no Rules check,
 * and the Final message is written with the written policy when the check would allow the action. Nothing new is asked of
 * Jev: the classifier, the triage answer, and the scored fields are the recorded ones.
 */
async function level3NoCheckRecord(req: TestRequest, prior: ClassifierRequestRecord): Promise<ClassifierRequestRecord> {
  const who = requesterFor(req.customerId, req.role)
  const ledger = new Set(req.startLedger)
  const triage = prior.triage
  let rules: RulesResponse | null = null
  let executed: Executed = nothingRuns([INVALID_REASON])
  let end: End = "invalid"
  if (!prior.classifier.invalid && triage !== null) {
    rules = rulesStep(triage.action, who, extractFacts(req.text), ledger, req.customerId, accountFieldsFor(triage.action), triage.queue === "Security")
    // No check: the action that Triage names runs.
    executed = runAction(triage.action, triage.queue, ledger, req.customerId, who)
    end = executed.action === "Send reply" ? "answer" : "act"
  }
  const tokens = { input: prior.decision.inputTokens, output: prior.decision.outputTokens }
  const { message, latencyS, calls } = await finalStep(
    req.text, accountText(req.customerId, who, accountFieldsFor(triage?.action ?? null)), executed,
    rules && rules.policy.verdict === "allow" ? rules.policy : null)
  for (const call of calls) {
    tokens.input += call.inputTokens
    tokens.output += call.outputTokens
  }
  const invalid = end === "invalid"
  const outcome = requestOutcome(executed, req.finalAction, invalid, securityStop(rules, executed))
  return {
    ...prior,
    rules,
    executed,
    end,
    message,
    timings: { decisionS: prior.decision.latencyS, finalS: latencyS, machineS: prior.decision.latencyS + latencyS },
    tokens,
    ledgerAfter: [...ledger].sort(),
    outcome,
    labelOutcome: labelOutcome(executed, req.finalAction, invalid, triage?.action === "Send reply" && req.finalAction === null),
    harmful: outcome === "error" && isStateChanging(executed.action),
    harmfulMoneyData: outcome === "error" && isHarmful(executed.action),
    note: "counterfactual: the action of Triage runs with no Rules check",
  }
}

/** One entry of `results/per_case.json`, as the check of the replay reads it. */
interface CaseEntry {
  id: string
  outcome: string
  executedAction: string | null
  decisionTokens: number
}

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}

const asText = (value: unknown): string | null => (typeof value === "string" ? value : null)
const asNumber = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null)

function caseEntries(value: unknown): CaseEntry[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const r = record(entry)
    const decision = record(r.decision)
    const id = asText(r.id)
    const outcome = asText(r.outcome)
    if (id === null || outcome === null) return []
    return [{ id, outcome, executedAction: asText(record(r.executed).action), decisionTokens: asNumber(decision.inputTokens) ?? -1 }]
  })
}

/** The replay of a system against `results/per_case.json`: the same outcome, the same action that ran, the same decision tokens. */
function checkReplay(stored: readonly CaseEntry[], replayed: readonly RunRecord[], system: string): { system: string; requests: number; mismatches: string[] } {
  const byId = new Map(stored.map((entry) => [entry.id, entry]))
  const mismatches: string[] = []
  for (const run of replayed) {
    const entry = byId.get(run.id)
    if (!entry) {
      mismatches.push(`${run.id}: not in per_case.json`)
      continue
    }
    if (entry.outcome !== run.outcome) mismatches.push(`${run.id}: outcome ${entry.outcome} in per_case.json, ${run.outcome} in the replay`)
    if (entry.executedAction !== run.executed.action) mismatches.push(`${run.id}: action ${String(entry.executedAction)} in per_case.json, ${String(run.executed.action)} in the replay`)
    if (entry.decisionTokens !== run.decision.inputTokens) mismatches.push(`${run.id}: decision tokens ${entry.decisionTokens} in per_case.json, ${run.decision.inputTokens} in the replay`)
  }
  return { system, requests: replayed.length, mismatches }
}

const pct = (value: number, digits = 1): string => (100 * value).toFixed(digits)

const log = (message: string): void => void process.stderr.write(`${message}\n`)

/** The live calls and the cache hits of the two services, at one moment of the run. */
interface Calls {
  jevLive: number
  jevCacheHits: number
  llmLive: number
  llmCacheHits: number
}

const snapshot = (counters: { jev: { live: number; cacheHits: number }; llm: { live: number; cacheHits: number } }): Calls =>
  ({ jevLive: counters.jev.live, jevCacheHits: counters.jev.cacheHits, llmLive: counters.llm.live, llmCacheHits: counters.llm.cacheHits })

/** One LaTeX table, in the style of tables.ts (the paper reads it). */
function table(caption: string, label: string, spec: string, header: readonly string[], rows: readonly (readonly string[])[]): string {
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
    ...rows.map((row) => `${row.join(" & ")} \\\\`),
    "\\bottomrule",
    "\\end{tabular}",
    "\\end{table}",
    "",
  ].join("\n")
}

/** One row of a level table: the counts, the machine time, and the API cost of 1,000 requests. */
const levelRow = (label: string, s: SystemSummary): string[] => [
  label, `${s.served}`, `${s.stopped}`, `${s.errors}`, `${s.harmful}`, `${s.labelErrors}`,
  s.machineSeconds.mean.toFixed(1), s.apiCostPer1000.toFixed(2),
]

const HEADER = ["Level", "Served", "Stopped", "Errors", "Harm", "Label err.", "Mach. s", "\\$/1k"]

async function main(): Promise<number> {
  const { world, requests } = await loadDataset(join(HERE, "data"))
  useWorld(world)
  await mkdir(OUT, { recursive: true })
  const handle = installRecordedTransport({ out: OUT, cache: CACHE, offline, jevWorkers: 4, llmWorkers: WORKERS })
  const before = snapshot(handle.counters)
  const indexes = requests.map((_, index) => index)

  // Level 2 and Level 3 as the paper recorded them: a replay from the cache, so the inputs of the ablation are the
  // recorded answers of the run (no live call unless the cache is missing an entry).
  const level2 = await pmap(requests, WORKERS, (req) => processAgentRequest(req))
  const level3 = await pmap(requests, WORKERS, (req) => processClassifierRequest(req, "jev", classifyWithJev))

  const perCase = record(JSON.parse(await readFile(PER_CASE, "utf8")))
  const replayCheck = [
    checkReplay(caseEntries(perCase.llm_agent), level2, "llm_agent"),
    checkReplay(caseEntries(perCase.jev), level3, "jev"),
  ]

  // Level 2b: the recorded agent answer behind the fixed check of Level 3.
  const level2b = await pmap(indexes, WORKERS, (index) => level2bRecord(requests[index], level2[index]))
  // The counterfactual: the recorded Jev answer with no fixed check at all.
  const level3NoCheck = await pmap(indexes, WORKERS, (index) => level3NoCheckRecord(requests[index], level3[index]))

  const summary2 = summarize(level2, "llm_agent")
  const summary2b = summarize(level2b, "llm_agent")
  const summary3 = summarize(level3, "jev")
  const summary3NoCheck = summarize(level3NoCheck, "jev")

  const levels: Level[] = [
    { key: "level_2", label: "Level 2 (LLM agent)", note: "the recorded run: the agent applies the written rules itself, and nothing checks its answer", summary: summary2 },
    { key: "level_2b", label: "Level 2b (LLM agent + fixed check)", note: "the action that the recorded agent named, behind the Rules check and the Security rule of Level 3", summary: summary2b },
    { key: "level_3", label: "Level 3 (Jev + LLM + rules)", note: "the recorded run of the paper: Jev classifies, the rules of Triage run, and the fixed code checks the action", summary: summary3 },
    { key: "level_3_no_check", label: "Level 3 without the check (counterfactual)", note: "the recorded Jev labels with no Rules check behind them: the action of Triage runs; a counterfactual, not a product level", summary: summary3NoCheck },
  ]

  const relabel = (test: SignTest, level2Name: string, level3Name: string): SignTest => ({ ...test, level2: level2Name, level3: level3Name })
  const signTests = {
    level_2_vs_level_2b: relabel(signTest(level2, level2b), "Level 2 (LLM agent)", "Level 2b (LLM agent + fixed check)"),
    level_2b_vs_level_3: relabel(signTest(level2b, level3), "Level 2b (LLM agent + fixed check)", "Level 3 (Jev + LLM + rules)"),
    level_2_vs_level_3: relabel(signTest(level2, level3), "Level 2 (LLM agent)", "Level 3 (Jev + LLM + rules)"),
    level_3_no_check_vs_level_3: relabel(signTest(level3NoCheck, level3), "Level 3 without the check (counterfactual)", "Level 3 (Jev + LLM + rules)"),
  }

  // The per-request reading of the check: what the agent named, what the fixed code ruled, and what ran at each level.
  const rows = requests.map((req, index) => {
    const agent = level2[index].agent
    const proposed = agent.invalid
      ? null
      : agent.run ?? (agent.refuse !== null && agent.refuse !== NO_RULE ? actionOfRule(agent.refuse) : "Send reply")
    const guardVerdict = agent.invalid ? null : agent.refuse === SECURITY_RULE.name ? "deny" : level2b[index].rules?.next === "act" ? "allow" : "deny"
    const agentVerdict = agent.invalid ? null : agent.run !== null || agent.refuse === NO_RULE ? "allow" : "deny"
    return {
      id: req.id,
      category: req.category,
      final_action: req.finalAction,
      agent_action: proposed,
      agent_refuse: agent.refuse,
      guard_verdict: guardVerdict,
      guard_denied_rules: level2b[index].rules?.policy.rules.filter((r) => r.outcome === "deny").map((r) => r.name) ?? [],
      agent_verdict: agentVerdict,
      guard_and_agent_agree: guardVerdict === null || agentVerdict === null ? null : guardVerdict === agentVerdict,
      executed_2: level2[index].executed.action,
      executed_2b: level2b[index].executed.action,
      executed_3: level3[index].executed.action,
      outcome_2: level2[index].outcome,
      outcome_2b: level2b[index].outcome,
      outcome_3: level3[index].outcome,
      changed_from_level_2: level2b[index].outcome !== level2[index].outcome,
    }
  })
  const withVerdict = rows.filter((row) => row.guard_and_agent_agree !== null)
  const disagreements = withVerdict.filter((row) => row.guard_and_agent_agree === false).map((row) => row.id)
  const changed = rows.filter((row) => row.changed_from_level_2).map((row) => ({ id: row.id, outcome_2: row.outcome_2, outcome_2b: row.outcome_2b }))

  // The action labels themselves: the action that the agent named against the gold asked action, and the same for Jev.
  const namedMatches = requests.filter((req, index) => rows[index].agent_action === req.gold.action).length
  /** The requests that report a misuse of the account: the ones where the injection rule of Triage decides the outcome. */
  const injectionIds = requests.filter((req) => req.gold.injection === true).map((req) => req.id)
  const jevMatches = level3.filter((run) => run.classifier.fields.action.value === requests.find((req) => req.id === run.id)?.gold.action).length

  const tableAblation = table(
    "The ablation of the fixed rules code. Level 2b is the recorded LLM agent of Level 2 with the fixed check of the written " +
      `rules of Level 3 behind its answer (Rules check, the Security rule, and the account fields of the action). The check ` +
      `adds nothing on the ${requests.length} requests: every action that the agent named it rules the same way as the agent itself. Label ` +
      "err. is the strict count of the requests whose action label differs from the gold action, Harm counts the errors " +
      "that ran an action changing money, a plan, data, or a password, Mach.~s is the machine time per request, and \\$/1k the " +
      "API cost of 1,000 requests.",
    "tab:ablation",
    "lrrrrrrr",
    HEADER,
    [levelRow("2 LLM agent", summary2), levelRow("2b LLM agent + check", summary2b), levelRow("3 Jev + LLM + rules", summary3)],
  )

  const tableGrid = table(
      `The 2x2 grid that isolates the two parts behind Level 3. Each cell is the same ${requests.length} requests: the classifier names the ` +
      "action, and the fixed check of the written rules may stop it. A written rule stops every state change of a request " +
      "that reports a misuse of the account (the Security rule). Harm counts the errors that ran an action changing a plan, " +
      "money, data, or a password. The counterfactual cells are computed from the recorded answers and are not product levels.",
    "tab:ablation-grid",
    "llrrrrr",
    ["Classifier", "Fixed check", "Served", "Stopped", "Errors", "Harm"],
    [
      ["LLM agent", "no (Level 2)", `${summary2.served}`, `${summary2.stopped}`, `${summary2.errors}`, `${summary2.harmful}`],
      ["LLM agent", "yes (Level 2b)", `${summary2b.served}`, `${summary2b.stopped}`, `${summary2b.errors}`, `${summary2b.harmful}`],
      ["Jev", "no (counterfactual)", `${summary3NoCheck.served}`, `${summary3NoCheck.stopped}`, `${summary3NoCheck.errors}`, `${summary3NoCheck.harmful}`],
      ["Jev", "yes (Level 3)", `${summary3.served}`, `${summary3.stopped}`, `${summary3.errors}`, `${summary3.harmful}`],
    ],
  )

  await mkdir(join(OUT, "tables"), { recursive: true })
  await writeFile(join(OUT, "tables", "ablation.tex"), `${tableAblation}\n${tableGrid}`, "utf8")

  const report = {
    generated_utc: new Date().toISOString(),
    offline,
    title: "Ablation: the fixed rules code against the classifier (Level 2b)",
    method:
      "Level 2b takes the action that the recorded Level 2 agent named (the action it ran, or the action of the written rule it " +
      "refused with; a refusal that names no rule asks for no action) and passes it through the same fixed check that Level 3 " +
      "runs: rulesStep (policyFor) on the account fields of that action, and the Security rule (the agent that refused with the " +
      "Security rule reports the misuse, so nothing runs). Do action runs only what the check allows, and the Final message is " +
      "written exactly as Level 3 writes it, through the recording transport. The counterfactual cell (Jev labels, no check) " +
      "takes the recorded Jev answer, runs Triage (the injection rule included), and runs the action of Triage with no Rules check.",
    levels,
    sign_tests: signTests,
    check: {
      answers_compared: withVerdict.length,
      the_check_and_the_agent_agree: withVerdict.filter((row) => row.guard_and_agent_agree === true).length,
      answers_with_no_action_named: rows.filter((row) => row.agent_action === null).length,
      disagreements,
      runs_changed_from_level_2: changed.length,
      changed,
      note:
        `The agent named no action on ${rows.filter((row) => row.agent_action === null).length} answers: the refusals that name the Security rule, ` +
        "where the misuse report stops every state change, so no action is named, nothing runs, and the ruling is the one that Level 2 " +
        `reads. No refusal of this set names the empty rule ("none"), so every other answer asks for an action and the check reads it.`,
    },
    action_labels: {
      note: "The action that a step names, against the action that the gold answer asks for (gold.action). The agent names the action of the written rule it refused with, so a refusal counts as the action that the request asked for; the agent's figure is therefore not the same measurement as the field accuracy of the classifier table.",
      agent_named: { n: requests.length, correct: namedMatches, accuracy: namedMatches / requests.length },
      jev: { n: requests.length, correct: jevMatches, accuracy: jevMatches / requests.length },
    },
    per_request: rows,
    replay_check: {
      source: "results/per_case.json",
      results: replayCheck,
      note: "The replay of Levels 2 and 3 out of the cache must reproduce per_case.json exactly: the same outcome, the same action that ran, and the same decision tokens.",
    },
    live_calls: {
      jev: handle.counters.jev.live - before.jevLive,
      llm: handle.counters.llm.live - before.llmLive,
      note: "The new Final messages of Level 2b and of the counterfactual cell. The classifier calls are replays from the cache, so no Jev call and no agent call is made.",
    },
    cache_hits: {
      jev: handle.counters.jev.cacheHits - before.jevCacheHits,
      llm: handle.counters.llm.cacheHits - before.llmCacheHits,
    },
    failures: handle.failures,
    table: "results/tables/ablation.tex",
    caveats: [
      `The Security rule of Level 3 reads the typed topic of the classifier (queue = Security). The agent has no topic, so at Level 2b the misuse signal is the agent's own refusal with the Security rule: a check behind the agent cannot invent that label. On the ${rows.filter((row) => row.agent_action === null).length} requests concerned nothing runs either way, so no number moves.`,
      `Level 2b has no rules of Triage: the agent answers no injection flag, so the injection rule (which forces "Send reply") can only run at Level 3. The ${injectionIds.length} requests of the set where that decides the outcome are ${injectionIds.join(", ")} (the requests that report a misuse of the account): the agent names an action on every one of them while the recorded Level 3 answer replies "Send reply", and Level 2b ends all of them as errors where Level 3 serves the request.`,
      "The decision latency and the decision tokens of Level 2b are the recorded ones of the Level 2 agent call: the ablation adds no classifier call, and the recorded agent answer is the input of the check.",
      "The counterfactual cell (Jev labels, no check) is not a product level; it is computed from the recorded Jev answers to measure what the fixed check itself is worth. Its Final messages are real calls, cached like every other call.",
      `The ${requests.length} requests are the same set that found the Security rule and the account-fields table, so the ablation is a description of this set, not a blind test.`,
    ],
  }
  await writeFile(join(OUT, "ablation.json"), `${JSON.stringify(report, null, 1)}\n`, "utf8")

  const line = (label: string, s: SystemSummary): string =>
    `  ${label}: served ${s.served}, stopped ${s.stopped}, errors ${s.errors}, harmful ${s.harmful}, ` +
    `machine ${s.machineSeconds.mean.toFixed(2)} s, API $${s.apiCostPer1000.toFixed(2)}/1k, ` +
    `served ${pct(s.served / s.requests)}%, errors ${pct(s.errorRate)}%`
  log(line("Level 2 ", summary2))
  log(line("Level 2b", summary2b))
  log(line("Level 3 ", summary3))
  log(line("Level 3n", summary3NoCheck))
  for (const [name, test] of Object.entries(signTests)) {
    log(`  ${name}: ${test.discordant} discordant pairs (${test.errorsInLevel2Only} against the first, ${test.errorsInLevel3Only} against the second), p = ${test.pValue.toFixed(4)}`)
  }
  log(
    `  the check against the agent: ${report.check.the_check_and_the_agent_agree}/${report.check.answers_compared} agree, ` +
      `${report.check.answers_with_no_action_named} answers with no action named, ${changed.length} runs changed from Level 2`,
  )
  log(`  live calls: jev ${report.live_calls.jev}, llm ${report.live_calls.llm}; cache hits: jev ${report.cache_hits.jev}, llm ${report.cache_hits.llm}`)
  for (const check of replayCheck) {
    log(`  replay check ${check.system}: ${check.mismatches.length ? `${check.mismatches.length} MISMATCHES: ${check.mismatches.join("; ")}` : `${check.requests} requests identical to per_case.json`}`)
  }
  log("written: results/ablation.json, results/tables/ablation.tex")
  return replayCheck.some((check) => check.mismatches.length) ? 1 : 0
}

if (import.meta.main) {
  main().then(
    (code) => process.exit(code),
    (err: unknown) => {
      log(`the ablation failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`)
      process.exit(1)
    },
  )
}
