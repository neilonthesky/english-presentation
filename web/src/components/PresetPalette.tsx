import { ChevronDown, ShieldAlert, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { InjectionScore, Preset } from "@/types"

/** The palette data that App loads once and shares with the presenter bar and the compare view. */
export interface PaletteData {
  presets: Preset[]
  /** What Jev says about the injection flag of each preset, by preset id. */
  scores: Record<string, InjectionScore>
  scoring: boolean
  error: string | null
  /** Ask the server to score the presets that have no score yet. */
  onScore: () => void
}

/** The chance of the injection flag of Jev: a bar, and red when the flag would be on (chance of yes at least 0.5). */
function InjectionChance({ score, scoring }: { score: InjectionScore | undefined; scoring: boolean }) {
  if (score?.chance == null)
    return <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">{scoring ? "Jev is scoring…" : score?.error ? "no score" : "not scored"}</span>
  const on = score.chance >= 0.5
  return (
    <span className="flex w-28 shrink-0 items-center justify-end gap-1.5 text-xs" title="The chance of yes that Jev gives to the question: is this an injection?">
      <span className="relative inline-block h-1.5 w-12 overflow-hidden rounded bg-system">
        <span className={cn("absolute inset-y-0 left-0", on ? "bg-destructive" : "bg-model-strong")} style={{ width: `${score.chance * 100}%` }} />
      </span>
      <span className={cn("w-9 text-right font-semibold tabular-nums", on ? "text-destructive" : "text-ink")}>{score.chance.toFixed(2)}</span>
    </span>
  )
}

const goldText = (p: Preset) =>
  p.gold ? `gold: ${p.gold.finalAction ?? `stopped (${p.gold.action} is denied)`}` : null

interface Props {
  data: PaletteData
  disabled?: boolean
  onPick: (preset: Preset) => void
}

/**
 * The palette of messages: the prompt-injection ladder and one request of each request type of the dataset. Each row shows the
 * injection chance that Jev gives to the text. Opening the palette asks the server to score the presets that have no score yet.
 */
export function PresetPalette({ data, disabled = false, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const groups = [...new Set(data.presets.map((p) => p.group))]
  return (
    <>
      <Button
        variant="secondary"
        disabled={disabled}
        aria-expanded={open}
        title="Prompt-injection ladder and one request of each request type"
        onClick={() => {
          if (!open) data.onScore()
          setOpen(!open)
        }}
      >
        <ShieldAlert /> Messages <ChevronDown />
      </Button>
      {open && (
        <div role="dialog" aria-label="Preset messages" className="absolute inset-x-1 top-full z-30 mt-1 max-h-[70vh] overflow-y-auto rounded-xl border bg-card p-2 shadow-xl">
          <div className="mb-1 flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground">
              Click a message to use it. The bar is the chance that Jev gives to "injection" (red: the flag would be on).
              {data.error && <span className="text-destructive"> Scoring failed: {data.error}</span>}
            </p>
            <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={() => setOpen(false)}><X /></Button>
          </div>
          {groups.map((group) => (
            <div key={group} className="pb-1">
              <p className="sticky top-0 bg-card px-1 pt-1 text-xs font-semibold uppercase text-ink-soft">{group}</p>
              {data.presets.filter((p) => p.group === group).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                  onClick={() => {
                    onPick(p)
                    setOpen(false)
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{p.label}</span>
                    <span className="block truncate text-xs text-muted-foreground" title={p.text}>
                      {p.text}
                    </span>
                    {goldText(p) && <span className="text-[11px] text-ink-soft">{goldText(p)}</span>}
                  </span>
                  <InjectionChance score={data.scores[p.id]} scoring={data.scoring} />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
