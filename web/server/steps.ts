// The glue between the rules of saas.ts: Triage (part 2), Rules check, and Do action. The Hono server (index.ts) and the
// experiment (experiment/) both call these functions, so the demo and the paper run the same code.
import type { Classifier, Executed, Facts, Requester, RulesResponse, TriageResponse } from "../src/types"
import { perform, policyFor, staffWhy, targetOf, triage } from "./saas"

/** Actions that change money or data. Each one that runs is written to the ledger. */
const LEDGER_ACTIONS = ["Start refund", "Delete data"]

/** Triage, part 2: fixed rules choose the next state from the five answers of the classifier. `round` is the number of Clarify rounds done so far. */
export function triageStep(c: Classifier, round: number): TriageResponse {
  return { ...triage(c.fields, round), round }
}

/** Rules check: the written rules for the action are checked on the data of the request. allow: Do action. deny: Final message. review: Queued. */
export function rulesStep(action: string, who: Requester, facts: Facts, ledger: ReadonlySet<string>, customerId: string): RulesResponse {
  const policy = policyFor(action, who, facts, ledger, customerId)
  if (policy.verdict === "review") return { policy, next: "queued", staffWhy: staffWhy("rules", policy) }
  return { policy, next: policy.verdict === "allow" ? "act" : "final", staffWhy: null }
}

/**
 * Do action: the system does the action, but only if the written rules allow it. This is the check that stands between a wrong
 * answer of a model and a change of money or data: a rule that denies the action means nothing runs, whatever the models said.
 * A done action is written to the ledger.
 */
export function actStep(action: string, queue: string, rules: RulesResponse, ledger: Set<string>, customerId: string): Executed {
  const { policy } = rules
  if (rules.next !== "act") {
    // One reason per group of rules, the details of the rules of a group in one line.
    const bad = policy.rules.filter((r) => r.outcome === (policy.verdict === "deny" ? "deny" : "review"))
    const groups = [...new Set(bad.map((r) => r.check))]
    const blocked = groups.map((g) => bad.filter((r) => r.check === g).map((r) => r.detail).join(" "))
    return { action: null, queue: null, target: null, blocked, details: [] }
  }
  const done = perform(action, customerId)
  const target = targetOf(customerId, action)
  if (target && LEDGER_ACTIONS.includes(action)) ledger.add(`${action}|${target.id}`)
  return { action, queue, target: done.target, blocked: null, details: done.details }
}
