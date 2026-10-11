import type { Classifier } from "./types"

/** The default confidence threshold of the cascade demo. */
export const DEFAULT_THRESHOLD = 0.9

/** The five answers of Jev, as the demo names them. */
export const ANSWERS = [
  { field: "queue", name: "Topic" },
  { field: "action", name: "Action" },
  { field: "priority", name: "Priority" },
  { field: "risk", name: "Risk flag" },
  { field: "injection", name: "Injection flag" },
] as const

/**
 * The answers of Jev whose chance is below the threshold, such as "Action 0.62". The cascade demo only reads this: the idea is that
 * a cascade would send these answers to the LLM or to staff. The flow of the demo and the experiment never read it.
 */
export function lowAnswers(fields: Classifier["fields"] | undefined, threshold: number): string[] {
  if (!fields) return []
  return ANSWERS.filter((a) => fields[a.field].confidence < threshold).map((a) => `${a.name} ${fields[a.field].confidence.toFixed(2)}`)
}
