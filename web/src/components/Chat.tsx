import { Clapperboard, Lock, Send } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Message } from "@/machine"
import type { Scenario } from "@/types"

/** What the customer can write now: the first message, the reply to a Clarify question, a new message in an open chat, or nothing. */
export type ChatMode = "start" | "reply" | "again" | "locked"
/** Why the customer cannot write: Queued waits for support staff, Support staff is writing a reply, or Resolved closed the chat. */
export type LockReason = "queued" | "staff" | "closed"

interface Props {
  messages: Message[]
  mode: ChatMode
  lock: LockReason | null
  /** The popup "Did this solve your issue?" is on screen. */
  popup: boolean
  scenario: Scenario
  /** The name of the customer who writes. */
  sender: string
  /** The one compact bar of presenter controls, under the chat header. */
  controls: ReactNode
  onSend: (text: string) => void
  onYes: () => void
  onNo: () => void
}

const BUBBLE = {
  customer: "bg-primary text-primary-foreground",
  bot: "bg-model text-ink",
  staff: "bg-staff text-ink",
} as const

const LOCK_TEXT: Record<LockReason, string> = {
  queued: "The chat is locked until support staff joins.",
  staff: "Support staff joined. Waiting for the reply.",
  closed: "This chat is closed. Press Reset to start a new chat.",
}

/** The text box of the customer. The parent gives it a new key whenever its start text changes, so it starts again from `initial`. */
function Composer({ initial, placeholder, disabled, onSend }: { initial: string; placeholder: string; disabled: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState(initial)
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!disabled && text.trim()) onSend(text.trim())
      }}
    >
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} disabled={disabled} />
      <Button type="submit" size="icon" disabled={disabled || !text.trim()} aria-label="Send"><Send /></Button>
    </form>
  )
}

export function Chat({ messages, mode, lock, popup, scenario, sender, controls, onSend, onYes, onNo }: Props) {
  const who = { customer: sender, bot: "FrameForge bot", staff: "Support staff" } as const
  const box: Record<ChatMode, { initial: string; placeholder: string }> = {
    start: { initial: scenario.text, placeholder: "Write to FrameForge support" },
    reply: { initial: scenario.reply ?? "", placeholder: "Reply to the question" },
    again: { initial: "", placeholder: "Write a new message" },
    locked: { initial: "", placeholder: "You cannot write now" },
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-card">
      <header className="flex items-center gap-3 bg-primary px-4 py-2.5 text-primary-foreground">
        <span className="grid size-9 place-items-center rounded-xl bg-primary-foreground text-primary"><Clapperboard className="size-5" /></span>
        <div>
          <h1 className="text-lg font-bold leading-tight">FrameForge Support</h1>
          <p className="text-xs">AI video generation</p>
        </div>
      </header>

      {controls}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-base text-muted-foreground">Pick a scenario, then send the message. You can edit the text first.</p>}
        {messages.map((m, i) =>
          m.from === "note" ? (
            <p key={i} className="text-center text-sm text-muted-foreground">{m.text}</p>
          ) : (
            <div key={i} className={cn("flex max-w-[85%] flex-col gap-0.5", m.from === "customer" && "ml-auto items-end")}>
              <span className="text-xs text-muted-foreground">{who[m.from]}</span>
              <div className={cn("rounded-2xl px-3.5 py-2 text-base leading-snug", BUBBLE[m.from])}>{m.text}</div>
            </div>
          ),
        )}
        {popup && (
          <div role="dialog" aria-label="Did this solve your issue?" className="space-y-2 rounded-2xl bg-system px-3 py-2.5 text-base text-ink">
            <p className="font-medium">Did this solve your issue?</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={onYes}>Yes</Button>
              <Button size="sm" variant="secondary" onClick={onNo}>No</Button>
            </div>
          </div>
        )}
        <div ref={(el) => el?.scrollIntoView({ block: "end" })} />
      </div>

      <div className="space-y-2 bg-system p-3">
        {lock && (
          <p className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-base text-ink", lock === "closed" ? "bg-resolved" : "bg-staff")}>
            {lock !== "closed" && <Lock className="size-4 shrink-0" />}
            {LOCK_TEXT[lock]}
          </p>
        )}
        <Composer
          key={`${mode}-${scenario.label}`}
          initial={box[mode].initial}
          placeholder={box[mode].placeholder}
          disabled={mode === "locked"}
          onSend={onSend}
        />
      </div>
    </div>
  )
}
