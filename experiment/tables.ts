// The LaTeX tables of the paper. Every number comes from results.json (written by metrics.ts),
// or from the per-case records; nothing is typed by hand.
// The style is the one of the old tables.
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { Results } from "./metrics"

const pct = (value: number, digits = 1): string => (100 * value).toFixed(digits)

interface TableStyle {
  /** "table" fits one column of the paper; "table*" spans both columns. */
  wide?: boolean
  /** The space between columns, in points. The default of LaTeX is 6 pt. */
  sep?: number
  /** The float placement specifier. The default is "t". */
  place?: string
  /** The size command of the table. The default is "\small". */
  font?: string
}

function table(
  caption: string, label: string, spec: string, header: readonly string[], rows: readonly (readonly string[])[],
  style: TableStyle = {},
): string {
  const env = style.wide ? "table*" : "table"
  return [
    `\\begin{${env}}[${style.place ?? "t"}]`,
    `\\caption{${caption}}`,
    `\\label{${label}}`,
    style.font ?? "\\small",
    ...(style.sep === undefined ? [] : [`\\setlength{\\tabcolsep}{${style.sep}pt}`]),
    `\\begin{tabular}{${spec}}`,
    "\\toprule",
    `${header.join(" & ")} \\\\`,
    "\\midrule",
    ...rows.map((row) => `${row.join(" & ")} \\\\`),
    "\\bottomrule",
    "\\end{tabular}",
    `\\end{${env}}`,
    "",
  ].join("\n")
}

export async function writeTables(out: string, results: Results): Promise<string[]> {
  const directory = join(out, "tables")
  await mkdir(directory, { recursive: true })
  const written: Record<string, string> = {}

  const ladderRow = (s: (typeof results.ladder)[number]): readonly string[] =>
    s.level === 0
      ? [`${s.level + 1} ${s.name}`, "--", "--", "--", "--", "--", "--", s.totalSeconds.toFixed(1)]
      : [
          `${s.level + 1} ${s.name}`,
          `${s.served}`,
          `${s.stopped}`,
          `${s.errors}`,
          `${s.harmful}`,
          s.machineSeconds.toFixed(1),
          s.apiCost1000.toFixed(2),
          s.totalSeconds.toFixed(1),
        ]
  written["ladder.tex"] = table(
    "The three levels on the 50 requests. Served counts a request that ends with the result it needs. Stopped counts a request " +
      "whose correct action a written rule denies and the check of the level stopped (the fixed rules check at Level 3, the agent itself at Level 2): the flow runs nothing and the Final message tells the customer what the chat cannot do. " +
      "Errors counts every other run, and Harm the errors that run an action which changes money, a plan, stored data, or a password. Mach.~s is the machine " +
      "time, \\$/1k the API cost for 1,000 requests, and Total s the total time (the assumed 90~s of staff work at Level 1). " +
      "Level 1 is the baseline, so its outcome columns are marked --.",
    "tab:ladder",
    ">{\\raggedright\\arraybackslash}p{1.7cm}rrrrrrr",
    ["Level", "Served", "Stopped", "Errors", "Harm", "Mach. s", "\\$/1k", "Total s"],
    results.ladder.map(ladderRow),
    { sep: 1.5 },
  )

  const { jev, llm } = results.systems
  const quality = results.classifier
  written["stage.tex"] = table(
    `Jev against the LLM as classifier, over every classifier call of the 50 requests. The tokens are the ` +
      "mean of one call and the cost is for 1,000 requests. Wrong in any field is the share of requests with at least one wrong " +
      "scored field. Only Jev reports a confidence, which the calibration table reads.",
    "tab:stage",
    "lrr",
    ["Classifier call", "Jev", "LLM"],
    [
      ["Median latency (s)", jev.decisionLatency.median.toFixed(3), llm.decisionLatency.median.toFixed(3)],
      ["95th percentile (s)", jev.decisionLatency.p95.toFixed(3), llm.decisionLatency.p95.toFixed(3)],
      ["Input tokens (per call)", jev.decisionTokens.inputPerCall.toFixed(0), llm.decisionTokens.inputPerCall.toFixed(0)],
      ["Output tokens (per call)", jev.decisionTokens.outputPerCall.toFixed(0), llm.decisionTokens.outputPerCall.toFixed(0)],
      ["Action accuracy (\\%)", pct(quality.jev.perField.action.accuracy), pct(quality.llm.perField.action.accuracy)],
      ["Wrong in any field (\\%)", pct(quality.jev.wrongAnyFieldRate), pct(quality.llm.wrongAnyFieldRate)],
      ["Cost per 1k requests (\\$)", jev.decisionCostPer1000.toFixed(3), llm.decisionCostPer1000.toFixed(3)],
    ],
  )

  // The answers of the topic, the action, and the risk flag by confidence: the classifier quality that the calibration table reports.
  const test = await chanceBins(join(out, "per_case.json"))
  const cell = (bin: { n: number; wrong: number }): string[] => [`${bin.n}`, `${bin.wrong}`, bin.n ? pct(bin.wrong / bin.n) : "--"]
  written["calibration.tex"] = table(
    "Wrong answers of the topic, the action, and the risk flag of Jev by the confidence of the answer.",
    "tab:calibration",
    "lrrr",
    ["Confidence", "n", "Wrong", "\\%"],
    test.map((bin) => [bin.label, ...cell(bin)]),
  )

  for (const [name, text] of Object.entries(written)) await writeFile(join(directory, name), text, "utf8")
  return Object.keys(written).sort()
}

export interface ChanceBin {
  label: string
  /** Answers of the topic, the action, and the risk flag with a chance in [low, high). */
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
  classifier: { fields: Record<string, { value: unknown; chance: number | null }> }
}

/** How often the three answers that carry a chance (topic, action, risk flag) are wrong, by the chance of the answer. */
export async function chanceBins(perCasePath: string): Promise<ChanceBin[]> {
  const perCase: { jev: (JevCase | { failure: string })[] } = await Bun.file(perCasePath).json()
  const bins = BINS.map((bin) => ({ label: bin.label, n: 0, wrong: 0 }))
  for (const record of perCase.jev) {
    if ("failure" in record) continue
    for (const field of ["queue", "action", "risk"]) {
      if (!record.scored.includes(field)) continue
      const answer = record.classifier.fields[field]
      if (answer.chance === null) continue
      const index = BINS.findIndex((bin) => answer.chance! >= bin.low && answer.chance! < bin.high)
      bins[index].n++
      bins[index].wrong += answer.value === record.gold[field] ? 0 : 1
    }
  }
  return bins
}
