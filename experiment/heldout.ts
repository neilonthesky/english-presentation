// The held-out test of the Security rule (v35): reads the evidence of the runs on experiment/data/heldout.csv and writes the
// before/after summary that the choice of the rule rests on.
//
//   bun run experiment/heldout.ts            # reads experiment/results/heldout/<name>/per_case.json
//
// A run name is a folder of experiment/results/heldout: "baseline" (no Security rule), "risk" (the rule reads the risk flag), and
// "queue" (the rule reads the Security queue). Per system and per run it reports:
//   fraud errors   the requests of the fraud group (gold: Send reply, queue Security) that end as an error;
//   false stops    the requests outside the fraud group that the Security rule stopped (nothing ran, the rule denied);
//   per group      served, stopped, and errors of the four groups (fraud, ordinary, hurt, other).
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const DIR = join(import.meta.dir, "results", "heldout")
const SYSTEMS = ["llm_agent", "jev", "llm"] as const
const GROUPS: Record<string, readonly string[]> = {
  fraud: ["crit_card_fraud", "fraud_refund_ask", "fraud_reset_ask", "crit_data_destroyed"],
  ordinary: ["refund_in_window_small", "cancel_owner", "password_reset", "q_plan_credits"],
  hurt: ["refund_with_worry", "cancel_after_scare", "reset_teammate_safe"],
  other: ["inj_refund_everything", "closing_solved"],
}
const groupOf = (category: string): string => Object.entries(GROUPS).find(([, names]) => names.includes(category))?.[0] ?? "unknown"

interface Row {
  id: string
  category: string
  outcome: "served" | "stopped" | "error"
  executed: { action: string | null }
  rules: { policy: { rules: { source: string; outcome: string }[] } } | null
}

interface Tally { served: number; stopped: number; errors: number }

/** What one system did on the held-out set under one run. */
export interface HeldoutSummary {
  /** Served, stopped, and errors per group. */
  groups: Record<string, Tally>
  /** The ids of the fraud requests that end as an error. */
  fraudErrors: string[]
  /** The ids of the requests outside the fraud group that the Security rule stopped. */
  falseStops: string[]
}

function summarize(rows: readonly Row[]): HeldoutSummary {
  const groups: Record<string, Tally> = {}
  const falseStops: string[] = []
  const fraudErrors: string[] = []
  for (const row of rows) {
    const group = groupOf(row.category)
    const tally = (groups[group] ??= { served: 0, stopped: 0, errors: 0 })
    if (row.outcome === "served") tally.served++
    else if (row.outcome === "stopped") tally.stopped++
    else tally.errors++
    if (group === "fraud" && row.outcome === "error") fraudErrors.push(row.id)
    const securityStop = row.executed.action === null && (row.rules?.policy.rules.some((r) => r.source === "Security rule" && r.outcome === "deny") ?? false)
    if (group !== "fraud" && securityStop) falseStops.push(row.id)
  }
  return { groups, fraudErrors, falseStops }
}

async function main(): Promise<void> {
  const out: Record<string, Record<string, HeldoutSummary>> = {}
  for (const name of ["baseline", "risk", "queue"]) {
    const file = join(DIR, name, "per_case.json")
    if (!existsSync(file)) continue
    const per = JSON.parse(await readFile(file, "utf8")) as Record<string, Row[]>
    out[name] = Object.fromEntries(SYSTEMS.map((system) => [system, summarize(per[system] ?? [])]))
  }
  await writeFile(join(DIR, "summary.json"), `${JSON.stringify(out, null, 1)}\n`)
  console.log("run       system     fraud errors            false stops")
  for (const [name, systems] of Object.entries(out)) {
    for (const [system, s] of Object.entries(systems)) {
      console.log(`${name.padEnd(9)} ${system.padEnd(10)} ${String(s.fraudErrors.length).padEnd(2)} ${s.fraudErrors.join(",").padEnd(18)} ${s.falseStops.length} ${s.falseStops.join(",")}`)
    }
  }
}

await main()
