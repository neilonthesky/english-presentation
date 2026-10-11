// Probe of three ways to put the written rules next to Jev, on the same 50 requests as jev_context.ts (live Jev calls, no LLM).
//
//   V1  (saved)  one call, all rules as text, one "Allowed" question          -> context_test/per_case.json
//   V2  atomic   call 1: Jev triage on the small state (no rules, no account).
//                call 2: only for a state-changing action: the account lines of that action and ONE yes/no question per rule
//                of that action (a violation question). Code only ANDs the answers. Raw account data: Jev reads dates and numbers.
//   V2b explicit like V2, but code states the facts a rule needs as plain words (days since the charge, the refund window,
//                the count, "the plan is already cancelled"); Jev answers the same atomic questions on these facts.
//   V3  code     call 1 only. Fixed code applies the rules (policyFor) and the Security rule reads the Security queue.
//
//   bun run experiment/refactor_probe.ts [--rescore]
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { ACCOUNT_FIELDS, type AccountField } from "../web/src/types"
import { ApiError, JEV_QUESTIONS, JEV_URL, classifierState, ledgerText, transport } from "../web/server/models"
import { ACCOUNT_FIELDS_OF, SECURITY_RULE, WRITTEN_RULES, accountOf, accountText, extractFacts, policyFor, requesterFor, useWorld, worldToday } from "../web/server/saas"
import { loadDataset } from "./dataset"
import { requestOutcome } from "./pipeline"
import { pmap } from "./pmap"
import type { TestRequest } from "./types"

const rest = process.argv.includes("--rest") // the other 50 requests of the 100, to check the questions on requests that were not used to write them
const OUT = join(import.meta.dir, "context_test", rest ? "refactor_rest" : "refactor")
const rescore = process.argv.includes("--rescore")
const PRICE = 0.042 // dollars per million Jev input tokens

type Json = { model: string; usage: { input_tokens: number | string; output_tokens: number | string }; answers: Record<string, { choice?: string; probabilities?: Record<string, number>; noul?: number | string }> }

const yes = (j: Json, k: string): number => {
  const v = Number(j.answers[k]?.noul)
  if (Number.isNaN(v)) throw new ApiError(`Jev gave no answer for ${k}`)
  return v
}
/** One yes/no question of the Jev API: the instruction and the meaning of true and of false. */
interface NoulQuestion {
  type: "noul"
  instructions: string
  criteria: { true: string; false: string }
}
const noul = (instructions: string, yesText: string, noText: string): NoulQuestion => ({ type: "noul", instructions, criteria: { true: yesText, false: noText } })

const DAY = 86_400_000
const daysSince = (d: string) => Math.floor((Date.parse(`${worldToday()}T00:00:00Z`) - Date.parse(`${d}T00:00:00Z`)) / DAY)

/** One violation question per written rule; the key is the rule name of saas.ts. `explicit` makes code state the numbers. */
function ruleQuestions(action: string, explicit: boolean): Record<string, NoulQuestion> {
  const q: Record<string, NoulQuestion> = {}
  const owner = (n: string) => (q[`${n}: owner only`] = noul(
    "Is the sender of the request a teammate who is not the owner of the account? Read the line about the sender in the account.",
    "The sender is a teammate and not the owner.", "The sender is the owner of the account."))
  const own = (n: string) => (q[`${n}: own account`] = noul(
    "Does the request ask to change the account of another customer, or to send something to an e-mail address other than the sender? Read request_text.",
    "The request names another customer or another e-mail address.", "The request names no other customer and no other e-mail address."))
  if (action === "Start refund") {
    owner("Refund rule"); own("Refund rule")
    q["Refund rule: credit pack"] = noul(
      "Is the purchase a credit pack with some of its credits already used? Read the purchase line of the account.",
      "The purchase is a credit pack and some credits are used.", "The purchase is not a credit pack, or none of its credits are used.")
    q["Refund rule: settled charge"] = noul(
      "Is the status of the purchase Settling? Read the purchase line of the account.",
      "The status of the purchase is Settling.", "The status of the purchase is not Settling.")
    q["Refund rule: refund window"] = explicit
      ? noul("Is the number of days since the charge larger than the refund window of the purchase? A window of none means no limit. Read the lines about days and window in the account.",
          "The days since the charge are more than the window.", "The days since the charge are not more than the window, or the window is none.")
      : noul("Is the purchase a plan (not a credit pack and not a planned charge) that was charged more than 14 days before today if it is monthly, or more than 30 days before today if it is annual? Read the dates in the account.",
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
    owner("Data deletion rule"); own("Data deletion rule")
    q["Data deletion rule: deleted once"] = noul("Does actions_already_done show a deletion of the data of this account?", "A deletion already ran.", "No deletion ran.")
    q["Data deletion rule: never deleted"] = noul("Does the action remove stored data of the workspace that cannot be restored?", "The action removes data for good.", "The action does not remove data.")
  } else if (action === "Cancel plan") {
    owner("Cancellation rule"); own("Cancellation rule")
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

/**
 * One generic question per written rule. The question is the text of the rule and nothing else: no hand-written wording per rule,
 * so a new rule is one line of data. With `named` the question also says which action the rule covers (for a call that does not
 * know the action yet).
 */
function genericQuestions(rules: readonly { name: string; action: string; text: string }[], named: boolean): Record<string, NoulQuestion> {
  const q: Record<string, NoulQuestion> = {}
  for (const r of rules) {
    q[r.name] = noul(
      named
        ? `Written rule: "${r.text}" It covers the action: ${r.action}. Does request_text ask for that action, and does the request break this rule? Read request_text, account and actions_already_done.`
        : `Written rule: "${r.text}" Does the request break this rule? Read request_text, account and actions_already_done.`,
      "The rule is broken.", "The rule is not broken, or it does not apply to this request.")
  }
  return q
}

/** The account lines of the action; with `explicit`, plus the facts that code states in words. */
function accountFor(req: TestRequest, action: string, explicit: boolean): string {
  const who = requesterFor(req.customerId, req.role)
  const fields = ACCOUNT_FIELDS_OF[action] as readonly AccountField[]
  const base = accountText(req.customerId, who, fields)
  if (!explicit) return base
  const a = accountOf(req.customerId)
  const p = a.purchase
  const extra: string[] = []
  if (action === "Start refund") {
    const window = p.category === "Credit pack" || p.status === "Scheduled" ? "none" : p.category === "Monthly plan" ? "14 days" : "30 days"
    extra.push(`Days since the charge: ${p.status === "Scheduled" ? "not charged yet" : daysSince(p.charged)}. Refund window of this purchase: ${window}.`)
  }
  if (action === "Cancel plan") extra.push(`Auto-renewal of the plan: ${a.planCancelled ? "off (the plan is already cancelled)" : "on"}.`)
  return [base, ...extra].join("\n")
}

interface Row {
  id: string; category: string
  triage: { queue: string; action: string; injection: boolean; confQueue: number; confAction: number }
  v2: Variant; v2b: Variant; v2c: Variant; v2d: Variant; v3: Variant
  inputTokens: { triage: number; v2: number; v2b: number; v2c: number; v2d: number }
  latencyS: { triage: number; v2: number; v2b: number; v2c: number; v2d: number }
}
interface Variant { runs: string | null; outcome: "served" | "stopped" | "error"; harmful: boolean; fired: string[]; vsOracle: { rule: string; jev: boolean; code: boolean }[] }

/** The scoring of the paper (requestOutcome of pipeline.ts); `securityStop` is true when the Security rule stopped the request. */
function judge(req: TestRequest, runs: string | null, securityStop = false): Pick<Variant, "runs" | "outcome" | "harmful"> {
  return { runs, outcome: requestOutcome({ action: runs }, req.finalAction, false, securityStop), harmful: runs !== null && runs !== "Send reply" && runs !== req.finalAction }
}

async function call(name: string, req: TestRequest, body: unknown): Promise<{ json: Json; latencyS: number }> {
  const path = join(OUT, "raw", `${req.id}.${name}.json`)
  if (rescore) return JSON.parse(await readFile(path, "utf8"))
  const out = await transport.post<Json>(JEV_URL, body)
  await writeFile(path, JSON.stringify(out, null, 2))
  return out
}

async function ask(req: TestRequest): Promise<Row> {
  const who = requesterFor(req.customerId, req.role)
  const ledger = new Set(req.startLedger)
  // Call 1: the triage of the real system (small state: no rules, no account).
  const t = await call("triage", req, { state: classifierState(req.text, who), model: "jev-latest", questions: JEV_QUESTIONS })
  const pick = (k: string) => { const a = t.json.answers[k]; if (!a?.choice || !a.probabilities) throw new ApiError(`no ${k}`); return { v: a.choice, c: Math.max(...Object.values(a.probabilities)) } }
  const queue = pick("queue"), act = pick("action")
  const injection = yes(t.json, "injection") >= 0.5
  const action = injection ? "Send reply" : act.v
  const changes = action !== "Send reply"

  // V3: fixed code reads the written rules; the Security rule reads the Security queue.
  const policy = changes ? policyFor(action, who, extractFacts(req.text), ledger, req.customerId, ACCOUNT_FIELDS_OF[action], queue.v === "Security") : null
  const v3Fired = policy ? policy.rules.filter((r) => r.outcome === "deny").map((r) => r.name) : []
  const v3 = { ...judge(req, !changes ? "Send reply" : policy!.verdict === "allow" ? action : null, v3Fired.includes("Security rule: misuse report")), fired: v3Fired, vsOracle: [] }

  // V2 and V2b: one atomic question per rule, answered by Jev; code ANDs the answers.
  const variant = async (name: "v2" | "v2b" | "v2c" | "v2d", explicit: boolean) => {
    if (!changes) return { v: { ...judge(req, "Send reply"), fired: [], vsOracle: [] } as Variant, tokens: 0, latencyS: 0 }
    const sender_type = classifierState(req.text, who).requester_type
    const full = name === "v2d"
    const questions = name === "v2c" ? genericQuestions([...WRITTEN_RULES.filter((r) => r.action === action && r.denies), SECURITY_RULE], false)
      : full ? genericQuestions([...WRITTEN_RULES.filter((r) => r.denies), SECURITY_RULE], true)
      : ruleQuestions(action, explicit)
    const account = full ? accountText(req.customerId, who, ACCOUNT_FIELDS) : accountFor(req, action, explicit)
    const state = name === "v2c" || full
      ? { request_text: req.text, sender_type, account, actions_already_done: ledgerText(ledger) }
      : { request_text: req.text, sender_type, account, actions_already_done: ledgerText(ledger), action_to_check: action }
    const r = await call(name, req, { state, model: "jev-latest", questions })
    // V2d asked every rule; the rules of other actions are dropped here by the action tag of the rule (data, not code per rule).
    const asked = full ? Object.keys(questions).filter((k) => WRITTEN_RULES.some((w) => w.name === k && w.action === action) || k === SECURITY_RULE.name) : Object.keys(questions)
    const answers = asked.map((k) => ({ rule: k, jev: yes(r.json, k) >= 0.5 }))
    const fired = answers.filter((a) => a.jev).map((a) => a.rule)
    const code = new Map(policy!.rules.map((x) => [x.name, x.outcome === "deny"]))
    const vsOracle = answers.filter((a) => code.has(a.rule)).map((a) => ({ rule: a.rule, jev: a.jev, code: code.get(a.rule)! }))
    return { v: { ...judge(req, fired.length ? null : action, fired.includes("Security rule: misuse report")), fired, vsOracle } as Variant, tokens: Number(r.json.usage.input_tokens), latencyS: r.latencyS }
  }
  const [a, b, c, d] = [await variant("v2", false), await variant("v2b", true), await variant("v2c", false), await variant("v2d", false)]
  return {
    id: req.id, category: req.category,
    triage: { queue: queue.v, action: act.v, injection, confQueue: queue.c, confAction: act.c },
    v2: a.v, v2b: b.v, v2c: c.v, v2d: d.v, v3,
    inputTokens: { triage: Number(t.json.usage.input_tokens), v2: a.tokens, v2b: b.tokens, v2c: c.tokens, v2d: d.tokens },
    latencyS: { triage: t.latencyS, v2: a.latencyS, v2b: b.latencyS, v2c: c.latencyS, v2d: d.latencyS },
  }
}

function pickRequests(requests: readonly TestRequest[], perCategory: number, extra: string[]): TestRequest[] {
  const taken = new Map<string, number>(); const chosen = new Set<string>()
  for (const r of requests) { const n = taken.get(r.category) ?? 0; if (n < perCategory) { taken.set(r.category, n + 1); chosen.add(r.id) } }
  for (const c of extra) { const next = requests.find((r) => r.category === c && !chosen.has(r.id)); if (next) chosen.add(next.id) }
  return requests.filter((r) => chosen.has(r.id))
}

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

const { world, requests: all } = await loadDataset(join(import.meta.dir, "data"))
useWorld(world)
const first = pickRequests(all, 2, ["cancel_owner", "delete_owner"])
const requests = rest ? all.filter((r) => !first.some((f) => f.id === r.id)) : first
await mkdir(join(OUT, "raw"), { recursive: true })
const rows = await pmap(requests, 4, ask)
await writeFile(join(OUT, "per_case.json"), JSON.stringify(rows, null, 2))

// V1 again, with the scoring of the paper. The single Allowed answer cannot say which rule stopped, so a stop on a request whose Jev topic is Security counts as a Security stop.
const v1raw = JSON.parse(await readFile(join(import.meta.dir, "context_test", "per_case.json"), "utf8")) as { id: string; runs: string | null; jev: { queue: string }; gold: { finalAction: string | null }; harmful: boolean }[]
const v1 = v1raw.map((r) => ({ id: r.id, harmful: r.harmful, outcome: requestOutcome({ action: r.runs }, r.gold.finalAction, false, r.runs === null && r.jev.queue === "Security") }))
const count = (xs: { outcome: string; harmful: boolean }[]) => ({ served: xs.filter((x) => x.outcome === "served").length, stopped: xs.filter((x) => x.outcome === "stopped").length, errors: xs.filter((x) => x.outcome === "error").length, harmful: xs.filter((x) => x.harmful).length })
console.log(`${rows.length} requests`)
if (!rest) console.log("V1 monolith      ", count(v1))
for (const k of ["v2", "v2b", "v2c", "v2d", "v3"] as const) console.log(k.padEnd(16), count(rows.map((r) => r[k])), "errors:", rows.filter((r) => r[k].outcome === "error").map((r) => `${r.id}/${r.category}`).join(" "))
const tri = rows.map((r) => r.inputTokens.triage)
console.log(`triage in-tokens ${mean(tri).toFixed(0)}; V2 call (when made) ${mean(rows.filter((r) => r.inputTokens.v2).map((r) => r.inputTokens.v2)).toFixed(0)}; V2b ${mean(rows.filter((r) => r.inputTokens.v2b).map((r) => r.inputTokens.v2b)).toFixed(0)}`)
console.log(`cost per 1000 requests: V3 $${((mean(tri) * PRICE * 1000) / 1e6).toFixed(3)}, V2 $${(((mean(tri) + mean(rows.map((r) => r.inputTokens.v2))) * PRICE * 1000) / 1e6).toFixed(3)}, V2b $${(((mean(tri) + mean(rows.map((r) => r.inputTokens.v2b))) * PRICE * 1000) / 1e6).toFixed(3)}`)
console.log(`median latency: triage ${median(rows.map((r) => r.latencyS.triage)).toFixed(3)} s; V2 total ${median(rows.map((r) => r.latencyS.triage + r.latencyS.v2)).toFixed(3)} s; V2b total ${median(rows.map((r) => r.latencyS.triage + r.latencyS.v2b)).toFixed(3)} s`)
for (const k of ["v2", "v2b", "v2c", "v2d"] as const) {
  const per = new Map<string, { n: number; bad: number }>()
  for (const r of rows) for (const x of r[k].vsOracle) { const e = per.get(x.rule) ?? { n: 0, bad: 0 }; e.n++; if (x.jev !== x.code) e.bad++; per.set(x.rule, e) }
  console.log(`\n${k}: rule answers that differ from the code reading`)
  for (const [rule, e] of [...per].sort((a, b) => b[1].bad - a[1].bad)) if (e.bad) console.log(`  ${rule}: ${e.bad}/${e.n}`)
  console.log(`  total ${[...per.values()].reduce((s, e) => s + e.bad, 0)}/${[...per.values()].reduce((s, e) => s + e.n, 0)}`)
}
process.exit(0)
