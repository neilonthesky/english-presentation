// Shapes of the FrameForge support system that the experiment runs: the account, the classifier answers, the written rules.

export const QUEUES = ["Plans and Credits", "Refunds", "Payments", "Product Help", "Account", "Security"] as const
export const ACTIONS = ["Send reply", "Start refund", "Delete data", "Cancel plan", "Reset password"] as const
export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const

/** The three personal plans of FrameForge. Each gives a different number of credits at each renewal (PLAN_CREDITS in system/saas.ts). */
export const PLANS = ["Plus", "Pro", "Max"] as const
export type Plan = (typeof PLANS)[number]

/** The account fields of the customer, in the order of the account text. Gather info reads the fields that the action of Triage needs. */
export const ACCOUNT_FIELDS = ["today", "owner", "sender", "plan", "reset", "purchase", "refunds"] as const
export type AccountField = (typeof ACCOUNT_FIELDS)[number]
/**
 * What Triage did with the request. Triage never stops the flow: every request goes on to Gather info. "injection": orders
 * in the text are ignored and the action is "Send reply". "answer": the request is a question. "act": the action has
 * written rules.
 */
export type TriageRule = "injection" | "answer" | "act"

export interface Requester {
  name: string
  email: string
}

export type PurchaseCategory = "Monthly plan" | "Annual plan"
/** Scheduled: the renewal is not charged yet. Settling: charged, but the bank has not settled it. Paid: settled. */
export type PurchaseStatus = "Scheduled" | "Settling" | "Paid"

/** The one purchase of an account: the charge of a plan. */
export interface PurchaseInfo {
  id: string
  /** What was bought, for example "Pro plan, monthly". */
  item: string
  category: PurchaseCategory
  status: PurchaseStatus
  /** What the purchase charged, in US dollars. */
  amount: number
  /** The date of the charge, or the planned date while it is Scheduled. */
  charged: string
  /** How the workspace used what it bought. The system checks claims such as "I never used it" against this. */
  usage: string
}

/** What the system knows about the customer: one customer has exactly one purchase. Jev and the LLM get the same facts. */
export interface Account {
  id: string
  customer: { name: string; email: string }
  plan: Plan
  creditsLeft: number
  /** The date of the next renewal of the plan. */
  renews: string
  /** True when the auto-renewal of the plan is off: the plan runs to the end of the paid period and does not renew. */
  planCancelled: boolean
  /** The password reset links sent to this account so far: the password reset log. */
  passwordResets: number
  purchase: PurchaseInfo
  refundsLast90Days: number
}

/** Read from the text with fixed patterns. */
export interface Facts {
  /** Another e-mail address in the text, which may belong to another customer. */
  otherEmail: string | null
}

export interface Choice {
  value: string
  confidence: number
}

export interface Flag {
  value: boolean
  confidence: number
}

export interface Classifier {
  model: string
  latencyS: number
  inputTokens: number
  outputTokens: number
  fields: { queue: Choice; action: Choice; priority: Choice; risk: Flag; injection: Flag }
}

/** One rule of the written policy, evaluated on the data of this request. */
export interface PolicyRule {
  /** The name of the written rule: the source and the short name of the rule (for example "Refund rule: refund window"). The rule check answers with this name. */
  name: string
  /** The group of the rule, in the order that the rules are listed: 1 Allowed, 2 Not done before, 3 Needs a check. */
  check: 1 | 2 | 3
  text: string
  source: "Refund rule" | "Data deletion rule" | "Cancellation rule" | "Password reset rule" | "Security rule"
  /** pass: the rule is met. deny: the rule is not met, the action cannot be done, and nothing runs. */
  outcome: "pass" | "deny"
  detail: string
}

export interface Policy {
  action: string
  verdict: "allow" | "deny"
  rules: PolicyRule[]
}

export interface Executed {
  action: string | null
  queue: string | null
  target: string | null
  /** Reasons why nothing was done, or null. */
  blocked: string[] | null
  /** What the system did, as facts for the reply. */
  details: string[]
}

/** Triage, part 2: what Triage did with the request, from the five answers of the classifier. The next state is always Gather info. */
export interface TriageResponse {
  rule: TriageRule
  reason: string
  /** The action after Triage. "Send reply" when the injection flag is on (the orders in the text are ignored). */
  action: string
  queue: string
  ignoredOrders: boolean
}

/** Rules check: the written rules for the action, on the facts. allow: Do action. deny: Final message, nothing runs. */
export interface RulesResponse {
  policy: Policy
  next: "act" | "final"
}
