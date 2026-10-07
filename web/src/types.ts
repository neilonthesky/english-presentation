// Shapes shared by the Hono server (server/) and the React app (src/).

export const QUEUES = ["Plans and Credits", "Refunds", "Payments", "Product Help", "Account", "Security"] as const
export const ACTIONS = ["Send reply", "Start refund", "Delete data", "Cancel plan", "Reset password"] as const
export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const

export type Role = "owner" | "teammate"
export const PLANS = ["Free", "Pro", "Team"] as const
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
  /** owner: the account holder who subscribed and pays. teammate: another member of the workspace, with no rights over billing or data. */
  role: Role
}

export type PurchaseCategory = "Monthly plan" | "Annual plan" | "Credit pack"
/** Scheduled: the renewal is not charged yet. Settling: charged, but the bank has not settled it. Paid: settled. */
export type PurchaseStatus = "Scheduled" | "Settling" | "Paid"

/** The one purchase of an account: a plan charge or a credit pack. */
export interface PurchaseInfo {
  id: string
  /** What was bought, for example "Pro plan, monthly" or "5,000 credits". */
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
  /** Another member of the workspace, without rights over billing or data. The sender can be this teammate instead of the owner. */
  teammate: { name: string; email: string }
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

export interface RequestInfo {
  text: string
  channel: string
  receivedUtc: string
  requester: Requester
}

export interface Timed {
  latencyS: number
}

// One response per step. The server keeps the request between the steps; the browser sends sessionId + requestId.
/** New: the message is saved. With a requestId the text is a new message of the customer in the open chat: it joins the chat of that request. */
export interface ReceiveResponse {
  requestId: string
  request: RequestInfo
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

/** Gather info: what the system knows about the sender, the purchase, and the help articles of the text. */
export interface GatherResponse {
  /** The account fields that Gather info read, chosen by the action of Triage. The next steps see only these fields. */
  fields: readonly AccountField[]
  account: Account
  facts: Facts
  /** The titles of the help articles that match the text. */
  articles: string[]
}

/** Rules check: the written rules for the action, on the facts. allow: Do action. deny: Final message, nothing runs. */
export interface RulesResponse {
  policy: Policy
  next: "act" | "final"
}

/** Final message: the text the customer reads. answer: the LLM answers a question from the help articles and the account. result: the LLM tells the result of Do action or why nothing ran. */
export interface FinalResponse extends Timed {
  text: string
  kind: "answer" | "result"
  /** The titles of the help articles given to the LLM (kind "answer"). */
  sources: string[]
  /** Why nothing ran, when it did not (kind "result"): the reasons of the written rules, or the rule of Triage that stopped the flow. */
  blocked: string[] | null
}

/** A scenario in the drop-down list of the chat: who sends which text, and what a good run shows. */
export interface Scenario {
  group: string
  label: string
  /** One of the demo customers of the server (id of the account). */
  customerId: string
  role: Role
  text: string
  /** What a good run shows. */
  note: string
}
