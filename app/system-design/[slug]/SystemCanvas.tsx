'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
  ConnectionMode,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Trash2, Sparkles, Grid3x3, MousePointerClick } from 'lucide-react'
import { serializeDiagram } from './diagram-utils'

// ── Component palette ─────────────────────────────────────────────────────────
type Color = 'orange' | 'blue' | 'emerald' | 'violet' | 'yellow' | 'cyan' | 'pink' | 'zinc'

interface Palette {
  kind: string
  label: string
  icon: string
  color: Color
}

const CANVAS_COMPONENTS: Palette[] = [
  { kind: 'client',       label: 'Client / User',   icon: '📱', color: 'zinc'    },
  { kind: 'cdn',          label: 'CDN',             icon: '🌐', color: 'cyan'    },
  { kind: 'lb',           label: 'Load Balancer',   icon: '⚖️', color: 'blue'    },
  { kind: 'gateway',      label: 'API Gateway',     icon: '🚪', color: 'blue'    },
  { kind: 'service',      label: 'Service',         icon: '⚙️', color: 'orange'  },
  { kind: 'cache',        label: 'Cache (Redis)',   icon: '⚡', color: 'yellow'  },
  { kind: 'sql',          label: 'SQL Database',    icon: '🗄️', color: 'emerald' },
  { kind: 'nosql',        label: 'NoSQL Database',  icon: '📦', color: 'emerald' },
  { kind: 'queue',        label: 'Message Queue',   icon: '📨', color: 'violet'  },
  { kind: 'stream',       label: 'Stream Processor',icon: '🌊', color: 'cyan'    },
  { kind: 'blob',         label: 'Object Storage',  icon: '🗂️', color: 'zinc'    },
  { kind: 'vector',       label: 'Vector DB',       icon: '🔢', color: 'pink'    },
  { kind: 'llm',          label: 'LLM / Model',     icon: '🤖', color: 'pink'    },
  { kind: 'featurestore', label: 'Feature Store',   icon: '🏪', color: 'orange'  },
  { kind: 'worker',       label: 'Worker / GPU',    icon: '🖥️', color: 'violet'  },
  { kind: 'monitor',      label: 'Monitoring',      icon: '📊', color: 'yellow'  },
]

const COMP_MAP = Object.fromEntries(CANVAS_COMPONENTS.map(c => [c.kind, c])) as Record<string, Palette>

// Tailwind class strings kept static so they survive the JIT compiler
const COLOR_CLASSES: Record<Color, { border: string; text: string; ring: string; dot: string }> = {
  orange:  { border: 'border-orange-500/50',  text: 'text-orange-300',  ring: 'ring-orange-500', dot: '#f97316' },
  blue:    { border: 'border-blue-500/50',    text: 'text-blue-300',    ring: 'ring-blue-500',   dot: '#3b82f6' },
  emerald: { border: 'border-emerald-500/50', text: 'text-emerald-300', ring: 'ring-emerald-500',dot: '#10b981' },
  violet:  { border: 'border-violet-500/50',  text: 'text-violet-300',  ring: 'ring-violet-500', dot: '#8b5cf6' },
  yellow:  { border: 'border-yellow-500/50',  text: 'text-yellow-300',  ring: 'ring-yellow-500', dot: '#eab308' },
  cyan:    { border: 'border-cyan-500/50',    text: 'text-cyan-300',    ring: 'ring-cyan-500',   dot: '#06b6d4' },
  pink:    { border: 'border-pink-500/50',    text: 'text-pink-300',    ring: 'ring-pink-500',   dot: '#ec4899' },
  zinc:    { border: 'border-zinc-500/50',    text: 'text-zinc-300',    ring: 'ring-zinc-400',   dot: '#a1a1aa' },
}

interface ArchNodeData extends Record<string, unknown> {
  kind: string
  label: string
  icon: string
  color: Color
}
type ArchNode = Node<ArchNodeData, 'arch'>

// ── Custom node ───────────────────────────────────────────────────────────────
function ArchNodeComponent({ id, data, selected }: NodeProps<ArchNode>) {
  const { updateNodeData } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(data.label)
  const c = COLOR_CLASSES[data.color] ?? COLOR_CLASSES.zinc

  const beginEdit = () => { setValue(data.label); setEditing(true) }

  const commit = () => {
    setEditing(false)
    const next = value.trim() || COMP_MAP[data.kind]?.label || data.kind
    updateNodeData(id, { label: next })
  }

  const handleClass = '!w-2 !h-2 !bg-zinc-500 !border !border-zinc-900 hover:!bg-orange-400'

  return (
    <div
      onDoubleClick={beginEdit}
      className={`group relative rounded-xl border bg-zinc-900 px-3 py-2 shadow-lg min-w-[130px] max-w-[200px] transition-all ${c.border} ${
        selected ? `ring-2 ${c.ring}` : ''
      }`}
    >
      {/* Handles on all four sides — Loose mode lets any connect to any */}
      <Handle id="t" type="source" position={Position.Top}    className={handleClass} />
      <Handle id="b" type="source" position={Position.Bottom} className={handleClass} />
      <Handle id="l" type="source" position={Position.Left}   className={handleClass} />
      <Handle id="r" type="source" position={Position.Right}  className={handleClass} />

      <div className="flex items-center gap-2">
        <span className="text-lg leading-none flex-shrink-0">{data.icon}</span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={commit}
              onKeyDown={e => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') { setEditing(false); setValue(data.label) }
              }}
              className="w-full bg-zinc-800 text-zinc-100 text-xs rounded px-1 py-0.5 outline-none border border-zinc-600"
            />
          ) : (
            <>
              <p className={`text-xs font-semibold leading-tight truncate ${c.text}`}>{data.label}</p>
              <p className="text-[9px] text-zinc-600 leading-tight">{COMP_MAP[data.kind]?.label ?? 'node'}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface SavedCanvas { nodes: ArchNode[]; edges: Edge[] }

interface Props {
  storageKey: string
  onChange?: (diagramText: string, nodeCount: number) => void
  /** Fired on a genuine user action (adding/connecting a node) — used to auto-start the timer. */
  onInteract?: () => void
  /** Tailwind height classes for the canvas area. */
  heightClass?: string
}

const defaultEdgeOptions = {
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#f97316' },
  style: { stroke: '#f97316', strokeWidth: 1.5 },
}

// ── Inner canvas (needs ReactFlowProvider context) ────────────────────────────
function CanvasInner({ storageKey, onChange, onInteract, heightClass = 'h-[calc(100vh-320px)] min-h-[460px]' }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { screenToFlowPosition } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loaded = useRef(false)

  const nodeTypes = useMemo(() => ({ arch: ArchNodeComponent }), [])

  // Load saved canvas
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const p = JSON.parse(raw) as SavedCanvas
        if (Array.isArray(p.nodes)) setNodes(p.nodes)
        if (Array.isArray(p.edges)) setEdges(p.edges)
      }
    } catch { /* ignore corrupt state */ }
    loaded.current = true
  }, [storageKey, setNodes, setEdges])

  // Persist + notify parent (debounced) whenever the graph changes
  useEffect(() => {
    if (!loaded.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify({ nodes, edges })) } catch {}
      onChange?.(serializeDiagram(nodes, edges), nodes.length)
    }, 500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [nodes, edges, storageKey, onChange])

  const onConnect = useCallback(
    (c: Connection) => { onInteract?.(); setEdges(eds => addEdge({ ...c, ...defaultEdgeOptions }, eds)) },
    [setEdges, onInteract],
  )

  const addNode = useCallback((kind: string, position: { x: number; y: number }) => {
    const comp = COMP_MAP[kind]
    if (!comp) return
    onInteract?.()
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `n_${Date.now()}_${Math.random()}`
    const node: ArchNode = {
      id,
      type: 'arch',
      position,
      data: { kind: comp.kind, label: comp.label, icon: comp.icon, color: comp.color },
    }
    setNodes(nds => [...nds, node])
  }, [setNodes, onInteract])

  // Drag from palette → drop on canvas
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const kind = e.dataTransfer.getData('application/sd-kind')
    if (!kind) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNode(kind, position)
  }, [screenToFlowPosition, addNode])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  // Click / tap to add — drops near the centre of the current viewport
  const addToCentre = useCallback((kind: string) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    const screen = rect
      ? { x: rect.left + rect.width / 2 + (Math.random() * 80 - 40), y: rect.top + rect.height / 2 + (Math.random() * 80 - 40) }
      : { x: 300, y: 200 }
    addNode(kind, screenToFlowPosition(screen))
  }, [screenToFlowPosition, addNode])

  const clearCanvas = useCallback(() => {
    if (nodes.length && !confirm('Clear the whole canvas? This cannot be undone.')) return
    setNodes([]); setEdges([])
  }, [nodes.length, setNodes, setEdges])

  return (
    <div className="flex flex-col gap-2">
      {/* Palette */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <MousePointerClick size={11} className="text-orange-400" />
          <span className="text-[10px] text-zinc-500">Drag onto the canvas — or tap to drop. Double-click a box to rename. Drag between boxes to connect.</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CANVAS_COMPONENTS.map(comp => {
            const c = COLOR_CLASSES[comp.color]
            return (
              <button
                key={comp.kind}
                draggable
                onDragStart={e => { e.dataTransfer.setData('application/sd-kind', comp.kind); e.dataTransfer.effectAllowed = 'move' }}
                onClick={() => addToCentre(comp.kind)}
                title={`Add ${comp.label}`}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-950/60 border ${c.border} hover:bg-zinc-800 transition-all cursor-grab active:cursor-grabbing text-left`}
              >
                <span className="text-sm leading-none">{comp.icon}</span>
                <span className={`text-[10px] font-medium ${c.text}`}>{comp.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={wrapperRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={`relative ${heightClass} bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden`}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={['Delete', 'Backspace']}
          fitView
          proOptions={{ hideAttribution: true }}
          className="bg-zinc-950"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
          <Controls className="!bg-zinc-900 !border-zinc-800 [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-400 [&_svg]:!fill-zinc-400" />
          <MiniMap
            pannable zoomable
            className="!bg-zinc-900 !border !border-zinc-800"
            maskColor="rgba(9,9,11,0.7)"
            nodeColor={(n) => COLOR_CLASSES[(n.data as ArchNodeData)?.color ?? 'zinc']?.dot ?? '#a1a1aa'}
          />
        </ReactFlow>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
            <Grid3x3 size={30} className="text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500 font-medium">Start building your architecture</p>
            <p className="text-xs text-zinc-600 mt-1 max-w-xs">Drag a component from above onto the canvas, then connect the boxes to show how data flows.</p>
          </div>
        )}

        {/* Canvas actions */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600 bg-zinc-900/80 border border-zinc-800 rounded-lg px-2 py-1">
            {nodes.length} nodes · {edges.length} links
          </span>
          {nodes.length > 0 && (
            <button
              onClick={clearCanvas}
              title="Clear canvas"
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
            >
              <Trash2 size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      <p className="text-[10px] text-zinc-600 flex items-center gap-1.5 px-1">
        <Sparkles size={10} className="text-orange-400" />
        Your diagram is included automatically when you click <span className="text-zinc-400 font-medium">AI Review</span>. Select a box or arrow and press Delete to remove it.
      </p>
    </div>
  )
}

export default function SystemCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
