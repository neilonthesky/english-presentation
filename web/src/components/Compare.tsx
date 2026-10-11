import { LoaderCircle, Play } from "lucide-react"
import { useState, type ReactNode } from "react"
import { api } from "@/api"
import { Button } from "@/components/ui/button"
import { CallInspector, usd } from "@/components/Inspector"
import { PresetPalette, type PaletteData } from "@/components/PresetPalette"
import { recordCost } from "@/costs"
import { cn } from "@/lib/utils"
import type { Account, CompareLevel, CompareResponse, CompareStep, Preset, RequestOutcome, Scenario } from "@/types"

const BLURB: Record<CompareLevel["level"], string> = {
  2: "One LLM call reads the message and the whole account, applies the written rules itself, and runs an action or refuses. Nothing checks it.",
  3: "Jev classifies the message. Fixed code applies the written rules and runs the action. The LLM only writes the text.",
}

const OUTCOME_LABEL: Record<RequestOutcome, string> = { served: "served", stopped: "stopped by the rules", error: "error" }

/** A model step shows seconds; a step of fixed code shows milliseconds. */
const timeOf = (s: CompareStep) => (s.kind === "model" ? `${s.latencyS.toFixed(2)} s` : s.latencyS < 0.0005 ? "< 1 ms" : `${(s.latencyS * 1000).toFixed(0)} ms`)

function Badge({ tone, children }: { tone: "good" | "bad" | "neutral"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-sm font-semibold",
        tone === "good" && "bg-rules text-ink",
        tone === "bad" && "bg-destructive text-white",
        tone === "neutral" && "bg-system text-ink",
      )}
    >
      {children}
    </span>
  )
}

/** What the level did with the request, in one badge: ran an action, answered, was stopped by a written rule, or failed. */
function ResultBadge({ level }: { level: CompareLevel }) {
  if (level.error) return <Badge tone="bad">Failed</Badge>
  if (level.end === "act") return <Badge tone="good">Ran: {level.executed?.action}</Badge>
  if (level.end === "answer") return <Badge tone="neutral">Answered, nothing changed</Badge>
  if (level.end === "blocked")
    return <Badge tone="bad">Stopped by {level.stoppedBy.length ? level.stoppedBy.join(" + ") : "a written rule"}</Badge>
  return <Badge tone="bad">Invalid answer, nothing ran</Badge>
}

function LevelCard({ level, gold }: { level: CompareLevel; gold: CompareResponse["gold"] }) {
  const models = level.steps.filter((s) => s.trace)
  return (
    <section className="min-w-0 space-y-2 rounded-xl bg-card p-4">
      <header>
        <h3 className="text-lg font-bold text-ink">Level {level.level} · {level.name}</h3>
        <p className="text-xs text-muted-foreground">{BLURB[level.level]}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <ResultBadge level={level} />
        {level.outcome && (
          <Badge tone={level.outcome === "error" ? "bad" : "good"}>
            vs gold ({gold?.finalAction ?? "stop"}): {OUTCOME_LABEL[level.outcome]}
          </Badge>
        )}
      </div>
      {level.error && <p className="rounded-lg bg-destructive/15 p-2 text-sm text-destructive">{level.error}</p>}
      <p className="text-sm">
        <span className="text-muted-foreground">Chosen action: </span>
        <b>{level.chosen ?? "none"}</b>
        <span className="block text-xs text-muted-foreground">{level.decision}</span>
      </p>

      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="pb-1 pr-2 font-medium">Step</th>
            <th className="pb-1 pr-2 text-right font-medium">Time</th>
            <th className="pb-1 pr-2 text-right font-medium">Tokens in / out</th>
            <th className="pb-1 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody>
          {level.steps.map((s, i) => (
            <tr key={i} className={cn("border-t align-top", s.kind === "code" && "text-muted-foreground")}>
              <td className="py-1 pr-2">
                <span className="font-medium text-ink">{s.name}</span>
                <span className="ml-1 text-[11px] uppercase text-muted-foreground">{s.kind === "model" ? "model" : "fixed code"}</span>
                <span className="block text-xs text-muted-foreground">{s.summary}</span>
              </td>
              <td className="whitespace-nowrap py-1 pr-2 text-right tabular-nums">{timeOf(s)}</td>
              <td className="whitespace-nowrap py-1 pr-2 text-right tabular-nums">{s.kind === "model" ? `${s.inputTokens} / ${s.outputTokens}` : "–"}</td>
              <td className="whitespace-nowrap py-1 text-right tabular-nums">{s.kind === "model" ? usd(s.costUsd) : "–"}</td>
            </tr>
          ))}
          <tr className="border-t-2 font-bold text-ink">
            <td className="py-1 pr-2">Total per request</td>
            <td className="whitespace-nowrap py-1 pr-2 text-right tabular-nums">{level.totals.latencyS.toFixed(2)} s</td>
            <td className="whitespace-nowrap py-1 pr-2 text-right tabular-nums">{level.totals.inputTokens} / {level.totals.outputTokens}</td>
            <td className="whitespace-nowrap py-1 text-right tabular-nums">{usd(level.totals.costUsd)}</td>
          </tr>
        </tbody>
      </table>

      {level.message && (
        <blockquote className="whitespace-pre-wrap rounded-lg bg-pane p-3 text-sm">{level.message}</blockquote>
      )}

      {models.length > 0 && (
        <details className="rounded-lg bg-pane px-3 py-1.5">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Payloads of the model calls</summary>
          {models.map((s) => (
            <CallInspector key={s.name} title={s.name} trace={s.trace!} />
          ))}
        </details>
      )}
    </section>
  )
}

interface Props {
  scenarios: Scenario[]
  /** The number of hand-written scenarios at the start of `scenarios`. */
  written: number
  /** The scenario that the presenter had when the compare was opened. */
  start: number
  palette: PaletteData
  accounts: Account[] | null
}

/** The side-by-side compare: the same message through Level 2 and Level 3, with time, tokens, cost, action, and outcome. */
export function Compare({ scenarios, written, start, palette, accounts }: Props) {
  const [index, setIndex] = useState(start)
  const [text, setText] = useState(scenarios[start].text)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scenario = scenarios[index]
  const account = accounts?.find((a) => a.id === scenario.customerId)
  const sender = account ? (scenario.role === "owner" ? account.customer.name : account.teammate.name) : scenario.customerId

  const pick = (i: number) => {
    setIndex(i)
    setText(scenarios[i].text)
  }

  async function run() {
    setRunning(true)
    setError(null)
    try {
      const r = await api("compare", { text, role: scenario.role, customerId: scenario.customerId, presetId: scenario.presetId })
      setResult(r)
      for (const level of [r.level2, r.level3]) if (!level.error) recordCost(level.level, level.totals.costUsd)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }

  const two = result?.level2
  const three = result?.level3
  const both = two && three && !two.error && !three.error
  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2 overflow-y-auto rounded-xl bg-pane p-3">
      <div className="relative space-y-2 rounded-xl bg-card p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            aria-label="Compare scenario"
            className="h-8 min-w-0 flex-1 rounded-md bg-pane px-2 text-sm text-ink"
            value={index}
            onChange={(e) => pick(Number(e.target.value))}
          >
            {[...new Set(scenarios.map((s) => s.group))].map((group) => (
              <optgroup key={group} label={group}>
                {scenarios.map((s, i) => (s.group === group && (i < written || i === index) ? <option key={s.label} value={i}>{s.label}</option> : null))}
              </optgroup>
            ))}
          </select>
          <PresetPalette data={palette} onPick={(p: Preset) => pick(written + palette.presets.indexOf(p))} />
          <Button onClick={() => void run()} disabled={running || !text.trim()}>
            {running ? <LoaderCircle className="animate-spin" /> : <Play />} Run Level 2 and Level 3
          </Button>
        </div>
        <textarea
          aria-label="Customer message"
          className="block w-full resize-none rounded-lg bg-pane p-2 text-sm text-ink"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Customer {account?.customer.name ?? scenario.customerId}, sent by {sender} ({scenario.role}). {scenario.note} Both levels run on the same
          message at the same time. Nothing changes in the account.
        </p>
      </div>

      {error && <p className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{error}</p>}
      {running && <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Both levels are running…</p>}

      {result && (
        <>
          {result.gold && (
            <p className="rounded-lg bg-card px-3 py-1.5 text-sm">
              Request type <b>{result.gold.category}</b> of the dataset. Gold final result: <b>{result.gold.finalAction ?? `a stop: the written rules deny ${result.gold.action}`}</b>.
            </p>
          )}
          {both && (
            <p className="rounded-lg bg-card px-3 py-1.5 text-sm text-ink">
              Cost per request: Level 2 <b>{usd(two.totals.costUsd)}</b>, Level 3 <b>{usd(three.totals.costUsd)}</b>
              {" · "}time: Level 2 <b>{two.totals.latencyS.toFixed(1)} s</b>, Level 3 <b>{three.totals.latencyS.toFixed(1)} s</b>
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <LevelCard level={result.level2} gold={result.gold} />
            <LevelCard level={result.level3} gold={result.gold} />
          </div>
        </>
      )}
      {!result && !running && !error && (
        <p className="text-sm text-muted-foreground">Pick a message, then press Run. The same message goes through Level 2 and Level 3, and the time, the tokens, the cost, the chosen action, and the outcome appear side by side.</p>
      )}
    </div>
  )
}
