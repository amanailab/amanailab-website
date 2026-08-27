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
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type EdgeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Trash2, Grid3x3, MousePointerClick, Tag } from 'lucide-react'
import { serializeDiagram } from './diagram-utils'

// ── Component palette ─────────────────────────────────────────────────────────
type Color = 'orange' | 'blue' | 'emerald' | 'violet' | 'yellow' | 'cyan' | 'pink' | 'zinc'

interface Palette { kind: string; label: string; icon: string; color: Color }

const CANVAS_COMPONENTS: Palette[] = [
  { kind: 'client',       label: 'Client / User',    icon: '📱', color: 'zinc'    },
  { kind: 'cdn',          label: 'CDN',              icon: '🌐', color: 'cyan'    },
  { kind: 'lb',           label: 'Load Balancer',    icon: '⚖️', color: 'blue'    },
  { kind: 'gateway',      label: 'API Gateway',      icon: '🚪', color: 'blue'    },
  { kind: 'service',      label: 'Service',          icon: '⚙️', color: 'orange'  },
  { kind: 'cache',        label: 'Cache (Redis)',    icon: '⚡', color: 'yellow'  },
  { kind: 'sql',          label: 'SQL Database',     icon: '🗄️', color: 'emerald' },
  { kind: 'nosql',        label: 'NoSQL Database',   icon: '📦', color: 'emerald' },
  { kind: 'queue',        label: 'Message Queue',    icon: '📨', color: 'violet'  },
  { kind: 'stream',       label: 'Stream Processor', icon: '🌊', color: 'cyan'    },
  { kind: 'blob',         label: 'Object Storage',   icon: '🗂️', color: 'zinc'    },
  { kind: 'vector',       label: 'Vector DB',        icon: '🔢', color: 'pink'    },
  { kind: 'llm',          label: 'LLM / Model',      icon: '🤖', color: 'pink'    },
  { kind: 'featurestore', label: 'Feature Store',    icon: '🏪', color: 'orange'  },
  { kind: 'worker',       label: 'Worker / GPU',     icon: '🖥️', color: 'violet'  },
  { kind: 'monitor',      label: 'Monitoring',       icon: '📊', color: 'yellow'  },
]

const COMP_MAP = Object.fromEntries(CANVAS_COMPONENTS.map(c => [c.kind, c])) as Record<string, Palette>

const COLOR_CLASSES: Record<Color, { border: string; text: string; ring: string; dot: string; bg: string }> = {
  orange:  { border: 'border-orange-500/50',  text: 'text-orange-300',  ring: 'ring-orange-500',  dot: '#f97316', bg: 'bg-orange-500/5'  },
  blue:    { border: 'border-blue-500/50',    text: 'text-blue-300',    ring: 'ring-blue-500',    dot: '#3b82f6', bg: 'bg-blue-500/5'    },
  emerald: { border: 'border-emerald-500/50', text: 'text-emerald-300', ring: 'ring-emerald-500', dot: '#10b981', bg: 'bg-emerald-500/5' },
  violet:  { border: 'border-violet-500/50',  text: 'text-violet-300',  ring: 'ring-violet-500',  dot: '#8b5cf6', bg: 'bg-violet-500/5'  },
  yellow:  { border: 'border-yellow-500/50',  text: 'text-yellow-300',  ring: 'ring-yellow-500',  dot: '#eab308', bg: 'bg-yellow-500/5'  },
  cyan:    { border: 'border-cyan-500/50',    text: 'text-cyan-300',    ring: 'ring-cyan-500',    dot: '#06b6d4', bg: 'bg-cyan-500/5'    },
  pink:    { border: 'border-pink-500/50',    text: 'text-pink-300',    ring: 'ring-pink-500',    dot: '#ec4899', bg: 'bg-pink-500/5'    },
  zinc:    { border: 'border-zinc-500/50',    text: 'text-zinc-300',    ring: 'ring-zinc-400',    dot: '#a1a1aa', bg: 'bg-zinc-500/5'    },
}

interface ArchNodeData extends Record<string, unknown> {
  kind: string; label: string; icon: string; color: Color
}
type ArchNode = Node<ArchNodeData, 'arch'>

interface ArchEdgeData extends Record<string, unknown> {
  label?: string
}
type ArchEdge = Edge<ArchEdgeData>

// ── Custom node ───────────────────────────────────────────────────────────────
function ArchNodeComponent({ id, data, selected }: NodeProps<ArchNode>) {
  const { updateNodeData } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(data.label)
  const c = COLOR_CLASSES[data.color] ?? COLOR_CLASSES.zinc

  const commit = () => {
    setEditing(false)
    const next = value.trim() || COMP_MAP[data.kind]?.label || data.kind
    updateNodeData(id, { label: next })
  }

  const handleClass = `!w-3 !h-3 !rounded-full !border-2 !transition-colors !duration-150 ${
    selected
      ? '!bg-orange-400 !border-orange-600'
      : '!bg-zinc-700 !border-zinc-900 hover:!bg-orange-400 hover:!border-orange-500'
  }`

  return (
    <div
      onDoubleClick={() => { setValue(data.label); setEditing(true) }}
      className={`group relative rounded-xl border ${c.bg} px-2.5 py-2 shadow-lg min-w-[96px] max-w-[148px] transition-all cursor-default ${c.border} ${
        selected ? `ring-2 ${c.ring} shadow-xl` : 'hover:shadow-xl'
      }`}
    >
      <Handle id="t" type="source" position={Position.Top}    className={handleClass} />
      <Handle id="b" type="source" position={Position.Bottom} className={handleClass} />
      <Handle id="l" type="source" position={Position.Left}   className={handleClass} />
      <Handle id="r" type="source" position={Position.Right}  className={handleClass} />

      <div className="flex items-center gap-2">
        <span className="text-sm leading-none flex-shrink-0">{data.icon}</span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setValue(data.label) } }}
              className="w-full bg-zinc-800 text-zinc-100 text-xs rounded px-1 py-0.5 outline-none border border-zinc-600"
            />
          ) : (
            <>
              <p className={`text-xs font-semibold leading-tight truncate ${c.text}`}>{data.label}</p>
              <p className="text-[9px] text-zinc-600 leading-tight mt-0.5">{COMP_MAP[data.kind]?.label ?? 'node'}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Custom edge with editable label ───────────────────────────────────────────
function LabeledEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  data, selected, markerEnd, style,
}: EdgeProps<ArchEdge>) {
  const { setEdges } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [labelVal, setLabelVal] = useState(data?.label ?? '')

  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  const commitLabel = () => {
    setEditing(false)
    setEdges(eds => eds.map(e => e.id === id ? { ...e, data: { ...e.data, label: labelVal.trim() } } : e))
  }

  const hasLabel = Boolean(data?.label)

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {editing ? (
            <input
              autoFocus
              value={labelVal}
              onChange={e => setLabelVal(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={e => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') setEditing(false) }}
              placeholder="label..."
              className="bg-zinc-900 border border-orange-500/60 text-orange-300 text-[10px] px-1.5 py-0.5 rounded-md outline-none w-24 shadow-xl"
            />
          ) : (
            (hasLabel || selected) && (
              <button
                onClick={() => { setLabelVal(data?.label ?? ''); setEditing(true) }}
                title="Click to edit label"
                className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-all cursor-text shadow-sm ${
                  hasLabel
                    ? 'bg-zinc-900 border-zinc-600 text-zinc-300 hover:border-orange-500/50 hover:text-orange-300'
                    : 'bg-zinc-900/70 border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                }`}
              >
                {hasLabel ? data!.label : (
                  <span className="flex items-center gap-0.5"><Tag size={9} />label</span>
                )}
              </button>
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

// ── Canvas props ──────────────────────────────────────────────────────────────
interface SavedCanvas { nodes: ArchNode[]; edges: ArchEdge[] }

interface Props {
  storageKey: string
  onChange?: (diagramText: string, nodeCount: number) => void
  onInteract?: () => void
  heightClass?: string
  fill?: boolean
}

const defaultEdgeOptions = {
  type: 'labeled',
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#f97316' },
  style: { stroke: '#f97316', strokeWidth: 1.5 },
  data: { label: '' },
}

// ── Inner canvas ──────────────────────────────────────────────────────────────
function CanvasInner({ storageKey, onChange, onInteract, heightClass = 'h-[calc(100vh-320px)] min-h-[460px]', fill = false }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ArchEdge>([])
  const { screenToFlowPosition } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loaded     = useRef(false)

  const nodeTypes = useMemo(() => ({ arch: ArchNodeComponent }), [])
  const edgeTypes = useMemo(() => ({ labeled: LabeledEdge }), [])

  // Load saved canvas
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const p = JSON.parse(raw) as SavedCanvas
        if (Array.isArray(p.nodes)) setNodes(p.nodes)
        if (Array.isArray(p.edges)) setEdges(p.edges)
      }
    } catch {}
    loaded.current = true
  }, [storageKey, setNodes, setEdges])

  // Persist on change
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
    (c: Connection) => {
      onInteract?.()
      setEdges(eds => addEdge({ ...c, ...defaultEdgeOptions, data: { label: '' } }, eds))
    },
    [setEdges, onInteract],
  )

  const addNode = useCallback((kind: string, position: { x: number; y: number }) => {
    const comp = COMP_MAP[kind]
    if (!comp) return
    onInteract?.()
    const id = crypto.randomUUID?.() ?? `n_${Date.now()}_${Math.random()}`
    const node: ArchNode = {
      id,
      type: 'arch',
      position,
      data: { kind: comp.kind, label: comp.label, icon: comp.icon, color: comp.color },
    }
    setNodes(nds => [...nds, node])
  }, [setNodes, onInteract])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const kind = e.dataTransfer.getData('application/sd-kind')
    if (!kind) return
    addNode(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }, [screenToFlowPosition, addNode])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const addToCentre = useCallback((kind: string) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    const screen = rect
      ? { x: rect.left + rect.width / 2 + (Math.random() * 100 - 50), y: rect.top + rect.height / 2 + (Math.random() * 80 - 40) }
      : { x: 300, y: 200 }
    addNode(kind, screenToFlowPosition(screen))
  }, [screenToFlowPosition, addNode])

  const clearCanvas = useCallback(() => {
    if (nodes.length && !confirm('Clear the whole canvas? This cannot be undone.')) return
    setNodes([]); setEdges([])
  }, [nodes.length, setNodes, setEdges])

  return (
    <div className={fill ? 'flex flex-col gap-2 h-full min-h-0' : 'flex flex-col gap-2'}>
      {/* Component palette — single scrolling row to maximise canvas height */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl flex-shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800/60">
          <MousePointerClick size={10} className="text-orange-400 flex-shrink-0" />
          <span className="text-[10px] text-zinc-500">Click to add · Drag onto canvas · Drag between handle dots (◉) to connect · Double-click node to rename · Click arrow to label · Delete/Backspace removes selected</span>
        </div>
        <div className="flex flex-wrap gap-1.5 px-3 py-2">
          {CANVAS_COMPONENTS.map(comp => {
            const c = COLOR_CLASSES[comp.color]
            return (
              <button
                key={comp.kind}
                draggable
                onDragStart={e => { e.dataTransfer.setData('application/sd-kind', comp.kind); e.dataTransfer.effectAllowed = 'move' }}
                onClick={() => addToCentre(comp.kind)}
                title={comp.label}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-950/60 border ${c.border} hover:bg-zinc-800 transition-all cursor-grab active:cursor-grabbing flex-shrink-0`}
              >
                <span className="text-sm leading-none">{comp.icon}</span>
                <span className={`text-[10px] font-medium ${c.text} whitespace-nowrap`}>{comp.label}</span>
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
        className={`relative ${fill ? 'flex-1 min-h-0' : heightClass} bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden`}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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
            <Grid3x3 size={28} className="text-zinc-800 mb-4" />
            <p className="text-sm font-semibold text-zinc-500 mb-4">Build your architecture diagram</p>
            <ul className="space-y-2 text-left max-w-xs">
              {[
                'Click any component above to place it on the canvas',
                'Drag components to reposition them anywhere',
                'Drag from a handle dot (◉) to another node to draw a connection',
                'Click a connection arrow to add a flow label (e.g. "REST", "gRPC")',
                'Double-click a node to rename it',
                'Select a node or edge then press Delete to remove it',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-zinc-600 flex items-start gap-2">
                  <span className="text-orange-400/70 font-bold flex-shrink-0 tabular-nums leading-relaxed">{i + 1}.</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Canvas actions */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600 bg-zinc-900/90 border border-zinc-800 rounded-lg px-2 py-1 tabular-nums">
            {nodes.length} nodes · {edges.length} links
          </span>
          {nodes.length > 0 && (
            <button
              onClick={clearCanvas}
              title="Clear canvas"
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition-colors"
            >
              <Trash2 size={11} />Clear
            </button>
          )}
        </div>
      </div>

      {!fill && (
        <p className="text-[10px] text-zinc-600 flex items-center gap-1.5 px-1">
          Select a box or arrow and press Delete to remove it. Your diagram is included automatically in the AI Review.
        </p>
      )}
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
