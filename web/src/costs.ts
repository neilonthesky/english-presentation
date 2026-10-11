import { useSyncExternalStore } from "react"

// The measured cost of the requests of this browser session, by level. A request is recorded when its last model call has
// answered: the step by step flow records a Level 3 request, and a compare records one request of each level. The store lives
// outside the machine, so "Reset" of the flow does not erase the measurement.
export type CostLevel = 2 | 3

interface Costs {
  level2: readonly number[]
  level3: readonly number[]
}

/** The cost of 1,000 requests in US dollars, from the experiment (experiment/results/results.json): Level 2 0.61, Level 3 0.28. */
export const EXPERIMENT_PER_1K: Record<CostLevel, number> = { 2: 0.61, 3: 0.28 }

const EMPTY: Costs = { level2: [], level3: [] }
let costs = EMPTY
const listeners = new Set<() => void>()

const publish = (next: Costs) => {
  costs = next
  for (const listener of listeners) listener()
}

/** Add the cost of one request of a level, in US dollars. */
export function recordCost(level: CostLevel, usd: number): void {
  publish(level === 2 ? { ...costs, level2: [...costs.level2, usd] } : { ...costs, level3: [...costs.level3, usd] })
}

export const clearCosts = (): void => publish(EMPTY)

export function useCosts(): Costs {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => costs,
  )
}

/** The mean cost of one request in US dollars, or null when no request was measured. */
export const meanCost = (usd: readonly number[]): number | null => (usd.length ? usd.reduce((a, b) => a + b, 0) / usd.length : null)
