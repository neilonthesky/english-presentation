// Checks the dataset of the experiment, then runs the real flow (decide() of pipeline.ts: triageStep, rulesStep, and actStep of
// web/server/steps.ts) over every request with an ORACLE classifier: the gold answers of the five fields, each with confidence 1.0.
// No model is called.
//
// What is checked:
//   (a) the files load (dataset.ts checks every cell), unique ids, the shape of the gold and of the final, a clarification for
//       every request and at least two wordings of it for every request type;
//   (b) for every request: Triage, then Rules check and Do action. A request ends right when it is in Queued and the gold
//       final result is Queued, or when the result of Do action equals the gold final result (a silent error when it does not);
//   (c) the counts of the dataset.
//
// Run: bun run experiment/validate.ts. It exits 1 on any problem.
import { join } from "node:path"
import { ACTIONS, type Policy, type TriageRule } from "../web/src/types"
import { requesterFor, useWorld, type World } from "../web/server/saas"
import { goldClassifier, loadDataset, TODAY, WORLD_FILE } from "./dataset"
import { decide, executedMatches, type Decision, type End } from "./pipeline"
import type { TestRequest } from "./types"

/**
 * Why one request type must go where it goes: the rule of Triage and the verdict of the written policy. The table is what the
 * request types claim, so the check proves that every category really exercises the rule it is named after (a refund outside
 * the window with a used plan must hit a "deny" rule, and so on). A null verdict means that Triage sends the request to Queued
 * before Rules check, so there is no verdict.
 */
const EXPECTED: Record<string, readonly [TriageRule, Policy["verdict"] | null]> = {
  q_plan_credits: ["answer", "allow"],
  q_refund_policy: ["answer", "allow"],
  q_render_problem: ["answer", "allow"],
  q_unknown_topic: ["answer", "allow"],
  pq_invoice_tax_id: ["needs-staff", null],
  pq_card_change: ["needs-staff", null],
  crit_card_fraud: ["critical", null],
  crit_data_destroyed: ["critical", null],
  refund_in_window_small: ["act", "allow"],
  refund_in_window_large: ["act", "review"],
  refund_after_window_unused: ["act", "review"],
  refund_not_returnable: ["act", "deny"],
  refund_credits_used: ["act", "deny"],
  refund_duplicate_ledger: ["act", "deny"],
  refund_other_email: ["act", "deny"],
  refund_teammate: ["act", "deny"],
  delete_owner: ["needs-staff", null],
  inj_refund_everything: ["injection", "allow"],
  lookalike_ask_rules: ["answer", "allow"],
  closing_solved: ["answer", "allow"],
  hard_mixed_billing_product: ["needs-staff", null],
}

// ---------------------------------------------------------------------------------------------------------------
// The oracle run.
// ---------------------------------------------------------------------------------------------------------------

interface Outcome {
  request: TestRequest
  decision: Decision
  end: End | "clarify"
  rule: TriageRule
  /** null when Triage sent the request to Queued before Rules check. */
  verdict: Policy["verdict"] | null
  matched: boolean
}

function runOracle(world: World, requests: readonly TestRequest[]): Outcome[] {
  useWorld(world)
  return requests.map((request) => {
    const who = requesterFor(request.customerId, request.role)
    const ledger = new Set(request.startLedger)
    const decision = decide(goldClassifier(request.gold), 0, who, request.text, ledger, request.customerId)
    const end = decision.next === "final" ? decision.end : decision.next
    const matched = decision.next === "queued" ? request.final.toStaff : decision.next === "final" && executedMatches(decision.executed, request.final)
    const verdict = decision.next === "clarify" || decision.rules === null ? null : decision.rules.policy.verdict
    return { request, decision, end, rule: decision.triage.rule, verdict, matched }
  })
}

// ---------------------------------------------------------------------------------------------------------------
// The report.
// ---------------------------------------------------------------------------------------------------------------

const share = (part: number, total: number): string => `${((part / total) * 100).toFixed(1)}%`

function countBy<T>(items: readonly T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1)
  return counts
}

function printTable(title: string, rows: readonly [string, string][]): void {
  const width = rows.reduce((w, [label]) => Math.max(w, label.length), title.length)
  console.log(`\n${title}`)
  console.log("-".repeat(width + 12))
  for (const [label, value] of rows) console.log(`${label.padEnd(width)}  ${value.padStart(10)}`)
}

const finalLabel = (request: TestRequest): string => (request.final.toStaff ? "Queued (support staff)" : request.final.action ?? "null (nothing runs)")

function printSummary(label: string, requests: readonly TestRequest[], outcomes: readonly Outcome[]): void {
  const ends = countBy(outcomes, (o) => o.end)
  const finals = countBy(requests, finalLabel)
  const risky = requests.filter((r) => r.gold.risk).length
  const critical = requests.filter((r) => r.gold.priority === "Critical").length
  const injection = requests.filter((r) => r.gold.injection).length
  const hard = requests.filter((r) => r.hard).length
  const denied = requests.filter((r) => !r.final.toStaff && r.final.action === null).length
  const differs = requests.filter((r) => !r.final.toStaff && r.final.action !== r.gold.action).length
  printTable(label, [
    ["requests", String(requests.length)],
    ["categories", String(new Set(requests.map((r) => r.category)).size)],
    ["hard cases", `${hard} (${share(hard, requests.length)})`],
    ["risk flag", `${risky} (${share(risky, requests.length)})`],
    ["critical priority", `${critical} (${share(critical, requests.length)})`],
    ["injection flag", `${injection} (${share(injection, requests.length)})`],
    ["denied (final action null)", `${denied} (${share(denied, requests.length)})`],
    ["final differs from the asked action", `${differs} (${share(differs, requests.length)})`],
    ...(["answer", "action", "denied", "queued", "clarify"] as const).map((end): [string, string] => [`oracle end: ${end}`, String(ends.get(end) ?? 0)]),
    ...[...finals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]): [string, string] => [`final: ${name}`, String(count)]),
  ])
}

// ---------------------------------------------------------------------------------------------------------------

async function main(): Promise<void> {
  const dataDir = join(import.meta.dir, "data")
  const problems: string[] = []
  const { world, requests } = await loadDataset(dataDir)

  // (a) the ids, the customers, and the shape of the labels.
  if (world.today !== TODAY) problems.push(`${WORLD_FILE}: today is ${world.today}, expected ${TODAY}`)
  const customerIds = new Set(world.customers.map((c) => c.id))
  const seen = new Set<string>()
  for (const request of requests) {
    if (seen.has(request.id)) problems.push(`${request.id}: id used twice`)
    seen.add(request.id)
    if (!customerIds.has(request.customerId)) problems.push(`${request.id}: customerId ${request.customerId} is not in ${WORLD_FILE}`)
    if (request.text.length === 0) problems.push(`${request.id}: the text is empty`)
    if (request.clarification.length === 0) problems.push(`${request.id}: the clarification is empty`)
    if (request.clarification === request.text) problems.push(`${request.id}: the clarification repeats the text`)
    if (/[{}]/.test(request.text) || /[{}]/.test(request.clarification)) problems.push(`${request.id}: a placeholder is left in the text or the clarification`)
    if (request.finalReason.length === 0) problems.push(`${request.id}: finalReason is empty`)
    if (request.scored.length === 0) problems.push(`${request.id}: no scored field`)
    if (request.gold.queue === null && request.scored.includes("queue")) problems.push(`${request.id}: the queue is not scored, so scored must not list it`)
    if (request.gold.queue !== null && !request.scored.includes("queue")) problems.push(`${request.id}: the queue must be scored`)
    if (request.startLedger.some((entry) => entry.split("|").filter((part) => part.length > 0).length !== 2 || !(ACTIONS as readonly string[]).includes(entry.split("|")[0]))) {
      problems.push(`${request.id}: a startLedger entry is not "action|target"`)
    }
    if (request.final.toStaff && request.final.action !== null) problems.push(`${request.id}: a final result in Queued has no final action`)
    if (request.final.action === "Needs staff") problems.push(`${request.id}: "Needs staff" is not an action that can run; the final result is Queued`)
  }

  // The stratified split: the second, fourth, ... request of every category is a test request.
  const seenCount = new Map<string, number>()
  for (const request of requests) {
    const at = seenCount.get(request.category) ?? 0
    seenCount.set(request.category, at + 1)
    if (request.split !== (at % 2 === 1 ? "test" : "dev")) problems.push(`${request.id}: the split must follow "every second request of a category goes to test"`)
  }
  for (const [category, count] of countBy(requests, (r) => r.category)) {
    if (count < 4) problems.push(`category ${category}: ${count} requests, at least 4 are required (2 in each split)`)
  }
  // Clarify: every request type has at least two wordings of the clarification, and each split sees at least one of them.
  for (const category of new Set(requests.map((r) => r.category))) {
    const own = requests.filter((r) => r.category === category)
    if (new Set(own.map((r) => r.clarification.replaceAll(/\S+@\S+/g, "{email}"))).size < 2) problems.push(`category ${category}: fewer than 2 wordings of the clarification`)
    for (const split of ["dev", "test"] as const) {
      if (own.filter((r) => r.split === split).length < 2) problems.push(`category ${category}: fewer than 2 ${split} requests`)
      if (new Set(own.filter((r) => r.split === split).map((r) => r.clarification)).size < 1) problems.push(`category ${category}: the ${split} split sees no clarification`)
    }
  }

  const outcomes = runOracle(world, requests)
  const violations: string[] = []
  const silent = outcomes.filter((o) => o.decision.next === "final" && !o.matched)
  const staffRead = outcomes.filter((o) => o.decision.next === "queued")
  const notNeeded = staffRead.filter((o) => !o.request.final.toStaff)
  for (const outcome of outcomes) {
    const { request } = outcome
    if (outcome.decision.next === "clarify") problems.push(`${request.id}: the oracle has full confidence, so Triage must not choose Clarify`)
    const expected = EXPECTED[request.category]
    if (!expected) problems.push(`${request.id}: category ${request.category} is not in the expected table`)
    else {
      if (outcome.rule !== expected[0]) problems.push(`${request.id} (${request.category}): the rule of Triage is "${outcome.rule}" but the request type must take "${expected[0]}"`)
      if (outcome.verdict !== expected[1]) problems.push(`${request.id} (${request.category}): the written rules give "${outcome.verdict}" but the request type must give "${expected[1]}"`)
    }
    const result = outcome.decision.next === "final" ? `${outcome.decision.executed.action ?? "null"}` : outcome.decision.next === "queued" ? "Queued" : "Clarify"
    if (!outcome.matched) violations.push(`${request.id} (${request.category}): the result is ${result} but the final result is ${finalLabel(request)}`)
  }

  console.log(`dataset: ${dataDir}`)
  console.log(`world: ${world.customers.length} customers, today ${world.today}`)
  console.log(`requests: ${requests.length}, categories: ${new Set(requests.map((r) => r.category)).size}`)

  console.log("\nPROBLEMS (schema, ids, split, clarification, expected rule)")
  console.log(problems.length === 0 ? "  none" : problems.map((p) => `  ${p}`).join("\n"))

  console.log("\nORACLE RUN (no model call)")
  console.log(`  ended in Queued: ${staffRead.length}, of them not needed by the gold final result: ${notNeeded.length}`)
  for (const outcome of notNeeded) {
    console.log(`    ${outcome.request.id} (${outcome.request.category}): rule ${outcome.decision.next === "queued" ? outcome.decision.rule : outcome.rule}, gold final "${finalLabel(outcome.request)}"`)
  }
  console.log(`  silent errors: ${silent.length}`)
  for (const outcome of silent) console.log(`    ${outcome.request.id}: ${outcome.decision.next === "final" ? outcome.decision.executed.action ?? "null" : outcome.decision.next}`)
  console.log(`  violations: ${violations.length}`)
  for (const violation of violations) console.log(`    ${violation}`)

  printSummary("ALL REQUESTS", requests, outcomes)
  printSummary("TEST SPLIT", requests.filter((r) => r.split === "test"), outcomes.filter((o) => o.request.split === "test"))

  const firstEnd = new Map<string, string>()
  for (const outcome of outcomes) if (!firstEnd.has(outcome.request.category)) firstEnd.set(outcome.request.category, outcome.end)
  const rows: [string, string][] = [...countBy(requests, (r) => r.category).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, count]) => {
      const testCount = requests.filter((r) => r.category === category && r.split === "test").length
      return [category, `${count} (${testCount} test, ${firstEnd.get(category) ?? "-"})`]
    })
  printTable("PER CATEGORY (n, test, oracle end of the first request)", rows)

  const failures = problems.length + violations.length + silent.length
  console.log(`\n${failures === 0 ? "OK" : `FAILED (${failures} problems)`}`)
  if (failures > 0) process.exitCode = 1
}

await main()
