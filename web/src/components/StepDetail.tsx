import { Check, LoaderCircle, TriangleAlert, X } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NO_LIMIT, POPUP_DELAY_MS, type Ctx, type NodeId, type Phase } from "@/machine"
import type { Next, Policy, PolicyRule, TriageRule } from "@/types"

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
function Callout({ title, children, tone = "default" }: { title: string; children?: ReactNode; tone?: "default" | "destructive" | "staff" }) {
  const toneClass =
    tone === "destructive"
      ? "bg-destructive/15 text-destructive"
      : tone === "staff"
        ? "bg-staff text-ink"
        : "bg-pane text-ink"
  return (
    <div className={cn("rounded-lg p-3 text-sm", toneClass)}>
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
  review: { text: "Needs staff", icon: <TriangleAlert className="size-4" />, color: "text-staff-strong" },
}

/** The groups of the written rules, in the order that the server lists them. */
const CHECK: Record<PolicyRule["check"], string> = { 1: "Allowed", 2: "Not done before", 3: "Needs staff" }

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
  { rule: "critical", text: "Priority is Critical → Queued" },
  { rule: "injection", text: "Injection flag is on → Gather info. The orders in the text are ignored, and the action is Send reply" },
  { rule: "unsure", text: "The chance of the queue, the action, or the risk flag is below the floor → Clarify. After the last round → Queued" },
  { rule: "needs-staff", text: "Action is Needs staff → Queued" },
  { rule: "risk", text: "Risk flag is on and no written rule covers the action → Queued" },
  { rule: "answer", text: "Action is Send reply → Gather info" },
  { rule: "act", text: "Action is Start refund or Delete data → Gather info" },
]

const NEXT_NAME: Record<Next, string> = { gather: "Gather info", queued: "Queued", clarify: "Clarify" }

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Why support staff must read the request. */
function whyQueued(ctx: Ctx): string {
  switch (ctx.queued?.reason) {
    case "customer": return `The customer said ${NO_LIMIT} times that the issue is not solved.`
    case "rules": return ctx.rules?.staffWhy ?? "A written rule asks for support staff."
    default: return `${sentence(ctx.triage?.reason ?? "")}.`
  }
}

const CLOSED: Record<NonNullable<Ctx["closedBy"]>, string> = {
  popup: "The customer said in the popup that the issue is solved.",
  silence: "The customer was silent for T.",
  "no staff": "No staff joined within T. The answer goes by e-mail.",
}

const CANNED_REPLY = "Hello, this is FrameForge support staff. I checked your account and your request is done. Tell me if you need more help."

/** The text box of support staff. It mounts only while the flow waits for the reply, so each visit starts with the canned reply. */
function StaffReply({ onReply }: { onReply: (text: string) => void }) {
  const [text, setText] = useState(CANNED_REPLY)
  return (
    <div className="space-y-2">
      <Label>Reply to the customer</Label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-input bg-pane px-2.5 py-2 text-sm outline-none focus-visible:border-primary"
      />
      <Button className="bg-staff text-ink hover:bg-staff-strong hover:text-white" disabled={!text.trim()} onClick={() => onReply(text.trim())}>
        Staff replies
      </Button>
    </div>
  )
}

function Ticket({ ctx }: { ctx: Ctx }) {
  if (!ctx.queued) return null
  return (
    <>
      <Row k="Ticket">{ctx.requestId} (one chat is one ticket)</Row>
      <Row k="Why">{whyQueued(ctx)}</Row>
      <Label>Summary for support staff (written by the LLM)</Label>
      <Quote>{ctx.queued.summary}</Quote>
      <Note>{ctx.queued.latencyS.toFixed(1)} s</Note>
    </>
  )
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
  clarify: {
    title: "Clarify",
    why: "Jev is not sure. The LLM asks the customer for more detail. The reply joins the same request, and Jev classifies the whole chat again. After the last round, an unsure request goes to Queued.",
  },
  gather: { title: "Gather info", why: "The system reads the account, the purchase, and the help articles that match the text. It also looks for another e-mail address in the text." },
  rules: {
    title: "Rules check",
    why: "Fixed code checks the written rules for the action on the facts of this request. Allowed: Do action. Denied: Final message, and nothing runs. Needs staff: Queued.",
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
  queued: {
    title: "Queued",
    why: "The bot tells the customer that support staff will reply and that the chat is locked. This text is fixed. The LLM writes a summary for support staff. The chat stays locked until staff joins.",
  },
  staff: { title: "Support staff", why: "Support staff read the ticket and the summary, and reply in the chat. Then the chat opens again." },
  resolved: { title: "Resolved", why: "The chat is closed. The customer needs a new chat to continue." },
}

/** The states where the flow waits for the customer or support staff, or has ended. A middle state that did not run was skipped. */
const STOPS: Partial<Record<NodeId, true>> = { chat: true, queued: true, staff: true, resolved: true }

interface Props {
  node: NodeId
  /** The state that the flow is in now, or null before the first message. */
  current: NodeId | null
  phase: Phase | null
  ctx: Ctx
  onStaffReply: (text: string) => void
}

export function StepDetail({ node, current, phase, ctx, onStaffReply }: Props) {
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
            {ctx.round > 0 && <Row k="Clarify rounds so far">{ctx.round}</Row>}
          </>
        )
      break
    case "triage":
      if (ctx.classifier && f && ctx.triage) {
        const t = ctx.triage
        content = (
          <>
            <Label>Jev gives five answers</Label>
            <Row k="Queue">{f.queue.value}<Chance value={f.queue.confidence} /></Row>
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
            <Callout title={`Next: ${NEXT_NAME[t.next]}`}>
              {sentence(t.reason)}.
            </Callout>
            <Row k="Action after Triage">{t.action}</Row>
            <Row k="Queue">{t.queue}</Row>
          </>
        )
      }
      break
    case "clarify":
      if (ctx.clarify)
        content = (
          <>
            <Label>Question of the LLM</Label>
            <Quote>{ctx.clarify.question}</Quote>
            <Row k="Round">{ctx.clarify.round} of {ctx.clarify.rounds}</Row>
            <Note>{ctx.clarify.latencyS.toFixed(1)} s</Note>
            {status === "done" && (
              <Callout title="The flow waits for the customer">
                Reply in the chat: the reply joins the same request, and Jev classifies again. Or press "Customer silent for T": the chat closes.
              </Callout>
            )}
          </>
        )
      break
    case "gather":
      if (ctx.gather) {
        const { account: a, facts, articles } = ctx.gather
        content = (
          <>
            <Label>Account</Label>
            <Row k="Owner">{a.customer.name} ({a.customer.email})</Row>
            <Row k="Plan">{a.plan}</Row>
            <Row k="Credits left">{a.creditsLeft.toLocaleString("en-US")}</Row>
            <Row k="Next renewal">{a.renews}</Row>
            <Row k="Refunds in 90 days">{a.refundsLast90Days}</Row>
            <Label>Purchase</Label>
            <Row k="Item">{a.purchase.id}: {a.purchase.item} ({a.purchase.category})</Row>
            <Row k="Amount">${a.purchase.amount} · {a.purchase.status}</Row>
            <Row k={a.purchase.status === "Scheduled" ? "Planned" : "Charged"}>{a.purchase.charged}</Row>
            <Row k="Usage">{a.purchase.usage}</Row>
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
        const next = { act: "Do action", final: "Final message (nothing runs)", queued: "Queued" }[ctx.rules.next]
        content = (
          <>
            <Label>Written rules for "{ctx.rules.policy.action}"</Label>
            <PolicyTable policy={ctx.rules.policy} />
            <Callout
              title={{ allow: "The rules allow it", deny: "A rule forbids it", review: "A rule asks for support staff" }[ctx.rules.policy.verdict]}
              tone={ctx.rules.policy.verdict === "deny" ? "destructive" : ctx.rules.policy.verdict === "review" ? "staff" : "default"}
            >
              Next: {next}.{ctx.rules.staffWhy && ` ${ctx.rules.staffWhy}`}
            </Callout>
          </>
        )
      }
      break
    case "act":
      if (ctx.executed)
        content = ctx.executed.blocked ? (
          <Callout title="Nothing was done" tone="destructive">
            {ctx.executed.blocked.join(" ")}
          </Callout>
        ) : (
          <>
            <Row k="Action">{ctx.executed.action}</Row>
            <Row k="Queue">{ctx.executed.queue}</Row>
            <Row k="Target">{ctx.executed.target ?? "none"}</Row>
            {ctx.executed.details.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm">{ctx.executed.details.map((d, i) => <li key={i}>{d}</li>)}</ul>
            )}
          </>
        )
      break
    case "final":
      if (ctx.final)
        content = (
          <>
            <Quote>{ctx.final.text}</Quote>
            <Note>
              {ctx.final.kind === "answer" ? "An answer from the help articles and the account" : "Written by the LLM from the result of Do action, or from the reason why nothing ran"} · {ctx.final.latencyS.toFixed(1)} s
            </Note>
            {ctx.final.kind === "answer" && (
              <>
                <Label>Help articles given to the LLM</Label>
                <p className="text-sm">{ctx.final.sources.length ? ctx.final.sources.join(", ") : "none matched; the LLM had only the account"}</p>
              </>
            )}
            {ctx.rules?.next === "final" && (
              <Callout title="Rules check denied the action, so nothing ran" tone="destructive">
                {ctx.rules.policy.rules.filter((r) => r.outcome === "deny").map((r) => r.detail).join(" ")}
              </Callout>
            )}
          </>
        )
      break
    case "chat":
      content = (
        <>
          <Row k="Popup">{status === "asking" ? "on screen: did this solve your issue?" : `comes after ${POPUP_DELAY_MS / 1000} s`}</Row>
          <Row k='Answers "no"'>{ctx.noCount} of {NO_LIMIT}</Row>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Yes: the chat closes (Resolved).</li>
            <li>No: the chat stays open. After {NO_LIMIT} times the request goes to Queued.</li>
            <li>The customer writes again: a new request in the same chat (New).</li>
            <li>The customer is silent for T: the chat closes (Resolved).</li>
          </ul>
        </>
      )
      break
    case "queued":
      if (ctx.queued)
        content = (
          <>
            {status === "done" && (
              <Callout title="The chat is locked" tone="staff">
                Press "Staff takes it" to let support staff join. Press "No staff after T" to close the chat.
              </Callout>
            )}
            <Ticket ctx={ctx} />
            <Label>Message to the customer (fixed text)</Label>
            <Quote>{ctx.queued.message}</Quote>
          </>
        )
      break
    case "staff":
      content = (
        <>
          {node === current && <StaffReply onReply={onStaffReply} />}
          {ctx.staffReply !== null && (
            <>
              <Label>Reply of support staff</Label>
              <Quote>{ctx.staffReply}</Quote>
            </>
          )}
          <Ticket ctx={ctx} />
        </>
      )
      break
    case "resolved":
      content = ctx.closedBy && <Note>{CLOSED[ctx.closedBy]}</Note>
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
