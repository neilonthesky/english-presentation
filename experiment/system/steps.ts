// The glue between the rules of saas.ts and the models: Rules check and Do action. The experiment (pipeline.ts, ablation.ts,
// build_dataset.ts) calls these functions. Triage itself is `triage()` of saas.ts.
import type { AccountField, Executed, Facts, Policy, Requester, RulesResponse } from "./types"
import { perform, policyFor, targetOf } from "./saas"

/** Actions that change the state of the account: money, stored data, the auto-renewal of the plan, or a password. Each one that runs is written to the ledger. */
export const STATE_CHANGING_ACTIONS = ["Start refund", "Delete data", "Cancel plan", "Reset password"]

/** The actions that change money or stored data. A wrong result with one of them is harmful. */
export const MONEY_OR_DATA_ACTIONS = ["Start refund", "Delete data"]

/**
 * Rules check: the written rules for the action are checked on the data of the request. allow: Do action, deny: Final message,
 * nothing runs. `fields` are the account fields that Gather info read; a rule that needs another field denies (fail closed).
 * `report` is the typed answer of the classifier that the request reports a misuse of the account (the Security rule).
 */
export function rulesStep(
  action: string, who: Requester, facts: Facts, ledger: ReadonlySet<string>, customerId: string, fields: readonly AccountField[],
  report: boolean,
): RulesResponse {
  const policy = policyFor(action, who, facts, ledger, customerId, fields, report)
  return { policy, next: policy.verdict === "allow" ? "act" : "final" }
}

/** The reason that the Final message reads when a step gave no usable answer: nothing runs and the customer is told. */
export const INVALID_REASON = "The classifier gave no usable answer."

/** Nothing runs: the reasons for the Final message, and no action. */
export function nothingRuns(reasons: readonly string[]): Executed {
  return { action: null, queue: null, target: null, blocked: [...reasons], details: [] }
}

/** The reasons why a policy denies the action: one reason per group of rules, the details of the rules of a group in one line. */
export function deniedReasons(policy: Policy): string[] {
  const bad = policy.rules.filter((r) => r.outcome === "deny")
  const groups = [...new Set(bad.map((r) => r.check))]
  return groups.map((g) => bad.filter((r) => r.check === g).map((r) => r.detail).join(" "))
}

/** Do action without a guard: the action runs, and a done action is written to the ledger. */
export function runAction(action: string, queue: string | null, ledger: Set<string>, customerId: string, who: Requester): Executed {
  const done = perform(action, customerId, who)
  const target = targetOf(customerId, action, who)
  if (target && STATE_CHANGING_ACTIONS.includes(action)) ledger.add(`${action}|${target.id}`)
  return { action, queue, target: done.target, blocked: null, details: done.details }
}

/** Do action (Level 3): the system does the action, but only if Rules check allows it. A deny means nothing runs, whatever Triage said. */
export function actStep(action: string, queue: string | null, rules: RulesResponse, ledger: Set<string>, customerId: string, who: Requester): Executed {
  if (rules.next !== "act") return nothingRuns(deniedReasons(rules.policy))
  return runAction(action, queue, ledger, customerId, who)
}
