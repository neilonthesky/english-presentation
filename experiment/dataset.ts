// The dataset files of the experiment: two CSV files (RFC 4180) in experiment/data/.
//
//   world.csv     one row per customer: the customer, the teammate, the plan, and the one purchase of the customer
//   requests.csv  one row per request: the text, the sender, the gold answers, and the gold final result
//
// build_dataset.ts writes them with writeDataset(); run.ts and validate.ts read them with loadDataset().
// An empty cell is null. A list is joined with ";". A boolean is "true" or "false". "Today" is the constant TODAY
// below, because the whole dataset is dated relative to it.
import { mkdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { ACTIONS, PLANS, PRIORITIES, QUEUES, type Choice, type Classifier, type Flag, type PurchaseCategory, type PurchaseStatus, type Role } from "../web/src/types"
import type { Customer, World } from "../web/server/saas"
import { FIELDS, type Gold, type TestRequest } from "./types"

export const TODAY = "2026-10-05"
export const WORLD_FILE = "world.csv"
export const REQUESTS_FILE = "requests.csv"

/** The gold answers of one request as a classifier result with full confidence. No model is called. */
export function goldClassifier(gold: Gold): Classifier {
  const choice = (value: string): Choice => ({ value, confidence: 1 })
  const flag = (value: boolean): Flag => ({ value, confidence: 1 })
  return {
    model: "gold",
    latencyS: 0,
    inputTokens: 0,
    outputTokens: 0,
    fields: {
      queue: choice(gold.queue ?? "Product Help"),
      action: choice(gold.action),
      priority: choice(gold.priority),
      risk: flag(gold.risk),
      injection: flag(gold.injection),
    },
  }
}

const WORLD_COLUMNS = [
  "id", "name", "email", "teammate_name", "teammate_email", "plan", "credits_left", "renews",
  "plan_cancelled", "password_resets", "refunds_last_90_days",
  "purchase_id", "item", "category", "status", "amount", "charged", "usage", "unused",
] as const

const REQUEST_COLUMNS = [
  "id", "category", "hard", "customer_id", "role", "text", "start_ledger",
  "gold_queue", "gold_action", "gold_priority", "gold_risk", "gold_injection", "scored",
  "final_action", "final_reason",
] as const

const PURCHASE_CATEGORIES: readonly PurchaseCategory[] = ["Annual plan", "Monthly plan", "Credit pack"]
const PURCHASE_STATUSES: readonly PurchaseStatus[] = ["Scheduled", "Settling", "Paid"]
const ROLES: readonly Role[] = ["owner", "teammate"]

/** One CSV text from rows of cells. A cell with a comma, a quote, or a line break is quoted. */
export function formatCsv(rows: readonly (readonly string[])[]): string {
  const cell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)
  return `${rows.map((row) => row.map(cell).join(",")).join("\n")}\n`
}

/** The rows of a CSV text. Understands quoted cells with commas, doubled quotes, and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (quoted) {
      if (ch !== '"') cell += ch
      else if (text[i + 1] === '"') {
        cell += '"'
        i += 1
      } else quoted = false
    } else if (ch === '"') quoted = true
    else if (ch === ",") {
      row.push(cell)
      cell = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else cell += ch
  }
  if (quoted) throw new Error("csv: a quoted cell is not closed")
  if (cell !== "" || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

/** The data rows of a file as objects keyed by column, after checking that the header is exactly `columns`. */
function records<C extends string>(file: string, text: string, columns: readonly C[]): Record<C, string>[] {
  const [header, ...body] = parseCsv(text)
  if (!header || header.join(",") !== columns.join(",")) throw new Error(`${file}: the header must be ${columns.join(",")}`)
  return body.map((cells, index) => {
    if (cells.length !== columns.length) throw new Error(`${file} row ${index + 2}: expected ${columns.length} cells, got ${cells.length}`)
    return Object.fromEntries(columns.map((name, i) => [name, cells[i]])) as Record<C, string>
  })
}

function oneOf<T extends string>(value: string, allowed: readonly T[], where: string): T {
  if (!(allowed as readonly string[]).includes(value)) throw new Error(`${where}: "${value}" is not one of ${allowed.join(", ")}`)
  return value as T
}

function whole(value: string, where: string): number {
  const n = Number(value)
  if (value === "" || !Number.isFinite(n)) throw new Error(`${where}: "${value}" is not a number`)
  return n
}

function bool(value: string, where: string): boolean {
  if (value !== "true" && value !== "false") throw new Error(`${where}: "${value}" must be true or false`)
  return value === "true"
}

const list = (value: string): string[] => (value === "" ? [] : value.split(";"))

function worldRows(world: World): string[][] {
  const rows = world.customers.map((c) => {
    const p = c.purchase
    return [
      c.id, c.name, c.email, c.teammate.name, c.teammate.email, c.plan, String(c.creditsLeft), c.renews,
      String(c.planCancelled), String(c.passwordResets), String(c.refundsLast90Days),
      p.id, p.item, p.category, p.status, String(p.amount), p.charged, p.usage, String(p.unused),
    ]
  })
  return [[...WORLD_COLUMNS], ...rows]
}

function requestRows(requests: readonly TestRequest[]): string[][] {
  const rows = requests.map((r) => [
    r.id, r.category, String(r.hard), r.customerId, r.role, r.text, r.startLedger.join(";"),
    r.gold.queue ?? "", r.gold.action, r.gold.priority, String(r.gold.risk), String(r.gold.injection), r.scored.join(";"),
    r.finalAction ?? "", r.finalReason,
  ])
  return [[...REQUEST_COLUMNS], ...rows]
}

/** Write world.csv and requests.csv into `dir`. */
export async function writeDataset(dir: string, world: World, requests: readonly TestRequest[]): Promise<void> {
  await mkdir(dir, { recursive: true })
  await Bun.write(join(dir, WORLD_FILE), formatCsv(worldRows(world)))
  await Bun.write(join(dir, REQUESTS_FILE), formatCsv(requestRows(requests)))
}

/** Read and check world.csv and requests.csv from `dir`. A bad cell raises an error that names the file, the row, and the column. */
export async function loadDataset(dir: string, requestsName: string = REQUESTS_FILE): Promise<{ world: World; requests: TestRequest[] }> {
  const worldFile = await readFile(join(dir, WORLD_FILE), "utf8").catch(() => null)
  const requestsFile = await readFile(join(dir, requestsName), "utf8").catch(() => null)
  if (worldFile === null || requestsFile === null) throw new Error(`${dir}: ${WORLD_FILE} and ${requestsName} are missing; run: bun run experiment/build_dataset.ts`)

  const customers: Customer[] = records(WORLD_FILE, worldFile, WORLD_COLUMNS).map((r, i) => {
    const at = `${WORLD_FILE} row ${i + 2}`
    return {
      id: r.id, name: r.name, email: r.email,
      teammate: { name: r.teammate_name, email: r.teammate_email },
      plan: oneOf(r.plan, PLANS, `${at} plan`), creditsLeft: whole(r.credits_left, `${at} credits_left`), renews: r.renews,
      planCancelled: bool(r.plan_cancelled, `${at} plan_cancelled`), passwordResets: whole(r.password_resets, `${at} password_resets`),
      refundsLast90Days: whole(r.refunds_last_90_days, `${at} refunds_last_90_days`),
      purchase: {
        id: r.purchase_id, item: r.item, category: oneOf(r.category, PURCHASE_CATEGORIES, `${at} category`),
        status: oneOf(r.status, PURCHASE_STATUSES, `${at} status`),
        amount: whole(r.amount, `${at} amount`), charged: r.charged,
        usage: r.usage, unused: bool(r.unused, `${at} unused`),
      },
    }
  })
  const ids = new Set(customers.map((c) => c.id))
  if (ids.size !== customers.length) throw new Error(`${WORLD_FILE}: a customer id is used twice`)

  const requests: TestRequest[] = records(requestsName, requestsFile, REQUEST_COLUMNS).map((r, i) => {
    const at = `${requestsName} row ${i + 2}`
    if (!ids.has(r.customer_id)) throw new Error(`${at}: customer ${r.customer_id} is not in ${WORLD_FILE}`)
    const gold: Gold = {
      queue: r.gold_queue === "" ? null : oneOf(r.gold_queue, QUEUES, `${at} gold_queue`),
      action: oneOf(r.gold_action, ACTIONS, `${at} gold_action`),
      priority: oneOf(r.gold_priority, PRIORITIES, `${at} gold_priority`),
      risk: bool(r.gold_risk, `${at} gold_risk`),
      injection: bool(r.gold_injection, `${at} gold_injection`),
    }
    const finalAction = r.final_action === "" ? null : oneOf(r.final_action, ACTIONS, `${at} final_action`)
    return {
      id: r.id, category: r.category, hard: bool(r.hard, `${at} hard`),
      customerId: r.customer_id, role: oneOf(r.role, ROLES, `${at} role`), text: r.text,
      startLedger: list(r.start_ledger),
      gold, scored: list(r.scored).map((f) => oneOf(f, FIELDS, `${at} scored`)),
      finalAction, finalReason: r.final_reason,
    }
  })
  return { world: { today: TODAY, customers }, requests }
}
