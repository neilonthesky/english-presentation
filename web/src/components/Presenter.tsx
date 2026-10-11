import { ArrowRight, Play, RotateCcw } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { PresetPalette, type PaletteData } from "@/components/PresetPalette"
import type { Account, Preset, Scenario } from "@/types"

/** The events that the presenter sends. Popup Yes and No are in the chat. */
export type PresenterEvent = "NEXT" | "RUN_ALL" | "SILENT" | "RESET"

interface Props {
  /** The hand-written scenarios, then the presets of the palette. The drop-down lists the hand-written ones and the chosen preset. */
  scenarios: Scenario[]
  /** The number of hand-written scenarios at the start of `scenarios`. */
  written: number
  index: number
  onIndex: (index: number) => void
  palette: PaletteData
  onPreset: (preset: Preset) => void
  /** The scenario can change only before the first message. */
  canPick: boolean
  /** The demo customer of the scenario. Undefined when the server does not answer. */
  account: Account | undefined
  /** The confidence threshold of the cascade demo, and its change. */
  threshold: number
  onThreshold: (value: number) => void
  can: (event: PresenterEvent) => boolean
  onEvent: (event: PresenterEvent) => void
}

/** The one compact bar of presenter controls. It sits under the chat header, so the chat keeps the screen. */
export function Presenter({ scenarios, written, index, onIndex, palette, onPreset, canPick, account, threshold, onThreshold, can, onEvent }: Props) {
  const scenario = scenarios[index]
  const button = (event: PresenterEvent, label: ReactNode, variant: "default" | "secondary" = "secondary") => (
    <Button variant={variant} onClick={() => onEvent(event)} disabled={!can(event)}>{label}</Button>
  )
  const p = account?.purchase
  const facts = account && p
    ? `${account.customer.name} · ${account.plan} plan · ${account.creditsLeft.toLocaleString("en-US")} credits left · renews ${account.renews} · purchase ${p.id}: ${p.item}, $${p.amount}, ${p.status}`
    : ""
  const senderLine = account
    ? `Sends as ${scenario.role === "owner" ? account.customer.name : account.teammate.name} (${scenario.role})`
    : ""

  return (
    <div className="relative shrink-0 space-y-1.5 bg-system px-3 py-2">
      <div className="flex items-center gap-1.5">
        <select
          aria-label="Scenario"
          className="h-8 min-w-0 flex-1 rounded-md bg-pane px-2 text-sm text-ink disabled:opacity-50"
          value={index}
          disabled={!canPick}
          onChange={(e) => onIndex(Number(e.target.value))}
        >
          {[...new Set(scenarios.map((s) => s.group))].map((group) => (
            <optgroup key={group} label={group}>
              {scenarios.map((s, i) => (s.group === group && (i < written || i === index) ? <option key={s.label} value={i}>{s.label}</option> : null))}
            </optgroup>
          ))}
        </select>
        {button("NEXT", <>Next step <ArrowRight /></>, "default")}
        {button("RUN_ALL", <><Play /> Run all</>)}
        {button("RESET", <><RotateCcw /> Reset</>)}
      </div>
      <div className="flex items-center gap-1.5">
        <PresetPalette data={palette} disabled={!canPick} onPick={onPreset} />
        {button("SILENT", "Customer silent for T")}
      </div>
      <label
        className="flex items-center gap-2 text-xs text-ink"
        title="Demo of the cascade idea: an answer of Jev below this chance would go to the LLM or to staff. The flow itself does not use it."
      >
        <span className="shrink-0 font-medium">Confidence threshold</span>
        <input
          type="range"
          min={0.5}
          max={1}
          step={0.01}
          value={threshold}
          className="h-1 min-w-0 flex-1 accent-primary"
          aria-label="Confidence threshold of the cascade demo"
          onChange={(e) => onThreshold(Number(e.target.value))}
        />
        <span className="w-9 shrink-0 text-right font-semibold tabular-nums">{threshold.toFixed(2)}</span>
        <span className="shrink-0 rounded bg-warn px-1.5 py-0.5 text-[11px] font-semibold">cascade demo, advisory</span>
      </label>
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
