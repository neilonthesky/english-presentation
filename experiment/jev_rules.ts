// Level 3, the second Jev call: one yes/no question for each written rule of the action. Triage (the first Jev call) names the
// action; when that action changes the state, this call gets the account lines of the action and the questions of its rules.
// A yes means "this rule is broken". Fixed code only ANDs the answers: Do action runs when no answer says broken. Rules are
// questions, not code: no rule is applied by the program on this path (policyFor() of system/saas.ts is read only to
// score the answers against the written rules).
import { ACCOUNT_FIELDS_OF, SECURITY_RULE, accountText, extractFacts, policyFor } from "./system/saas"
import { ApiError, JEV_URL, classifierState, ledgerText, transport } from "./system/models"
import type { AccountField, Requester } from "./system/types"
import { withCallLog } from "./transport"

/** One yes/no question of the Jev API: the instruction and the meaning of true and of false. */
export interface NoulQuestion {
  type: "noul"
  instructions: string
  criteria: { true: string; false: string }
}
const noul = (instructions: string, yesText: string, noText: string): NoulQuestion => ({ type: "noul", instructions, criteria: { true: yesText, false: noText } })

/** One violation question per written rule of the action; the key is the rule name of saas.ts. A yes answer means that the rule is broken. */
export function ruleQuestions(action: string): Record<string, NoulQuestion> {
  const q: Record<string, NoulQuestion> = {}
  const own = (n: string) => (q[`${n}: own account`] = noul(
    "Does the request ask to change the account of another customer, or to send something to an e-mail address other than the sender? Read request_text.",
    "The request names another customer or another e-mail address.", "The request names no other customer and no other e-mail address."))
  if (action === "Start refund") {
    own("Refund rule")
    q["Refund rule: credits used"] = noul(
      "Does the usage on the purchase line of the account show that some credits of the plan are already used?",
      "Some credits of the plan are used.", "No credits of the plan are used.")
    q["Refund rule: settled charge"] = noul(
      "Is the status of the purchase Settling? Read the purchase line of the account.",
      "The status of the purchase is Settling.", "The status of the purchase is not Settling.")
    q["Refund rule: refund window"] =
      noul("Is the purchase a plan that was already charged (not a planned charge) more than 14 days before today if it is monthly, or more than 30 days before today if it is annual? Read the days since the charge in the account.",
          "The plan was charged after the end of its refund window.", "The purchase is inside its refund window, or no window applies.")
    q["Refund rule: refunded once"] = noul(
      "Does actions_already_done show a refund of this purchase?",
      "A refund of this purchase already ran.", "No refund of this purchase ran.")
    q["Refund rule: amount limit"] = noul(
      "Is the amount of the purchase above 100 dollars? Read the purchase line of the account.",
      "The amount is above 100 dollars.", "The amount is 100 dollars or less.")
    q["Refund rule: refund count"] = noul(
      "Are there 2 or more refunds in the last 90 days? Read the refunds line of the account.",
      "There are 2 or more refunds in the last 90 days.", "There are fewer than 2 refunds in the last 90 days.")
  } else if (action === "Delete data") {
    own("Data deletion rule")
    q["Data deletion rule: deleted once"] = noul("Does actions_already_done show a deletion of the data of this account?", "A deletion already ran.", "No deletion ran.")
    q["Data deletion rule: never deleted"] = noul("Does the action remove stored data of the workspace that cannot be restored?", "The action removes data for good.", "The action does not remove data.")
  } else if (action === "Cancel plan") {
    own("Cancellation rule")
    q["Cancellation rule: cancelled once"] = noul(
      "Is the auto-renewal of the plan already off? Read the plan line of the account, and actions_already_done.",
      "The auto-renewal is already off.", "The auto-renewal is on.")
  } else if (action === "Reset password") {
    q["Password reset rule: e-mail on file"] = noul(
      "Does the request ask to send the reset link to an e-mail address other than the e-mail of the sender? Read request_text and the sender line.",
      "The request names another e-mail address.", "The request names no other e-mail address.")
  }
  q["Security rule: misuse report"] = noul(
    "Does request_text report that the account or the payment method was used by someone who is not the customer?",
    "The request reports a misuse of the account or of the payment method.", "The request does not report a misuse.")
  return q
}

/** One answer to one rule question. `chance` is the chance of yes (the rule is broken); `code` is what the written rules say. */
export interface RuleAnswer {
  rule: string
  chance: number
  broken: boolean
  code: boolean
}

/** The second Jev call of one request. */
export interface RuleRun {
  action: string
  model: string
  latencyS: number
  inputTokens: number
  outputTokens: number
  answers: RuleAnswer[]
  /** The answer as Jev gave it. */
  raw: unknown
}

type JevJson = {
  model: string
  usage: { input_tokens: number | string; output_tokens: number | string }
  answers: Record<string, { noul?: number | string }>
}

/**
 * Ask Jev the rule questions of `action` for one request. `securityGold` says whether the request really reports a misuse of the
 * account (the gold queue is Security): it scores the Security answer, because no fixed code reads that rule.
 */
export async function askRules(
  text: string, who: Requester, customerId: string, ledger: ReadonlySet<string>, action: string, securityGold: boolean,
): Promise<RuleRun> {
  const questions = ruleQuestions(action)
  const account = accountText(customerId, who, ACCOUNT_FIELDS_OF[action] as readonly AccountField[])
  const state = {
    request_text: text,
    sender_type: classifierState(text).requester_type,
    account,
    actions_already_done: ledgerText(ledger),
    action_to_check: action,
  }
  const { result, calls } = await withCallLog(() => transport.post<JevJson>(JEV_URL, { state, model: "jev-latest", questions }))
  const { json, latencyS } = result
  const code = new Map(policyFor(action, who, extractFacts(text), ledger, customerId, ACCOUNT_FIELDS_OF[action], securityGold).rules.map((r) => [r.name, r.outcome === "deny"]))
  const answers = Object.keys(questions).map((rule): RuleAnswer => {
    const p = Number(json.answers[rule]?.noul)
    if (Number.isNaN(p)) throw new ApiError(`Jev gave no answer for ${rule}`)
    // A rule that the written policy leaves out of this purchase (a rule of a planned charge on a paid plan) is met.
    return { rule, chance: p, broken: p >= 0.5, code: code.get(rule) ?? false }
  })
  return {
    action,
    model: json.model,
    latencyS,
    inputTokens: Number(json.usage.input_tokens),
    outputTokens: Number(json.usage.output_tokens),
    answers,
    raw: calls[0]?.raw ?? json,
  }
}

/** The rule that stops the request: the Security rule when it is broken, else the first broken rule in the order of the questions. Null when no rule is broken. */
export const brokenRule = (answers: readonly RuleAnswer[]): string | null =>
  answers.find((a) => a.broken && a.rule === SECURITY_RULE.name)?.rule ?? answers.find((a) => a.broken)?.rule ?? null
