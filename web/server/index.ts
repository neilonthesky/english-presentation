// FrameForge customer support system: the Hono server. It holds the API credentials, so the browser never sees them.
// One endpoint for each state of the flow that calls the server (receive, classify, triage, gather, rules, act, final).
// The server keeps each request between the calls.
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import type {
  ClassifyResponse, CompareResponse, Executed, FinalResponse, GatherResponse, PresetsResponse, ReceiveResponse, Requester, Role,
  RulesResponse, TriageResponse,
} from "../src/types"
import { accountFieldsFor, misuseReport, accountOf, accountText, accountsOf, extractFacts, findArticles, findCustomer, requesterFor, triage } from "./saas"
import { ApiError, answerQuestion, classify, writeReply } from "./models"
import { actStep, rulesStep } from "./steps"
import { compare } from "./compare"
import { knownScores, presetById, presets, scorePresets } from "./presets"
import { installTrace, onlyCall, traced } from "./trace"

installTrace()

interface Req {
  customerId: string
  who: Requester
  receivedUtc: string
  /** What the customer wrote in this request: the first message, then the messages that follow in the same chat. */
  lines: string[]
  classifier?: ClassifyResponse
  triage?: TriageResponse
  gather?: GatherResponse
  rules?: RulesResponse
  executed?: Executed
  final?: FinalResponse
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

// New: the system saves the message with an ID and the time. With a requestId, the message is a new message of the customer
// in the open chat: it joins the chat of that request, and the results of the steps after it are dropped, because the
// classifier reads the whole chat again.
app.post("/api/receive", async (c) => {
  const { s, requestId, body, r: old } = await load(c)
  const { text, role, customerId } = body as { text: string; role: Role; customerId: string }
  if (requestId) {
    const { customerId: id, who, receivedUtc, lines } = old
    const r: Req = { customerId: id, who, receivedUtc, lines: [...lines, text] }
    s.requests.set(requestId, r)
    return c.json({ requestId, request: { text: textOf(r), channel: "chat", receivedUtc, requester: who } } satisfies ReceiveResponse)
  }
  if (!findCustomer(customerId)) throw new HTTPException(400, { message: `unknown customer ${customerId}` })
  const id = `R-${s.requests.size + 1}`
  const r: Req = { customerId, who: requesterFor(customerId, role), receivedUtc: new Date().toISOString(), lines: [text] }
  s.requests.set(id, r)
  return c.json({ requestId: id, request: { text, channel: "chat", receivedUtc: r.receivedUtc, requester: r.who } } satisfies ReceiveResponse)
})

// Triage, part 1: the classifier (Jev) gives five answers on the whole chat of the customer. The account is not an input.
// The answer carries the call as it went over the network (the payload inspector of the UI).
app.post("/api/classify", async (c) => {
  const { r } = await load(c)
  const { result, calls } = await traced(() => classify(textOf(r), r.who))
  r.classifier = { ...result, trace: onlyCall(calls) }
  return c.json(r.classifier)
})

// Triage, part 2: fixed rules choose the next state. No model.
app.post("/api/triage", async (c) => {
  const { r } = await load(c, "classifier")
  r.triage = triage(r.classifier!.fields)
  return c.json(r.triage)
})

// Gather info: the account, the purchase, the other e-mail in the text, and the help articles.
app.post("/api/gather", async (c) => {
  const { r } = await load(c, "triage")
  const text = textOf(r)
  r.gather = {
    fields: accountFieldsFor(r.triage!.action), account: accountOf(r.customerId), facts: extractFacts(text), articles: findArticles(text).map((a) => a.title),
  }
  return c.json(r.gather)
})

// Rules check: the written rules for the action of Triage, checked on the facts (fixed code).
app.post("/api/rules", async (c) => {
  const { s, r } = await load(c, "gather")
  r.rules = rulesStep(r.triage!.action, r.who, r.gather!.facts, s.ledger, r.customerId, r.gather!.fields, misuseReport(r.classifier!.fields))
  return c.json(r.rules)
})

// Do action: the system does the action, but only if the rules allow it.
app.post("/api/act", async (c) => {
  const { s, r } = await load(c, "rules")
  if (r.rules!.next !== "act") throw new HTTPException(409, { message: `the rules say ${r.rules!.next}, so no action runs` })
  r.executed ??= actStep(r.triage!.action, r.triage!.queue, r.rules!, s.ledger, r.customerId, r.who)
  return c.json(r.executed)
})

// Final message: the LLM answers from the help articles and the account ("Send reply"), or tells the result of Do action or why
// nothing ran. Rules check ends the flow here (deny: nothing runs), and a request that an action ran ends here too.
app.post("/api/final", async (c) => {
  const { s, r } = await load(c, "rules")
  const rules = r.rules!
  if (rules.next === "act" && !r.executed) throw new HTTPException(409, { message: "the step before did not run: executed is missing" })
  // A deny verdict skips Do action: actStep returns the reasons and runs nothing.
  r.executed ??= actStep(r.triage!.action, r.triage!.queue, rules, s.ledger, r.customerId, r.who)
  if (!r.final) {
    const text = textOf(r)
    const articles = findArticles(text)
    if (r.executed.action === "Send reply") {
      const { result: a, calls } = await traced(() => answerQuestion(text, accountText(r.customerId, r.who, r.gather!.fields), articles))
      r.final = { text: a.text, latencyS: a.latencyS, kind: "answer", sources: articles.map((x) => x.title), blocked: null, trace: onlyCall(calls) }
    } else {
      const { result: w, calls } = await traced(() => writeReply(text, r.executed!, rules.policy, articles, accountText(r.customerId, r.who, r.gather!.fields)))
      r.final = { text: w.text, latencyS: w.latencyS, kind: "result", sources: [], blocked: r.executed.blocked, trace: onlyCall(calls) }
    }
  }
  return c.json(r.final)
})

// The palette of messages: the prompt-injection ladder and one request of each request type of the dataset, with the Jev scores
// that the server already has.
app.get("/api/presets", (c) => c.json({ presets, scores: knownScores() } satisfies PresetsResponse))

// Jev scores every preset: the chance of the injection flag. The scores stay in the memory of the server, so each preset costs
// one Jev call per start of the server.
app.post("/api/presets/score", async (c) => c.json({ presets, scores: await scorePresets() } satisfies PresetsResponse))

// Compare: the same message through Level 2 (one LLM call decides) and Level 3 (Jev, fixed rules, LLM text), at the same time.
// Nothing changes in the account of the session. `presetId` is sent only when the text is the text of a preset; the gold answers of a
// dataset preset are used to judge the outcome.
app.post("/api/compare", async (c) => {
  const { s, body } = await load(c)
  const { text, role, customerId, presetId } = body as { text: string; role: Role; customerId: string; presetId?: string }
  if (!findCustomer(customerId)) throw new HTTPException(400, { message: `unknown customer ${customerId}` })
  if (!text?.trim()) throw new HTTPException(400, { message: "the message is empty" })
  const preset = presetId ? presetById(presetId) : undefined
  const gold = preset && preset.text === text ? preset.gold : null
  return c.json(await compare(text, customerId, role, s.ledger, gold) satisfies CompareResponse)
})

// The demo customers. Each has one purchase. The chat shows them from the start.
app.get("/api/customers", (c) => c.json(accountsOf()))

app.post("/api/reset", async (c) => {
  sessions.delete((await c.req.json<{ sessionId: string }>()).sessionId)
  return c.json({ ok: true })
})

export default { port: 8787, hostname: "127.0.0.1", fetch: app.fetch, idleTimeout: 255 }
