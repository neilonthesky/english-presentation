import { EdgeLabelRenderer, Handle, Position, ReactFlow, useReactFlow, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import type { EdgeId, NodeId } from "@/machine"

// The diagram shows the states of the flow and the moves between them. One plain block for each state, one thin arrow for
// each move, a short label on the arrows that need one. The blocks and the arrows have fixed places, so the machine only
// says which ones are lit: the active state, the states the flow reached, and the arrows the flow took.
// The places and the labels are the same as figures/flow.tex.
type Kind = "model" | "system" | "resolved" | "rules"
type Status = "idle" | "todo" | "visited" | "active"

interface BlockSpec {
  kind: Kind
  title: string
  /** One short line under the title, or nothing. */
  line?: string
  /** True when the line is longer than the block and must break into two lines. */
  wrap?: true
  x: number
  y: number
  w: number
  h: number
}

// The grid of figures/flow.tex, in demo units: row 1 is the main line (New to Do action), Final message sits in row 2
// under Do action, Chat open in row 3, and Resolved closes the flow on the same row, on the left.
const BLOCKS: Record<NodeId, BlockSpec> = {
  new: { kind: "system", title: "New", line: "message saved", x: 30, y: 76, w: 140, h: 58 },
  triage: { kind: "model", title: "Triage", line: "Jev: five answers", x: 230, y: 76, w: 140, h: 58 },
  gather: { kind: "system", title: "Gather info", line: "account + articles", x: 490, y: 76, w: 140, h: 58 },
  rules: { kind: "rules", title: "Rules check", line: "written rules", x: 720, y: 76, w: 140, h: 58 },
  act: { kind: "system", title: "Do action", line: "refund, delete, cancel plan, or reset password", wrap: true, x: 930, y: 76, w: 180, h: 58 },
  final: { kind: "model", title: "Final message", line: "LLM writes the text", x: 950, y: 201, w: 140, h: 58 },
  chat: { kind: "system", title: "Chat open", line: "popup: solved?", x: 950, y: 326, w: 140, h: 58 },
  resolved: { kind: "resolved", title: "Resolved", line: "chat closed", x: 30, y: 326, w: 140, h: 58 },
}

interface ArrowSpec {
  from: NodeId | "start"
  to: NodeId
  /** The path of the arrow, in the same units as the blocks. */
  d: string
  /** A short label on the arrow and the center of its box. "\n" breaks the line. The last value is the font size, 14 by default. */
  label?: [text: string, x: number, y: number, size?: number]
}

const ARROWS: Record<EdgeId, ArrowSpec> = {
  "start-new": { from: "start", to: "new", d: "M18,105 H28" },
  "new-triage": { from: "new", to: "triage", d: "M170,105 H228" },
  "triage-gather": { from: "triage", to: "gather", d: "M370,105 H488", label: ["answer, refund,\ndelete, cancel plan,\nor reset password", 430, 74, 12] },
  "triage-gather-injection": { from: "triage", to: "gather", d: "M370,105 H488", label: ["injection:\norders ignored", 429, 140] },
  "gather-rules": { from: "gather", to: "rules", d: "M630,105 H718", label: ["facts", 674, 88] },
  "rules-act": { from: "rules", to: "act", d: "M860,105 H928", label: ["allowed", 893, 88] },
  "rules-final": { from: "rules", to: "final", d: "M755,134 V180 H990 V199", label: ["denied: nothing runs", 872, 180] },
  "act-final": { from: "act", to: "final", d: "M1020,134 V199", label: ["ok or failed", 1061, 167] },
  "final-chat": { from: "final", to: "chat", d: "M1020,259 V324" },
  "chat-new": { from: "chat", to: "new", d: "M1090,355 H1120 V42 H100 V74", label: ["same chat: customer writes again", 600, 42] },
  "chat-resolved": { from: "chat", to: "resolved", d: "M950,355 H172", label: ["popup: yes, silent for T, or no N times", 561, 355] },
}

// The part of the diagram that is shown. The pane keeps the whole of it in view with a small padding, the way fitView
// does, but the arrows reach past the blocks, so the frame is fixed here instead of taken from the nodes.
const VIEW = { x: 0, y: 0, w: 1160, h: 410 }
const PADDING = 0.98

const FILL: Record<Kind, string> = {
  model: "bg-model", system: "bg-system", resolved: "bg-resolved", rules: "bg-rules",
}
const FILL_ACTIVE: Record<Kind, string> = {
  model: "bg-model-strong", system: "bg-system-strong", resolved: "bg-system-strong", rules: "bg-rules-strong",
}

/** The advisory cascade of the demo: the answers of Jev below the threshold. It only draws a branch; no flow decision reads it. */
export type Cascade = {
  threshold: number
  /** The answers below the threshold, such as "Action 0.62". */
  low: string[]
  /** True when Jev has answered, so the branch has something to show. */
  answered: boolean
}

type BlockData = { spec: BlockSpec; status: Status; /** The written rules that deny the action, on Rules check only. */ blockedBy: string[] | null }
type ArrowData = { spec: ArrowSpec; taken: boolean; faded: boolean; blockedBy: string[] | null }
type BlockNode = Node<BlockData, "block">
type DotNode = Node<Record<string, never>, "start">
type LegendNode = Node<Record<string, never>, "legend">
type CascadeNode = Node<Cascade, "cascade">
type ArrowEdge = Edge<ArrowData, "arrow"> & { data: ArrowData }
type AdvisoryEdge = Edge<Cascade, "advisory"> & { data: Cascade }

// An arrow needs a handle on each end to exist in React Flow, but the arrow draws its own path, so the handles stay hidden.
const HANDLES = (
  <>
    <Handle type="target" position={Position.Left} isConnectable={false} className="opacity-0" />
    <Handle type="source" position={Position.Right} isConnectable={false} className="opacity-0" />
  </>
)

function Block({ data: { spec, status, blockedBy } }: NodeProps<BlockNode>) {
  const active = status === "active"
  const line = blockedBy ? `blocked by ${blockedBy.join(" + ")}` : spec.line
  return (
    <div
      className={cn(
        "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] px-1.5 text-center",
        blockedBy ? "bg-destructive" : active ? FILL_ACTIVE[spec.kind] : FILL[spec.kind],
        blockedBy || active ? "text-white" : "text-ink",
        status === "todo" && !blockedBy && "opacity-60",
      )}
    >
      <span className="text-[18px] font-bold leading-tight">{spec.title}</span>
      {line && (
        <span
          className={cn(
            spec.wrap || blockedBy ? "text-[12px] font-semibold leading-[15px]" : "whitespace-nowrap text-[14px] leading-tight",
            blockedBy || active ? "text-white" : "text-ink-soft",
          )}
        >
          {line}
        </span>
      )}
      {HANDLES}
    </div>
  )
}

/** The low-confidence branch of the cascade demo: lit when an answer of Jev is below the threshold, faint otherwise. */
function CascadeBlock({ data: { threshold, low, answered } }: NodeProps<CascadeNode>) {
  const lit = low.length > 0
  return (
    <div
      className={cn(
        "flex h-full w-full cursor-default flex-col items-center justify-center gap-0.5 rounded-[12px] border-2 border-dashed px-2 text-center text-ink",
        lit ? "border-warn-strong bg-warn" : "border-line bg-pane",
        !lit && "opacity-50",
      )}
    >
      <span className="text-[16px] font-bold leading-tight">{lit ? "Low confidence" : "Cascade demo (advisory)"}</span>
      <span className="whitespace-nowrap text-[13px] leading-tight">
        {lit ? `would go to LLM or staff · ${low.join(", ")}` : answered ? `every answer is at least ${threshold.toFixed(2)}` : `answers below ${threshold.toFixed(2)} go here`}
      </span>
      {lit && <span className="text-[11px] leading-tight text-ink-soft">advisory only: the flow below is unchanged</span>}
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
      {chip("bg-warn", "Advisory (cascade demo)")}
      {chip("bg-destructive", "Blocked by a rule")}
    </div>
  )
}

function Arrow({ data: { spec, taken, faded, blockedBy } }: EdgeProps<ArrowEdge>) {
  const text = blockedBy ? `blocked by ${blockedBy.join(" + ")}` : spec.label?.[0]
  const lit = taken || blockedBy !== null
  return (
    <>
      <path
        d={spec.d}
        fill="none"
        stroke={blockedBy ? "var(--color-destructive)" : "var(--color-line)"}
        strokeWidth={blockedBy ? 4 : taken ? 3.4 : 1.8}
        opacity={faded && !blockedBy ? 0.45 : 1}
        markerEnd={blockedBy ? "url(#head-blocked)" : "url(#head-line)"}
      />
      {spec.label && text && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "pointer-events-none absolute whitespace-pre-line rounded bg-pane px-[3px] text-center text-[14px] leading-[20px] text-ink",
              lit && "font-bold",
              blockedBy && "text-destructive",
              faded && !blockedBy && "opacity-60",
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${spec.label[1]}px, ${spec.label[2]}px)`,
              ...(spec.label[3] ? { fontSize: `${spec.label[3]}px`, lineHeight: `${Math.round(spec.label[3] * 1.45)}px` } : {}),
            }}
          >
            {text}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

/** The dashed arrow from Triage to the low-confidence branch of the cascade demo. */
function AdvisoryArrow({ data: { threshold, low } }: EdgeProps<AdvisoryEdge>) {
  const lit = low.length > 0
  return (
    <>
      <path
        d="M300,134 V203"
        fill="none"
        stroke={lit ? "var(--color-warn-strong)" : "var(--color-line)"}
        strokeWidth={lit ? 3.4 : 1.8}
        strokeDasharray="7 5"
        opacity={lit ? 1 : 0.45}
        markerEnd={lit ? "url(#head-warn)" : "url(#head-line)"}
      />
      <EdgeLabelRenderer>
        <div
          className={cn("pointer-events-none absolute rounded bg-pane px-[3px] text-[13px] leading-[18px] text-ink", lit ? "font-bold" : "opacity-60")}
          style={{ transform: "translate(0, -50%) translate(308px, 168px)" }}
        >
          below {threshold.toFixed(2)}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes = { block: Block, start: StartDot, legend: Legend, cascade: CascadeBlock }
const edgeTypes = { arrow: Arrow, advisory: AdvisoryArrow }

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
  /** The advisory cascade: the answers of Jev below the confidence threshold. */
  cascade: Cascade
  /** The written rules that deny the action of this request (Rules check answered "deny"), or null. */
  blockedBy: string[] | null
  onSelect: (node: NodeId) => void
}
export function Diagram({ active, visited, taken, cascade, blockedBy, onSelect }: Props) {
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
  const nodes: (BlockNode | DotNode | LegendNode | CascadeNode)[] = [
    ...(Object.entries(BLOCKS) as [NodeId, BlockSpec][]).map(([id, spec]): BlockNode => {
      const status: Status = id === active ? "active" : visited.includes(id) ? "visited" : started ? "todo" : "idle"
      return {
        id, type: "block", position: { x: spec.x, y: spec.y }, style: { width: spec.w, height: spec.h },
        data: { spec, status, blockedBy: id === "rules" ? blockedBy : null }, draggable: false, selectable: false,
      }
    }),
    { id: "start", type: "start", position: { x: 2, y: 97 }, style: { width: 16, height: 16 }, data: {}, draggable: false, selectable: false },
    { id: "legend", type: "legend", position: { x: 24, y: 2 }, data: {}, draggable: false, selectable: false },
    { id: "cascade", type: "cascade", position: { x: 120, y: 205 }, style: { width: 360, height: 70 }, data: cascade, draggable: false, selectable: false },
  ]
  // An arrow that the flow took is drawn last, so it lies over the arrows that the flow did not take. No z-index is used:
  // a non-zero one moves the arrow into the viewport portal of React Flow, above the labels of the other arrows.
  const arrows: ArrowEdge[] = (Object.entries(ARROWS) as [EdgeId, ArrowSpec][])
    .map(([id, spec]): ArrowEdge => {
      const isTaken = taken.includes(id)
      return {
        id, type: "arrow", source: spec.from, target: spec.to,
        data: { spec, taken: isTaken, faded: started && !isTaken, blockedBy: id === "rules-final" ? blockedBy : null },
      }
    })
    .toSorted((a, b) => Number(a.data.taken || a.data.blockedBy !== null) - Number(b.data.taken || b.data.blockedBy !== null))
  const edges: (ArrowEdge | AdvisoryEdge)[] = [...arrows, { id: "cascade", type: "advisory", source: "triage", target: "cascade", data: cascade }]

  return (
    <div ref={measure} className="relative size-full overflow-hidden bg-pane">
      <svg className="absolute size-0" aria-hidden>
        <defs>
          <marker id="head-line" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--color-line)" }} />
          </marker>
          <marker id="head-blocked" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--color-destructive)" }} />
          </marker>
          <marker id="head-warn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--color-warn-strong)" }} />
          </marker>
        </defs>
      </svg>
      {size && (
        <ReactFlow<BlockNode | DotNode | LegendNode | CascadeNode, ArrowEdge | AdvisoryEdge>
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
