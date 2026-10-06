// The evidence for the two parameters of Triage: the confidence floor and the number of Clarify rounds. A sweep run is one full
// run of run.ts for one pair (floor, rounds): `<out>/sweep/floor_<T>_rounds_<N>/` for the test split and
// `<out>/sweep_dev/floor_<T>_rounds_<N>/` for the dev split. Every number is read from the result files of those runs;
// nothing is typed by hand.
import { readdir } from "node:fs/promises"
import { join } from "node:path"
import type { Results } from "./metrics"
import type { End } from "./pipeline"

export const SWEEP_FOLDERS = { test: "sweep", dev: "sweep_dev" } as const
export type SweepSplit = keyof typeof SWEEP_FOLDERS

/** The grid of the sweeps. A floor of 0 is no floor. */
export const FLOORS: readonly number[] = [0, 0.2, 0.5, 0.6, 0.7, 0.8, 0.9]
export const ROUNDS: readonly number[] = [0, 1]

export const sweepFolder = (floor: number, rounds: number): string => `floor_${floor}_rounds_${rounds}`

export interface SweepRow {
  floor: number
  rounds: number
  requests: number
  ends: Record<End, number>
  staffRate: number
  /** Queued although a correct system could finish alone. */
  staffNotNeeded: number
  clarifyRate: number
  /** Sent to Queued by the floor itself (rule "unsure"), after the last Clarify round. */
  unsure: number
  silentErrors: number
  harmful: number
  meanMachineS: number
  meanTotalS: number
  /** The US dollars of every model call of the Jev system, for 1,000 requests. */
  apiCost1000: number
}

/**
 * Read every <out>/<folder>/floor_<T>_rounds_<N> run of the Jev system, in order of the floor and the rounds.
 * Returns null with a clear message if the folder is missing or empty. A run of the wrong split, a run whose parameters differ
 * from its folder name, and a run with a failed request are errors.
 */
export async function readSweep(out: string, split: SweepSplit): Promise<SweepRow[] | null> {
  const folder = join(out, SWEEP_FOLDERS[split])
  let names: string[]
  try {
    names = (await readdir(folder)).filter((name) => /^floor_\d+(\.\d+)?_rounds_\d+$/.test(name))
  } catch {
    names = []
  }
  if (!names.length) {
    console.error(`sweep missing: no floor_<T>_rounds_<N> folder in ${folder}. Run the ${split} sweep first (see experiment/README.md).`)
    return null
  }
  const rows: SweepRow[] = []
  for (const name of names) {
    const results: Results = await Bun.file(join(folder, name, "results.json")).json()
    const where = join(folder, name)
    if (results.split !== split) throw new Error(`${where} holds the ${results.split} split, not ${split}`)
    if (name !== sweepFolder(results.parameters.floor, results.parameters.rounds)) {
      throw new Error(`${where} was run with floor ${results.parameters.floor} and rounds ${results.parameters.rounds}`)
    }
    if (results.failed_requests > 0) throw new Error(`${where}: ${results.failed_requests} request(s) failed; run it again`)
    const jev = results.systems.jev
    rows.push({
      floor: results.parameters.floor,
      rounds: results.parameters.rounds,
      requests: jev.requests,
      ends: jev.ends,
      staffRate: jev.staffRate,
      staffNotNeeded: jev.staffNotNeeded,
      clarifyRate: jev.clarifyRate,
      unsure: jev.queuedBy.unsure ?? 0,
      silentErrors: jev.silentErrors,
      harmful: jev.harmfulSilentErrors,
      meanMachineS: jev.machineSeconds.mean,
      meanTotalS: jev.totalSeconds.mean,
      apiCost1000: jev.apiCostPer1000,
    })
  }
  return rows.sort((a, b) => a.floor - b.floor || a.rounds - b.rounds)
}

/** The rows of the sweep for one number of rounds (the floor sweep) or for one floor (the rounds sweep). */
export const floorSweep = (rows: readonly SweepRow[], rounds: number): SweepRow[] => rows.filter((row) => row.rounds === rounds)
export const roundsSweep = (rows: readonly SweepRow[], floor: number): SweepRow[] => rows.filter((row) => row.floor === floor)

/** The two cross-sections through the chosen pair: the floor sweep at the chosen rounds, and the rounds sweep at the chosen floor. A missing run is an error. */
export function crossSections(rows: readonly SweepRow[], split: SweepSplit, floor: number, rounds: number): { byFloor: SweepRow[]; byRounds: SweepRow[] } {
  const byFloor = floorSweep(rows, rounds)
  const byRounds = roundsSweep(rows, floor)
  for (const f of FLOORS) if (!byFloor.some((row) => row.floor === f)) throw new Error(`the ${split} sweep has no run for floor ${f} and rounds ${rounds}`)
  for (const n of ROUNDS) if (!byRounds.some((row) => row.rounds === n)) throw new Error(`the ${split} sweep has no run for floor ${floor} and rounds ${n}`)
  return { byFloor, byRounds }
}

export interface Choice {
  floor: number
  rounds: number
  /** The rule, in words, with the numbers that decided. */
  why: string
}

/**
 * The choice of the two parameters, from the dev grid only. For each number of rounds N, take the smallest floor of the grid
 * with 0 silent errors. Among these pairs take the one with the lowest staff rate; a tie goes to the smaller N (no Clarify is the
 * simpler flow). If no pair has 0 silent errors, take the pair with the fewest silent errors, then the lowest staff rate.
 */
export function chooseParameters(dev: readonly SweepRow[]): Choice {
  for (const rounds of ROUNDS) {
    for (const floor of FLOORS) {
      if (!dev.some((row) => row.floor === floor && row.rounds === rounds)) throw new Error(`the dev sweep has no run for floor ${floor} and rounds ${rounds}`)
    }
  }
  const byOrder = (a: SweepRow, b: SweepRow): number => a.staffRate - b.staffRate || a.rounds - b.rounds || a.floor - b.floor
  const smallest = ROUNDS.flatMap((rounds) => {
    const row = floorSweep(dev, rounds).find((candidate) => candidate.silentErrors === 0)
    return row ? [row] : []
  })
  if (smallest.length) {
    const best = [...smallest].sort(byOrder)[0]
    const found = smallest.map((row) => `N = ${row.rounds}: floor ${row.floor} (${(100 * row.staffRate).toFixed(1)}% to staff)`).join("; ")
    return { floor: best.floor, rounds: best.rounds, why: `smallest floor with 0 silent errors on dev, per N: ${found}; lowest staff rate, then smaller N` }
  }
  const best = [...dev].sort((a, b) => a.silentErrors - b.silentErrors || byOrder(a, b))[0]
  return { floor: best.floor, rounds: best.rounds, why: `no pair has 0 silent errors on dev; fewest silent errors (${best.silentErrors}), then lowest staff rate` }
}

export interface ChanceBin {
  label: string
  /** Answers of the queue, the action, and the risk flag with a chance in [low, high). */
  n: number
  wrong: number
}

const BINS: readonly { label: string; low: number; high: number }[] = [
  { label: "below 0.5", low: 0, high: 0.5 },
  { label: "0.5 to 0.6", low: 0.5, high: 0.6 },
  { label: "0.6 to 0.7", low: 0.6, high: 0.7 },
  { label: "0.7 to 0.8", low: 0.7, high: 0.8 },
  { label: "0.8 to 0.9", low: 0.8, high: 0.9 },
  { label: "0.9 or more", low: 0.9, high: Infinity },
]

interface JevCase {
  scored: string[]
  gold: Record<string, unknown>
  rounds: { classifier: { fields: Record<string, { value: unknown; chance: number | null }> } }[]
}

/** How often the three answers that the floor reads (queue, action, risk flag) are wrong in the first pass, by the chance of the answer. */
export async function chanceBins(perCasePath: string): Promise<ChanceBin[]> {
  const perCase: { jev: (JevCase | { failure: string })[] } = await Bun.file(perCasePath).json()
  const bins = BINS.map((bin) => ({ label: bin.label, n: 0, wrong: 0 }))
  for (const record of perCase.jev) {
    if ("failure" in record) continue
    for (const field of ["queue", "action", "risk"]) {
      if (!record.scored.includes(field)) continue
      const answer = record.rounds[0].classifier.fields[field]
      if (answer.chance === null) continue
      const index = BINS.findIndex((bin) => answer.chance! >= bin.low && answer.chance! < bin.high)
      bins[index].n++
      bins[index].wrong += answer.value === record.gold[field] ? 0 : 1
    }
  }
  return bins
}

function printGrid(split: SweepSplit, rows: readonly SweepRow[]): void {
  console.log(`\n${split} sweep, Jev system (${rows[0].requests} requests per run)`)
  console.log("rounds  floor  silent  harmful  staff %  staff not needed  Clarify %  unsure  mean total s  API $ per 1k")
  for (const row of [...rows].sort((a, b) => a.rounds - b.rounds || a.floor - b.floor)) {
    console.log(
      [
        String(row.rounds).padStart(6),
        String(row.floor).padStart(6),
        String(row.silentErrors).padStart(7),
        String(row.harmful).padStart(8),
        (100 * row.staffRate).toFixed(1).padStart(8),
        String(row.staffNotNeeded).padStart(17),
        (100 * row.clarifyRate).toFixed(1).padStart(10),
        String(row.unsure).padStart(7),
        row.meanTotalS.toFixed(1).padStart(13),
        row.apiCost1000.toFixed(2).padStart(16),
      ].join(" "),
    )
  }
}

// bun run experiment/sweep.ts [results directory]: print the dev grid and the choice of the two parameters, then the test grid.
if (import.meta.main) {
  const out = process.argv[2] ?? join(import.meta.dir, "results")
  const dev = await readSweep(out, "dev")
  if (!dev) process.exit(1)
  printGrid("dev", dev)
  const choice = chooseParameters(dev)
  console.log(`\nChosen on dev: floor ${choice.floor}, Clarify rounds ${choice.rounds}\nRule: ${choice.why}`)
  const test = await readSweep(out, "test")
  if (test) printGrid("test", test)
}
