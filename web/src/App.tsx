import { useMachine } from "@xstate/react"
import { use, useState } from "react"
import { customersPromise } from "@/api"
import { Chat, type ChatMode, type LockReason } from "@/components/Chat"
import { Diagram } from "@/components/Diagram"
import { Presenter } from "@/components/Presenter"
import { StepDetail } from "@/components/StepDetail"
import { machine, type NodeId, type Phase } from "@/machine"
import { SCENARIOS } from "@/samples"

/** The states where the customer cannot write, and why. */
const LOCKS: Partial<Record<NodeId, LockReason>> = { queued: "queued", staff: "staff", resolved: "closed" }

export default function App() {
  const customers = use(customersPromise)
  const [snap, send] = useMachine(machine)
  // The state value is "idle", "staff", "resolved", or a state with its phase, such as { triage: "done" }.
  const value = snap.value
  const [name, phase] = typeof value === "string" ? [value, null] : (Object.entries(value)[0] as [string, Phase])
  const current = name === "idle" ? null : (name as NodeId)

  // One scenario sets the customer, the sender, and the text. It is fixed after the first message.
  const [index, setIndex] = useState(0)
  const scenario = SCENARIOS[index]
  const account = customers?.find((c) => c.id === scenario.customerId)
  const sender = account ? (scenario.role === "owner" ? account.customer.name : account.teammate.name) : ""

  // A click on a block shows that state. Any button of the flow brings the detail back to the current state.
  const [pick, setPick] = useState<NodeId | null>(null)
  const shown = pick ?? current
  const act = (event: Parameters<typeof send>[0]) => {
    setPick(null)
    send(event)
  }

  const canWrite = snap.can({ type: "WRITE", text: "", role: "owner", customerId: "" })
  const mode: ChatMode = !canWrite || !account ? "locked" : current === null ? "start" : current === "chat" ? "again" : "reply"

  return (
    <div className="flex h-screen gap-2 bg-background p-2">
      <div className="flex min-h-0 w-2/5 flex-col">
        <Chat
          messages={snap.context.messages}
          mode={mode}
          lock={(current && LOCKS[current]) ?? null}
          popup={snap.matches({ chat: "asking" })}
          scenario={scenario}
          sender={sender}
          onSend={(text) => act({ type: "WRITE", text, role: scenario.role, customerId: scenario.customerId })}
          onYes={() => act({ type: "YES" })}
          onNo={() => act({ type: "NO" })}
          controls={
            <Presenter
              index={index}
              onIndex={setIndex}
              canPick={current === null}
              account={account}
              can={(type) => snap.can({ type })}
              onEvent={(type) => act({ type })}
            />
          }
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="h-[55%] min-h-0 shrink-0 overflow-hidden rounded-xl">
          <Diagram active={current} visited={snap.context.visited} taken={snap.context.taken} onSelect={setPick} />
        </div>
        <aside className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-card p-5">
          {shown === null ? (
            <p className="text-sm text-muted-foreground">
              Pick a scenario and send the message in the chat. Then press Next step to run one state at a time, or Run all to go on until a state needs the customer or support staff. Click a block to see its detail.
            </p>
          ) : (
            <StepDetail node={shown} current={current} phase={phase} ctx={snap.context} onStaffReply={(text) => act({ type: "STAFF_REPLY", text })} />
          )}
        </aside>
      </div>
    </div>
  )
}
