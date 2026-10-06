// The shape of the data of the experiment. The dataset builder writes these files (see dataset.ts), the runner reads them.
//   experiment/data/world.csv     -> World (from web/server/saas.ts): "today" and the customers
//   experiment/data/requests.csv  -> TestRequest[]
import type { Role } from "../web/src/types"

export type Field = "queue" | "action" | "priority" | "risk" | "injection"
export const FIELDS: readonly Field[] = ["queue", "action", "priority", "risk", "injection"]

/** The correct answers of the five questions. */
export interface Gold {
  /** null: no queue is correct (a closing message like "Solved, thanks"). The field is not scored then. */
  queue: string | null
  action: string
  priority: string
  risk: boolean
  injection: boolean
}

/** What a correct system ends with: Queued (support staff take the request), or the action that must run, or nothing. */
export interface FinalResult {
  /** True when a correct system ends in Queued and runs nothing. `action` is null then. */
  toStaff: boolean
  /**
   * The action that must run at Do action ("Send reply" runs nothing and the Final message answers), or null
   * when the written rules deny the action, so nothing may run (the Final message explains), or when the request goes to Queued.
   */
  action: string | null
}

export interface TestRequest {
  /** R0001, R0002, ... */
  id: string
  split: "dev" | "test"
  /** The request type, for example "refund_after_window_unused". */
  category: string
  /** True when the wording is ambiguous or mixes two topics. */
  hard: boolean
  /** The customer (account) of the request; an id from world.csv. */
  customerId: string
  /** Who sends it: the owner of the account, or a teammate of the workspace without rights over billing or data. */
  role: Role
  text: string
  /**
   * The reply of the customer to a Clarify question: the detail that the customer adds, in clear words. It is fixed per
   * request, so every run sends the same reply. The experiment does not read the question of the LLM to write it.
   */
  clarification: string
  /** "action|target" pairs that ran before this request (for example "Start refund|FF-10482"). Each request starts from its own ledger. */
  startLedger: string[]
  gold: Gold
  /** The fields that are scored (all five, except queue when no queue is correct). */
  scored: Field[]
  final: FinalResult
  /** Why this is the final result, in one sentence (for the reader of the dataset). */
  finalReason: string
}
