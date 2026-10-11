import { useMachine } from "@xstate/react"
import { use, useState } from "react"
import { api, customersPromise, presetsPromise } from "@/api"
import { DEFAULT_THRESHOLD, lowAnswers } from "@/cascade"
import { Chat, type ChatMode } from "@/components/Chat"
import { Compare } from "@/components/Compare"
import { CostPanel } from "@/components/CostPanel"
import { Diagram } from "@/components/Diagram"
import type { PaletteData } from "@/components/PresetPalette"
import { Presenter } from "@/components/Presenter"
import { StepDetail } from "@/components/StepDetail"
import { cn } from "@/lib/utils"
import { machine, type NodeId, type Phase } from "@/machine"
import { SCENARIOS, presetScenario } from "@/samples"
import type { InjectionScore, Preset } from "@/types"

const NO_PRESETS: Preset[] = []
type View = "flow" | "compare"

const TABS: { view: View; label: string }[] = [
  { view: "flow", label: "Flow" },
  { view: "compare", label: "Compare Level 2 and 3" },
]

export default function App() {
  const customers = use(customersPromise)
  const loaded = use(presetsPromise)
  const [snap, send] = useMachine(machine)
  // The state value is "idle", "resolved", or a state with its phase, such as { triage: "done" }.
  const value = snap.value
  const [name, phase] = typeof value === "string" ? [value, null] : (Object.entries(value)[0] as [string, Phase])
  const current = name === "idle" ? null : (name as NodeId)

  // One scenario sets the customer, the sender, and the text. It is fixed after the first message. The scenarios are the
  // hand-written ones, then the messages of the palette (the prompt-injection ladder and the request types of the dataset).
  const presets = loaded?.presets ?? NO_PRESETS
  const scenarios = [...SCENARIOS, ...presets.map(presetScenario)]
  const [index, setIndex] = useState(0)
  const scenario = scenarios[index]
  const account = customers?.find((c) => c.id === scenario.customerId)
  const sender = account ? (scenario.role === "owner" ? account.customer.name : account.teammate.name) : ""

  // The palette scores each message with Jev (the chance of the injection flag). The server keeps the scores.
  const [scores, setScores] = useState<Record<string, InjectionScore>>(loaded?.scores ?? {})
  const [scoring, setScoring] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const palette: PaletteData = {
    presets, scores, scoring, error: scoreError,
    onScore: () => {
      if (scoring || presets.every((p) => scores[p.id]?.chance != null)) return
      setScoring(true)
      setScoreError(null)
      api("presets/score")
        .then((r) => {
          setScores(r.scores)
          const failed = Object.values(r.scores).find((s) => s.error)
          if (failed) setScoreError(failed.error)
        })
        .catch((err: unknown) => setScoreError(err instanceof Error ? err.message : String(err)))
        .finally(() => setScoring(false))
    },
  }

  // A click on a block shows that state. Any button of the flow brings the detail back to the current state.
  const [pick, setPick] = useState<NodeId | null>(null)
  const shown = pick ?? current
  const act = (event: Parameters<typeof send>[0]) => {
    setPick(null)
    send(event)
  }

  // The confidence threshold of the cascade demo. It only changes what the diagram and the detail show.
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const fields = snap.context.classifier?.fields
  const cascade = { threshold, low: lowAnswers(fields, threshold), answered: fields !== undefined }

  // Rules check answered "deny": the diagram turns the block and the arrow to Final message red, with the name of the rule.
  const rules = snap.context.rules
  const denied = rules?.next === "final" ? rules.policy.rules.filter((r) => r.outcome === "deny").map((r) => r.source) : null
  const blockedBy = denied ? [...new Set(denied)] : null

  const [view, setView] = useState<View>("flow")

  const canWrite = snap.can({ type: "WRITE", text: "", role: "owner", customerId: "" })
  const mode: ChatMode = current === null ? "start" : "again"

  return (
    <div className="flex h-screen gap-2 bg-background p-2">
      <div className="flex min-h-0 w-2/5 flex-col">
        <Chat
          messages={snap.context.messages}
          mode={mode}
          disabled={!canWrite || !account}
          popup={snap.matches({ chat: "asking" })}
          scenario={scenario}
          sender={sender}
          onSend={(text) => act({ type: "WRITE", text, role: scenario.role, customerId: scenario.customerId })}
          onYes={() => act({ type: "YES" })}
          onNo={() => act({ type: "NO" })}
          controls={
            <Presenter
              scenarios={scenarios}
              written={SCENARIOS.length}
              index={index}
              onIndex={setIndex}
              palette={palette}
              onPreset={(p) => setIndex(SCENARIOS.length + presets.indexOf(p))}
              canPick={current === null}
              account={account}
              threshold={threshold}
              onThreshold={setThreshold}
              can={(type) => snap.can({ type })}
              onEvent={(type) => act({ type })}
            />
          }
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div className="flex shrink-0 items-center gap-2">
          <div role="tablist" className="flex gap-1 rounded-xl bg-card p-1">
            {TABS.map((t) => (
              <button
                key={t.view}
                role="tab"
                type="button"
                aria-selected={view === t.view}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold",
                  view === t.view ? "bg-primary text-primary-foreground" : "text-ink hover:bg-muted",
                )}
                onClick={() => setView(t.view)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <CostPanel />
          </div>
        </div>
        {view === "flow" && (
          <>
            <div className="h-[55%] min-h-0 shrink-0 overflow-hidden rounded-xl">
              <Diagram active={current} visited={snap.context.visited} taken={snap.context.taken} cascade={cascade} blockedBy={blockedBy} onSelect={setPick} />
            </div>
            <aside className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-card p-5">
              {shown === null ? (
                <p className="text-sm text-muted-foreground">
                  Pick a scenario or a message from the palette and send it in the chat. Then press Next step to run one state at a time, or Run all to go on until a state needs the customer. Click a block to see its detail, with the exact JSON of each model call.
                </p>
              ) : (
                <StepDetail node={shown} current={current} phase={phase} ctx={snap.context} threshold={threshold} />
              )}
            </aside>
          </>
        )}
        <div className={cn("min-h-0 flex-1", view !== "compare" && "hidden")}>
          <Compare scenarios={scenarios} written={SCENARIOS.length} start={index} palette={palette} accounts={customers} />
        </div>
      </div>
    </div>
  )
}
