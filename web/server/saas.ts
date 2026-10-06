// The made-up SaaS product "FrameForge" (an AI video-generation platform where customers turn text prompts or reference images
// into short video clips in a web studio, sold as a monthly or annual plan plus credit packs):
// the customers, the written policy, the Triage rules, and the help articles. No network code here.
//
// Every customer has exactly one purchase. The refund rules set a window after the charge (14 days for a monthly plan,
// 30 days for an annual plan), allow a credit pack only while none of its credits are used, cancel a renewal that is
// not charged yet, and accept a request only from the owner of the account. The refund and data deletion rules also
// set limits for this made-up customer support system.
import type {
  Account, Classifier, Executed, Facts, Next, Plan, Policy, PolicyRule, PurchaseInfo, Requester, Role, TriageRule,
} from "../src/types"

export const MONTHLY_WINDOW_DAYS = 14
export const ANNUAL_WINDOW_DAYS = 30
export const AUTO_REFUND_LIMIT_USD = 100
export const MAX_REFUNDS_90_DAYS = 2

const DAY_MS = 86_400_000
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const daysAgo = (n: number) => iso(Date.now() - n * DAY_MS)
const daysAhead = (n: number) => iso(Date.now() + n * DAY_MS)
const daysSince = (date: string) => Math.floor((Date.parse(`${world.today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY_MS)

export interface Purchase extends PurchaseInfo {
  /** The workspace used none of what it bought: no credits of a plan period, or no credit of the pack. */
  unused: boolean
}

export interface Customer {
  id: string
  name: string
  email: string
  teammate: { name: string; email: string }
  plan: Plan
  creditsLeft: number
  renews: string
  refundsLast90Days: number
  purchase: Purchase
}

// The demo world. Dates are relative to today, so the windows of the demo are the same on every day.
// The first three customers give three different answers to the same sentence "I want a refund".
const demoCustomers = (): Customer[] => [
  {
    id: "linh", name: "Linh Tran", email: "linh@mail.example",
    teammate: { name: "Duc Le", email: "duc@mail.example" }, plan: "Pro", creditsLeft: 1480, renews: daysAhead(25), refundsLast90Days: 0,
    purchase: {
      id: "FF-10482", item: "Pro plan, monthly", category: "Monthly plan", status: "Paid", amount: 64,
      charged: daysAgo(5), usage: "Used 520 of 2,000 credits", unused: false,
    },
  },
  {
    id: "minh", name: "Minh Pham", email: "minh@mail.example",
    teammate: { name: "Khanh Tran", email: "khanh@mail.example" }, plan: "Team", creditsLeft: 10000, renews: daysAhead(10), refundsLast90Days: 1,
    purchase: {
      id: "FF-10517", item: "Team plan, monthly", category: "Monthly plan", status: "Paid", amount: 129,
      charged: daysAgo(20), usage: "No credits used", unused: true,
    },
  },
  {
    id: "an", name: "An Nguyen", email: "an@mail.example",
    teammate: { name: "Bao Vu", email: "bao@mail.example" }, plan: "Free", creditsLeft: 1880, renews: daysAhead(24), refundsLast90Days: 0,
    purchase: {
      id: "FF-10533", item: "Credit pack, 5,000 credits", category: "Credit pack", status: "Paid", amount: 50,
      charged: daysAgo(6), usage: "3,120 of 5,000 credits used", unused: false,
    },
  },
  {
    id: "hoa", name: "Hoa Le", email: "hoale@mail.example",
    teammate: { name: "Tam Do", email: "tam@mail.example" }, plan: "Pro", creditsLeft: 2000, renews: daysAhead(2), refundsLast90Days: 0,
    purchase: {
      id: "FF-10561", item: "Pro plan, monthly", category: "Monthly plan", status: "Scheduled", amount: 64,
      charged: daysAhead(2), usage: "Renewal not charged yet", unused: true,
    },
  },
]

/** The customers and the date of "today". The demo has four customers; the experiment loads its own world. */
export interface World {
  today: string
  customers: Customer[]
}

let world: World = { today: iso(Date.now()), customers: demoCustomers() }

/** Replace the world. The rules and the prompts read the customers and the date from it. */
export function useWorld(w: World): void {
  world = w
}

export const findCustomer = (id: unknown): Customer | undefined => world.customers.find((c) => c.id === id)

function customerOf(id: string): Customer {
  const c = findCustomer(id)
  if (!c) throw new Error(`unknown customer ${id}`)
  return c
}

/** The sender: the owner, or a teammate of the workspace, who has no rights over billing or data. */
export function requesterFor(customerId: string, role: Role): Requester {
  const c = customerOf(customerId)
  return role === "owner" ? { name: c.name, email: c.email, role } : { name: c.teammate.name, email: c.teammate.email, role }
}

function accountFrom(c: Customer): Account {
  const { unused: _unused, ...purchase } = c.purchase
  return {
    id: c.id,
    customer: { name: c.name, email: c.email },
    teammate: c.teammate,
    plan: c.plan,
    creditsLeft: c.creditsLeft,
    renews: c.renews,
    purchase,
    refundsLast90Days: c.refundsLast90Days,
  }
}

export const accountsOf = (): Account[] => world.customers.map(accountFrom)
export const accountOf = (customerId: string): Account => accountFrom(customerOf(customerId))

/** The account as plain text, for the prompts of the LLM. */
export function accountText(customerId: string, who: Requester): string {
  const a = accountOf(customerId)
  const p = a.purchase
  const charge = p.status === "Scheduled" ? `Planned charge: ${p.charged}.` : `Charged ${p.charged}.`
  return [
    `Today: ${world.today}.`,
    `Account owner: ${a.customer.name} <${a.customer.email}>.`,
    `Sender of the request: ${who.name} <${who.email}>, ${who.role === "owner" ? "the owner (pays and has all rights)" : "a teammate (no rights over billing or data)"}.`,
    `Plan: ${a.plan}. Credits left: ${a.creditsLeft}. Next renewal: ${a.renews}.`,
    `Purchase (the only one): ${p.id}, ${p.item} (${p.category}), $${p.amount}. ` +
      `Status: ${p.status}. ${charge} Usage: ${p.usage}.`,
    `Refunds in the last 90 days: ${a.refundsLast90Days}.`,
  ].join("\n")
}

/** Gather info: read another e-mail address from the text with a fixed pattern. */
export function extractFacts(text: string): Facts {
  return { otherEmail: text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0].toLowerCase() ?? null }
}

/** The thing an action changes: an id for the ledger and a name for the replies. */
export function targetOf(customerId: string, action: string): { id: string; label: string } | null {
  const c = customerOf(customerId)
  if (action === "Start refund") return { id: c.purchase.id, label: `${c.purchase.item} (purchase ${c.purchase.id})` }
  if (action === "Delete data") return { id: `${c.id}:account`, label: `the workspace of ${c.name}` }
  return null
}

/** Actions that change money or data. Only these have written rules. */
const COVERED: Record<string, true> = { "Start refund": true, "Delete data": true }

/**
 * The written policy for an action, checked against the data of this request. Each rule has an outcome:
 * pass (fine), deny (the action cannot be done), or review (support staff must decide). The ledger holds the
 * "action|target" pairs that already ran in this session.
 */
export function policyFor(action: string, who: Requester, facts: Facts, ledger: ReadonlySet<string>, customerId: string): Policy {
  const c = customerOf(customerId)
  const purchase = c.purchase
  const rules: PolicyRule[] = []
  const add = (check: PolicyRule["check"], source: PolicyRule["source"], text: string, outcome: PolicyRule["outcome"], detail: string) => {
    rules.push({ check, text, source, outcome, detail })
  }

  if (action in COVERED) {
    const source = action === "Start refund" ? "Refund rule" : "Data deletion rule"
    const owner = who.role === "owner"
    add(1, source, "Only the owner can ask for this.", owner ? "pass" : "deny",
      owner ? `${who.name} is the owner of the account.` : `${who.name} is a teammate, not the owner of the account.`)
    const other = facts.otherEmail && facts.otherEmail !== c.email && facts.otherEmail !== c.teammate.email ? facts.otherEmail : null
    add(1, source, "The system changes only the account of the sender.", other ? "deny" : "pass", other ? `${other} is another customer.` : "The request names no other customer.")
  }

  if (action === "Start refund") {
    const done = ledger.has(`Start refund|${purchase.id}`)
    add(2, "Refund rule", "A purchase is refunded once.", done ? "deny" : "pass", done ? `Purchase ${purchase.id} was already refunded.` : "No refund ran for this purchase.")
    if (purchase.category === "Credit pack") {
      add(1, "Refund rule", "A credit pack can be refunded only while none of its credits are used.", purchase.unused ? "pass" : "deny", `${purchase.usage}.`)
    } else if (purchase.status === "Scheduled") {
      add(1, "Refund rule", "A renewal that is not charged yet can be cancelled with no charge.", "pass", "The renewal is still scheduled.")
    } else if (purchase.status === "Settling") {
      add(1, "Refund rule", "A charge that the bank has not settled cannot be refunded; ask again after it settles.", "deny",
        "The charge was made and is not settled yet.")
    } else {
      const limit = purchase.category === "Monthly plan" ? MONTHLY_WINDOW_DAYS : ANNUAL_WINDOW_DAYS
      const age = daysSince(purchase.charged)
      const text = `A refund is possible within ${MONTHLY_WINDOW_DAYS} days of the charge for a monthly plan and ${ANNUAL_WINDOW_DAYS} days for an annual plan.`
      if (age <= limit) add(1, "Refund rule", text, "pass", `Charged ${age} days ago; the limit is ${limit} days.`)
      else if (purchase.unused)
        add(1, "Refund rule", text, "review",
          `Charged ${age} days ago; the limit is ${limit} days. The workspace used nothing it bought, so support staff can make an exception.`)
      else add(1, "Refund rule", text, "deny", `Charged ${age} days ago; the limit is ${limit} days. The workspace used the plan (${purchase.usage}).`)
    }
    add(3, "Refund rule", `A refund over $${AUTO_REFUND_LIMIT_USD} needs support staff.`, purchase.amount > AUTO_REFUND_LIMIT_USD ? "review" : "pass", `The refund is $${purchase.amount}.`)
    const refunds = c.refundsLast90Days + (done ? 1 : 0)
    add(3, "Refund rule", `A customer with ${MAX_REFUNDS_90_DAYS} or more refunds in 90 days needs support staff.`, refunds >= MAX_REFUNDS_90_DAYS ? "review" : "pass", `${refunds} refund${refunds === 1 ? "" : "s"} in the last 90 days.`)
  }

  if (action === "Delete data") {
    const done = ledger.has(`Delete data|${c.id}:account`)
    add(2, "Data deletion rule", "Data is deleted once.", done ? "deny" : "pass", done ? "The deletion already started." : "No deletion ran before.")
    add(3, "Data deletion rule", "Deleting data cannot be undone, so support staff always handle it.", "review", `The workspace of ${c.name} would be deleted for good.`)
  }

  rules.sort((a, b) => a.check - b.check)
  const verdict = rules.some((r) => r.outcome === "deny") ? "deny" : rules.some((r) => r.outcome === "review") ? "review" : "allow"
  return { action, verdict, rules }
}

/** The classifier must be at least this sure of the queue, the action, and the risk flag, or Triage does not trust it. The environment variable CONFIDENCE_FLOOR changes it for the sweep of the experiment. */
export const CONFIDENCE_FLOOR = Number(process.env.CONFIDENCE_FLOOR ?? 0.6)

/** How many times Clarify may ask the customer for more detail before an unsure request goes to Queued. The environment variable CLARIFY_ROUNDS changes it for the sweep of the experiment. */
export const CLARIFY_ROUNDS = Number(process.env.CLARIFY_ROUNDS ?? 1)

export interface TriageResult {
  next: Next
  rule: TriageRule
  reason: string
  /** The action after Triage: "Send reply" when the injection flag is on. */
  action: string
  queue: string
  ignoredOrders: boolean
}

/**
 * Triage, part 2: choose the next state from the five answers of the classifier. The first rule that matches wins.
 * `round` is the number of Clarify rounds done so far for this request.
 */
export function triage(f: Classifier["fields"], round: number): TriageResult {
  const queue = f.queue.value
  const done = (next: Next, rule: TriageRule, reason: string, action = f.action.value, ignoredOrders = false): TriageResult =>
    ({ next, rule, reason, action, queue, ignoredOrders })
  if (f.priority.value === "Critical") return done("queued", "critical", "the priority is Critical")
  if (f.injection.value) return done("gather", "injection", "the injection flag is on, so the orders in the text are ignored", "Send reply", true)
  if (Math.min(f.queue.confidence, f.action.confidence, f.risk.confidence) < CONFIDENCE_FLOOR) {
    const reason = `the classifier is less than ${Math.round(CONFIDENCE_FLOOR * 100)}% sure of the queue, the action, or the risk flag`
    return round < CLARIFY_ROUNDS ? done("clarify", "unsure", reason) : done("queued", "unsure", reason)
  }
  if (f.action.value === "Needs staff") return done("queued", "needs-staff", "the action is Needs staff")
  if (f.risk.value && !(f.action.value in COVERED)) return done("queued", "risk", "the risk flag is on and no written rule covers the action")
  if (f.action.value === "Send reply") return done("gather", "answer", "the request is a question and nothing changes")
  return done("gather", "act", "the classifier is sure and the action has written rules or needs none")
}

/** Why support staff must read the request: the reason of a Queued state. `policy` is needed for "rules". */
export function staffWhy(rule: TriageRule | "rules" | "customer", policy?: Policy): string {
  switch (rule) {
    case "critical": return "The priority is Critical, so support staff must read it."
    case "unsure": return "The classifier is not sure of its answer, so support staff must read it."
    case "needs-staff": return "The request needs work that the system cannot do itself, so support staff must do it."
    case "risk": return "The classifier says money or data would change, and no written rule covers this action."
    case "rules": return policy ? policy.rules.filter((r) => r.outcome === "review").map((r) => r.detail).join(" ") : ""
    case "customer": return "The customer says that the reply did not solve the issue."
    default: return ""
  }
}

/** Do action: what the system does for an action. Returns the target and the details for the Final message. */
export function perform(action: string, customerId: string): Pick<Executed, "target" | "details"> {
  const c = customerOf(customerId)
  const p = c.purchase
  const target = targetOf(customerId, action)?.label ?? null
  switch (action) {
    case "Start refund":
      return {
        target,
        details:
          p.status === "Scheduled"
            ? [`The renewal ${p.id} was cancelled before it was charged.`, "Nothing is charged."]
            : [`A refund was approved for ${p.item}.`, `A refund of $${p.amount} started.`, "The money returns to the original payment method in 5 to 10 business days."],
      }
    case "Delete data":
      return { target, details: [`The deletion of the workspace of ${c.name} started.`, "It is complete in 30 days and cannot be undone."] }
    default:
      return { target, details: [] }
  }
}

export interface Article {
  title: string
  text: string
  keywords: string[]
}

// The help center of FrameForge. The LLM answers a question only from these articles and the account.
const ARTICLES: Article[] = [
  {
    title: "Plans and credits",
    keywords: ["plan", "plans", "free", "pro", "team", "credit", "credits", "balance", "renew", "renewal", "seat", "seats", "usage", "limit", "quota", "left", "upgrade", "downgrade", "price"],
    text:
      "FrameForge has three plans: Free, Pro, and Team. A plan gives credits every month, and the credits of a plan reset at each renewal. " +
      "A credit pack adds credits at once, and the credits of a pack do not expire. Every video render uses credits, whether it starts from a text prompt or from a reference image. " +
      "The cost of a render depends on its duration and resolution, and the studio shows the quoted cost before the render starts. " +
      "The account shows the plan, the credits left, and the date of the next renewal.",
  },
  {
    title: "Refunds and cancelling",
    keywords: ["refund", "money back", "cancel", "cancellation", "mistake", "reimburse", "charged by mistake", "unused", "window"],
    text:
      "Refunds must be asked for by the owner of the account. A monthly plan can be refunded within " + MONTHLY_WINDOW_DAYS + " days of the charge and an annual plan within " +
      ANNUAL_WINDOW_DAYS + " days. A credit pack can be refunded only while none of its credits are used. A renewal that is not charged yet can be cancelled with no charge. " +
      `A refund over $${AUTO_REFUND_LIMIT_USD} is checked by support staff. Outside the window, support staff can make an exception when the workspace used nothing it bought. ` +
      "The money returns to the card in 5 to 10 business days.",
  },
  {
    title: "Payments and invoices",
    keywords: ["pay", "payment", "card", "charge", "charged", "twice", "invoice", "receipt", "vat", "tax", "coupon", "promo", "discount", "billing"],
    text:
      "The card is charged when a plan renews or a credit pack is bought. An invoice with a tax ID can be requested from support staff; " +
      "support staff send it. A pending authorization that looks like a second charge disappears in 3 to 5 days.",
  },
  {
    title: "Changing your plan",
    keywords: ["switch", "change plan", "move to", "upgrade", "downgrade", "seats", "plan change"],
    text:
      "The chatbot does not change a plan itself. Support staff change it for you, and the new plan starts at the next renewal. " +
      "Only the owner of the account can ask for it.",
  },
  {
    title: "Video rendering and exports",
    keywords: ["video", "render", "rendering", "export", "exports", "upload", "uploads", "format", "stalled", "failed", "stuck", "queued", "job", "clip", "resolution", "duration", "error", "slow", "not working", "download", "mp4", "image", "reference image", "prompt"],
    text:
      "If a render is stalled or failed, open the job in the web studio and check its status, then refresh the studio. If an upload or export fails, check that the file format is supported and try again. " +
      "If it still fails, send the render job ID, and a member of support staff looks at the job.",
  },
  {
    title: "Account and security",
    keywords: ["password", "login", "hacked", "fraud", "email", "two-factor", "2fa", "unauthorized", "someone else", "suspicious", "stolen", "leaked", "teammate"],
    text:
      "Change your password under Account settings and turn on two-factor sign-in. A teammate can use the product but cannot change billing or data. " +
      "If someone used your card or your account without you, or your private footage or projects are exposed, support staff look at the request at once.",
  },
  {
    title: "Delete workspace data",
    keywords: ["delete", "data", "privacy", "gdpr", "remove", "erase", "close account", "workspace"],
    text: "Only the owner can delete the data of a workspace. Support staff take over every deletion request and handle it in the chat. The deletion is complete in 30 days and cannot be undone.",
  },
]

/** The articles that match the words of a request. A plain keyword score, best first. */
export function findArticles(text: string, limit = 2): Article[] {
  const t = text.toLowerCase()
  return ARTICLES.map((a) => ({ a, score: a.keywords.filter((k) => t.includes(k)).length }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a)
}

/** The help articles that match a request, as the text that both classifiers read in Triage. */
export function articlesText(text: string): string {
  return findArticles(text).map((a) => `${a.title}: ${a.text}`).join("\n")
}
