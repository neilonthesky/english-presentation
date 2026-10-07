import { Check, LoaderCircle, X } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { NO_LIMIT, POPUP_DELAY_MS, type Ctx, type NodeId, type Phase } from "@/machine"
import type { AccountField, Policy, PolicyRule, TriageRule } from "@/types"

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <p className="pt-2 text-xs font-medium uppercase text-muted-foreground">{children}</p>
}

function Quote({ children }: { children: ReactNode }) {
  return <blockquote className="whitespace-pre-wrap rounded-lg bg-pane p-3 text-sm">{children}</blockquote>
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>
}
function Callout({ title, children, tone = "default" }: { title: string; children?: ReactNode; tone?: "default" | "destructive" }) {
  return (
    <div className={cn("rounded-lg p-3 text-sm", tone === "destructive" ? "bg-destructive/15 text-destructive" : "bg-pane text-ink")}>
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-1 text-xs leading-relaxed opacity-90">{children}</p>}
    </div>
  )
}

/** The chance that Jev gives to one answer. */
function Chance({ value }: { value: number }) {
  return (
    <span className="ml-2 inline-flex items-center gap-1.5 align-middle text-xs font-normal text-muted-foreground">
      <span className="inline-block h-1.5 w-12 overflow-hidden rounded bg-system">
        <span className="block h-full bg-model-strong" style={{ width: `${value * 100}%` }} />
      </span>
      {value.toFixed(2)}
    </span>
  )
}

const OUTCOME: Record<PolicyRule["outcome"], { text: string; icon: ReactNode; color: string }> = {
  pass: { text: "Pass", icon: <Check className="size-4" />, color: "text-rules-strong" },
  deny: { text: "Deny", icon: <X className="size-4" />, color: "text-destructive" },
}

/** The groups of the written rules, in the order that the server lists them. */
const CHECK: Record<PolicyRule["check"], string> = { 1: "Allowed", 2: "Not done before", 3: "Limits" }

/** The written rules for the action, with the outcome of each rule on the data of this request. */
function PolicyTable({ policy }: { policy: Policy }) {
  if (policy.rules.length === 0)
    return <Note>"{policy.action}" changes no money or data, so no written rule applies.</Note>
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase text-muted-foreground">
        <tr>
          <th className="pb-1 pr-3 font-medium">Check</th>
          <th className="pb-1 pr-3 font-medium">Rule</th>
          <th className="pb-1 pr-3 font-medium">Result</th>
          <th className="pb-1 font-medium">On this request</th>
        </tr>
      </thead>
      <tbody>
        {policy.rules.map((r, i) => {
          const first = i === 0 || policy.rules[i - 1].check !== r.check
          return (
            <tr key={i} className={cn("align-top", first && "border-t")}>
              <td className="whitespace-nowrap py-1.5 pr-3 text-xs font-medium uppercase text-muted-foreground">{first && CHECK[r.check]}</td>
              <td className="py-1.5 pr-3">
                {r.text}
                <span className="block text-xs text-muted-foreground">{r.source}</span>
              </td>
              <td className={cn("whitespace-nowrap py-1.5 pr-3 font-medium", OUTCOME[r.outcome].color)}>
                <span className="inline-flex items-center gap-1">{OUTCOME[r.outcome].icon}{OUTCOME[r.outcome].text}</span>
              </td>
              <td className="py-1.5 text-muted-foreground">{r.detail}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const TRIAGE_RULES: { rule: TriageRule; text: string }[] = [
  { rule: "injection", text: "Injection flag is on → Gather info. The orders in the text are ignored, and the action is Send reply" },
  { rule: "answer", text: "Action is Send reply → Gather info" },
  { rule: "act", text: "Action is Start refund, Delete data, Cancel plan, or Reset password → Gather info" },
]

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const CLOSED: Record<NonNullable<Ctx["closedBy"]>, string> = {
  popup: "The customer said in the popup that the issue is solved.",
  silence: "The customer was silent for T.",
  unresolved: `The customer said ${NO_LIMIT} times that the issue is not solved.`,
}

function Panel({ title, why, children }: { title: string; why: string; children?: ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <p className="text-sm text-muted-foreground">{why}</p>
      </div>
      {children}
    </div>
  )
}

const INFO: Record<NodeId, { title: string; why: string }> = {
  new: { title: "New", why: "The system saves the message with an ID and the time. No model has read it yet." },
  triage: {
    title: "Triage",
    why: "Jev, a small model, reads the whole chat of the customer and gives five answers, each with a chance. Then fixed rules choose the next state. The first rule that matches wins.",
  },
  gather: { title: "Gather info", why: "The system reads only the account fields that the action of Triage needs, and the help articles that match the text. It also looks for another e-mail address in the text." },
  rules: {
    title: "Rules check",
    why: "Fixed code checks the written rules for the action on the facts of this request. Allowed: Do action. Denied: Final message, and nothing runs.",
  },
  act: { title: "Do action", why: "Fixed code does the action, but only after Rules check allowed it. Send reply changes nothing." },
  final: {
    title: "Final message",
    why: "The LLM writes what the customer reads. For a question it answers from the help articles and the account. Otherwise it tells the result of Do action, or why nothing ran.",
  },
  chat: {
    title: "Chat open",
    why: "The customer reads the message. After a short time a popup asks if the issue is solved. The customer can also write again, or be silent.",
  },
  resolved: { title: "Resolved", why: "The chat is closed. The customer needs a new chat to continue." },
}

/** The states where the flow waits for the customer, or has ended. A middle state that did not run was skipped. */
const STOPS: Partial<Record<NodeId, true>> = { chat: true, resolved: true }

interface Props {
  node: NodeId
  /** The state that the flow is in now, or null before the first message. */
  current: NodeId | null
  phase: Phase | null
  ctx: Ctx
}

export function StepDetail({ node, current, phase, ctx }: Props) {
  const info = INFO[node]
  const status = node === current ? phase : null
  const f = ctx.classifier?.fields

  let content: ReactNode = null
  switch (node) {
    case "new":
      if (ctx.request)
        content = (
          <>
            <Quote>{ctx.request.text}</Quote>
            <Row k="Sender">{ctx.request.requester.name} ({ctx.request.requester.role})</Row>
            <Row k="Channel">{ctx.request.channel}</Row>
            <Row k="Request ID">{ctx.requestId}</Row>
            <Row k="Received (UTC)">{ctx.request.receivedUtc.slice(0, 19).replace("T", " ")}</Row>
          </>
        )
      break
    case "triage":
      if (ctx.classifier && f && ctx.triage) {
        const t = ctx.triage
        content = (
          <>
            <Label>Jev gives five answers</Label>
            <Row k="Topic">{f.queue.value}<Chance value={f.queue.confidence} /></Row>
            <Row k="Action">{f.action.value}<Chance value={f.action.confidence} /></Row>
            <Row k="Priority">{f.priority.value}<Chance value={f.priority.confidence} /></Row>
            <Row k="Risk flag">{f.risk.value ? "on" : "off"}<Chance value={f.risk.confidence} /></Row>
            <Row k="Injection flag">{f.injection.value ? "on" : "off"}<Chance value={f.injection.confidence} /></Row>
            <Note>{ctx.classifier.model} · {ctx.classifier.latencyS.toFixed(2)} s · {ctx.classifier.inputTokens}+{ctx.classifier.outputTokens} tokens</Note>
            <Label>Triage rules: the first match wins</Label>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {TRIAGE_RULES.map((r) => (
                <li key={r.rule} className={t.rule === r.rule ? "font-semibold text-ink" : "text-muted-foreground"}>{r.text}</li>
              ))}
            </ol>
            <Callout title="Next: Gather info">{sentence(t.reason)}.</Callout>
            <Row k="Action after Triage">{t.action}</Row>
            <Row k="Topic">{t.queue}</Row>
          </>
        )
      }
      break
    case "gather":
      if (ctx.gather) {
        const { fields, account: a, facts, articles } = ctx.gather
        const read = (field: AccountField) => fields.includes(field)
        content = (
          <>
            <Label>Account fields read for "{ctx.triage?.action}"</Label>
            <p className="text-sm">{fields.length ? fields.join(", ") : "none"}</p>
            {(read("owner") || read("plan") || read("refunds")) && <Label>Account</Label>}
            {read("owner") && <Row k="Owner">{a.customer.name} ({a.customer.email})</Row>}
            {read("plan") && (
              <>
                <Row k="Plan">{a.plan}</Row>
                <Row k="Credits left">{a.creditsLeft.toLocaleString("en-US")}</Row>
                <Row k="Next renewal">{a.renews}</Row>
              </>
            )}
            {read("refunds") && <Row k="Refunds in 90 days">{a.refundsLast90Days}</Row>}
            {read("purchase") && (
              <>
                <Label>Purchase</Label>
                <Row k="Item">{a.purchase.id}: {a.purchase.item} ({a.purchase.category})</Row>
                <Row k="Amount">${a.purchase.amount} · {a.purchase.status}</Row>
                <Row k={a.purchase.status === "Scheduled" ? "Planned" : "Charged"}>{a.purchase.charged}</Row>
                <Row k="Usage">{a.purchase.usage}</Row>
              </>
            )}
            <Label>Found in the text</Label>
            <Row k="Other e-mail">{facts.otherEmail ?? "none"}</Row>
            <Label>Help articles that match</Label>
            <p className="text-sm">{articles.length ? articles.join(", ") : "none"}</p>
          </>
        )
      }
      break
    case "rules":
      if (ctx.rules) {
        const next = { act: "Do action", final: "Final message (nothing runs)" }[ctx.rules.next]
        content = (
          <>
            <Label>Written rules for "{ctx.rules.policy.action}"</Label>
            <PolicyTable policy={ctx.rules.policy} />
            <Callout
              title={{ allow: "The rules allow it", deny: "A rule forbids it" }[ctx.rules.policy.verdict]}
              tone={ctx.rules.policy.verdict === "allow" ? "default" : "destructive"}
            >
              Next: {next}.
            </Callout>
          </>
        )
      }
      break
    case "act":
      if (ctx.executed)
        content = (
          <>
            <Row k="Action">{ctx.executed.action}</Row>
            <Row k="Topic">{ctx.executed.queue}</Row>
            <Row k="Target">{ctx.executed.target ?? "none"}</Row>
            {ctx.executed.details.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm">{ctx.executed.details.map((d, i) => <li key={i}>{d}</li>)}</ul>
            )}
          </>
        )
      break
    case "final":
      if (ctx.final) {
        const blocked = ctx.final.blocked
        content = (
          <>
            <Quote>{ctx.final.text}</Quote>
            <Note>
              {ctx.final.kind === "answer" ? "An answer from the help articles and the account" : blocked ? "Written by the LLM from the reason why nothing ran" : "Written by the LLM from the result of Do action"} · {ctx.final.latencyS.toFixed(1)} s
            </Note>
            {ctx.final.kind === "answer" && (
              <>
                <Label>Help articles given to the LLM</Label>
                <p className="text-sm">{ctx.final.sources.length ? ctx.final.sources.join(", ") : "none matched; the LLM had only the account"}</p>
              </>
            )}
            {blocked && <Callout title="A written rule forbids the action, so nothing ran" tone="destructive">{blocked.join(" ")}</Callout>}
          </>
        )
      }
      break
    case "chat":
      content = (
        <>
          <Row k="Popup">{status === "asking" ? "on screen: did this solve your issue?" : `comes after ${POPUP_DELAY_MS / 1000} s`}</Row>
          <Row k='Answers "no"'>{ctx.noCount} of {NO_LIMIT}</Row>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Yes: the chat closes (Resolved).</li>
            <li>No: the popup comes again. After {NO_LIMIT} times the chat closes (Resolved).</li>
            <li>The customer writes again: a new request in the same chat (New).</li>
            <li>The customer is silent for T: the chat closes (Resolved).</li>
          </ul>
        </>
      )
      break
    case "resolved":
      content = ctx.closedBy && <Note>{CLOSED[ctx.closedBy]} The customer needs a new chat to continue.</Note>
      break
  }

  const reached = ctx.visited.includes(node)
  const pending = (text: string) => <p className="text-sm text-muted-foreground">{text}</p>
  return (
    <Panel title={info.title} why={info.why}>
      {status === "failed" && (
        <Callout title="This state failed. Press Next step to try again." tone="destructive">
          {ctx.error}
        </Callout>
      )}
      {status === "running" ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Working…</p>
      ) : !reached ? (
        pending(current !== null && STOPS[current] ? "The flow did not go through this state for this request." : "This state has not run yet.")
      ) : (
        content ?? pending("This state has not run yet.")
      )}
    </Panel>
  )
}
