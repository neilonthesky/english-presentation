// FrameForge customer support system: the Hono server. It holds the API credentials, so the browser never sees them.
// One endpoint for each state of the flow that calls the server (receive, classify, triage, clarify, gather, rules, act, final, queue).
// The server keeps each request between the calls.
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import type {
  ClarifyResponse, Classifier, Executed, FinalResponse, GatherResponse, QueueResponse, ReceiveResponse, Requester, Role,
  RulesResponse, TriageResponse,
} from "../src/types"
import { CLARIFY_ROUNDS, accountOf, accountsOf, extractFacts, findArticles, findCustomer, requesterFor, staffWhy } from "./saas"
import { ApiError, QUEUED_MESSAGE, answerQuestion, classify, writeBrief, writeClarify, writeReply } from "./models"
import { actStep, rulesStep, triageStep } from "./steps"

interface Req {
  customerId: string
  who: Requester
  receivedUtc: string
  /** What the customer wrote in this request: the first message, then the replies to Clarify. */
  lines: string[]
  /** Clarify rounds done so far. */
  round: number
  /** True after Clarify asked a question and before the reply of the customer came. */
  waiting: boolean
  classifier?: Classifier
  triage?: TriageResponse
  clarify?: ClarifyResponse
  gather?: GatherResponse
  rules?: RulesResponse
  executed?: Executed
  final?: FinalResponse
  queued?: QueueResponse
}
interface Session {
  /** "action|target" pairs of the actions that changed something in this session. */
  ledger: Set<string>
  requests: Map<string, Req>
}

const sessions = new Map<string, Session>()

const textOf = (r: Req) => r.lines.join("\n\n")

/** The session and the request of a call. A step needs the result of the step before it. */
async function load(c: { req: { json: <T>() => Promise<T> } }, needs?: keyof Req) {
  const { sessionId, requestId, ...rest } = await c.req.json<{ sessionId: string; requestId?: string } & Record<string, unknown>>()
  let s = sessions.get(sessionId)
  if (!s) sessions.set(sessionId, (s = { ledger: new Set(), requests: new Map() }))
  if (!requestId) return { s, requestId, body: rest, r: undefined as never }
  const r = s.requests.get(requestId)
  if (!r) throw new HTTPException(404, { message: `unknown request ${requestId}` })
  if (needs && r[needs] === undefined) throw new HTTPException(409, { message: `the step before did not run: ${needs} is missing` })
  return { s, requestId, body: rest, r }
}

const app = new Hono()

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
  return c.json({ error: err.message }, err instanceof ApiError ? 502 : 500)
})

// New: the system saves the message with an ID and the time. With a requestId, the message is the reply of the customer to Clarify:
// it joins the chat of that request, and the results of the steps after it are dropped, because Jev classifies the whole chat again.
app.post("/api/receive", async (c) => {
  const { s, requestId, body, r: old } = await load(c)
  const { text, role, customerId } = body as { text: string; role: Role; customerId: string }
  if (requestId) {
    if (!old.waiting) throw new HTTPException(409, { message: "Clarify did not ask a question for this request" })
    const { customerId: id, who, receivedUtc, lines, round } = old
    const r: Req = { customerId: id, who, receivedUtc, lines: [...lines, text], round, waiting: false }
    s.requests.set(requestId, r)
    return c.json({ requestId, request: { text: textOf(r), channel: "chat", receivedUtc, requester: who }, round } satisfies ReceiveResponse)
  }
  if (!findCustomer(customerId)) throw new HTTPException(400, { message: `unknown customer ${customerId}` })
  const id = `R-${s.requests.size + 1}`
  const r: Req = { customerId, who: requesterFor(customerId, role), receivedUtc: new Date().toISOString(), lines: [text], round: 0, waiting: false }
  s.requests.set(id, r)
  return c.json({ requestId: id, request: { text, channel: "chat", receivedUtc: r.receivedUtc, requester: r.who }, round: 0 } satisfies ReceiveResponse)
})

// Triage, part 1: the classifier (Jev) gives five answers on the whole chat of the customer. The account is not an input.
app.post("/api/classify", async (c) => {
  const { r } = await load(c)
  r.classifier = await classify(textOf(r), r.who)
  return c.json(r.classifier)
})

// Triage, part 2: fixed rules choose the next state. No model.
app.post("/api/triage", async (c) => {
  const { r } = await load(c, "classifier")
  r.triage = triageStep(r.classifier!, r.round)
  return c.json(r.triage)
})

// Clarify: the LLM asks the customer for more detail. This call counts the round.
app.post("/api/clarify", async (c) => {
  const { r } = await load(c, "triage")
  if (r.triage!.next !== "clarify") throw new HTTPException(409, { message: `Triage chose ${r.triage!.next}, not clarify` })
  if (!r.clarify) {
    const q = await writeClarify(textOf(r), r.who)
    r.round += 1
    r.waiting = true
    r.clarify = { question: q.text, round: r.round, rounds: CLARIFY_ROUNDS, latencyS: q.latencyS }
  }
  return c.json(r.clarify)
})

// Gather info: the account, the purchase, the other e-mail in the text, and the help articles.
app.post("/api/gather", async (c) => {
  const { r } = await load(c, "triage")
  if (r.triage!.next !== "gather") throw new HTTPException(409, { message: `Triage chose ${r.triage!.next}, not gather` })
  const text = textOf(r)
  r.gather = { account: accountOf(r.customerId), facts: extractFacts(text), articles: findArticles(text).map((a) => a.title) }
  return c.json(r.gather)
})

// Rules check: the written rules for the action of Triage are checked on the facts.
app.post("/api/rules", async (c) => {
  const { s, r } = await load(c, "gather")
  r.rules = rulesStep(r.triage!.action, r.who, r.gather!.facts, s.ledger, r.customerId)
  return c.json(r.rules)
})

// Do action: the system does the action, but only if the rules allow it.
app.post("/api/act", async (c) => {
  const { s, r } = await load(c, "rules")
  if (r.rules!.next !== "act") throw new HTTPException(409, { message: `the rules say ${r.rules!.next}, so no action runs` })
  r.executed ??= actStep(r.triage!.action, r.triage!.queue, r.rules!, s.ledger, r.customerId)
  return c.json(r.executed)
})

// Final message: the LLM answers from the help articles and the account (action "Send reply"), or tells the result of Do action or why nothing ran.
app.post("/api/final", async (c) => {
  const { s, r } = await load(c, "rules")
  const { rules, triage } = r
  if (rules!.next === "queued") throw new HTTPException(409, { message: "the rules say queued, so there is no Final message" })
  if (rules!.next === "act" && !r.executed) throw new HTTPException(409, { message: "the step before did not run: executed is missing" })
  // A deny verdict skips Do action: actStep returns the reasons and runs nothing.
  r.executed ??= actStep(triage!.action, triage!.queue, rules!, s.ledger, r.customerId)
  if (!r.final) {
    const text = textOf(r)
    if (r.executed.action === "Send reply") {
      const articles = findArticles(text)
      const a = await answerQuestion(text, r.who, r.customerId, articles)
      r.final = { text: a.text, latencyS: a.latencyS, kind: "answer", sources: articles.map((x) => x.title) }
    } else {
      const w = await writeReply(text, r.who, r.customerId, rules!.policy, r.executed)
      r.final = { text: w.text, latencyS: w.latencyS, kind: "result", sources: [] }
    }
  }
  return c.json(r.final)
})

// Queued: the LLM writes the ticket summary for support staff, and the bot sends the fixed message. One request is one ticket.
// Triage or Rules check sent the request here, or the customer pressed "no" N times (body reason "customer").
app.post("/api/queue", async (c) => {
  const { r, body } = await load(c, "classifier")
  if (!r.queued) {
    let reason: QueueResponse["reason"]
    let bot = null
    if (body.reason === "customer") {
      if (!r.final || !r.executed) throw new HTTPException(409, { message: "the customer has not read a Final message yet" })
      reason = "customer"
      bot = { executed: r.executed, reply: r.final.text }
    } else if (r.triage?.next === "queued") {
      reason = r.triage.rule as QueueResponse["reason"]
    } else if (r.rules?.next === "queued") {
      reason = "rules"
    } else {
      throw new HTTPException(409, { message: "Triage and Rules check did not send this request to Queued" })
    }
    const why = reason === "customer" ? null : staffWhy(reason, r.rules?.policy)
    const brief = await writeBrief(textOf(r), r.who, r.customerId, r.classifier!, r.rules?.policy ?? null, why, bot)
    r.queued = { summary: brief.text, message: QUEUED_MESSAGE[reason === "customer" ? "customer" : "request"], reason, latencyS: brief.latencyS }
  }
  return c.json(r.queued)
})

// The demo customers. Each has one purchase. The chat shows them from the start.
app.get("/api/customers", (c) => c.json(accountsOf()))

app.post("/api/reset", async (c) => {
  sessions.delete((await c.req.json<{ sessionId: string }>()).sessionId)
  return c.json({ ok: true })
})

export default { port: 8787, hostname: "127.0.0.1", fetch: app.fetch, idleTimeout: 255 }
