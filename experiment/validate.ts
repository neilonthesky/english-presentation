// Checks the dataset of the experiment, then runs the real flow (decide() of pipeline.ts: triage(), rulesStep, and actStep of
// web/server) over every request with an ORACLE classifier: the gold answers of the five fields, each with confidence 1.0.
// No model is called.
//
// What is checked:
//   (a) the files load (dataset.ts checks every cell), unique ids, the shape of the gold and of the final;
//   (b) for every request: Triage, then Rules check and Do action. A request ends right when the result of Do action is the
//       gold final action (null counts the requests that the written rules deny, where nothing runs);
//   (c) the counts of the dataset: 512 customers, 1,024 requests in 21 types and ten families, all sent by an owner,
//       and 248 requests that a written rule denies (the figures of the test-data slides); no two requests of a type share a text.
//
// Run: bun run experiment/validate.ts. It exits 1 on any problem.
import { join } from "node:path"
import { ACTIONS, type Policy, type TriageRule } from "../web/src/types"
import { useWorld, type World } from "../web/server/saas"
import { FAMILIES, goldClassifier, loadDataset, senderOf, TODAY, WORLD_FILE } from "./dataset"
import { decide, resultMatches, type Decision, type End } from "./pipeline"
import type { TestRequest } from "./types"

/**
 * Why one request type must go where it goes: the rule of Triage and the verdict of the written policy. The table is what the
 * request types claim, so the check proves that every category really exercises the rule it is named after (a refund outside
 * the window with a used plan must hit a "deny" rule, and so on).
 */
const EXPECTED: Record<string, readonly [TriageRule, Policy["verdict"]]> = {
  q_plan_credits: ["answer", "allow"],
  q_unknown_topic: ["answer", "allow"],
  bug_report: ["answer", "allow"],
  feature_request: ["answer", "allow"],
  complaint_service: ["answer", "allow"],
  pq_invoice_tax_id: ["answer", "allow"],
  person_request: ["answer", "allow"],
  crit_card_fraud: ["answer", "allow"],
  crit_data_destroyed: ["answer", "allow"],
  hard_mixed_billing_product: ["answer", "allow"],
  refund_in_window_small: ["act", "allow"],
  refund_in_window_large: ["act", "deny"],
  refund_credits_used: ["act", "deny"],
  cancel_owner: ["act", "allow"],
  cancel_already: ["act", "deny"],
  password_reset: ["act", "allow"],
  password_other_email: ["act", "deny"],
  delete_owner: ["act", "deny"],
  inj_refund_everything: ["injection", "allow"],
  lookalike_ask_rules: ["answer", "allow"],
  closing_solved: ["answer", "allow"],
}

// ---------------------------------------------------------------------------------------------------------------
// The oracle run.
// ---------------------------------------------------------------------------------------------------------------

interface Outcome {
  request: TestRequest
  decision: Decision
  end: End
  rule: TriageRule
  verdict: Policy["verdict"]
  /** The result of the run is the gold final action of the dataset. */
  matched: boolean
}

function runOracle(world: World, requests: readonly TestRequest[]): Outcome[] {
  useWorld(world)
  return requests.map((request) => {
    const who = senderOf(request.customerId)
    const ledger = new Set(request.startLedger)
    const decision = decide(goldClassifier(request.gold), who, request.text, ledger, request.customerId)
    return {
      request,
      decision,
      end: decision.end,
      rule: decision.triage.rule,
      verdict: decision.rules.policy.verdict,
      matched: resultMatches(decision.executed, request.finalAction),
    }
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

const finalLabel = (request: TestRequest): string => request.finalAction ?? "null (nothing runs)"

function printSummary(label: string, requests: readonly TestRequest[], outcomes: readonly Outcome[]): void {
  const ends = countBy(outcomes, (o) => o.end)
  const finals = countBy(requests, finalLabel)
  const risky = requests.filter((r) => r.gold.risk).length
  const critical = requests.filter((r) => r.gold.priority === "Critical").length
  const injection = requests.filter((r) => r.gold.injection).length
  const hard = requests.filter((r) => r.hard).length
  const denied = requests.filter((r) => r.finalAction === null).length
  const differs = requests.filter((r) => r.finalAction !== r.gold.action).length
  printTable(label, [
    ["requests", String(requests.length)],
    ["categories", String(new Set(requests.map((r) => r.category)).size)],
    ["hard cases", `${hard} (${share(hard, requests.length)})`],
    ["risk flag", `${risky} (${share(risky, requests.length)})`],
    ["gold priority Critical", `${critical} (${share(critical, requests.length)})`],
    ["injection flag", `${injection} (${share(injection, requests.length)})`],
    ["final action null (nothing runs)", `${denied} (${share(denied, requests.length)})`],
    ["final differs from the asked action", `${differs} (${share(differs, requests.length)})`],
    ...(["answer", "act", "blocked", "invalid"] as const).map((end): [string, string] => [`oracle end: ${end}`, String(ends.get(end) ?? 0)]),
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
    if (/[{}]/.test(request.text)) problems.push(`${request.id}: a placeholder is left in the text`)
    if (request.finalReason.length === 0) problems.push(`${request.id}: finalReason is empty`)
    if (request.scored.length === 0) problems.push(`${request.id}: no scored field`)
    if (request.gold.queue === null && request.scored.includes("queue")) problems.push(`${request.id}: the queue is not scored, so scored must not list it`)
    if (request.gold.queue !== null && !request.scored.includes("queue")) problems.push(`${request.id}: the queue must be scored`)
    if (request.startLedger.some((entry) => entry.split("|").filter((part) => part.length > 0).length !== 2 || !(ACTIONS as readonly string[]).includes(entry.split("|")[0]))) {
      problems.push(`${request.id}: a startLedger entry is not "action|target"`)
    }
    if (request.finalAction === null && request.finalReason.length === 0) problems.push(`${request.id}: a denied action needs a reason`)
  }

  // The counts of the test-data slides.
  const expect = (what: string, got: number, want: number): void => {
    if (got !== want) problems.push(`${what}: ${got}, expected ${want}`)
  }
  expect("customers", world.customers.length, 512)
  expect("requests", requests.length, 1024)
  expect("request types", new Set(requests.map((r) => r.category)).size, 21)
  expect("requests that a written rule denies", requests.filter((r) => r.finalAction === null).length, 248)
  const familySizes: Record<string, number> = {
    "Questions and answers": 288, "Refund": 144, "Cancel plan": 104, "Reset password": 96, "Invoice or request for a human": 96,
    "Fraud or data loss": 96, "Delete data": 56, "Injection": 48, "Two problems in one request": 48, "Closing message": 48,
  }
  for (const [family, types] of Object.entries(FAMILIES)) {
    expect(`family ${family}`, requests.filter((r) => types.includes(r.category)).length, familySizes[family])
  }
  const senders = new Set(requests.map((r) => r.customerId))
  for (const customer of world.customers) if (!senders.has(customer.id)) problems.push(`customer ${customer.id} sends no request`)
  const sameText = new Set<string>()
  for (const request of requests) {
    const key = `${request.category}|${request.text}`
    if (sameText.has(key)) problems.push(`${request.id}: the text is the same as an earlier request of the type ${request.category}`)
    sameText.add(key)
  }

  // Every request type needs at least 4 requests, and every action needs at least 3 gold answers, so each row of the action
  // confusion has support.
  for (const action of ACTIONS) {
    const count = requests.filter((request) => request.gold.action === action).length
    if (count < 3) problems.push(`gold action "${action}" appears ${count} time(s), at least 3 are required`)
  }
  for (const [category, count] of countBy(requests, (r) => r.category)) {
    if (count < 4) problems.push(`category ${category}: ${count} requests, at least 4 are required`)
  }
  if (!world.customers.some((customer) => customer.planCancelled)) {
    problems.push(`${WORLD_FILE}: no customer has the auto-renewal off, so the cancellation rule has nothing to deny`)
  }

  const outcomes = runOracle(world, requests)
  const violations: string[] = []
  const silent = outcomes.filter((o) => !o.matched)
  for (const outcome of outcomes) {
    const { request } = outcome
    const expected = EXPECTED[request.category]
    if (!expected) problems.push(`${request.id}: category ${request.category} is not in the expected table`)
    else {
      if (outcome.rule !== expected[0]) problems.push(`${request.id} (${request.category}): the rule of Triage is "${outcome.rule}" but the request type must take "${expected[0]}"`)
      if (outcome.verdict !== expected[1]) problems.push(`${request.id} (${request.category}): the written rules give "${outcome.verdict}" but the request type must give "${expected[1]}"`)
    }
    const result = `${outcome.decision.executed.action ?? "null"}`
    if (!outcome.matched) violations.push(`${request.id} (${request.category}): the result is ${result} but the final action is ${finalLabel(request)}`)
  }

  console.log(`dataset: ${dataDir}`)
  console.log(`world: ${world.customers.length} customers, today ${world.today}`)
  console.log(`requests: ${requests.length}, categories: ${new Set(requests.map((r) => r.category)).size}`)

  console.log("\nPROBLEMS (schema, ids, expected rule, counts)")
  console.log(problems.length === 0 ? "  none" : problems.map((p) => `  ${p}`).join("\n"))

  console.log("\nORACLE RUN (no model call)")
  console.log(`  requests whose result is not the gold final action: ${silent.length}`)
  for (const outcome of silent) console.log(`    ${outcome.request.id}: ${outcome.decision.executed.action ?? "null"}`)
  console.log(`  violations: ${violations.length}`)
  for (const violation of violations) console.log(`    ${violation}`)

  printSummary("ALL REQUESTS", requests, outcomes)

  const firstEnd = new Map<string, string>()
  for (const outcome of outcomes) if (!firstEnd.has(outcome.request.category)) firstEnd.set(outcome.request.category, outcome.end)
  const rows: [string, string][] = [...countBy(requests, (r) => r.category).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, count]) => [category, `${count} (${firstEnd.get(category) ?? "-"})`])
  printTable("PER CATEGORY (n, oracle end of the first request)", rows)

  const failures = problems.length + violations.length + silent.length
  console.log(`\n${failures === 0 ? "OK" : `FAILED (${failures} problems)`}`)
  if (failures > 0) process.exitCode = 1
}

await main()
