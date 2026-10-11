import { Button } from "@/components/ui/button"
import { EXPERIMENT_PER_1K, clearCosts, meanCost, useCosts, type CostLevel } from "@/costs"

const money = (usd: number) => `$${Math.round(usd).toLocaleString("en-US")}`

const ROWS: { level: CostLevel; name: string }[] = [
  { level: 2, name: "Level 2 · LLM agent" },
  { level: 3, name: "Level 3 · Jev + rules" },
]

/**
 * The cost of one million requests at each level. "Experiment" is the measured cost of the 100 requests of the experiment
 * (US dollars per 1,000 requests, times 1,000). "Session" is the mean cost of the requests of this browser session, times
 * 1,000,000: Level 3 from the step by step flow and the compare, Level 2 from the compare.
 */
export function CostPanel() {
  const costs = useCosts()
  const measured: Record<CostLevel, readonly number[]> = { 2: costs.level2, 3: costs.level3 }
  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-card px-3 py-1.5 text-xs text-ink"
      title="Cost of 1,000,000 requests. Experiment: measured on the 100 requests of the experiment. Session: the mean cost of the requests of this browser session."
    >
      <p className="w-20 shrink-0 text-sm font-bold leading-tight">Cost of 1M requests</p>
      <div className="grid min-w-0 flex-1 grid-cols-[auto_auto_1fr] gap-x-3 gap-y-0.5 leading-tight">
        {ROWS.map(({ level, name }) => {
          const mean = meanCost(measured[level])
          return (
            <div key={level} className="contents">
              <span className="whitespace-nowrap font-semibold">{name}</span>
              <span className="whitespace-nowrap text-ink-soft">
                experiment <b className="text-ink">{money(EXPERIMENT_PER_1K[level] * 1000)}</b>
              </span>
              <span className="whitespace-nowrap text-ink-soft">
                session <b className="text-ink">{mean === null ? "–" : `${money(mean * 1_000_000)} (n=${measured[level].length})`}</b>
              </span>
            </div>
          )
        })}
      </div>
      <Button variant="ghost" size="xs" className="shrink-0" onClick={clearCosts}>Clear</Button>
    </div>
  )
}
