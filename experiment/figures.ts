// The charts of the paper, drawn from results.json: SVG text, then one PDF per chart with rsvg-convert.
// The paper includes the PDFs with \includegraphics, so LaTeX has no drawing to compute (Overleaf compiles fast).
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { Cascade, Gate } from "./cascade"
import type { Results } from "./metrics"
import { FIELDS, type Field } from "./types"

const NAMES: Record<Field, string> = { queue: "Topic", action: "Action", priority: "Priority", risk: "Risk", injection: "Injection" }
const BLUE = "#2563eb"
const AMBER = "#f59e0b"
const SLATE = "#64748b"
const RED = "#dc2626"

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

/** The three levels of the ladder: the outcome of the requests (served, stopped, errors), mean time per request, and the API cost per 1,000 requests. */
function ladderChart(r: Results): string {
  const out: string[] = []
  const steps = r.ladder
  const labels = [["Level 1", "Staff only"], ["Level 2", "LLM agent"], ["Level 3", "Jev + LLM"]]
  const DARK_RED = "#7f1d1d"
  const GREY = "#9ca3af"
  const [top, bottom] = [22, 106]
  /** The size of the set: the axis of (a) and the one grey block of Level 1. */
  const all = r.requests

  // (a) the outcome of each level: served, stopped by design, and errors, with the harmful part of the errors on top of a stack
  out.push(title(24, `(a) Outcome of the ${all} requests`))
  const [ax0, ax1] = [24, 164]
  const ay = yAxis(ax0, ax1, top, bottom, 0, all, all <= 60 ? 10 : 20, (v) => `${v}`, out)
  const gw = (ax1 - ax0) / steps.length
  const stepLabels = (x0: number, x1: number): void => {
    const w = (x1 - x0) / steps.length
    steps.forEach((_, i) => {
      out.push(t(x0 + (i + 0.5) * w, bottom + 9, labels[i][0], "middle", 6), t(x0 + (i + 0.5) * w, bottom + 17, labels[i][1], "middle", 6))
    })
  }
  const stackLabel = (x: number, lo: number, hi: number, value: string, fill: string): void => {
    const middle = (ay(lo) + ay(hi)) / 2 + 2.2
    if (ay(lo) - ay(hi) >= 7) out.push(t(x, middle, value, "middle", 6.5, fill))
  }
  steps.forEach((s, i) => {
    const bx = ax0 + i * gw + gw * 0.2
    const bw = gw * 0.6
    const cx = bx + bw / 2
    if (s.level === 0) {
      // Level 1 is the reference: the study assumes that staff serve every request, so the bar is one grey block.
      out.push(rect(bx, ay(all), bw, bottom - ay(all), GREY), t(cx, (ay(all) + bottom) / 2 + 2.2, `${all}`, "middle", 6.5, "#ffffff"))
      return
    }
    const served = s.served
    const stopped = served + s.stopped
    const errors = stopped + s.errors
    out.push(rect(bx, ay(served), bw, bottom - ay(served), BLUE))
    out.push(rect(bx, ay(stopped), bw, ay(served) - ay(stopped), AMBER))
    out.push(rect(bx, ay(errors), bw, ay(stopped) - ay(errors), RED))
    // The harmful errors are the lowest part of the error stack; there are none in this run.
    if (s.harmful > 0) out.push(rect(bx, ay(stopped + s.harmful), bw, ay(stopped) - ay(stopped + s.harmful), DARK_RED))
    stackLabel(cx, 0, served, `${served}`, "#ffffff")
    stackLabel(cx, served, stopped, `${s.stopped}`, "#111827")
    stackLabel(cx, stopped, errors, `${s.errors}`, "#ffffff")
  })
  stepLabels(ax0, ax1)
  const harmfulTotal = steps.reduce((sum, s) => sum + s.harmful, 0)
  legend(ax0 - 18, 137, [["Served", BLUE], ["Stopped", AMBER], ["Errors", RED], [`Harmful (${harmfulTotal})`, DARK_RED]], out)
  legend(ax0 - 18, 147, [["Staff only (assumed)", GREY]], out)

  // (b) mean time per request: the machine time, and the assumed staff time of the reference level
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
  legend(bx0 + 6, 137, [["Machine", SLATE], [`Staff (assumed ${r.staff_seconds} s, Level 1)`, AMBER]], out)

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
  return svg(520, 156, out)
}

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

/**
 * The confidence cascade of the recorded answers: (a) the risk-coverage curve of Jev alone with abstention, (b) the
 * action-label accuracy of the cascade to the LLM against the coverage, for the two gates, and (c) the escalation of
 * a wrong action label (precision against recall), with the chance level of the request set.
 */
export function cascadeChart(c: Cascade): string {
  const GREY = "#9ca3af"
  const out: string[] = []
  const [top, bottom] = [20, 112]
  const ticks = (x: (v: number) => number): void => {
    for (const v of [0, 0.25, 0.5, 0.75, 1]) out.push(t(x(v), bottom + 8, v === 0 || v === 1 ? `${v}` : v.toFixed(2).replace(/0$/, ""), "middle", 6, "#4b5563"))
  }
  const polyline = (points: readonly (readonly [number, number])[], color: string): void => {
    out.push(`<polyline points="${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="1"/>`)
    for (const [x, y] of points) out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.7" fill="${color}"/>`)
  }

  // (a) the risk-coverage curve of Jev alone: the action error rate of the answered requests against the coverage
  out.push(title(20, "(a) Jev alone: risk against coverage"))
  const [ax0, ax1] = [34, 170]
  const risk = c.riskCoverage
  const ay = yAxis(ax0, ax1, top, bottom, 0, 20, 5, (v) => `${v}`, out)
  const ax = (v: number) => ax0 + v * (ax1 - ax0)
  out.push(t(10, (top + bottom) / 2, "action error rate (%)", "middle", 6.5, "#4b5563", `transform="rotate(-90 10 ${(top + bottom) / 2})"`))
  ticks(ax)
  out.push(t((ax0 + ax1) / 2, bottom + 17, "coverage (share answered by Jev)", "middle", 6.5, "#4b5563"))
  polyline([...risk.points].sort((p, q) => p.coverage - q.coverage).map((p) => [ax(p.coverage), ay(100 * p.risk)] as const), BLUE)
  const llmRisk = 100 * (1 - c.labelEnds.llm.actionAccuracy)
  out.push(line(ax0, ay(llmRisk), ax1, ay(llmRisk), GREY, 0.8), t(ax1 - 2, ay(llmRisk) - 3, `LLM alone ${llmRisk.toFixed(1)}`, "end", 6, "#6b7280"))
  out.push(t(ax0 + 2, ay(0) - 3, `AURC ${risk.aurc.toFixed(3)}`, "start", 6, "#4b5563"))
  legend(ax0, 138, [["Jev alone", BLUE], ["LLM alone, no abstention", GREY]], out)

  // (b) the action-label accuracy of the cascade to the LLM, against the coverage, for the two gates
  out.push(title(200, "(b) The cascade to the LLM: action accuracy"))
  const [bx0, bx1] = [232, 368]
  const by = yAxis(bx0, bx1, top, bottom, 80, 95, 5, (v) => `${v}`, out)
  const bx = (v: number) => bx0 + v * (bx1 - bx0)
  out.push(t(206, (top + bottom) / 2, "action correct (%)", "middle", 6.5, "#4b5563", `transform="rotate(-90 206 ${(top + bottom) / 2})"`))
  ticks(bx)
  out.push(t((bx0 + bx1) / 2, bottom + 17, "coverage (share answered by Jev)", "middle", 6.5, "#4b5563"))
  const ends: readonly (readonly [Gate, string])[] = [["action", BLUE], ["decision", AMBER]]
  for (const [gate, color] of ends)
    polyline(
      c.labelQuality.filter((l) => l.gate === gate).sort((p, q) => p.coverage - q.coverage).map((l) => [bx(l.coverage), by(100 * l.actionAccuracy)] as const),
      color,
    )
  const jevAccuracy = 100 * c.labelEnds.jev.actionAccuracy
  const llmAccuracy = 100 * c.labelEnds.llm.actionAccuracy
  out.push(
    line(bx0, by(llmAccuracy), bx1, by(llmAccuracy), GREY, 0.8), t(bx0 + 2, by(llmAccuracy) - 3, `LLM alone ${llmAccuracy.toFixed(1)}`, "start", 6, "#6b7280"),
    line(bx0, by(jevAccuracy), bx1, by(jevAccuracy), GREY, 0.8), t(bx1 - 2, by(jevAccuracy) + 8, `Jev alone ${jevAccuracy.toFixed(1)}`, "end", 6, "#6b7280"),
  )
  legend(bx0, 138, [["Action gate", BLUE], ["Decision gate", AMBER]], out)

  // (c) escalating a wrong action label: the precision against the recall, both gates, with the chance level
  out.push(title(390, "(c) Escalating a wrong action"))
  const [cx0, cx1] = [430, 514]
  const cy = yAxis(cx0, cx1, top, bottom, 0, 50, 10, (v) => `${v}`, out)
  const cx = (v: number) => cx0 + v * (cx1 - cx0)
  out.push(t(404, (top + bottom) / 2, "precision (%)", "middle", 6.5, "#4b5563", `transform="rotate(-90 404 ${(top + bottom) / 2})"`))
  ticks(cx)
  out.push(t((cx0 + cx1) / 2, bottom + 17, "recall of the errors", "middle", 6.5, "#4b5563"))
  const chance = 100 * (1 - c.labelEnds.jev.actionAccuracy)
  out.push(line(cx0, cy(chance), cx1, cy(chance), GREY, 0.8), t(cx0 + 2, cy(chance) - 3, `chance level ${chance.toFixed(0)}`, "start", 6, "#6b7280"))
  for (const [gate, color] of ends) {
    const view = c.escalation.find((e) => e.gate === gate)
    if (!view) continue
    polyline(view.points.filter((p) => p.precision !== null).map((p) => [cx(p.recall), cy(100 * (p.precision ?? 0))] as const), color)
  }
  legend(cx0 - 14, 138, [["Action gate", BLUE], ["Decision gate", AMBER]], out)

  return svg(524, 148, out)
}

/** Write one chart as `figures/<name>.svg` and `figures/<name>.pdf` under `out`; returns the file name of the PDF. */
export async function writeChart(out: string, name: string, text: string): Promise<string> {
  const directory = join(out, "figures")
  await mkdir(directory, { recursive: true })
  const svgPath = join(directory, `${name}.svg`)
  await writeFile(svgPath, text, "utf8")
  const done = Bun.spawnSync(["rsvg-convert", "-f", "pdf", "-o", join(directory, `${name}.pdf`), svgPath])
  if (done.exitCode !== 0) throw new Error(`rsvg-convert failed for ${name}: ${done.stderr.toString()}`)
  return `figures/${name}.pdf`
}

/** Write figures/<name>.svg and figures/<name>.pdf into `out`. Returns the file names of the PDFs. */
export async function writeFigures(out: string, results: Results): Promise<string[]> {
  const charts: Record<string, string> = { classifier: classifierChart(results), ladder: ladderChart(results), reliability: reliabilityChart(results) }
  const written: string[] = []
  for (const [name, text] of Object.entries(charts)) written.push(await writeChart(out, name, text))
  return written
}
