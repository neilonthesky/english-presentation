import { Check, Copy, Eye, X } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { CallTrace } from "@/types"

/** A string longer than this (or with several lines) folds into one line until the viewer opens it. */
const FOLD_CHARS = 140

interface TreeProps {
  name: string | null
  value: unknown
  depth: number
  /** Objects and arrays open at a depth below this one. */
  openDepth: number
  /** Names of keys that start closed whatever their depth. */
  closedKeys: readonly string[]
}

const KEY = "text-muted-foreground"

function Name({ name }: { name: string | null }) {
  return name === null ? null : <span className={KEY}>{name}: </span>
}

/** One value of the JSON, as a tree: objects, arrays, and long strings fold. */
function JsonNode({ name, value, depth, openDepth, closedKeys }: TreeProps) {
  if (typeof value === "string" && (value.length > FOLD_CHARS || value.includes("\n"))) {
    return (
      <details>
        <summary className="cursor-pointer break-words">
          <Name name={name} />
          <span className="text-rules-strong">"{value.slice(0, 80).replaceAll("\n", " ")}…"</span>
          <span className="text-muted-foreground"> ({value.length} chars)</span>
        </summary>
        <pre className="ml-4 whitespace-pre-wrap break-words text-rules-strong">{value}</pre>
      </details>
    )
  }
  if (typeof value === "object" && value !== null) {
    const entries = Array.isArray(value) ? value.map((v, i): [string, unknown] => [String(i), v]) : Object.entries(value)
    const [open, close] = Array.isArray(value) ? ["[", "]"] : ["{", "}"]
    if (entries.length === 0)
      return (
        <div>
          <Name name={name} />
          {open}
          {close}
        </div>
      )
    return (
      <details open={depth < openDepth && !(name !== null && closedKeys.includes(name))}>
        <summary className="cursor-pointer">
          <Name name={name} />
          {open}
          <span className="text-muted-foreground"> {entries.length} {Array.isArray(value) ? "items" : "keys"} </span>
          {close}
        </summary>
        <div className="ml-4 border-l pl-2">
          {entries.map(([key, child]) => (
            <JsonNode key={key} name={key} value={child} depth={depth + 1} openDepth={openDepth} closedKeys={closedKeys} />
          ))}
        </div>
      </details>
    )
  }
  const color = typeof value === "string" ? "text-rules-strong" : typeof value === "number" ? "text-model-strong" : "text-ink"
  return (
    <div className="break-words">
      <Name name={name} />
      <span className={color}>{typeof value === "string" ? `"${value}"` : String(value)}</span>
    </div>
  )
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground hover:opacity-80"
      title="Copy the JSON to the clipboard"
      onClick={(e) => {
        // The button sits inside a <summary>: a click must copy and not fold the section.
        e.preventDefault()
        e.stopPropagation()
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }}
    >
      {done ? <Check className="size-3" /> : <Copy className="size-3" />}
      {done ? "Copied" : label}
    </button>
  )
}

interface SectionProps {
  title: string
  value: unknown
  openDepth: number
  closedKeys?: readonly string[]
}

/** One JSON of a call: a row with a View button. The button opens a popup (a modal dialog) with the JSON tree. */
function JsonSection({ title, value, openDepth, closedKeys = [] }: SectionProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  // The tree is built only while the popup is open, so a closed popup costs nothing.
  const [shown, setShown] = useState(false)
  const text = JSON.stringify(value, null, 2)
  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-pane px-3 py-1.5 text-sm font-semibold text-ink">
        {title}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground hover:opacity-80"
          title="Open the JSON in a popup"
          onClick={() => {
            setShown(true)
            dialog.current?.showModal()
          }}
        >
          <Eye className="size-3" /> View
        </button>
      </div>
      <dialog
        ref={dialog}
        aria-label={title}
        className="m-auto h-[85vh] w-[min(60rem,94vw)] overflow-hidden rounded-xl bg-card p-0 text-ink shadow-xl backdrop:bg-black/50"
        onClose={() => setShown(false)}
        // A click on the backdrop (the dialog element itself, outside its content) closes the popup.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close()
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
            <h2 className="text-base font-semibold">{title}</h2>
            <div className="flex items-center gap-2">
              <CopyButton text={text} />
              <button
                type="button"
                aria-label="Close"
                className="inline-flex size-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:opacity-80"
                onClick={() => dialog.current?.close()}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-sm leading-relaxed text-ink">
            {shown && <JsonNode name={null} value={value} depth={0} openDepth={openDepth} closedKeys={closedKeys} />}
          </div>
        </div>
      </dialog>
    </>
  )
}

export const usd = (value: number): string => `$${value.toFixed(value < 0.01 ? 6 : 4)}`

function Stat({ children }: { children: ReactNode }) {
  return <span className="rounded bg-system px-1.5 py-0.5">{children}</span>
}

/** The numbers of one model call, in one line. */
export function CallStats({ trace, className }: { trace: CallTrace; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-1.5 text-xs text-ink-soft", className)}>
      <Stat>{trace.model}</Stat>
      <Stat>{trace.latencyS.toFixed(2)} s</Stat>
      <Stat>{trace.inputTokens} in + {trace.outputTokens} out tokens</Stat>
      <Stat>{usd(trace.costUsd)}</Stat>
    </p>
  )
}

const WHO = { jev: "Jev", llm: "the LLM" } as const

/**
 * The payload inspector: the exact JSON that the server sent to the model, the exact JSON that came back, and the latency,
 * the tokens, and the cost of the call.
 */
export function CallInspector({ title, trace }: { title: string; trace: CallTrace }) {
  const jev = trace.service === "jev"
  return (
    <div className="space-y-1.5">
      <p className="pt-2 text-xs font-medium uppercase text-muted-foreground">{title}</p>
      <CallStats trace={trace} />
      <JsonSection
        title={`Sent to ${WHO[trace.service]}`}
        value={trace.request}
        openDepth={jev ? 2 : 3}
        closedKeys={jev ? ["questions"] : []}
      />
      <JsonSection title={`Received from ${WHO[trace.service]}`} value={trace.response} openDepth={jev ? 4 : 3} />
    </div>
  )
}
