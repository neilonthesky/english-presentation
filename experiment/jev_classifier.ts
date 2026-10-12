// Triage, part 1, of the experiment: the first Jev call of Level 3. It gets the input of `classifierState()` of
// web/server/models.ts: the customer text of the chat, the sender, the channel, and the matching help articles. Level 2 runs no
// classifier at all: it is the LLM agent of llm_agent.ts.
//
// `classifyWithJev` is the classifier of the demo (`classify()` of web/server/models.ts). It runs through the recording
// transport, and the raw JSON of the answer is kept here: `classify()` drops the `confidence` that Jev reports for a choice
// field, which the calibration table needs.
import type { Classifier, Requester } from "../web/src/types"
import { classify } from "../web/server/models"
import { withCallLog } from "./transport"

/** The classifier answers of one request, and what it took to get them. */
export interface ClassifierRun {
  /** null when the answer was not valid, so the pipeline must fail closed: nothing runs. */
  classifier: Classifier | null
  invalidReason: string | null
  model: string
  latencyS: number
  inputTokens: number
  outputTokens: number
  /** The answer as Jev gave it: the parsed JSON. */
  raw: unknown
}

/** The classifier of one chat: the customer text so far, and the sender. */
export type Classify = (text: string, who: Requester) => Promise<ClassifierRun>

/** The system under test: the Jev classifier of web/server/models.ts. */
export const classifyWithJev: Classify = async (text, who) => {
  const { result, calls } = await withCallLog(() => classify(text, who))
  return {
    classifier: result,
    invalidReason: null,
    model: result.model,
    latencyS: result.latencyS,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    raw: calls[0]?.raw ?? null,
  }
}
