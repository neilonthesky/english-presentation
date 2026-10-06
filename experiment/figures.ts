// The charts of the paper, drawn from results.json and the sweep runs: SVG text, then one PDF per chart with rsvg-convert.
// The paper includes the PDFs with \includegraphics, so LaTeX has no drawing to compute (Overleaf compiles fast).
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { Results } from "./metrics"
import { ENDS, type End } from "./pipeline"
import { crossSections, FLOORS, readSweep, ROUNDS, type SweepRow } from "./sweep"
import { FIELDS, type Field } from "./types"

const NAMES: Record<Field, string> = { queue: "Queue", action: "Action", priority: "Priority", risk: "Risk", injection: "Injection" }
const BLUE = "#2563eb"
const AMBER = "#f59e0b"
const SLATE = "#64748b"
const RED = "#dc2626"
const GREEN = "#16a34a"
const GREY = "#9ca3af"
const BAND = "#e5e7eb"
const END_COLORS: Record<End, string> = { answer: BLUE, action: GREEN, denied: GREY, queued: AMBER, invalid: RED }
const END_NAMES: Record<End, string> = { answer: "Answer", action: "Action done", denied: "Denied", queued: "Queued", invalid: "Invalid" }

type Anchor = "start" | "middle" | "end"
const t = (x: number, y: number, s: string, anchor: Anchor = "middle", size = 7, fill = "#111827", extra = ""): string =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" text-anchor="${anchor}" fill="${fill}" ${extra}>${s}</text>`
const rect = (x: number, y: number, w: number, h: number, fill: string): string =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w, 0).toFixed(1)}" height="${Math.max(h, 0).toFixed(1)}" fill="${fill}"/>`
const line = (x1: number, y1: number, x2: number, y2: number, stroke = "#d1d5db", width = 0.5): string =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${width}"/>`
const title = (x: number, s: string): string => t(x, 10, s, "start", 7.5, "#111827", 'font-weight="bold"')

function svg(width: number, height: number, body: string[]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}pt" height="${height}pt" viewBox="0 0 ${width} ${height}" font-family="DejaVu Sans, Helvetica, sans-serif">${rect(0, 0, width, height, "#ffffff")}${body.join("")}</svg>`
}

/** A vertical axis box with grid lines; returns the y position of a value. */
function yAxis(x0: number, x1: number, top: number, bottom: number, lo: number, hi: number, step: number, fmt: (v: number) => string, out: string[]): (v: number) => number {
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top)
  for (let v = lo; v <= hi + 1e-9; v += step) out.push(line(x0, y(v), x1, y(v)), t(x0 - 3, y(v) + 2.3, fmt(v), "end", 6, "#4b5563"))
  out.push(line(x0, top, x0, bottom, "#6b7280"), line(x0, bottom, x1, bottom, "#6b7280"))
  return y
}

function legend(x: number, y: number, items: readonly (readonly [string, string])[], out: string[]): void {
  let at = x
  for (const [label, color] of items) {
    out.push(rect(at, y - 5.5, 6, 6, color), t(at + 8, y, label, "start", 6.5))
    at += 14 + label.length * 3.6
  }
}

/** Accuracy per field of the first pass, Jev against the LLM. */
function classifierChart(r: Results): string {
  const out: string[] = []
  const [x0, x1, top, bottom] = [30, 236, 18, 118]
  const y = yAxis(x0, x1, top, bottom, 50, 100, 10, (v) => `${v}`, out)
  out.push(t(8, (top + bottom) / 2, "% correct", "middle", 6.5, "#4b5563", `transform="rotate(-90 8 ${(top + bottom) / 2})"`))
  legend(x0 + 4, 9, [["Jev", BLUE], ["LLM", AMBER]], out)
  const gw = (x1 - x0) / FIELDS.length
  FIELDS.forEach((f, i) => {
    const bars = [[r.classifier.jev.perField[f].accuracy * 100, BLUE], [r.classifier.llm.perField[f].accuracy * 100, AMBER]] as const
    bars.forEach(([v, color], k) => {
      const bx = x0 + i * gw + gw * 0.12 + k * gw * 0.38
      out.push(rect(bx, y(v), gw * 0.36, bottom - y(v), color), t(bx + gw * 0.18, y(v) - 2, v.toFixed(0), "middle", 5.5))
    })
    out.push(t(x0 + (i + 0.5) * gw, bottom + 9, NAMES[f], "middle", 6.5))
  })
  return svg(240, 134, out)
}

/** The three rungs of the ladder: wrong final results (with the harmful runs), mean time per request, and the API cost per 1,000 requests. */
function ladderChart(r: Results): string {
  const out: string[] = []
  const steps = r.ladder
  const labels = [["Rung 0", "Staff"], ["Rung 1", "LLM + rules"], ["Rung 2", "+ Jev + staff"]]
  const DARK_RED = "#7f1d1d"
  const [top, bottom] = [22, 106]

  // (a) wrong final results; the dark part is the wrong runs of an action that changes money or data
  out.push(title(24, "(a) Wrong final results"))
  const [ax0, ax1] = [24, 164]
  const wrongMax = Math.max(10, Math.ceil(Math.max(...steps.map((s) => s.wrongFinal)) / 10) * 10)
  const ay = yAxis(ax0, ax1, top, bottom, 0, wrongMax, wrongMax > 60 ? 20 : 10, (v) => `${v}`, out)
  const gw = (ax1 - ax0) / steps.length
  const stepLabels = (x0: number, x1: number): void => {
    const w = (x1 - x0) / steps.length
    steps.forEach((_, i) => {
      out.push(t(x0 + (i + 0.5) * w, bottom + 9, labels[i][0], "middle", 6), t(x0 + (i + 0.5) * w, bottom + 17, labels[i][1], "middle", 5.5))
    })
  }
  steps.forEach((s, i) => {
    const bx = ax0 + i * gw + gw * 0.2
    out.push(rect(bx, ay(s.wrongFinal), gw * 0.6, bottom - ay(s.wrongFinal), RED), rect(bx, ay(s.harmful), gw * 0.6, bottom - ay(s.harmful), DARK_RED))
    out.push(t(bx + gw * 0.3, ay(s.wrongFinal) - 2, `${s.wrongFinal}`, "middle", 6.5))
  })
  stepLabels(ax0, ax1)
  legend(ax0 - 18, 137, [["Wrong final result", RED], ["Of these, harmful", DARK_RED]], out)

  // (b) mean time per request: machine time and the assumed staff time
  const timeMax = Math.max(20, Math.ceil(Math.max(...steps.map((s) => s.totalSeconds)) / 20) * 20)
  out.push(title(198, "(b) Mean time per request (s)"))
  const [bx0, bx1] = [198, 338]
  const by = yAxis(bx0, bx1, top, bottom, 0, timeMax, 20, (v) => `${v}`, out)
  const bw = (bx1 - bx0) / steps.length
  steps.forEach((s, i) => {
    const x = bx0 + i * bw + bw * 0.2
    out.push(rect(x, by(s.machineSeconds), bw * 0.6, bottom - by(s.machineSeconds), SLATE), rect(x, by(s.totalSeconds), bw * 0.6, by(s.machineSeconds) - by(s.totalSeconds), AMBER))
    out.push(t(x + bw * 0.3, by(s.totalSeconds) - 2, s.totalSeconds.toFixed(1), "middle", 6.5))
  })
  stepLabels(bx0, bx1)
  legend(bx0 + 6, 137, [["Machine", SLATE], [`Staff (assumed ${r.staff_seconds} s)`, AMBER]], out)

  // (c) the API cost of every model call of the pipeline
  out.push(title(372, "(c) API cost per 1k requests ($)"))
  const [cx0, cx1] = [372, 512]
  const costHi = Math.max(0.5, Math.ceil(Math.max(...steps.map((s) => s.apiCost1000)) / 0.5) * 0.5)
  const cy = yAxis(cx0, cx1, top, bottom, 0, costHi, costHi > 2 ? 1 : 0.5, (v) => v.toFixed(1), out)
  const cw = (cx1 - cx0) / steps.length
  steps.forEach((s, i) => {
    const x = cx0 + i * cw + cw * 0.2
    out.push(rect(x, cy(s.apiCost1000), cw * 0.6, bottom - cy(s.apiCost1000), BLUE), t(x + cw * 0.3, cy(s.apiCost1000) - 2, s.apiCost1000.toFixed(2), "middle", 6.5))
  })
  stepLabels(cx0, cx1)
  return svg(520, 146, out)
}

/** Stacked bars of how the Jev system ended each request (answer, action done, denied, Queued) for each floor; the silent errors are printed above each bar. */
function floorChart(rows: readonly SweepRow[]): string {
  const out: string[] = []
  const [x0, x1, top, bottom] = [30, 236, 34, 118]
  const total = rows[0].requests
  const y = yAxis(x0, x1, top, bottom, 0, total, 20, (v) => `${v}`, out)
  out.push(t(8, (top + bottom) / 2, "requests", "middle", 6.5, "#4b5563", `transform="rotate(-90 8 ${(top + bottom) / 2})"`))
  legend(x0 + 2, 9, ENDS.map((end) => [END_NAMES[end], END_COLORS[end]] as const), out)
  out.push(t(x0 + 2, 24, "Silent errors above each bar", "start", 6.5, "#4b5563"))
  const gw = (x1 - x0) / rows.length
  rows.forEach((row, i) => {
    const bx = x0 + i * gw + gw * 0.2
    let at = bottom
    for (const end of ENDS) {
      const h = bottom - y(row.ends[end])
      at -= h
      out.push(rect(bx, at, gw * 0.6, h, END_COLORS[end]))
      if (h >= 7) out.push(t(bx + gw * 0.3, at + h / 2 + 2.3, `${row.ends[end]}`, "middle", 6.5, end === "denied" ? "#111827" : "#ffffff"))
    }
    out.push(t(bx + gw * 0.3, y(total) - 3, `${row.silentErrors}`, "middle", 7.5, row.silentErrors ? RED : "#111827", 'font-weight="bold"'))
    out.push(t(x0 + (i + 0.5) * gw, bottom + 9, row.floor === 0 ? "0 (none)" : `${row.floor}`, "middle", 6.5))
  })
  out.push(t((x0 + x1) / 2, bottom + 19, "Confidence floor", "middle", 6.5, "#4b5563"))
  return svg(240, 142, out)
}

/** A polyline with a marker at each point; `dash` draws a dashed line. */
function series(points: readonly (readonly [number, number])[], color: string, radius: number, dash: boolean, out: string[]): void {
  if (!points.length) return
  const d = dash ? ' stroke-dasharray="3 2"' : ""
  out.push(`<polyline points="${points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="1"${d}/>`)
  for (const [px, py] of points) out.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${radius}" fill="${color}"/>`)
}

type SplitName = "dev" | "test"
const SPLIT_COLOR: Record<SplitName, string> = { dev: BLUE, test: AMBER }
const SPLIT_TEXT: Record<SplitName, string> = { dev: BLUE, test: "#b45309" }

/**
 * Choosing the floor, at the chosen number of Clarify rounds: for each floor, the silent errors (a), the share of requests sent
 * to staff (b), and the share that went to Clarify (c) of the Jev system, on the dev split (where the floor was chosen) and on
 * the test split (the confirmation).
 */
function chooseFloorChart(dev: readonly SweepRow[], test: readonly SweepRow[], chosen: number, rounds: number): string {
  const out: string[] = []
  const [top, bottom] = [24, 110]
  const rowsOf = { dev, test } as const
  const label = (floor: number): string => (floor === 0 ? "0" : floor.toFixed(1))

  const panel = (heading: string, x0: number, x1: number, lo: number, hi: number, step: number, fmt: (v: number) => string) => {
    out.push(title(x0 - 28, heading))
    const px = (floor: number) => x0 + ((FLOORS.indexOf(floor) + 0.5) / FLOORS.length) * (x1 - x0)
    out.push(rect(px(chosen) - 0.5 * ((x1 - x0) / FLOORS.length), top, (x1 - x0) / FLOORS.length, bottom - top, BAND))
    const y = yAxis(x0, x1, top, bottom, lo, hi, step, fmt, out)
    for (const floor of FLOORS) out.push(t(px(floor), bottom + 9, label(floor), "middle", 6.5))
    out.push(t((x0 + x1) / 2, bottom + 19, "Confidence floor", "middle", 6.5, "#4b5563"))
    return { px, y }
  }
  /** One line per split, with the value above (dev) or below (test) each point. Near the axis the value of the test split goes above too. */
  const lines = (p: ReturnType<typeof panel>, value: (row: SweepRow) => number, dash: boolean, digits: number): void => {
    for (const split of ["dev", "test"] as const) {
      const rows = rowsOf[split]
      series(rows.map((row) => [p.px(row.floor), p.y(value(row))] as const), SPLIT_COLOR[split], (split === "dev" ? 3 : 1.8) * (dash ? 0.75 : 1), dash, out)
      if (!dash) {
        for (const row of rows) {
          const at = p.y(value(row))
          const dy = split === "dev" ? -5 : at + 10 > bottom - 1 ? -12 : 10
          out.push(t(p.px(row.floor), at + dy, value(row).toFixed(digits), "middle", 5.5, SPLIT_TEXT[split]))
        }
      }
    }
  }

  const silentMax = Math.max(2, ...dev.map((row) => row.silentErrors), ...test.map((row) => row.silentErrors))
  lines(panel("(a) Silent errors", 36, 164, 0, silentMax, silentMax > 8 ? 2 : 1, (v) => `${v}`), (row) => row.silentErrors, false, 0)

  const toStaff = panel("(b) Sent to staff (%)", 212, 340, 0, 100, 20, (v) => `${v}`)
  lines(toStaff, (row) => 100 * row.staffRate, false, 0)
  lines(toStaff, (row) => (100 * row.staffNotNeeded) / row.requests, true, 0)

  const clarifyMax = Math.max(20, Math.ceil(Math.max(...dev.map((row) => 100 * row.clarifyRate), ...test.map((row) => 100 * row.clarifyRate)) / 20) * 20)
  lines(panel("(c) Went to Clarify (%)", 388, 500, 0, clarifyMax, clarifyMax > 60 ? 20 : 10, (v) => `${v}`), (row) => 100 * row.clarifyRate, false, 0)

  legend(40, 137, [["Dev", BLUE], ["Test", AMBER], [`Grey band: chosen floor (N = ${rounds})`, BAND]], out)
  legend(212, 137, [["Solid: to staff", GREY], ["Dashed: of these, not needed", GREY]], out)
  return svg(504, 146, out)
}

/**
 * Choosing the number of Clarify rounds N, at the chosen floor: for N = 0 and N = 1, the silent errors (a), the share sent to
 * staff (b), the share that went to Clarify (c), and the mean time per request (d), on the dev and the test split.
 */
function chooseRoundsChart(dev: readonly SweepRow[], test: readonly SweepRow[], chosen: number, floor: number): string {
  const out: string[] = []
  const [top, bottom] = [24, 110]
  const panels: { heading: string; x0: number; x1: number; value: (row: SweepRow) => number; digits: number; unit: number }[] = [
    { heading: "(a) Silent errors", x0: 34, x1: 118, value: (row) => row.silentErrors, digits: 0, unit: 1 },
    { heading: "(b) To staff (%)", x0: 158, x1: 242, value: (row) => 100 * row.staffRate, digits: 0, unit: 20 },
    { heading: "(c) To Clarify (%)", x0: 282, x1: 366, value: (row) => 100 * row.clarifyRate, digits: 0, unit: 20 },
    { heading: "(d) Time per request (s)", x0: 410, x1: 500, value: (row) => row.meanTotalS, digits: 1, unit: 20 },
  ]
  for (const p of panels) {
    const all = [...dev, ...test].map(p.value)
    const hi = p.unit === 1 ? Math.max(2, ...all) : Math.max(p.unit, Math.ceil(Math.max(...all) / p.unit) * p.unit)
    const step = p.unit === 1 ? (hi > 8 ? 2 : 1) : hi > 100 ? p.unit * 2 : p.unit
    out.push(title(p.x0 - 24, p.heading))
    const gw = (p.x1 - p.x0) / ROUNDS.length
    ROUNDS.forEach((n, i) => {
      if (n === chosen) out.push(rect(p.x0 + i * gw, top, gw, bottom - top, BAND))
    })
    const y = yAxis(p.x0, p.x1, top, bottom, 0, hi, step, (v) => `${v}`, out)
    ROUNDS.forEach((n, i) => {
      ;(["dev", "test"] as const).forEach((split, k) => {
        const row = (split === "dev" ? dev : test).find((candidate) => candidate.rounds === n)
        if (!row) return
        const v = p.value(row)
        const bx = p.x0 + i * gw + gw * (0.12 + k * 0.4)
        out.push(rect(bx, y(v), gw * 0.36, bottom - y(v), SPLIT_COLOR[split]), t(bx + gw * 0.18, y(v) - 2, v.toFixed(p.digits), "middle", 5.5, SPLIT_TEXT[split]))
      })
      out.push(t(p.x0 + (i + 0.5) * gw, bottom + 9, `N = ${n}`, "middle", 6.5))
    })
    out.push(t((p.x0 + p.x1) / 2, bottom + 19, "Clarify rounds", "middle", 6.5, "#4b5563"))
  }
  legend(34, 137, [["Dev", BLUE], ["Test", AMBER], [`Grey band: chosen N (floor ${floor})`, BAND]], out)
  return svg(504, 146, out)
}

/** The reliability diagram of Jev (all fields together) and the calibration error per field. */
function reliabilityChart(r: Results): string {
  const out: string[] = []
  out.push(title(0, "(a) Chance of answer against accuracy"))
  const [x0, x1, top, bottom] = [30, 140, 20, 118]
  const y = yAxis(x0, x1, top, bottom, 0, 1, 0.25, (v) => v.toFixed(2).replace(/0$/, ""), out)
  const x = (v: number) => x0 + v * (x1 - x0)
  out.push(t(8, (top + bottom) / 2, "accuracy", "middle", 6.5, "#4b5563", `transform="rotate(-90 8 ${(top + bottom) / 2})"`), line(x(0), y(0), x(1), y(1), "#9ca3af", 0.8), t(x0 + (x1 - x0) / 2, bottom + 18, "chance of the answer", "middle", 6.5, "#4b5563"))
  for (const v of [0, 0.25, 0.5, 0.75, 1]) out.push(t(x(v), bottom + 8, v === 0 || v === 1 ? `${v}` : v.toFixed(2).replace(/0$/, ""), "middle", 6, "#4b5563"))
  const pooled = new Map<number, { n: number; conf: number; right: number }>()
  for (const f of FIELDS) for (const b of r.reliability[f].chance_of_answer.bins) {
    const p = pooled.get(b.low) ?? { n: 0, conf: 0, right: 0 }
    pooled.set(b.low, { n: p.n + b.n, conf: p.conf + b.n * b.meanConfidence, right: p.right + b.n * b.accuracy })
  }
  const points = [...pooled.entries()].sort(([a], [b]) => a - b).map(([, p]) => ({ n: p.n, conf: p.conf / p.n, acc: p.right / p.n }))
  out.push(`<polyline points="${points.map((p) => `${x(p.conf).toFixed(1)},${y(p.acc).toFixed(1)}`).join(" ")}" fill="none" stroke="${BLUE}" stroke-width="1"/>`)
  for (const p of points) out.push(`<circle cx="${x(p.conf).toFixed(1)}" cy="${y(p.acc).toFixed(1)}" r="2.4" fill="${BLUE}"/>`, t(x(p.conf), y(p.acc) - 4.5, `n=${p.n}`, "middle", 5, "#4b5563"))

  out.push(title(200, "(b) Expected calibration error (lower is better)"))
  const [bx0, bx1] = [232, 500]
  const eceMax = Math.max(0.1, Math.ceil(Math.max(...FIELDS.flatMap((f) => [r.reliability[f].chance_of_answer.ece, r.reliability[f].reported_confidence.ece])) / 0.02) * 0.02)
  const by = yAxis(bx0, bx1, top, bottom, 0, eceMax, 0.02, (v) => v.toFixed(2), out)
  legend(bx0 + 4, 139, [["Chance of the answer", BLUE], ["Confidence Jev reports", AMBER]], out)
  const gw = (bx1 - bx0) / FIELDS.length
  FIELDS.forEach((f, i) => {
    const bars = [[r.reliability[f].chance_of_answer.ece, BLUE], [r.reliability[f].reported_confidence.ece, AMBER]] as const
    bars.forEach(([v, color], k) => {
      const px = bx0 + i * gw + gw * 0.12 + k * gw * 0.38
      out.push(rect(px, by(v), gw * 0.36, bottom - by(v), color), t(px + gw * 0.18, by(v) - 2, v.toFixed(3).slice(1), "middle", 5.5))
    })
    out.push(t(bx0 + (i + 0.5) * gw, bottom + 9, NAMES[f], "middle", 6.5))
  })
  return svg(504, 145, out)
}

/** Write figures/<name>.svg and figures/<name>.pdf into `out`. Returns the file names of the PDFs. */
export async function writeFigures(out: string, results: Results): Promise<string[]> {
  const directory = join(out, "figures")
  await mkdir(directory, { recursive: true })
  const { floor, rounds } = results.parameters
  const charts: Record<string, string> = { classifier: classifierChart(results), ladder: ladderChart(results), reliability: reliabilityChart(results) }
  const test = await readSweep(out, "test")
  const dev = await readSweep(out, "dev")
  if (test) charts.floor = floorChart(crossSections(test, "test", floor, rounds).byFloor)
  if (test && dev) {
    const onTest = crossSections(test, "test", floor, rounds)
    const onDev = crossSections(dev, "dev", floor, rounds)
    charts.choose_floor = chooseFloorChart(onDev.byFloor, onTest.byFloor, floor, rounds)
    charts.choose_rounds = chooseRoundsChart(onDev.byRounds, onTest.byRounds, rounds, floor)
  }
  const written: string[] = []
  for (const [name, text] of Object.entries(charts)) {
    const svgPath = join(directory, `${name}.svg`)
    await writeFile(svgPath, text, "utf8")
    const done = Bun.spawnSync(["rsvg-convert", "-f", "pdf", "-o", join(directory, `${name}.pdf`), svgPath])
    if (done.exitCode !== 0) throw new Error(`rsvg-convert failed for ${name}: ${done.stderr.toString()}`)
    written.push(`figures/${name}.pdf`)
  }
  return written
}
