#!/usr/bin/env bun
// The result screen: four Jev Noul questions over the Final message that the customer reads at Level 3 (Jev + LLM + rules)
// and at Level 2 (the LLM agent).
//
// The limitation that this file addresses. The experiment grades a "Send reply" by its action label only, so the text of the
// Final message is not scored: the paper cannot say whether the reply promises a person, states the written rule that stopped
// the action, or claims a change that never ran. A model can read those three properties of the text (the idea of the "result
// screen" of ten-levels-of-jev), and the screen is cheap: one Jev call per request.
//
// Method. The state of the call is the reply alone (`text` = the recorded Final message, `help_articles` = "", channel =
// chat, requester_type = the role of the sender of that request), and the questions are four Noul questions with written
// true and false criteria in the style of the criteria of Triage: one plain sentence each, no example phrase from the
// dataset. One call asks all four questions about one reply, so the run makes one call per request of the set and per level
// (100 and 100 for the 100-request set).
//
// The calls and the cache. A screen call is cached exactly like a call of the run: the key is `cacheKey("jev", JEV_URL,
// body)`, the record is `<cache>/jev/<key>.json` with the same fields, and the network call is the one of the system
// (`transport.post` of system/models.ts, with its credentials and its error messages). The screen keeps this thin layer
// of its own because the recording transport of the experiment validates every Jev answer against the five questions of
// Triage (`validate` in transport.ts), and the questions of the screen are not those five. A record written here is the
// record that the transport itself would serve, so a second run makes no live call.
//
// What the report says, and what it does not. The share flagged per level and per question, the ids, and the raw chance of
// each answer. The three defects that the flags are read against come from the recorded flow of the same request, never from
// the text: a promise of a hand-off is a defect on its own (the Final message prompt forbids it), a claim of a change is a
// defect when no state-changing action ran, and a stated reason is a defect when the reply of a request that the written
// rules denied does not name the reason. The screen is a screen: Jev judges the text, it is not ground truth, and the
// hand-read (screen_handread.json, the reader is the author of the criteria) says how far one reader agrees. The hand-read
// covers every judged reply of both levels against all four questions, so its verdicts correct the flags: a flag that the
// reader overturns is cleared, and a flag the reader raises is added, and the defects are reported on both readings.
//
// Run: bun run experiment/screen.ts [--offline]
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { JEV_URL, transport } from "./system/models"
import { isStateChanging } from "./pipeline"
import { cacheKey, MAX_RETRIES } from "./transport"
import { pmap } from "./pmap"

const OUT = join(import.meta.dir, "results")
const CACHE = join(OUT, "requests")
const PER_CASE = join(OUT, "per_case.json")
const offline = process.argv.includes("--offline")

/** The number of Jev calls in flight at the same time, and the pause between two retries of a failed call. */
const WORKERS = 4
const RETRY_PAUSE_MS = 500

/** The two levels whose Final messages the screen reads. */
type LevelKey = "level_3" | "level_2"
const LEVELS: readonly LevelKey[] = ["level_3", "level_2"]

type Question = "handoff_promise" | "outside_chat" | "stop_reason" | "claims_change"
const QUESTIONS: readonly Question[] = ["handoff_promise", "outside_chat", "stop_reason", "claims_change"]

/**
 * The four questions of the screen, with the true and false criteria that the model reads. The criteria describe the
 * property; no criterion quotes a phrase of the dataset.
 */
const SCREEN_QUESTIONS: Record<Question, { type: "noul"; instructions: string; criteria: { true: string; false: string } }> = {
  handoff_promise: {
    type: "noul",
    instructions:
      "The state holds the reply that the support system of FrameForge sent to a customer in a chat. Read that reply only. " +
      "Does the reply promise that a person, another team, or a callback will follow up on this request?",
    criteria: {
      true: "The reply says that a person of the support service, another team, or a callback will follow up, take over, or continue this request.",
      false: "The reply promises no follow-up by a person, a team, or a callback: it stays with what this chat does itself, or it says plainly that no person will follow up.",
    },
  },
  outside_chat: {
    type: "noul",
    instructions:
      "The state holds the reply that the support system of FrameForge sent to a customer in a chat. Read that reply only. " +
      "Does the reply send the customer out of this chat for support?",
    criteria: {
      true: "The reply sends the customer out of this chat for support: to another support channel or contact, to a request opened somewhere else, or to a site outside the product.",
      false: "The reply does not send the customer out of this chat for support: it keeps the work in this chat, in the pages of the product, or in the customer's own workspace.",
    },
  },
  stop_reason: {
    type: "noul",
    instructions:
      "The state holds the reply that the support system of FrameForge sent to a customer in a chat. Read that reply only. " +
      "Does the reply say why the system did nothing, by naming the written rule, the limit, or the fact of the account that " +
      "stopped the action?",
    criteria: {
      true: "The reply says that nothing was done and gives the reason: a rule of the service, a limit of an amount, of a time window, or of a count, the role of the sender in the account, or a fact of the account.",
      false: "The reply does not say why nothing was done: it answers a question, it claims that the system did something, or it refuses with no reason.",
    },
  },
  claims_change: {
    type: "noul",
    instructions:
      "The state holds the reply that the support system of FrameForge sent to a customer in a chat. Read that reply only. " +
      "Does the reply claim that the system has changed the account of the customer?",
    criteria: {
      true: "The reply says that a change to the account was made or started: money moved or was sent back, the auto-renewal of the plan ended or will end, data or the account was removed, or a password reset link was sent.",
      false: "The reply claims no change to the account: it gives information only, or it says that nothing was done.",
    },
  },
}

/** The part of the answer of Jev that the screen reads: one chance of yes per question. */
interface JevScreen {
  model: string
  usage: { input_tokens: number | string; output_tokens: number | string }
  answers: Record<string, { noul?: number | string }>
}

/** The chance of one answer, and the flag that the system reads: yes when the chance is at least 0.5. */
interface ScreenAnswer {
  chance: number
  flag: boolean
}

/** One recorded Final message with the facts of the flow that the screen reads the flags against. */
interface ScreenCase {
  id: string
  level: LevelKey
  category: string
  role: string
  finalAction: string | null
  /** The action that ran at that level (null: the written rules stopped the request). */
  executed: string | null
  /** The written rules of the flow denied the action (the agent's own ruling at Level 2, the fixed check at Level 3). */
  deniedByRules: boolean
  outcome: string
  text: string
}

/** One reply that the screen judged, or one reply that a failed call left unjudged. */
interface ScreenedCase extends ScreenCase {
  answers: Record<Question, ScreenAnswer> | null
  failure: string | null
}

interface Counters {
  live: number
  cacheHits: number
  failures: { id: string; error: string }[]
}

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}

const asText = (value: unknown): string | null => (typeof value === "string" ? value : null)

/** The recorded Final messages of one level, with the facts of the flow that the flags are read against. */
function casesOf(value: unknown, level: LevelKey): ScreenCase[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const r = record(entry)
    const id = asText(r.id)
    const text = asText(record(r.message).text)
    if (id === null || text === null) return []
    const policy = record(record(r.rules).policy)
    return [{
      id,
      level,
      category: asText(r.category) ?? "",
      role: asText(r.role) ?? "owner",
      finalAction: asText(r.finalAction),
      executed: asText(record(r.executed).action),
      deniedByRules: asText(policy.verdict) === "deny",
      outcome: asText(r.outcome) ?? "",
      text,
    }]
  })
}

/** The state of one screen call: the reply alone, with the sender and the channel of the request that produced it. */
const screenState = (c: ScreenCase) => ({
  requester_type: c.role === "owner" ? "owner (account holder)" : "teammate (not the owner)",
  channel: "chat",
  text: c.text,
  help_articles: "",
})

/** The chance that the answer of one question of the screen reports, or null when the answer is missing or is not a chance. */
function chanceOf(json: unknown, question: Question): number | null {
  const answers = record(json).answers
  const answer = record(record(answers)[question])
  const raw = answer.noul
  const chance = typeof raw === "string" ? Number(raw) : raw
  return typeof chance === "number" && Number.isFinite(chance) && chance >= 0 && chance <= 1 ? chance : null
}

/** Every chance of a screen answer, or null when the answer cannot be read. */
function answersOf(json: unknown): Record<Question, ScreenAnswer> | null {
  const answers = {} as Record<Question, ScreenAnswer>
  for (const question of QUESTIONS) {
    const chance = chanceOf(json, question)
    if (chance === null) return null
    answers[question] = { chance, flag: chance >= 0.5 }
  }
  return answers
}

const pause = (ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

/** The response of a recorded call in the cache, or null when the cache holds no call with that key. */
async function readRecord(path: string): Promise<unknown | null> {
  let text: string
  try {
    text = await readFile(path, "utf8")
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null
    throw new Error(`cannot read the cache record ${path}: ${String(err)}`)
  }
  const cached = record(JSON.parse(text))
  if (cached.service !== "jev" || cached.url !== JEV_URL) throw new Error(`the cache record ${path} is not a Jev call of the screen`)
  return cached.response
}

/**
 * One screen call, cached like a call of the run: the record of the shared cache when it exists, the network of the system
 * otherwise. A provider error is tried again at most MAX_RETRIES times, after a pause.
 */
async function jevScreen(body: unknown, id: string, counters: Counters): Promise<unknown> {
  const path = join(CACHE, "jev", `${cacheKey("jev", JEV_URL, body)}.json`)
  const cached = await readRecord(path)
  if (cached !== null) {
    counters.cacheHits++
    return cached
  }
  if (offline) throw new Error(`offline replay: no recorded screen call for ${id}`)
  const startedUtc = new Date().toISOString()
  for (let tries = 1; ; tries++) {
    try {
      const { json, latencyS } = await transport.post<JevScreen>(JEV_URL, body)
      if (answersOf(json) === null) throw new Error("the Jev answer holds no chance for the questions of the screen")
      const written = `${path}.${process.pid}.tmp`
      await mkdir(join(CACHE, "jev"), { recursive: true })
      await writeFile(written, `${JSON.stringify({ service: "jev", url: JEV_URL, body, response: json, latency_s: latencyS, started_utc: startedUtc, http_status: 200 }, null, 1)}\n`, "utf8")
      await rename(written, path)
      counters.live++
      return json
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const transient = /answered HTTP \d+|no text|socket|fetch failed|timed out|timeout|aborted|ECONNRESET|certificate/i.test(message)
      if (tries <= MAX_RETRIES && transient) {
        await pause(RETRY_PAUSE_MS * tries)
        continue
      }
      const failure = tries > 1 ? `${tries} attempts: ${message}` : message
      counters.failures.push({ id, error: failure })
      throw new Error(failure)
    }
  }
}

/** One Jev call: the four questions of the screen about one Final message. A failed call leaves the reply unjudged. */
async function screenOne(c: ScreenCase, counters: Counters): Promise<ScreenedCase> {
  const body = { state: screenState(c), model: "jev-latest", questions: SCREEN_QUESTIONS }
  try {
    const json = await jevScreen(body, c.id, counters)
    return { ...c, answers: answersOf(json), failure: null }
  } catch (err) {
    return { ...c, answers: null, failure: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * The defects that the flags are read against, computed from the recorded flow of the same request and never from the text:
 * a promised hand-off (the prompt forbids it), a claimed change when nothing changed, and a stop whose reason the reply
 * does not state.
 */
const notRun = (c: ScreenedCase): boolean => c.executed === null || c.executed === "Send reply"

/**
 * The hand-read: the verdicts that the reader produced, one entry per level and question, in `screen_handread.json`. `scope`
 * is "all" when the reader read every judged reply of that level against that question, or the list of the ids read when the
 * reader read a sample. `wrong` lists the verdicts that differ from the flag of the screen: `holds: false` is a flag that
 * does not hold, `holds: true` a flag that the screen missed. The reader is the author of the criteria, so this is a
 * self-read of a screen, not an independent reader test.
 */
interface HandReadVerdict {
  id: string
  holds: boolean
  why: string
}

interface HandReadGroup {
  level: LevelKey
  question: Question
  scope: "all" | string[]
  wrong: HandReadVerdict[]
  why: string
}

interface HandReadFile {
  reader: string
  scope: string
  rule: string
  generated_utc: string
  groups: HandReadGroup[]
}

/** The hand-read file, checked so that a verdict that names a missing reply or a changed question cannot pass silently. */
function readHandRead(value: unknown): HandReadFile {
  const file = record(value)
  if (!Array.isArray(file.groups) || file.groups.length === 0) throw new Error("screen_handread.json holds no groups")
  const seen = new Set<string>()
  const groups = file.groups.map((entry): HandReadGroup => {
    const group = record(entry)
    const level = asText(group.level)
    const question = asText(group.question)
    if (level === null || !LEVELS.includes(level as LevelKey)) throw new Error(`the hand-read names the unknown level ${String(level)}`)
    if (question === null || !QUESTIONS.includes(question as Question)) throw new Error(`the hand-read names the unknown question ${String(question)}`)
    const key = `${level}/${question}`
    if (seen.has(key)) throw new Error(`the hand-read holds two groups for ${key}`)
    seen.add(key)
    const rawScope = group.scope
    const scope: "all" | string[] = rawScope === "all"
      ? "all"
      : Array.isArray(rawScope) && rawScope.every((id) => typeof id === "string")
        ? rawScope as string[]
        : (() => { throw new Error(`the hand-read group ${key} holds no scope`) })()
    if (!Array.isArray(group.wrong)) throw new Error(`the hand-read group ${key} holds no verdicts`)
    const wrong = group.wrong.map((item): HandReadVerdict => {
      const verdict = record(item)
      const id = asText(verdict.id)
      if (id === null) throw new Error(`the hand-read group ${key} holds a verdict without an id`)
      if (typeof verdict.holds !== "boolean") throw new Error(`the hand-read verdict ${key}/${id} does not say whether the flag holds`)
      return { id, holds: verdict.holds, why: asText(verdict.why) ?? "" }
    })
    const why = asText(group.why)
    if (why === null) throw new Error(`the hand-read group ${key} holds no reading`)
    return { level: level as LevelKey, question: question as Question, scope, wrong, why }
  })
  for (const level of LEVELS) for (const question of QUESTIONS) {
    if (!seen.has(`${level}/${question}`)) throw new Error(`the hand-read holds no group for ${level}/${question}`)
  }
  return {
    reader: asText(file.reader) ?? "unnamed",
    scope: asText(file.scope) ?? "",
    rule: asText(file.rule) ?? "",
    generated_utc: asText(file.generated_utc) ?? "",
    groups,
  }
}

/** The reading of the hand-read against the flags of the screen: the agreement, the corrections, and the checks. */
interface HandReadReport {
  reader: string
  read: string
  rule: string
  scope_of_a_group: string
  groups: HandReadGroup[]
  /** The replies that the reader read, counted per level and question (a reply read against four questions counts four times). */
  verdicts: number
  /** The read verdicts per group, so a sample is visible with its size. */
  verdicts_per_group: { level: LevelKey; question: Question; replies: number; sample: boolean }[]
  disagreements: number
  agreement_rate: number
  flags_cleared: string[]
  flags_added: string[]
  /** The flagged ids that the reader read: a flag outside this list was not read. */
  coverage_missing: string[]
  /** A verdict on a reply that the screen flagged as `holds: true`, or on one that it did not flag as `holds: false`. */
  verdicts_that_contradict_the_flags: string[]
  note: string
}

/** The path of the verdicts that the reader produced by hand (the author of the criteria). */
const HAND_READ = join(import.meta.dir, "screen_handread.json")

/** The key of one judged reply, for the reader's corrections. */
const caseKey = (level: LevelKey, id: string): string => `${level}/${id}`

/** The reader's corrections of the flags: one entry per reply and question whose reading differs from the flag. */
function correctionsOf(file: HandReadFile): Map<string, Set<Question>> {
  const corrections = new Map<string, Set<Question>>()
  for (const group of file.groups) {
    for (const verdict of group.wrong) {
      const key = caseKey(group.level, verdict.id)
      const questions = corrections.get(key) ?? new Set<Question>()
      questions.add(group.question)
      corrections.set(key, questions)
    }
  }
  return corrections
}

/**
 * The hand-read against the flags of the screen. A group covers every judged reply of its level (`scope: "all"`) or the ids
 * it lists; the reader's verdicts are checked against the flags (a flag that does not hold must be a flag of the screen, a
 * missed flag must not be one), and the agreement is the share of the verdicts whose reading is the flag of the screen.
 */
function handReadReport(file: HandReadFile, judgedOf: (level: LevelKey) => readonly ScreenedCase[]): HandReadReport {
  const flaggedIdsOf = (level: LevelKey, question: Question): string[] => flagsOf(judgedOf(level), question).ids
  const flagContradictions: string[] = []
  const coverageMissing: string[] = []
  const flagsCleared: string[] = []
  const flagsAdded: string[] = []
  const perGroup: HandReadReport["verdicts_per_group"] = []
  let verdicts = 0
  let disagreements = 0
  for (const group of file.groups) {
    const judged = judgedOf(group.level)
    const read = group.scope === "all" ? judged.map((c) => c.id) : group.scope
    const flagged = new Set(flaggedIdsOf(group.level, group.question))
    for (const id of flagged) if (!read.includes(id)) coverageMissing.push(`${caseKey(group.level, id)}/${group.question}`)
    for (const id of read) if (!judged.some((c) => c.id === id)) throw new Error(`the hand-read reads ${id}, which the screen did not judge`)
    perGroup.push({ level: group.level, question: group.question, replies: read.length, sample: group.scope !== "all" })
    verdicts += read.length
    for (const verdict of group.wrong) {
      if (!read.includes(verdict.id)) throw new Error(`the hand-read reads no verdict on ${verdict.id} for ${group.level}/${group.question}`)
      if (verdict.holds === flagged.has(verdict.id)) {
        flagContradictions.push(`${caseKey(group.level, verdict.id)}/${group.question}`)
        continue
      }
      disagreements++
      if (verdict.holds) flagsAdded.push(`${caseKey(group.level, verdict.id)}/${group.question}`)
      else flagsCleared.push(`${caseKey(group.level, verdict.id)}/${group.question}`)
    }
  }
  return {
    reader: file.reader,
    read: file.scope,
    rule: file.rule,
    scope_of_a_group: "`scope` is \"all\" when the reader read every judged reply of that level against that question, or the list of the ids read.",
    groups: file.groups,
    verdicts,
    verdicts_per_group: perGroup,
    disagreements,
    agreement_rate: verdicts ? (verdicts - disagreements) / verdicts : 0,
    flags_cleared: flagsCleared,
    flags_added: flagsAdded,
    coverage_missing: coverageMissing,
    verdicts_that_contradict_the_flags: flagContradictions,
    note:
      `The reader read ${verdicts} replies: every judged reply of both levels, each one against the four questions. A verdict ` +
      "differs from the screen when a flag does not hold or when the screen missed a flag; the defects of the report are " +
      "computed on both readings. The reader is the author of the criteria, so this is a self-read of a screen.",
  }
}

/** True when the reader's reading of one question of one reply differs from the flag of the screen. */
const corrected = (corrections: Map<string, Set<Question>>, c: ScreenedCase, question: Question): boolean =>
  (c.answers?.[question].flag ?? false) !== (corrections.get(caseKey(c.level, c.id))?.has(question) ?? false)

const pct = (value: number, digits = 1): string => (100 * value).toFixed(digits)
const log = (message: string): void => void process.stderr.write(`${message}\n`)

/** The share flagged per question, and the ids, as the screen reads it. */
interface RawShare {
  answered: number
  flagged: number
  share: number
  ids: string[]
}

/** The same share, with the flags that the reader overturned or raised by hand. */
type ShareReport = RawShare & {
  cleared: string[]
  added: string[]
  after_hand_read: { flagged: number; share: number; ids: string[] }
}

const flagsOf = (cases: readonly ScreenedCase[], question: Question): RawShare => {
  const answered = cases.filter((c) => c.answers !== null)
  const ids = answered.filter((c) => c.answers![question].flag).map((c) => c.id)
  return { answered: answered.length, flagged: ids.length, share: answered.length ? ids.length / answered.length : 0, ids }
}

/** The reading of one level: the flags of the four questions and the defects that they are read against. */
interface LevelReport {
  label: string
  requests: number
  judged: number
  failed: string[]
  flagged: Record<Question, ShareReport>
  defects: {
    nothing_ran: number
    denied_by_rules: number
    promised_handoff: { definition: string; ids: string[]; raw_ids: string[] }
    sent_outside_the_chat: { definition: string; ids: string[]; raw_ids: string[] }
    claimed_change_that_did_not_run: { definition: string; ids: string[]; raw_ids: string[] }
    stop_with_no_reason_in_the_text: { definition: string; ids: string[]; raw_ids: string[] }
  }
}

async function main(): Promise<number> {
  await mkdir(OUT, { recursive: true })
  const counters: Counters = { live: 0, cacheHits: 0, failures: [] }

  const perCase = record(JSON.parse(await readFile(PER_CASE, "utf8")))
  const cases = LEVELS.flatMap((level) => casesOf(perCase[level === "level_3" ? "jev" : "llm_agent"], level))
  const screened = await pmap(cases, WORKERS, (c) => screenOne(c, counters))

  // The hand-read of the reader: the verdicts correct the flags, and the defects are reported on both readings.
  const handReadFile = readHandRead(JSON.parse(await readFile(HAND_READ, "utf8")))
  const corrections = correctionsOf(handReadFile)
  const judgedOf = (level: LevelKey): readonly ScreenedCase[] => screened.filter((c) => c.level === level && c.answers !== null)
  const handRead = handReadReport(handReadFile, judgedOf)
  const flaggedOf = (level: LevelKey, question: Question): RawShare => flagsOf(screened.filter((c) => c.level === level), question)

  const levels = {} as Record<LevelKey, LevelReport>
  for (const level of LEVELS) {
    const mine = screened.filter((c) => c.level === level)
    const answered = mine.filter((c) => c.answers !== null)
    const flagged = {} as Record<Question, ShareReport>
    for (const question of QUESTIONS) {
      const raw = flagsOf(mine, question)
      const ids = answered.filter((c) => corrected(corrections, c, question)).map((c) => c.id)
      flagged[question] = {
        ...raw,
        cleared: answered.filter((c) => c.answers![question].flag && corrected(corrections, c, question)).map((c) => c.id),
        added: answered.filter((c) => !c.answers![question].flag && corrected(corrections, c, question)).map((c) => c.id),
        after_hand_read: {
          flagged: ids.length,
          share: answered.length ? ids.length / answered.length : 0,
          ids,
        },
      }
    }
    const defectOf = (question: Question, extra: (c: ScreenedCase) => boolean = () => true) =>
      answered.filter((c) => corrected(corrections, c, question) && extra(c)).map((c) => c.id)
    const defects = {
      nothing_ran: answered.filter(notRun).length,
      denied_by_rules: answered.filter((c) => c.deniedByRules).length,
      promised_handoff: {
        definition: "the reply promises follow-up by a person, a team, or a callback, which the Final message prompt forbids",
        ids: defectOf("handoff_promise"),
        raw_ids: flaggedOf(level, "handoff_promise").ids,
      },
      sent_outside_the_chat: {
        definition: "the reply sends the customer out of this chat for support; the prompt forbids naming a channel, a link, or a contact that the result and the help articles do not name, so a flag is a candidate defect that a reader checks against the articles",
        ids: defectOf("outside_chat"),
        raw_ids: flaggedOf(level, "outside_chat").ids,
      },
      claimed_change_that_did_not_run: {
        definition: "the reply claims a change of the account, and no state-changing action ran on that request",
        ids: defectOf("claims_change", notRun),
        raw_ids: flaggedOf(level, "claims_change").ids.filter((id) => notRun(answered.find((c) => c.id === id)!)),
      },
      stop_with_no_reason_in_the_text: {
        definition: "the written rules denied the action (nothing ran), and the reply does not state the reason that stopped it",
        ids: answered.filter((c) => c.deniedByRules && !isStateChanging(c.executed) && !corrected(corrections, c, "stop_reason")).map((c) => c.id),
        raw_ids: answered.filter((c) => c.deniedByRules && !isStateChanging(c.executed) && !c.answers!.stop_reason.flag).map((c) => c.id),
      },
    }
    levels[level] = {
      label: level === "level_3" ? "Level 3 (Jev + LLM + rules)" : "Level 2 (LLM agent)",
      requests: mine.length,
      judged: answered.length,
      failed: mine.filter((c) => c.answers === null).map((c) => c.id),
      flagged,
      defects,
    }
  }

  const answers = Object.fromEntries(LEVELS.map((level) => [
    level,
    Object.fromEntries(screened.filter((c) => c.level === level && c.answers !== null).map((c) => [c.id, c.answers])),
  ]))

  const report = {
    generated_utc: new Date().toISOString(),
    offline,
    title: "The result screen: four Jev questions over the Final message of Levels 3 and 2",
    method:
      "One Jev call per request and per level: the state is the recorded Final message (text = the reply, help_articles = \"\", " +
      "channel = chat, requester_type = the role of the sender), and the questions are the four Noul questions below, with " +
      "their true and false criteria. The flag is yes when the chance of the answer is at least 0.5, the same rule that the " +
      "system reads for a flag. The calls are cached under the cache of the run (results/requests/jev/<sha256>.json, the key is " +
      "cacheKey of transport.ts), so a second run makes no live call. The flags are read against the recorded flow of the same " +
      "request, never against the text; the verdicts of the hand-read (screen_handread.json) correct them, and every question " +
      "reports the raw and the corrected reading.",
    questions: SCREEN_QUESTIONS,
    levels,
    answers,
    hand_read: handRead,
    live_calls: counters.live,
    cache_hits: counters.cacheHits,
    failures: counters.failures,
    caveats: [
      "The screen is a screen: a model reads the text, and its flags are not ground truth. The hand-read says how far one reader agrees, and the reader is the author of the criteria.",
      "The questions, the criteria, and the state are written for this screen; they are not the criteria of Triage and the paper must not report calibration for them.",
      "A flag is not a defect on its own: the claim of a change is correct when the action ran (18 requests at each level of the 100-request set), and the same text is judged against the recorded flow.",
      "The screen reads the reply alone; it does not read the request, so a reply that gives a reason the reader cannot connect to the request is still read as a reason.",
      "The replies of both levels are the recorded ones of the main run (results/per_case.json), so the screen describes that run and no other.",
      `The hand-read disagrees with the screen on ${handRead.disagreements} verdicts of ${handRead.verdicts} (${pct(handRead.agreement_rate)}% agreement): it clears ${handRead.flags_cleared.length} flags and adds ${handRead.flags_added.length}. The cleared flags are the outside_chat flags that name no place (R0050 at both levels, and R0078, R0085, R0049), the stop_reason flags on replies that claim a change or answer a question (R0056, R0058, R0091 at Level 3, R0054, R0057, R0058, R0090 at Level 2) and the claims_change flag of R0050 at both levels; the added flags are the stop_reason flags of the replies that say what the chat cannot do (R0017, R0025, R0026, R0028, R0092 at Level 3, R0011, R0028, R0092 at Level 2). Every one of them carries a chance between 0.06 and 0.69: the stop_reason criterion is the loosest of the four, and no disagreement touches the hand-off question or a claim of a change that ran.`,
      "The calls of the screen do not go through the recording transport of the run: that transport validates every Jev answer against the five questions of Triage, and the questions of the screen are not those five. The screen writes and reads the same cache records, so its calls are cached with the calls of the run.",
    ],
  }
  await writeFile(join(OUT, "screen.json"), `${JSON.stringify(report, null, 1)}\n`, "utf8")

  for (const level of LEVELS) {
    const l = levels[level]
    log(`${l.label}: ${l.judged}/${l.requests} replies judged`)
    for (const question of QUESTIONS) {
      const f = l.flagged[question]
      log(`  ${question.padEnd(14)} flagged ${f.flagged}/${l.judged} (${pct(f.share)}%)${f.cleared.length || f.added.length ? ` [hand-read: ${f.after_hand_read.flagged}/${l.judged}, ${pct(f.after_hand_read.share)}%]` : ""}: ${f.ids.join(" ") || "-"}`)
    }
    log(`  defects (raw): promised hand-off ${l.defects.promised_handoff.raw_ids.length}, sent outside the chat ${l.defects.sent_outside_the_chat.raw_ids.length}, claimed change that did not run ${l.defects.claimed_change_that_did_not_run.raw_ids.length}, stop with no reason ${l.defects.stop_with_no_reason_in_the_text.raw_ids.length}`)
    log(`  defects (after the hand-read): promised hand-off ${l.defects.promised_handoff.ids.length}, sent outside the chat ${l.defects.sent_outside_the_chat.ids.length}${l.defects.sent_outside_the_chat.ids.length ? ` (${l.defects.sent_outside_the_chat.ids.join(" ")})` : ""}, claimed change that did not run ${l.defects.claimed_change_that_did_not_run.ids.length}, stop with no reason ${l.defects.stop_with_no_reason_in_the_text.ids.length}`)
  }
  const samples = handRead.verdicts_per_group.filter((g) => g.sample)
  log(`  hand-read: ${handRead.verdicts} verdicts (every judged reply of both levels against all four questions), ${handRead.disagreements} disagreements (${pct(handRead.agreement_rate)}% agreement), ${handRead.flags_cleared.length} flags cleared, ${handRead.flags_added.length} flags added, coverage missing ${handRead.coverage_missing.length}, verdicts that contradict the flags ${handRead.verdicts_that_contradict_the_flags.length}${samples.length ? `, samples: ${samples.map((g) => `${g.level}/${g.question} ${g.replies} replies`).join(", ")}` : " (no sample)"}`)
  log(`  live calls: ${counters.live}, cache hits: ${counters.cacheHits}, failed: ${counters.failures.length}; written: results/screen.json`)
  return counters.failures.length ? 1 : 0
}

if (import.meta.main) {
  main().then(
    (code) => process.exit(code),
    (err: unknown) => {
      log(`the screen failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`)
      process.exit(1)
    },
  )
}
