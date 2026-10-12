// The shape of the data of the experiment. The dataset builder writes these files (see dataset.ts), the runner reads them.
//   experiment/data/world.csv     -> World (from system/saas.ts): "today" and the customers
//   experiment/data/requests.csv  -> TestRequest[]

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

/** What a correct system ends with: the action that must run, or null when the written rules deny the action, so nothing may run and the Final message explains. */

export interface TestRequest {
  /** R0001, R0002, ... */
  id: string
  /** The request type, for example "refund_in_window_small". */
  category: string
  /** True when the wording is ambiguous or mixes two topics. */
  hard: boolean
  /** The customer (account) of the request; an id from world.csv. */
  customerId: string
  text: string
  /** "action|target" pairs that ran before this request (for example "Start refund|FF-10482"). Each request starts from its own ledger. */
  startLedger: string[]
  gold: Gold
  /** The fields that are scored (all five, except queue when no queue is correct). */
  scored: Field[]
  /** The action that must run, or null when the written rules deny the action and the Final message explains. */
  finalAction: string | null
  /** Why this is the final result, in one sentence (for the reader of the dataset). */
  finalReason: string
}
