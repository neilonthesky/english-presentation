// The LaTeX tables of the paper. Every number comes from results.json (written by metrics.ts) or from
// the fault report inside it; nothing is typed by hand. The style is the one of the old tables.
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { Results } from "./metrics"
import { chanceBins, SWEEP_FOLDERS, sweepFolder } from "./sweep"

const pct = (value: number, digits = 1): string => (100 * value).toFixed(digits)

interface TableStyle {
  /** "table" fits one column of the paper; "table*" spans both columns. */
  wide?: boolean
  /** The space between columns, in points. The default of LaTeX is 6 pt. */
  sep?: number
}

function table(
  caption: string, label: string, spec: string, header: readonly string[], rows: readonly (readonly string[])[],
  style: TableStyle = {},
): string {
  const env = style.wide ? "table*" : "table"
  return [
    `\\begin{${env}}[t]`,
    `\\caption{${caption}}`,
    `\\label{${label}}`,
    "\\small",
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
  const split = results.split
  const written: Record<string, string> = {}

  const d = results.dataset
  written["data.tex"] = table(
    `The synthetic request set of the ${split} split.`,
    "tab:data",
    "lr",
    ["Item", "Value"],
    [
      ["Requests", `${d.requests}`],
      ["Request types", `${d.categories}`],
      ["Customers in the world", `${d.customers}`],
      ["Requests by owner / teammate", `${d.byRole.owner} / ${d.byRole.teammate}`],
      ["Hard cases (mixed requests)", `${d.hard}`],
      ["Risk flag should be on", `${pct(d.riskFlagShare)}\\%`],
      ["Priority is critical", `${pct(d.criticalShare)}\\%`],
      ["Injection attempts", `${pct(d.injectionShare)}\\%`],
      ["Final result is Queued (support staff)", `${d.finalToStaff}`],
      ["Final action differs from the asked action", `${d.finalDiffersFromGoldAction}`],
    ],
  )

  written["ladder.tex"] = table(
    `The three rungs of the ladder on the ${split} split. Each rung adds one part to the rung before. Staff and Clar. are the ` +
      "share of requests sent to support staff and the share that went to Clarify, in percent. Wrong is the number of wrong final " +
      "results: at rung 1 a request whose correct final result is Queued counts as wrong (no support staff help the customer), and " +
      "so does a run of an action other than the correct one; at rung 2 it is the silent errors. Harm is a wrong run of an " +
      "action that changes money or data. Mach.~s and \\$/1k are the machine time and the API cost per 1,000 requests, measured " +
      `over every model call of the pipeline (Jev at \\$${results.prices.jev.input} per million input tokens and free output tokens; ` +
      `the LLM off-peak at \\$${results.prices.llm.input.toFixed(2)} and \\$${results.prices.llm.output.toFixed(2)} per million output ` +
      `tokens). Total s adds the assumed ${results.staff_seconds}~s of support staff for each request that reaches Queued.`,
    "tab:ladder",
    ">{\\raggedright\\arraybackslash}p{2.2cm}rrrrrrr",
    ["Rung", "Staff", "Clar.", "Wrong", "Harm", "Mach. s", "\\$/1k", "Total s"],
    results.ladder.map((s) => [
      `${s.rung} ${s.name}`,
      pct(s.staffRate),
      pct(s.clarifyRate),
      `${s.wrongFinal}`,
      `${s.harmful}`,
      s.machineSeconds.toFixed(1),
      s.apiCost1000.toFixed(2),
      s.totalSeconds.toFixed(1),
    ]),
    { sep: 2 },
  )

  const { jev, llm } = results.systems
  const quality = results.classifier
  written["stage.tex"] = table(
    `The classifier stage on the ${split} split: Jev against the LLM baseline, over every classifier call (a Clarify round makes ` +
      "one more call). The tokens are the mean of one classifier call and the cost is in US dollars for 1,000 requests. Action " +
      "accuracy is the share of the requests whose action answer is the gold answer, and wrong in any field is the share with at " +
      "least one wrong scored field. Only Jev reports a chance, which the confidence floor reads.",
    "tab:stage",
    "lrr",
    ["Classifier stage", "Jev", "LLM"],
    [
      ["Median latency (s)", jev.classifierLatency.median.toFixed(3), llm.classifierLatency.median.toFixed(3)],
      ["95th percentile (s)", jev.classifierLatency.p95.toFixed(3), llm.classifierLatency.p95.toFixed(3)],
      ["Input tokens (per call)", jev.classifierTokens.inputPerCall.toFixed(0), llm.classifierTokens.inputPerCall.toFixed(0)],
      ["Output tokens (per call)", jev.classifierTokens.outputPerCall.toFixed(0), llm.classifierTokens.outputPerCall.toFixed(0)],
      ["Action accuracy (\\%)", pct(quality.jev.perField.action.accuracy), pct(quality.llm.perField.action.accuracy)],
      ["Wrong in any field (\\%)", pct(quality.jev.wrongAnyFieldRate), pct(quality.llm.wrongAnyFieldRate)],
      ["Cost per 1k requests (\\$)", jev.classifierCostPer1000.toFixed(3), llm.classifierCostPer1000.toFixed(3)],
    ],
  )

  written["fault.tex"] = table(
    "Fault injection with forged classifier answers. Unsafe means a state-changing action ran that the written rules do not allow.",
    "tab:fault",
    "lrrrrr",
    ["Case", "Requests", "Unsafe", "Denied by Rules check", "To staff", "Right result"],
    Object.entries(results.fault.groups).map(([name, group]) => [
      name,
      `${group.requests}`,
      `${group.unsafe}`,
      `${group.denied}`,
      `${group.toStaff}`,
      `${group.right}`,
    ]),
    { wide: true },
  )

  // The answers of the queue, the action, and the risk flag by chance: the evidence for the floor. The dev run is optional.
  const test = await chanceBins(join(out, "per_case.json"))
  const devPath = join(out, SWEEP_FOLDERS.dev, sweepFolder(results.parameters.floor, results.parameters.rounds), "per_case.json")
  const dev = (await Bun.file(devPath).exists()) ? await chanceBins(devPath) : null
  if (!dev) console.error(`calibration table without dev columns: ${devPath} is missing. Run the dev sweep first (see experiment/README.md).`)
  const cell = (bin: { n: number; wrong: number }): string[] => [`${bin.n}`, `${bin.wrong}`, bin.n ? pct(bin.wrong / bin.n) : "--"]
  written["calibration.tex"] = table(
    "Wrong answers of the queue, the action, and the risk flag of Jev by the chance of the answer, in the first pass. The floor reads these three answers.",
    "tab:calibration",
    dev ? "lrrrrrr" : "lrrr",
    dev ? ["Chance", "Dev n", "Wrong", "\\%", "Test n", "Wrong", "\\%"] : ["Chance", "Test n", "Wrong", "\\%"],
    test.map((bin, i) => [bin.label, ...(dev ? cell(dev[i]) : []), ...cell(bin)]),
  )

  for (const [name, text] of Object.entries(written)) await writeFile(join(directory, name), text, "utf8")
  return Object.keys(written).sort()
}
