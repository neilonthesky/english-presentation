// The states of the support flow as an xstate machine. A state does its work (one or two calls to the server)
// as soon as the flow enters it. Two ways to move on:
//   "Next step": go to the next state, run it, and stop (step by step).
//   "Run all":   go on, one state after the other, until a state needs the customer.
// The presenter plays the customer (popup answer, a message in the chat, silence for T).
import { assign, enqueueActions, fromPromise, setup } from "xstate"
import { api } from "./api"
import type {
  Classifier, Executed, FinalResponse, GatherResponse, RequestInfo, RulesResponse, Role, TriageResponse,
} from "./types"

export type NodeId = "new" | "triage" | "gather" | "rules" | "act" | "final" | "chat" | "resolved"

/** One arrow of the diagram. The machine records each arrow that the flow takes, so the diagram can light it. */
export type EdgeId =
  | "start-new" | "new-triage"
  | "triage-gather" | "triage-gather-injection"
  | "gather-rules" | "rules-act" | "rules-final" | "act-final" | "final-chat"
  | "chat-new" | "chat-resolved"

/** The part of a state that is on screen: a call is running, it is done, it failed, or the chat waits for the popup or answers it. */
export type Phase = "running" | "done" | "failed" | "waiting" | "asking"

/** In "Run all" a finished state stays on screen this long before the next one starts. */
export const AUTO_DELAY_MS = 1800
/** Demo values of "N s" (the popup comes after this time) and of "no, N times". The paper does not measure them. */
export const POPUP_DELAY_MS = 3000
export const NO_LIMIT = 2

/** How Resolved was reached: the customer said yes in the popup, the customer was silent for T, or the customer said "no" N times. */
export type ClosedBy = "popup" | "silence" | "unresolved"

export interface Message {
  from: "customer" | "bot" | "note"
  text: string
}

export interface Ctx {
  messages: Message[]
  role: Role
  customerId: string
  /** How many times the customer said "no" in the popup, in this chat. */
  noCount: number
  requestId: string | null
  request: RequestInfo | null
  classifier: Classifier | null
  triage: TriageResponse | null
  gather: GatherResponse | null
  rules: RulesResponse | null
  executed: Executed | null
  final: FinalResponse | null
  closedBy: ClosedBy | null
  error: string | null
  /** True after "Run all": each state goes on to the next one without a click. */
  auto: boolean
  visited: NodeId[]
  taken: EdgeId[]
}

type Ev =
  | { type: "WRITE"; text: string; role: Role; customerId: string }
  | { type: "NEXT" }
  | { type: "RUN_ALL" }
  | { type: "YES" }
  | { type: "NO" }
  | { type: "SILENT" }
  | { type: "RESET" }

/** The data of one request. A new request in the same chat starts from this. */
const request0 = {
  requestId: null, request: null, classifier: null, triage: null, gather: null, rules: null,
  executed: null, final: null, closedBy: null, error: null, auto: false, visited: [], taken: [],
} satisfies Partial<Ctx>
const initial: Ctx = { messages: [], role: "owner", customerId: "", noCount: 0, ...request0 }

/** The states that call the server. */
type Call = "new" | "triage" | "gather" | "rules" | "act" | "final"

/** The work of one state: a call to the server (Triage makes two, one after the other). The result is merged into the context. */
async function runStep(step: Call, c: Ctx): Promise<Partial<Ctx>> {
  const id = { requestId: c.requestId }
  switch (step) {
    case "new": {
      // The last customer line is the message to save. With a request ID it is a new message of the same chat.
      const text = c.messages.findLast((m) => m.from === "customer")!.text
      const r = await api("receive", { text, role: c.role, customerId: c.customerId, requestId: c.requestId ?? undefined })
      return { requestId: r.requestId, request: r.request }
    }
    case "triage": {
      const classifier = await api("classify", id)
      return { classifier, triage: await api("triage", id) }
    }
    case "gather":
      return { gather: await api("gather", id) }
    case "rules":
      return { rules: await api("rules", id) }
    case "act":
      return { executed: await api("act", id) }
    case "final": {
      const final = await api("final", id)
      return { final, messages: [...c.messages, { from: "bot", text: final.text }] }
    }
  }
}

function triageOf(c: Ctx): TriageResponse {
  if (!c.triage) throw new Error("Triage has not run")
  return c.triage
}

function written(event: Ev) {
  if (event.type !== "WRITE") throw new Error(`expected WRITE, got ${event.type}`)
  return event
}

const CLOSED_NOTE: Record<ClosedBy, string> = {
  popup: "The customer said in the popup that the issue is solved. The chat is closed.",
  silence: "The customer was silent for T. The chat is closed.",
  unresolved: `The customer said ${NO_LIMIT} times that the issue is not solved. The chat is closed.`,
}

/** The result of a finished actor. xstate puts it in `event.output`, but the machine type does not list that event, so it is checked here. */
function outputOf(event: unknown): Partial<Ctx> {
  if (typeof event === "object" && event !== null && "output" in event && typeof event.output === "object" && event.output !== null)
    return event.output
  throw new Error("a finished step gave no result")
}

function errorOf(event: unknown): string {
  if (typeof event === "object" && event !== null && "error" in event)
    return event.error instanceof Error ? event.error.message : String(event.error)
  throw new Error("a failed step gave no error")
}

const visit = (node: NodeId) => ({ type: "visit" as const, params: { node } })
const take = (edge: EdgeId) => ({ type: "take" as const, params: { edge } })
const close = (by: ClosedBy) => ({ type: "closeChat" as const, params: { by } })
const to = (target: string, edge: EdgeId) => ({ target, actions: take(edge) })

/** A state that calls the server runs in `running`. */
const running = (step: Call) => ({
  invoke: {
    src: "work" as const,
    input: ({ context }: { context: Ctx }) => ({ step, ctx: context }),
    onDone: { target: "done", actions: "store" as const },
    onError: { target: "failed", actions: "storeError" as const },
  },
})

// A failed call is tried again with "Next step" or "Run all".
const failed = {
  on: {
    NEXT: { target: "running", actions: "clearError" as const },
    RUN_ALL: { target: "running", actions: ["clearError" as const, "setAuto" as const] },
  },
}

const runAll = { RUN_ALL: { actions: "runAll" as const } }
const goOnIfAuto = { [AUTO_DELAY_MS]: { actions: "continueIfAuto" as const } }

export const machine = setup({
  types: { context: {} as Ctx, events: {} as Ev },
  actors: {
    work: fromPromise<Partial<Ctx>, { step: Call; ctx: Ctx }>(({ input }) => runStep(input.step, input.ctx)),
  },
  actions: {
    resetSession: () => void api("reset"),
    clearError: assign({ error: null }),
    // The result of a finished state goes into the context.
    store: assign(({ event }) => outputOf(event)),
    // A failed call stops "Run all".
    storeError: assign({ error: ({ event }) => errorOf(event), auto: false }),
    setAuto: assign({ auto: true }),
    // "Run all" stops at a state that needs the customer.
    stopAuto: assign({ auto: false }),
    continueIfAuto: enqueueActions<Ctx, Ev, undefined, Ev, never, never, never, never, never>(({ context, enqueue }) => {
      if (context.auto) enqueue.raise({ type: "NEXT" })
    }),
    runAll: enqueueActions<Ctx, Ev, undefined, Ev, never, never, never, never, never>(({ enqueue }) => {
      enqueue.assign({ auto: true })
      enqueue.raise({ type: "NEXT" })
    }),
    visit: assign({ visited: ({ context }, params: { node: NodeId }) => [...context.visited, params.node] }),
    take: assign({ taken: ({ context }, params: { edge: EdgeId }) => [...context.taken, params.edge] }),
    takeTriage: assign({ taken: ({ context }) => [...context.taken, triageOf(context).rule === "injection" ? "triage-gather-injection" : "triage-gather"] }),
    // The first message of a chat.
    customerStarts: assign(({ event }) => {
      const e = written(event)
      return { ...initial, role: e.role, customerId: e.customerId, messages: [{ from: "customer" as const, text: e.text }] }
    }),
    // A new message in the same chat is a new request.
    customerWritesAgain: assign(({ context, event }) => ({
      ...request0, messages: [...context.messages, { from: "customer" as const, text: written(event).text }], visited: ["chat" as const],
    })),
    countNo: assign({ noCount: ({ context }) => context.noCount + 1 }),
    closeChat: assign({
      closedBy: (_, params: { by: ClosedBy }) => params.by,
      messages: ({ context }, params: { by: ClosedBy }) => [...context.messages, { from: "note" as const, text: CLOSED_NOTE[params.by] }],
    }),
  },
  guards: {
    rulesNext: ({ context }, params: { next: "act" | "final" }) => context.rules?.next === params.next,
    lastNo: ({ context }) => context.noCount + 1 >= NO_LIMIT,
  },
}).createMachine({
  id: "support",
  context: initial,
  initial: "idle",
  on: { RESET: { target: ".idle", actions: [assign<Ctx, Ev, undefined, Ev, never>(initial), "resetSession"] } },
  states: {
    idle: { on: { WRITE: { target: "new", actions: ["customerStarts", take("start-new")] } } },
    new: {
      id: "new",
      entry: visit("new"),
      initial: "running",
      states: {
        running: running("new"),
        done: { on: { NEXT: to("#triage", "new-triage"), ...runAll }, after: goOnIfAuto },
        failed,
      },
    },
    triage: {
      id: "triage",
      entry: visit("triage"),
      initial: "running",
      states: {
        running: running("triage"),
        done: {
          on: {
            NEXT: { target: "#gather", actions: "takeTriage" },
            ...runAll,
          },
          after: goOnIfAuto,
        },
        failed,
      },
    },
    gather: {
      id: "gather",
      entry: visit("gather"),
      initial: "running",
      states: {
        running: running("gather"),
        done: { on: { NEXT: to("#rules", "gather-rules"), ...runAll }, after: goOnIfAuto },
        failed,
      },
    },
    rules: {
      id: "rules",
      entry: visit("rules"),
      initial: "running",
      states: {
        running: running("rules"),
        done: {
          on: {
            NEXT: [
              { guard: { type: "rulesNext", params: { next: "act" } }, ...to("#act", "rules-act") },
              to("#final", "rules-final"),
            ],
            ...runAll,
          },
          after: goOnIfAuto,
        },
        failed,
      },
    },
    act: {
      id: "act",
      entry: visit("act"),
      initial: "running",
      states: {
        running: running("act"),
        done: { on: { NEXT: to("#final", "act-final"), ...runAll }, after: goOnIfAuto },
        failed,
      },
    },
    final: {
      id: "final",
      entry: visit("final"),
      initial: "running",
      states: {
        running: running("final"),
        done: { on: { NEXT: to("#chat", "final-chat"), ...runAll }, after: goOnIfAuto },
        failed,
      },
    },
    // Chat open: the popup comes after N s ("Next step" does not wait). The customer can also write again, or be silent for T.
    chat: {
      id: "chat",
      entry: [visit("chat"), "stopAuto"],
      initial: "waiting",
      on: {
        WRITE: { target: "#new", actions: ["customerWritesAgain", take("chat-new")] },
        SILENT: { target: "#resolved", actions: [take("chat-resolved"), close("silence")] },
      },
      states: {
        waiting: { after: { [POPUP_DELAY_MS]: "asking" }, on: { NEXT: "asking" } },
        asking: {
          on: {
            YES: { target: "#resolved", actions: [take("chat-resolved"), close("popup")] },
            NO: [
              { guard: "lastNo", target: "#resolved", actions: ["countNo", take("chat-resolved"), close("unresolved")] },
              { target: "waiting", actions: "countNo" },
            ],
          },
        },
      },
    },
    resolved: { id: "resolved", entry: [visit("resolved"), "stopAuto"] },
  },
})
