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
  NodeResizer,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type EdgeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Trash2, Grid3x3, MousePointerClick, Tag, Maximize2, Undo2 } from 'lucide-react'
import { serializeDiagram } from './diagram-utils'
import type React from 'react'

// ── Component palette ─────────────────────────────────────────────────────────
type Color = 'orange' | 'blue' | 'emerald' | 'violet' | 'yellow' | 'cyan' | 'pink' | 'zinc'
type NodeShape = 'rect' | 'cylinder' | 'diamond' | 'hexagon' | 'parallelogram' | 'pill'

interface Palette { kind: string; label: string; icon: string; color: Color }

const CANVAS_COMPONENTS: Palette[] = [
  { kind: 'client',       label: 'Client / User',    icon: '📱', color: 'zinc'    },
  { kind: 'dns',          label: 'DNS',              icon: '🧭', color: 'cyan'    },
  { kind: 'cdn',          label: 'CDN',              icon: '🌐', color: 'cyan'    },
  { kind: 'lb',           label: 'Load Balancer',    icon: '⚖️', color: 'blue'    },
  { kind: 'gateway',      label: 'API Gateway',      icon: '🚪', color: 'blue'    },
  { kind: 'ratelimit',    label: 'Rate Limiter',     icon: '🚦', color: 'orange'  },
  { kind: 'auth',         label: 'Auth Service',     icon: '🔐', color: 'blue'    },
  { kind: 'service',      label: 'Service',          icon: '⚙️', color: 'orange'  },
  { kind: 'worker',       label: 'Worker / GPU',     icon: '🖥️', color: 'violet'  },
  { kind: 'scheduler',    label: 'Scheduler / Cron', icon: '⏰', color: 'orange'  },
  { kind: 'cache',        label: 'Cache (Redis)',    icon: '⚡', color: 'yellow'  },
  { kind: 'sql',          label: 'SQL Database',     icon: '🗄️', color: 'emerald' },
  { kind: 'nosql',        label: 'NoSQL Database',   icon: '📦', color: 'emerald' },
  { kind: 'replica',      label: 'Read Replica',     icon: '🗃️', color: 'emerald' },
  { kind: 'search',       label: 'Search (ES)',      icon: '🔍', color: 'yellow'  },
  { kind: 'queue',        label: 'Message Queue',    icon: '📨', color: 'violet'  },
  { kind: 'kafka',        label: 'Kafka / Event Bus',icon: '🔀', color: 'violet'  },
  { kind: 'stream',       label: 'Stream Processor', icon: '🌊', color: 'cyan'    },
  { kind: 'blob',         label: 'Object Storage',   icon: '🗂️', color: 'zinc'    },
  { kind: 'warehouse',    label: 'Data Warehouse',   icon: '🏢', color: 'emerald' },
  { kind: 'analytics',    label: 'Analytics',        icon: '📈', color: 'cyan'    },
  { kind: 'vector',       label: 'Vector DB',        icon: '🔢', color: 'pink'    },
  { kind: 'llm',          label: 'LLM / Model',      icon: '🤖', color: 'pink'    },
  { kind: 'featurestore', label: 'Feature Store',    icon: '🏪', color: 'orange'  },
  { kind: 'notify',       label: 'Notification',     icon: '🔔', color: 'violet'  },
  { kind: 'websocket',    label: 'WebSocket Server', icon: '🔌', color: 'blue'    },
  { kind: 'coordinator',  label: 'Coordination (ZK)',icon: '🗂️', color: 'zinc'    },
  { kind: 'monitor',      label: 'Monitoring',       icon: '📊', color: 'yellow'  },
]

const COMP_MAP = Object.fromEntries(CANVAS_COMPONENTS.map(c => [c.kind, c])) as Record<string, Palette>

// Minimum dimensions per shape (used when no explicit style.width/height on the node)
const SHAPE_MIN: Record<NodeShape, { w: number; h: number }> = {
  rect:          { w: 96,  h: 44 },
  pill:          { w: 110, h: 44 },
  cylinder:      { w: 96,  h: 84 },
  diamond:       { w: 96,  h: 96 },
  hexagon:       { w: 110, h: 60 },
  parallelogram: { w: 120, h: 56 },
}

// Distinct shape per component kind
const KIND_SHAPE: Partial<Record<string, NodeShape>> = {
  client:       'pill',
  dns:          'pill',
  cdn:          'pill',
  lb:           'diamond',
  gateway:      'hexagon',
  auth:         'hexagon',
  llm:          'hexagon',
  vector:       'hexagon',
  cache:        'cylinder',
  sql:          'cylinder',
  nosql:        'cylinder',
  replica:      'cylinder',
  featurestore: 'cylinder',
  blob:         'cylinder',
  warehouse:    'cylinder',
  search:       'cylinder',
  queue:        'parallelogram',
  kafka:        'parallelogram',
  stream:       'parallelogram',
  // service, worker, monitor, ratelimit, scheduler, analytics, notify, websocket, coordinator → 'rect'
}

// Initial dimensions for SVG-shaped nodes (react flow reads these via style prop)
const SHAPE_INIT_STYLE: Partial<Record<string, React.CSSProperties>> = {
  lb:           { width: 104, height: 104 },
  gateway:      { width: 128, height: 72 },
  auth:         { width: 128, height: 72 },
  llm:          { width: 128, height: 72 },
  vector:       { width: 128, height: 72 },
  cache:        { width: 106, height: 92 },
  sql:          { width: 106, height: 92 },
  nosql:        { width: 106, height: 92 },
  replica:      { width: 106, height: 92 },
  featurestore: { width: 106, height: 92 },
  blob:         { width: 106, height: 92 },
  warehouse:    { width: 106, height: 92 },
  search:       { width: 106, height: 92 },
  queue:        { width: 140, height: 62 },
  kafka:        { width: 140, height: 62 },
  stream:       { width: 140, height: 62 },
  client:       { width: 128, height: 48 },
  dns:          { width: 128, height: 48 },
  cdn:          { width: 128, height: 48 },
}

const COLOR_CLASSES: Record<Color, { border: string; text: string; ring: string; dot: string; bg: string }> = {
  orange:  { border: 'border-orange-500/50',  text: 'text-orange-300',  ring: 'ring-orange-500',  dot: '#f97316', bg: 'bg-orange-500/8'  },
  blue:    { border: 'border-blue-500/50',    text: 'text-blue-300',    ring: 'ring-blue-500',    dot: '#3b82f6', bg: 'bg-blue-500/8'    },
  emerald: { border: 'border-emerald-500/50', text: 'text-emerald-300', ring: 'ring-emerald-500', dot: '#10b981', bg: 'bg-emerald-500/8' },
  violet:  { border: 'border-violet-500/50',  text: 'text-violet-300',  ring: 'ring-violet-500',  dot: '#8b5cf6', bg: 'bg-violet-500/8'  },
  yellow:  { border: 'border-yellow-500/50',  text: 'text-yellow-300',  ring: 'ring-yellow-500',  dot: '#eab308', bg: 'bg-yellow-500/8'  },
  cyan:    { border: 'border-cyan-500/50',    text: 'text-cyan-300',    ring: 'ring-cyan-500',    dot: '#06b6d4', bg: 'bg-cyan-500/8'    },
  pink:    { border: 'border-pink-500/50',    text: 'text-pink-300',    ring: 'ring-pink-500',    dot: '#ec4899', bg: 'bg-pink-500/8'    },
  zinc:    { border: 'border-zinc-500/50',    text: 'text-zinc-300',    ring: 'ring-zinc-400',    dot: '#a1a1aa', bg: 'bg-zinc-500/8'    },
}

interface ArchNodeData extends Record<string, unknown> {
  kind: string; label: string; icon: string; color: Color
}
type ArchNode = Node<ArchNodeData, 'arch'>

interface ArchEdgeData extends Record<string, unknown> {
  label?: string
}
type ArchEdge = Edge<ArchEdgeData>

// ── SVG shape backgrounds ─────────────────────────────────────────────────────
function ShapeBg({ shape, dot, selected }: { shape: NodeShape; dot: string; selected: boolean }) {
  const sw = selected ? 2.5 : 1.5
  const op = selected ? 0.9 : 0.55
  const fill = dot + '18'  // ~9% opacity fill
  const cls = 'absolute inset-0 w-full h-full pointer-events-none'

  if (shape === 'cylinder') return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cls}>
      {/* Body */}
      <rect x="1.5" y="16" width="97" height="70" fill={fill} stroke={dot} strokeWidth={sw} strokeOpacity={op} />
      {/* Bottom cap */}
      <ellipse cx="50" cy="86" rx="48.5" ry="14" fill={fill} stroke={dot} strokeWidth={sw} strokeOpacity={op} />
      {/* Top cap (drawn last so it covers body top edge) */}
      <ellipse cx="50" cy="16" rx="48.5" ry="14" fill={fill} stroke={dot} strokeWidth={sw} strokeOpacity={op} />
    </svg>
  )

  if (shape === 'diamond') return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cls}>
      <polygon points="50,3 97,50 50,97 3,50" fill={fill} stroke={dot} strokeWidth={sw} strokeOpacity={op} strokeLinejoin="round" />
    </svg>
  )

  if (shape === 'hexagon') return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cls}>
      <polygon points="27,3 73,3 97,50 73,97 27,97 3,50" fill={fill} stroke={dot} strokeWidth={sw} strokeOpacity={op} strokeLinejoin="round" />
    </svg>
  )

  if (shape === 'parallelogram') return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cls}>
      <polygon points="15,3 97,3 85,97 3,97" fill={fill} stroke={dot} strokeWidth={sw} strokeOpacity={op} strokeLinejoin="round" />
    </svg>
  )

  return null
}

// ── Custom node ───────────────────────────────────────────────────────────────
function ArchNodeComponent({ id, data, selected }: NodeProps<ArchNode>) {
  const { updateNodeData } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(data.label)
  const c = COLOR_CLASSES[data.color] ?? COLOR_CLASSES.zinc
  const shape: NodeShape = KIND_SHAPE[data.kind] ?? 'rect'
  const isSvgShape = shape !== 'rect' && shape !== 'pill'

  const commit = () => {
    setEditing(false)
    const next = value.trim() || COMP_MAP[data.kind]?.label || data.kind
    updateNodeData(id, { label: next })
  }

  const hc = `!w-3 !h-3 !rounded-full !border-2 !transition-colors !duration-150 ${
    selected
      ? '!bg-orange-400 !border-orange-600'
      : '!bg-zinc-700 !border-zinc-900 hover:!bg-orange-400 hover:!border-orange-500'
  }`

  const editInput = (
    <input
      autoFocus
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setValue(data.label) } }}
      className="w-full bg-zinc-800 text-zinc-100 text-xs rounded px-1 py-0.5 outline-none border border-zinc-600 max-w-[80px]"
    />
  )

  // SVG-shaped nodes (diamond, hexagon, cylinder, parallelogram)
  if (isSvgShape) {
    const isVertical = shape === 'diamond'
    const { w: minW, h: minH } = SHAPE_MIN[shape]
    return (
      <div
        onDoubleClick={() => { setValue(data.label); setEditing(true) }}
        className="group relative flex items-center justify-center cursor-default"
        style={{ minWidth: minW, minHeight: minH, width: '100%', height: '100%', boxSizing: 'border-box' }}
      >
        <NodeResizer
          color="#f97316"
          isVisible={selected}
          minWidth={80}
          minHeight={56}
          handleStyle={{ width: 9, height: 9, borderRadius: 3, backgroundColor: '#f97316', border: '2px solid #9a3412' }}
          lineStyle={{ borderColor: '#f97316', borderWidth: 1, opacity: 0.6 }}
        />

        <ShapeBg shape={shape} dot={c.dot} selected={selected} />

        <Handle id="t" type="source" position={Position.Top}    className={hc} />
        <Handle id="b" type="source" position={Position.Bottom} className={hc} />
        <Handle id="l" type="source" position={Position.Left}   className={hc} />
        <Handle id="r" type="source" position={Position.Right}  className={hc} />

        <div className={`relative z-10 flex items-center gap-1.5 select-none ${
          isVertical ? 'flex-col gap-0.5 px-2' :
          shape === 'parallelogram' ? 'px-6' :
          shape === 'hexagon' ? 'px-5' :
          shape === 'cylinder' ? 'px-3 pt-4' : 'px-2'
        }`}>
          <span className={`leading-none flex-shrink-0 ${isVertical ? 'text-lg' : 'text-sm'}`}>{data.icon}</span>
          <div className={isVertical ? 'text-center' : 'min-w-0'}>
            {editing ? editInput : (
              <p className={`text-[11px] font-semibold leading-tight ${c.text} ${isVertical ? 'text-center max-w-[64px]' : 'max-w-[88px]'}`}
                style={{ wordBreak: 'break-word' }}>
                {data.label}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Pill (client, CDN) and Rect (service, worker, monitor)
  return (
    <div
      onDoubleClick={() => { setValue(data.label); setEditing(true) }}
      className={`group relative border ${c.bg} px-2.5 py-2 shadow-lg min-w-[96px] transition-all cursor-default ${c.border} ${
        shape === 'pill' ? 'rounded-full' : 'rounded-xl'
      } ${selected ? `ring-2 ${c.ring} shadow-xl` : 'hover:shadow-xl'}`}
    >
      <NodeResizer
        color="#f97316"
        isVisible={selected}
        minWidth={96}
        minHeight={44}
        handleStyle={{ width: 9, height: 9, borderRadius: 3, backgroundColor: '#f97316', border: '2px solid #9a3412' }}
        lineStyle={{ borderColor: '#f97316', borderWidth: 1, opacity: 0.6 }}
      />

      <Handle id="t" type="source" position={Position.Top}    className={hc} />
      <Handle id="b" type="source" position={Position.Bottom} className={hc} />
      <Handle id="l" type="source" position={Position.Left}   className={hc} />
      <Handle id="r" type="source" position={Position.Right}  className={hc} />

      <div className="flex items-center gap-2 h-full select-none">
        <span className="text-sm leading-none flex-shrink-0">{data.icon}</span>
        <div className="min-w-0 flex-1">
          {editing ? editInput : (
            <>
              <p className={`text-xs font-semibold leading-tight ${c.text}`} style={{ wordBreak: 'break-word' }}>{data.label}</p>
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
  resetKey?: number
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
function CanvasInner({ storageKey, resetKey, onChange, onInteract, heightClass = 'h-[calc(100vh-320px)] min-h-[460px]', fill = false }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ArchEdge>([])
  const { screenToFlowPosition, fitView } = useReactFlow()
  const wrapperRef  = useRef<HTMLDivElement>(null)
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loaded      = useRef(false)
  const historyRef  = useRef<Array<{ nodes: ArchNode[]; edges: ArchEdge[] }>>([])

  const pushHistory = useCallback((ns: ArchNode[], es: ArchEdge[]) => {
    historyRef.current = [...historyRef.current.slice(-19), { nodes: ns, edges: es }]
  }, [])

  const undo = useCallback(() => {
    const prev = historyRef.current.pop()
    if (!prev) return
    setNodes(prev.nodes); setEdges(prev.edges)
  }, [setNodes, setEdges])

  const nodeTypes = useMemo(() => ({ arch: ArchNodeComponent }), [])
  const edgeTypes = useMemo(() => ({ labeled: LabeledEdge }), [])

  // Load saved canvas — also migrates old nodes to have explicit dimensions for SVG shapes.
  // Re-runs when resetKey changes so the canvas clears after a session reset.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const p = JSON.parse(raw) as SavedCanvas
        if (Array.isArray(p.nodes)) {
          const migrated = p.nodes.map(n => {
            const kind = (n.data as ArchNodeData)?.kind
            const shape = KIND_SHAPE[kind] ?? 'rect'
            const isSvg = shape !== 'rect' && shape !== 'pill'
            if (isSvg && !n.style?.width) {
              return { ...n, style: { ...n.style, ...(SHAPE_INIT_STYLE[kind] ?? { width: SHAPE_MIN[shape].w, height: SHAPE_MIN[shape].h }) } }
            }
            return n
          })
          setNodes(migrated)
        }
        if (Array.isArray(p.edges)) setEdges(p.edges)
      } else {
        setNodes([])
        setEdges([])
      }
    } catch {
      setNodes([])
      setEdges([])
    }
    loaded.current = true
  }, [storageKey, setNodes, setEdges, resetKey])

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
    pushHistory(nodes, edges)
    const id = crypto.randomUUID?.() ?? `n_${Date.now()}_${Math.random()}`
    const node: ArchNode = {
      id,
      type: 'arch',
      position,
      style: SHAPE_INIT_STYLE[kind],
      data: { kind: comp.kind, label: comp.label, icon: comp.icon, color: comp.color },
    }
    setNodes(nds => [...nds, node])
  }, [setNodes, onInteract, pushHistory, nodes, edges])

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
      {/* Component palette */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl flex-shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800/60">
          <MousePointerClick size={10} className="text-orange-400 flex-shrink-0" />
          <span className="text-[10px] text-zinc-500">Click to add · Drag onto canvas · Connect: drag from ◉ handle · Resize: select → drag orange corners · Double-click to rename · Delete/Backspace removes</span>
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
          panActivationKeyCode={null}
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
            <>
              <button
                onClick={() => fitView({ padding: 0.15, duration: 400 })}
                title="Fit all nodes in view"
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-500 hover:text-orange-400 hover:border-orange-500/40 transition-colors"
              >
                <Maximize2 size={11} />Fit
              </button>
              <button
                onClick={undo}
                title="Undo last action"
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                <Undo2 size={11} />
              </button>
              <button
                onClick={clearCanvas}
                title="Clear canvas"
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition-colors"
              >
                <Trash2 size={11} />Clear
              </button>
            </>
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
