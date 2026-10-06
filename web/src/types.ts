// Shapes shared by the Hono server (server/) and the React app (src/).

export const QUEUES = ["Plans and Credits", "Refunds", "Payments", "Product Help", "Account", "Security"] as const
export const ACTIONS = ["Send reply", "Needs staff", "Start refund", "Delete data"] as const
export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const

export type Role = "owner" | "teammate"
export const PLANS = ["Free", "Pro", "Team"] as const
export type Plan = (typeof PLANS)[number]
/** Where Triage sends the request: Gather info, Queued (support staff), or Clarify (the LLM asks for more detail). */
export type Next = "gather" | "queued" | "clarify"
/** Why Triage chose the next state. "injection": orders in the text are ignored and the action is "Send reply". */
export type TriageRule = "critical" | "injection" | "unsure" | "needs-staff" | "risk" | "answer" | "act"

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
  /** Another member of the workspace, without rights over billing or data. The sender can be this person instead of the owner. */
  teammate: { name: string; email: string }
  plan: Plan
  creditsLeft: number
  /** The date of the next renewal of the plan. */
  renews: string
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
  /** The group of the rule, in the order that the rules are listed: 1 Allowed, 2 Not done before, 3 Needs a person. */
  check: 1 | 2 | 3
  text: string
  source: "Refund rule" | "Data deletion rule"
  /** pass: fine. deny: the action cannot be done. review: a person must decide. */
  outcome: "pass" | "deny" | "review"
  detail: string
}

export interface Policy {
  action: string
  verdict: "allow" | "review" | "deny"
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
/** New: the message is saved. With a requestId the text is the reply of the customer in Clarify: it joins the chat of that request. */
export interface ReceiveResponse {
  requestId: string
  request: RequestInfo
  /** Clarify rounds done so far for this request. */
  round: number
}

/** Triage, part 2: where the request goes, from the five answers of the classifier. */
export interface TriageResponse {
  next: Next
  rule: TriageRule
  reason: string
  /** The action after Triage. "Send reply" when the injection flag is on (the orders in the text are ignored). */
  action: string
  queue: string
  ignoredOrders: boolean
  round: number
}

/** Clarify: the LLM asks the customer for more detail. */
export interface ClarifyResponse extends Timed {
  question: string
  /** This round, counted from 1, and the most rounds before the request goes to Queued. */
  round: number
  rounds: number
}

/** Gather info: what the system knows about the sender, the purchase, and the help articles of the text. */
export interface GatherResponse {
  account: Account
  facts: Facts
  /** The titles of the help articles that match the text. */
  articles: string[]
}

/** Rules check: the written rules for the action, on the facts. allow: Do action. deny: Final message, nothing runs. review: Queued. */
export interface RulesResponse {
  policy: Policy
  next: "act" | "final" | "queued"
  /** The reason for support staff when next is "queued", else null. */
  staffWhy: string | null
}

/** Final message: the text the customer reads. answer: the LLM answers a question from the help articles and the account. result: the LLM tells the result of Do action or why nothing ran. */
export interface FinalResponse extends Timed {
  text: string
  kind: "answer" | "result"
  /** The titles of the help articles given to the LLM (kind "answer"). */
  sources: string[]
}

/** Queued: the ticket summary for support staff, and the fixed message to the customer (staff will reply, the chat is locked). */
export interface QueueResponse extends Timed {
  summary: string
  message: string
  reason: "critical" | "needs-staff" | "risk" | "rules" | "unsure" | "customer"
}

/** A scenario in the drop-down list of the chat: who sends which text, and what a good run shows. */
export interface Scenario {
  group: string
  label: string
  /** One of the demo customers of the server (id of the account). */
  customerId: string
  role: Role
  text: string
  /** The reply of the customer when Clarify asks for more detail. It fills the chat box at that point. */
  reply?: string
  /** What a good run shows. */
  note: string
}
