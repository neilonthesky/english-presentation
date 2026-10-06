import { EdgeLabelRenderer, Handle, Position, ReactFlow, useReactFlow, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import type { EdgeId, NodeId } from "@/machine"

// The diagram shows the states of the flow and the moves between them. One plain block for each state, one thin arrow for
// each move, a short label on the arrows that need one. The blocks and the arrows have fixed places, so the machine only
// says which ones are lit: the active state, the states the flow reached, and the arrows the flow took.
type Kind = "model" | "system" | "resolved" | "rules" | "staff"
type Status = "idle" | "todo" | "visited" | "active"

interface BlockSpec {
  kind: Kind
  title: string
  /** One short line under the title, or nothing. */
  line?: string
  x: number
  y: number
  w: number
  h: number
}

// The grid of figures/flow.tex, in demo units: row 1 is the main line (New to Do action), Clarify and Final message sit
// in row 2, Queued, Support staff and Chat open in row 3, and Resolved closes the flow in row 4 on the left.
const BLOCKS: Record<NodeId, BlockSpec> = {
  new: { kind: "system", title: "New", line: "message saved", x: 30, y: 76, w: 140, h: 58 },
  triage: { kind: "model", title: "Triage", line: "Jev: 5 answers", x: 240, y: 76, w: 140, h: 58 },
  gather: { kind: "system", title: "Gather info", line: "account + articles", x: 450, y: 76, w: 140, h: 58 },
  rules: { kind: "rules", title: "Rules check", line: "written rules", x: 655, y: 76, w: 140, h: 58 },
  act: { kind: "system", title: "Do action", line: "refund, delete", x: 860, y: 76, w: 140, h: 58 },
  clarify: { kind: "model", title: "Clarify", line: "asks for detail", x: 240, y: 201, w: 140, h: 58 },
  final: { kind: "model", title: "Final message", line: "LLM writes", x: 860, y: 201, w: 140, h: 58 },
  queued: { kind: "staff", title: "Queued", line: "ticket, summary", x: 450, y: 326, w: 140, h: 58 },
  staff: { kind: "staff", title: "Support staff", line: "replies", x: 655, y: 326, w: 140, h: 58 },
  chat: { kind: "system", title: "Chat open", line: "popup after N s", x: 860, y: 326, w: 140, h: 58 },
  resolved: { kind: "resolved", title: "Resolved", line: "chat closed", x: 240, y: 451, w: 140, h: 58 },
}

interface ArrowSpec {
  from: NodeId | "start"
  to: NodeId
  /** The path of the arrow, in the same units as the blocks. */
  d: string
  /** An orange arrow: the request goes to support staff. */
  staff?: boolean
  /** A short label on the arrow and the center of its box. */
  label?: [text: string, x: number, y: number]
}

const ARROWS: Record<EdgeId, ArrowSpec> = {
  "start-new": { from: "start", to: "new", d: "M18,105 H28" },
  "new-triage": { from: "new", to: "triage", d: "M170,105 H238" },
  "triage-gather": { from: "triage", to: "gather", d: "M380,95 H448", label: ["action", 414, 77] },
  "triage-gather-injection": { from: "triage", to: "gather", d: "M380,115 H448", label: ["injection", 414, 137] },
  "triage-queued-critical": { from: "triage", to: "queued", d: "M350,134 V285 H534 V324", staff: true, label: ["Critical", 442, 267] },
  "triage-queued-staff": { from: "triage", to: "queued", d: "M315,134 V310 H560 V324", staff: true, label: ["needs staff", 400, 300] },
  "triage-clarify": { from: "triage", to: "clarify", d: "M270,134 V199", label: ["unsure", 240, 165] },
  "gather-rules": { from: "gather", to: "rules", d: "M590,105 H653", label: ["facts", 621, 87] },
  "rules-act": { from: "rules", to: "act", d: "M795,105 H858", label: ["allow", 826, 87] },
  "rules-final": { from: "rules", to: "final", d: "M765,134 V230 H858", label: ["deny", 812, 212] },
  "rules-queued": { from: "rules", to: "queued", d: "M690,134 V285 H585 V324", staff: true, label: ["needs staff", 640, 267] },
  "act-final": { from: "act", to: "final", d: "M930,134 V199", label: ["done", 963, 165] },
  "final-chat": { from: "final", to: "chat", d: "M930,259 V324" },
  "chat-new": { from: "chat", to: "new", d: "M1000,355 H1045 V50 H95 V74", label: ["writes again", 520, 50] },
  "chat-queued": { from: "chat", to: "queued", d: "M891,384 V420 H572 V386", staff: true, label: ["no, N times", 730, 437] },
  "chat-resolved-yes": { from: "chat", to: "resolved", d: "M962,384 V480 H367", label: ["yes", 690, 462] },
  "chat-resolved-silent": { from: "chat", to: "resolved", d: "M977,384 V505 H367", label: ["silent for T", 690, 487] },
  "chat-chat": { from: "chat", to: "chat", d: "M1000,345 H1030 V375 H1002", label: ["no", 1008, 400] },
  "queued-staff": { from: "queued", to: "staff", d: "M590,355 H653", staff: true, label: ["takes it", 621, 337] },
  "staff-chat": { from: "staff", to: "chat", d: "M795,355 H858", staff: true, label: ["replies", 826, 337] },
  "queued-queued": { from: "queued", to: "queued", d: "M450,355 H420 V379 H448", label: ["chat locked", 395, 400] },
  "queued-resolved": { from: "queued", to: "resolved", d: "M491,384 V455 H367", staff: true, label: ["no staff after T", 400, 437] },
  "clarify-queued": { from: "clarify", to: "queued", d: "M300,259 V355 H448", staff: true, label: ["N rounds", 400, 337] },
  "clarify-resolved": { from: "clarify", to: "resolved", d: "M270,259 V449", label: ["silent for T", 240, 365] },
  "clarify-new": { from: "clarify", to: "new", d: "M240,230 H95 V136" },
}

// The part of the diagram that is shown. The pane keeps the whole of it in view with a small padding, the way fitView
// does, but the arrows reach past the blocks, so the frame is fixed here instead of taken from the nodes.
const VIEW = { x: 0, y: 0, w: 1070, h: 530 }
const PADDING = 0.98

const FILL: Record<Kind, string> = {
  model: "bg-model", system: "bg-system", resolved: "bg-resolved", rules: "bg-rules", staff: "bg-staff",
}
const FILL_ACTIVE: Record<Kind, string> = {
  model: "bg-model-strong", system: "bg-system-strong", resolved: "bg-system-strong", rules: "bg-rules-strong", staff: "bg-staff-strong",
}

type BlockData = { spec: BlockSpec; status: Status }
type ArrowData = { spec: ArrowSpec; taken: boolean; faded: boolean }
type BlockNode = Node<BlockData, "block">
type DotNode = Node<Record<string, never>, "start">
type LegendNode = Node<Record<string, never>, "legend">
type ArrowEdge = Edge<ArrowData, "arrow"> & { data: ArrowData }

// An arrow needs a handle on each end to exist in React Flow, but the arrow draws its own path, so the handles stay hidden.
const HANDLES = (
  <>
    <Handle type="target" position={Position.Left} isConnectable={false} className="opacity-0" />
    <Handle type="source" position={Position.Right} isConnectable={false} className="opacity-0" />
  </>
)

function Block({ data: { spec, status } }: NodeProps<BlockNode>) {
  const active = status === "active"
  return (
    <div
      className={cn(
        "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] px-1.5 text-center",
        active ? FILL_ACTIVE[spec.kind] : FILL[spec.kind],
        active ? "text-white" : "text-ink",
        status === "todo" && "opacity-60",
      )}
    >
      <span className="text-[18px] font-bold leading-tight">{spec.title}</span>
      {spec.line && (
        <span className={cn("whitespace-nowrap text-[14px] leading-tight", active ? "text-white" : "text-ink-soft")}>{spec.line}</span>
      )}
      {HANDLES}
    </div>
  )
}

function StartDot() {
  return (
    <div className="size-full rounded-full bg-ink">
      {HANDLES}
    </div>
  )
}

function Legend() {
  const chip = (fill: string, text: string) => (
    <span className="flex items-center gap-2">
      <span className={cn("h-[16px] w-[24px] rounded", fill)} />
      {text}
    </span>
  )
  return (
    <div className="pointer-events-none flex items-center gap-8 whitespace-nowrap text-[15px] text-ink">
      {chip("bg-model", "Model")}
      {chip("bg-system", "System (fixed code)")}
      {chip("bg-rules", "Written rules")}
      {chip("bg-staff", "Support staff")}
      <span className="flex items-center gap-2">
        <svg width="34" height="12" viewBox="0 0 34 12">
          <path d="M0,6 H32" stroke="var(--color-staff-line)" strokeWidth="2.2" fill="none" markerEnd="url(#head-staff)" />
        </svg>
        goes to support staff
      </span>
    </div>
  )
}

function Arrow({ data: { spec, taken, faded } }: EdgeProps<ArrowEdge>) {
  const head = spec.staff ? "staff" : "line"
  return (
    <>
      <path
        d={spec.d}
        fill="none"
        stroke={spec.staff ? "var(--color-staff-line)" : "var(--color-line)"}
        strokeWidth={taken ? 3.4 : 1.8}
        opacity={faded ? 0.45 : 1}
        markerEnd={`url(#head-${head})`}
      />
      {spec.label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "pointer-events-none absolute whitespace-nowrap rounded bg-pane px-[3px] text-[14px] leading-[20px]",
              spec.staff ? "text-staff-line" : "text-ink",
              taken && "font-bold",
              faded && "opacity-60",
            )}
            style={{ transform: `translate(-50%, -50%) translate(${spec.label[1]}px, ${spec.label[2]}px)` }}
          >
            {spec.label[0]}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = { block: Block, start: StartDot, legend: Legend }
const edgeTypes = { arrow: Arrow }

/** Zoom buttons and a fit button, drawn over the pane. `fit` is the whole-diagram view of the pane. */
function DiagramControls({ fit }: { fit: { zoom: number; x: number; y: number } }) {
  const { zoomIn, zoomOut, setViewport } = useReactFlow()
  const btn =
    "grid size-7 place-items-center rounded-md bg-system-strong text-[15px] font-semibold text-ink " +
    "cursor-pointer select-none border-none hover:opacity-85"
  return (
    <div className="absolute right-2 bottom-2 z-10 flex items-center gap-1.5">
      <button className={btn} title="Zoom out" onClick={() => zoomOut({ duration: 150 })}>
        −
      </button>
      <button className={btn} title="Zoom in" onClick={() => zoomIn({ duration: 150 })}>
        +
      </button>
      <button className={cn(btn, "px-2 text-[11px] tracking-wide")} title="Show the whole diagram" onClick={() => setViewport(fit, { duration: 200 })}>
        Fit
      </button>
    </div>
  )
}

interface Props {
  active: NodeId | null
  visited: NodeId[]
  taken: EdgeId[]
  onSelect: (node: NodeId) => void
}
export function Diagram({ active, visited, taken, onSelect }: Props) {
  // The pane starts with the whole diagram in view at a small padding. After that the user zooms and pans freely.
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const measure = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const zoom = size ? PADDING * Math.min(size.w / VIEW.w, size.h / VIEW.h) : 1
  const viewport = size
    ? { zoom, x: (size.w - VIEW.w * zoom) / 2 - VIEW.x * zoom, y: (size.h - VIEW.h * zoom) / 2 - VIEW.y * zoom }
    : { zoom: 1, x: 0, y: 0 }

  // Before the first message every block and arrow shows its own color. After it, what the flow did not reach fades.
  const started = visited.length > 0
  const nodes: (BlockNode | DotNode | LegendNode)[] = [
    ...(Object.entries(BLOCKS) as [NodeId, BlockSpec][]).map(([id, spec]): BlockNode => {
      const status: Status = id === active ? "active" : visited.includes(id) ? "visited" : started ? "todo" : "idle"
      return {
        id, type: "block", position: { x: spec.x, y: spec.y }, style: { width: spec.w, height: spec.h },
        data: { spec, status }, draggable: false, selectable: false,
      }
    }),
    { id: "start", type: "start", position: { x: 2, y: 97 }, style: { width: 16, height: 16 }, data: {}, draggable: false, selectable: false },
    { id: "legend", type: "legend", position: { x: 24, y: 2 }, data: {}, draggable: false, selectable: false },
  ]
  const edges: ArrowEdge[] = (Object.entries(ARROWS) as [EdgeId, ArrowSpec][]).map(([id, spec]) => {
    const isTaken = taken.includes(id)
    return {
      id, type: "arrow", source: spec.from, target: spec.to, zIndex: isTaken ? 10 : 0,
      data: { spec, taken: isTaken, faded: started && !isTaken },
    }
  })

  return (
    <div ref={measure} className="relative size-full overflow-hidden bg-pane">
      <svg className="absolute size-0" aria-hidden>
        <defs>
          {(["line", "staff"] as const).map((head) => (
            <marker key={head} id={`head-${head}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: head === "staff" ? "var(--color-staff-line)" : "var(--color-line)" }} />
            </marker>
          ))}
        </defs>
      </svg>
      {size && (
        <ReactFlow<BlockNode | DotNode | LegendNode, ArrowEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultViewport={viewport}
          minZoom={0.05}
          maxZoom={2.5}
          zoomOnScroll
          zoomOnPinch
          panOnDrag
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          onNodeClick={(_, node) => {
            if (node.type === "block") onSelect(node.id as NodeId)
          }}
          proOptions={{ hideAttribution: true }}
        >
          <DiagramControls fit={viewport} />
        </ReactFlow>
      )}
    </div>
  )
}
