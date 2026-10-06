#!/usr/bin/env bun
// The neutrality probe of the criteria: one Jev call on a state that carries no request.
//
// The request text is "N/A", the state carries no help article, and the five questions of Triage are the five questions of
// web/server/models.ts (the ones that the classifier gets in a real run). One option that wins with a high probability on this
// empty state is an option that the criteria push on their own, without any request. A flat distribution is the evidence that
// the criteria do not. Method: the content-free input of Zhao et al., Calibrate Before Use (arXiv:2102.09690), section 5.
//
// The call runs through the same recording transport as the experiment, so it is recorded under <out>/requests/jev/<sha256>.json
// and a second run replays it with the same numbers. The answer distributions are written to <out>/neutrality.json.
//
// Run: bun run experiment/neutrality.ts [--offline]
import { join } from "node:path"
import { writeFile } from "node:fs/promises"
import { JEV_URL, JEV_QUESTIONS, transport } from "../web/server/models"
import { installRecordedTransport } from "./transport"

const OUT = join(import.meta.dir, "results")
const offline = process.argv.includes("--offline")

/** The content-free state: no request, no article. The sender and the channel are the ones of a real chat. */
const STATE = { requester_type: "owner (account holder)", channel: "chat", text: "N/A", help_articles: "" }

interface JevAnswer {
  choice?: string
  probabilities?: Record<string, number>
  noul?: number | string
}

interface JevProbe {
  model: string
  usage: { input_tokens: number | string; output_tokens: number | string }
  answers: Record<string, JevAnswer>
}

/** The tests of the research note that this file does not run. The paper must not claim them. */
const NOT_CHECKED = [
  "the order test (the option order of a Choice is not permuted)",
  "the label-swap test (the option names are not replaced by neutral codes)",
  "the cue-ablation test (no criterion was run with its words removed)",
  "the reader test (no second reader applied the criteria by hand)",
  "the paraphrase test (no request was rewritten in other words)",
]

const { counters, modelsSeen } = installRecordedTransport({ out: OUT, cache: join(OUT, "requests"), offline, jevWorkers: 1, llmWorkers: 1 })
const { json, latencyS } = await transport.post<JevProbe>(JEV_URL, { state: STATE, model: "jev-latest", questions: JEV_QUESTIONS })

const questions: Record<string, { type: string; answer: string; probability: number; probabilities: Record<string, number> }> = {}
for (const [name, question] of Object.entries(JEV_QUESTIONS)) {
  const answer = json.answers[name]
  if (!answer) throw new Error(`Jev gave no answer for ${name}`)
  // A Choice question reports one probability per option; a Noul question reports the chance of yes.
  const probabilities =
    question.type === "choice"
      ? (answer.probabilities ?? {})
      : { true: Number(answer.noul), false: 1 - Number(answer.noul) }
  const best = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0]
  questions[name] = { type: question.type, answer: answer.choice ?? (Number(answer.noul) >= 0.5 ? "true" : "false"), probability: best?.[1] ?? 0, probabilities }
}

const report = {
  probe: "content-free state",
  method: "Zhao et al., Calibrate Before Use (arXiv:2102.09690): the five questions of Triage on a state with no request (text \"N/A\", no help article).",
  state: STATE,
  model: json.model,
  latency_s: latencyS,
  usage: json.usage,
  questions,
  live_calls: { jev: counters.jev.live, llm: counters.llm.live },
  cache_hits: { jev: counters.jev.cacheHits, llm: counters.llm.cacheHits },
  offline,
  not_checked: NOT_CHECKED,
}

await writeFile(join(OUT, "neutrality.json"), `${JSON.stringify(report, null, 1)}\n`, "utf8")
console.log(`models seen: ${modelsSeen().join(", ") || "none"}`)
console.log(`state: text "${STATE.text}", no help article`)
for (const [name, q] of Object.entries(questions)) {
  const list = Object.entries(q.probabilities)
    .sort((a, b) => b[1] - a[1])
    .map(([option, p]) => `${option} ${p.toFixed(3)}`)
    .join("  ")
  console.log(`${name.padEnd(10)} ${q.answer.padEnd(16)} ${list}`)
}
console.log(`live calls: jev ${counters.jev.live}, llm ${counters.llm.live}; cache hits: jev ${counters.jev.cacheHits}, llm ${counters.llm.cacheHits}`)
console.log(`written: ${join(OUT, "neutrality.json")}`)
