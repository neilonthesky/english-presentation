import type {
  Account, Classifier, Executed, FinalResponse, GatherResponse, ReceiveResponse, RulesResponse, TriageResponse,
} from "./types"

/** One id per browser tab. The server keeps the requests and the ledger of actions that ran under this id. */
export const SESSION_ID = crypto.randomUUID()

/** The POST endpoints of the server and what each one returns. A state of the flow calls the endpoint with its own name. */
interface Endpoints {
  receive: ReceiveResponse
  classify: Classifier
  triage: TriageResponse
  gather: GatherResponse
  rules: RulesResponse
  act: Executed
  final: FinalResponse
  reset: { ok: true }
}

export async function api<K extends keyof Endpoints>(step: K, body: Record<string, unknown> = {}): Promise<Endpoints[K]> {
  const res = await fetch(`/api/${step}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: SESSION_ID, ...body }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json as Endpoints[K]
}

/** The demo customers, each with one purchase. Loaded once; the chat reads it with `use`. */
export const customersPromise: Promise<Account[] | null> = fetch("/api/customers")
  .then((res) => (res.ok ? (res.json() as Promise<Account[]>) : null))
  .catch(() => null)
