import { ArrowRight, Play, RotateCcw } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { SCENARIOS } from "@/samples"
import type { Account } from "@/types"

/** The events that the presenter sends. Popup Yes and No are in the chat, and the reply of support staff is in the detail of Support staff. */
export type PresenterEvent = "NEXT" | "RUN_ALL" | "SILENT" | "TAKE" | "NO_STAFF" | "RESET"

interface Props {
  index: number
  onIndex: (index: number) => void
  /** The scenario can change only before the first message. */
  canPick: boolean
  /** The demo customer of the scenario. Undefined when the server does not answer. */
  account: Account | undefined
  can: (event: PresenterEvent) => boolean
  onEvent: (event: PresenterEvent) => void
}

/** The buttons that play support staff are orange, like the support staff blocks of the diagram. */
const STAFF_BUTTON = "bg-staff text-ink hover:bg-staff-strong hover:text-white"

/** The one compact bar of presenter controls. It sits under the chat header, so the chat keeps the screen. */
export function Presenter({ index, onIndex, canPick, account, can, onEvent }: Props) {
  const scenario = SCENARIOS[index]
  const button = (event: PresenterEvent, label: ReactNode, className?: string, variant: "default" | "secondary" = "secondary") => (
    <Button variant={variant} className={className} onClick={() => onEvent(event)} disabled={!can(event)}>{label}</Button>
  )
  const p = account?.purchase
  const facts = account && p
    ? `${account.customer.name} · ${account.plan} plan · ${account.creditsLeft.toLocaleString("en-US")} credits left · renews ${account.renews} · purchase ${p.id}: ${p.item}, $${p.amount}, ${p.status}`
    : ""
  const senderLine = account
    ? `Sends as ${scenario.role === "owner" ? account.customer.name : account.teammate.name} (${scenario.role})`
    : ""

  return (
    <div className="shrink-0 space-y-1.5 bg-system px-3 py-2">
      <div className="flex items-center gap-1.5">
        <select
          aria-label="Scenario"
          className="h-8 min-w-0 flex-1 rounded-md bg-pane px-2 text-sm text-ink disabled:opacity-50"
          value={index}
          disabled={!canPick}
          onChange={(e) => onIndex(Number(e.target.value))}
        >
          {[...new Set(SCENARIOS.map((s) => s.group))].map((group) => (
            <optgroup key={group} label={group}>
              {SCENARIOS.map((s, i) => (s.group === group ? <option key={s.label} value={i}>{s.label}</option> : null))}
            </optgroup>
          ))}
        </select>
        {button("NEXT", <>Next step <ArrowRight /></>, undefined, "default")}
        {button("RUN_ALL", <><Play /> Run all</>)}
        {button("RESET", <><RotateCcw /> Reset</>)}
      </div>
      <div className="flex items-center gap-1.5">
        {button("SILENT", "Customer silent for T")}
        {button("TAKE", "Staff takes it", STAFF_BUTTON)}
        {button("NO_STAFF", "No staff after T", STAFF_BUTTON)}
      </div>
      {account ? (
        <>
          <p className="truncate text-xs text-ink-soft" title={`${scenario.note} ${senderLine}`}>{scenario.note} · {senderLine}</p>
          <p className="truncate text-xs text-ink-soft" title={facts}>{facts}</p>
        </>
      ) : (
        <p className="text-xs text-destructive">The support server does not answer.</p>
      )}
    </div>
  )
}
