'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Save, Sparkles, CheckCircle, Circle,
  AlertCircle, Loader2, Eye, PenLine, X, RefreshCw,
  Play, Pause, RotateCcw, Building2, BookOpen,
  ListChecks, Cpu, Lightbulb, Target, Award,
  Bold, Heading2, Heading3, List, Minus, Workflow, PanelRightClose, PanelRightOpen,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { serializeDiagram } from './diagram-utils'
import type { SDProblem } from '@/lib/system-design-problems'
import { DESIGN_TEMPLATE } from '@/lib/system-design-problems'

// React Flow is browser-only — load it client-side to keep it out of SSR/prerender
const SystemCanvas = dynamic(() => import('./SystemCanvas'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center">
      <span className="text-xs text-zinc-600 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Loading canvas…</span>
    </div>
  ),
})

const STORAGE_PREFIX = 'sd_design_v2_'
const CANVAS_PREFIX  = 'sd_canvas_v1_'

type LeftTab = 'problem' | 'framework' | 'components'
type EditorMode = 'write' | 'preview'

interface ReviewResult {
  overallScore: number
  grade: string
  summary: string
  strengths: string[]
  gaps: string[]
  sectionScores: Record<string, number | null>
  topSuggestion: string
  interviewerNote: string
}

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  A: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Interview-Ready' },
  B: { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',       label: 'Strong Answer'  },
  C: { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',   label: 'Needs Work'     },
  D: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',          label: 'Major Gaps'     },
}

const SECTION_LABELS: Record<string, string> = {
  requirements: 'Requirements',
  architecture: 'Architecture',
  scalability:  'Scalability',
  dataModel:    'Data Model',
  tradeoffs:    'Trade-offs',
}

// ── Architecture component snippets ──────────────────────────────────────────
const ARCH_COMPONENTS = [
  { label: 'Load Balancer',    icon: '⚖️',
    snippet: '**Load Balancer** (nginx / AWS ALB)\n- Distributes requests across N instances\n- Health checks every 30s, sticky sessions optional\n' },
  { label: 'API Gateway',      icon: '🚪',
    snippet: '**API Gateway** (Kong / AWS API GW)\n- Rate limiting, auth, request routing\n- Adds ~2ms overhead, 99.99% availability SLA\n' },
  { label: 'Cache (Redis)',     icon: '⚡',
    snippet: '**Cache** (Redis)\n- Strategy: Cache-aside / Write-through\n- TTL: __ s, Eviction: LRU\n- Cache hit rate target: __%\n' },
  { label: 'SQL Database',     icon: '🗄️',
    snippet: '**SQL Database** (PostgreSQL / MySQL)\n- 1 primary + N read replicas\n- Sharding strategy: range / hash / directory\n- Indexes: __\n' },
  { label: 'NoSQL Database',   icon: '📦',
    snippet: '**NoSQL Database** (DynamoDB / Cassandra / MongoDB)\n- Partition key: __, Sort key: __\n- Consistency: eventual / strong\n- Throughput: __ RCU / __ WCU\n' },
  { label: 'Message Queue',    icon: '📨',
    snippet: '**Message Queue** (Kafka / SQS / RabbitMQ)\n- Producers: __, Consumers: __ (consumer groups)\n- Retention: __ days, Throughput: __ msg/s\n- At-least-once / exactly-once delivery\n' },
  { label: 'CDN',              icon: '🌐',
    snippet: '**CDN** (CloudFront / Fastly / Cloudflare)\n- Static assets: images, JS, CSS cached at edge\n- Cache-Control: max-age=__\n- Origin fallback on cache miss\n' },
  { label: 'Vector Database',  icon: '🔢',
    snippet: '**Vector Database** (Qdrant / Pinecone / Weaviate)\n- Index: HNSW, Dimensions: __\n- Metric: cosine / dot product / L2\n- Search latency: __ ms at __ recall@10\n' },
  { label: 'ML Model Server',  icon: '🤖',
    snippet: '**ML Model Server** (vLLM / Triton / TorchServe)\n- Model: __, Quantisation: FP16 / INT8\n- Hardware: __ × GPU\n- Throughput: __ req/s, P99 latency: __ ms\n' },
  { label: 'Stream Processor', icon: '🌊',
    snippet: '**Stream Processor** (Flink / Spark Streaming)\n- Window: tumbling __ / sliding __ / session\n- Latency: __ ms, Throughput: __ events/s\n- Watermark delay: __ s for late data\n' },
  { label: 'Feature Store',    icon: '🏪',
    snippet: '**Feature Store** (Feast / Tecton)\n- Online store: Redis → __ ms latency\n- Offline store: S3 / BigQuery → batch training\n- Point-in-time correct joins for training\n' },
  { label: 'Object Storage',   icon: '🗂️',
    snippet: '**Object Storage** (S3 / GCS / Azure Blob)\n- Stores: __ (models, logs, raw data)\n- Lifecycle: transition to Glacier after __ days\n- Versioning: enabled / disabled\n' },
]

// ── Interview framework steps ─────────────────────────────────────────────────
const FRAMEWORK_STEPS = [
  {
    num: '01', time: '2–3 min', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/25',
    title: 'Clarify Requirements',
    tips: [
      'What are the top 3 functional requirements?',
      'What scale? (users, QPS, data volume)',
      'Latency SLA? Availability SLA?',
      'What are we explicitly NOT building?',
      'Any tech stack or cost constraints?',
    ],
  },
  {
    num: '02', time: '2–3 min', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25',
    title: 'Capacity Estimation',
    tips: [
      'DAU → QPS: divide by 86,400',
      'Storage: record size × daily writes × retention',
      'Bandwidth: avg request size × QPS',
      'State whether to go deeper or move on',
    ],
  },
  {
    num: '03', time: '10–15 min', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/25',
    title: 'High-Level Architecture',
    tips: [
      'Draw/describe main components and data flow',
      'Choose storage (SQL/NoSQL) and justify why',
      'Identify stateless vs stateful services',
      'Explain each component in 1 sentence',
    ],
  },
  {
    num: '04', time: '15–20 min', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25',
    title: 'Deep Dive (2–3 Components)',
    tips: [
      'Pick the most critical or risky components',
      'Detail schemas, APIs, algorithms',
      'Discuss trade-offs — don\'t just describe',
      'Cover failure modes and edge cases',
    ],
  },
  {
    num: '05', time: '5–10 min', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25',
    title: 'Scale & Trade-offs',
    tips: [
      'Identify your design\'s bottlenecks',
      'How would you handle 10× more traffic?',
      'What did you trade off and why?',
      'What would you change with more time?',
    ],
  },
]

// ── Markdown → HTML (minimal, safe) ──────────────────────────────────────────
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="bg-zinc-800 rounded-lg p-3 text-xs overflow-x-auto my-3 text-orange-300"><code>$1</code></pre>')
    .replace(/`([^`\n]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-orange-300 text-xs">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-zinc-100 mt-4 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-extrabold text-zinc-100 mt-5 mb-2 border-b border-zinc-800 pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-extrabold text-zinc-100 mt-6 mb-3">$1</h1>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em class="text-zinc-300">$1</em>')
    .replace(/^---$/gm, '<hr class="border-zinc-800 my-4" />')
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-1.5 text-zinc-300 mb-1 text-sm"><span class="text-orange-400 mt-0.5 flex-shrink-0 text-xs">•</span><span>$1</span></li>')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="space-y-0.5 my-2">${m}</ul>`)
    .replace(/^(\d+)\. (.+)$/gm, '<li class="text-zinc-300 mb-1 ml-5 text-sm list-decimal">$2</li>')
    .replace(/\n\n+/g, '</p><p class="mb-2">')
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DesignPad({ problem }: { problem: SDProblem }) {
  const [design, setDesign]           = useState('')
  const [notesView, setNotesView]     = useState<EditorMode>('write')
  const [leftTab, setLeftTab]         = useState<LeftTab>('problem')
  const [briefOpen, setBriefOpen]     = useState(false)
  const [notesOpen, setNotesOpen]     = useState(true)
  const [mobilePane, setMobilePane]   = useState<'canvas' | 'notes'>('canvas')
  const [savedAt, setSavedAt]         = useState<Date | null>(null)
  const [reviewing, setReviewing]     = useState(false)
  const [review, setReview]           = useState<ReviewResult | null>(null)
  const [reviewError, setReviewError] = useState('')
  const [reviewOpen, setReviewOpen]   = useState(false)
  const [checklist, setChecklist]     = useState<Record<string, boolean>>({})
  const [timerSec, setTimerSec]       = useState(45 * 60)
  const [timerOn, setTimerOn]         = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [diagramNodes, setDiagramNodes] = useState(0)
  const saveTimer                     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerInterval                 = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef                   = useRef<HTMLTextAreaElement>(null)
  const diagramTextRef                = useRef('')
  const startedRef                    = useRef(false)
  const storageKey                    = STORAGE_PREFIX + problem.slug
  const canvasKey                     = CANVAS_PREFIX + problem.slug

  // Start the interview timer on the first real action (typing or drawing)
  const autoStartTimer = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setTimerOn(true)
    setTimerStarted(true)
  }, [])

  const handleCanvasChange = useCallback((text: string, count: number) => {
    diagramTextRef.current = text
    setDiagramNodes(count)
  }, [])

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const p = JSON.parse(saved)
        setDesign(p.design ?? DESIGN_TEMPLATE)
        setSavedAt(p.savedAt ? new Date(p.savedAt) : null)
        setChecklist(p.checklist ?? {})
      } else {
        setDesign(DESIGN_TEMPLATE)
      }
    } catch { setDesign(DESIGN_TEMPLATE) }
  }, [storageKey])

  // Seed diagram text from a previously-saved canvas so AI Review can include it
  useEffect(() => {
    try {
      const raw = localStorage.getItem(canvasKey)
      if (!raw) return
      const p = JSON.parse(raw)
      if (Array.isArray(p.nodes) && p.nodes.length) {
        diagramTextRef.current = serializeDiagram(p.nodes, p.edges ?? [])
        setDiagramNodes(p.nodes.length)
      }
    } catch { /* ignore */ }
  }, [canvasKey])

  // Timer
  useEffect(() => {
    if (timerOn) {
      timerInterval.current = setInterval(() => {
        setTimerSec(s => {
          if (s <= 1) { clearInterval(timerInterval.current!); setTimerOn(false); return 0 }
          return s - 1
        })
      }, 1000)
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current) }
  }, [timerOn])

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`
  const timerColor = timerSec <= 300 ? 'text-red-400' : timerSec <= 600 ? 'text-orange-400' : 'text-zinc-300'

  const resetTimer = () => { setTimerOn(false); setTimerSec(45 * 60); setTimerStarted(false); startedRef.current = false }
  const startTimerManually = () => { startedRef.current = true; setTimerOn(true); setTimerStarted(true) }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [])

  // Download design as Markdown
  const downloadDesign = () => {
    const blob = new Blob([design], { type: 'text/markdown;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${problem.slug}-design.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Auto-save
  const saveDesign = useCallback((text: string, cl: Record<string, boolean>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ design: text, savedAt: new Date().toISOString(), checklist: cl }))
        setSavedAt(new Date())
      } catch {}
    }, 700)
  }, [storageKey])

  const handleChange = (val: string) => { autoStartTimer(); setDesign(val); saveDesign(val, checklist) }

  const toggleCheck = (area: string) => {
    const next = { ...checklist, [area]: !checklist[area] }
    setChecklist(next)
    saveDesign(design, next)
  }

  // Insert text at cursor
  const insertAt = useCallback((text: string) => {
    const el = textareaRef.current
    if (!el) return
    const s = el.selectionStart, e = el.selectionEnd
    const next = design.slice(0, s) + text + design.slice(e)
    handleChange(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = s + text.length
      el.focus()
    })
  }, [design, handleChange])

  // Wrap selected text
  const wrap = useCallback((before: string, after = '') => {
    const el = textareaRef.current
    if (!el) return
    const s = el.selectionStart, e = el.selectionEnd
    const sel = design.slice(s, e)
    const next = design.slice(0, s) + before + sel + after + design.slice(e)
    handleChange(next)
    requestAnimationFrame(() => {
      el.selectionStart = s + before.length
      el.selectionEnd   = s + before.length + sel.length
      el.focus()
    })
  }, [design, handleChange])

  // AI review — combines the written answer with the visual diagram
  const buildReviewPayload = () => {
    const diagram = diagramTextRef.current.trim()
    if (!diagram) return design
    return `${design.trim()}\n\n---\n\n## Architecture Diagram (drawn on the visual canvas)\n${diagram}`
  }

  const handleReview = async () => {
    const hasEnoughText = design.trim().length >= 100
    const hasDiagram    = diagramNodes >= 2
    if (!hasEnoughText && !hasDiagram) {
      setReviewError('Add more before requesting a review — write a few paragraphs, or place and connect at least a couple of components on the diagram.')
      return
    }
    setReviewing(true); setReviewError(''); setReview(null)
    try {
      const res = await fetch('/api/system-design/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: problem.problem, design: buildReviewPayload() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Review failed')
      setReview(data.review)
      setReviewOpen(true)
    } catch (e: unknown) {
      setReviewError((e instanceof Error ? e.message : '') || 'Review failed. Try again.')
    } finally { setReviewing(false) }
  }

  const coveredCount = Object.values(checklist).filter(Boolean).length
  const wordCount    = design.split(/\s+/).filter(Boolean).length

  // ─ Render ─────────────────────────────────────────────────────────────────
  const RING_C = 2 * Math.PI * 42
  const gradeStroke: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#eab308', D: '#ef4444' }

  const openNotes = () => { setNotesOpen(true); setMobilePane('notes') }

  return (
    <div className="h-full flex flex-col bg-zinc-950 relative overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="h-12 flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 border-b border-zinc-800 bg-zinc-950 z-30">
        <Link href="/system-design" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors flex-shrink-0">
          <ArrowLeft size={14} /> <span className="hidden sm:inline">Problems</span>
        </Link>
        <span className="text-zinc-700 hidden sm:inline">›</span>
        <span className="text-sm font-semibold text-zinc-200 truncate flex-1 min-w-0">{problem.title}</span>

        <span className={`hidden md:inline flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full border font-medium ${
          problem.difficulty === 'Hard' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
        }`}>{problem.difficulty}</span>

        {/* Timer */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-sm font-mono font-bold tabular-nums ${timerColor}`}>{fmtTime(timerSec)}</span>
          {!timerStarted ? (
            <button onClick={startTimerManually} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
              <Play size={10} /> <span className="hidden sm:inline">Start</span>
            </button>
          ) : (
            <>
              <button onClick={() => setTimerOn(v => !v)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                {timerOn ? <Pause size={10} /> : <Play size={10} />}
              </button>
              <button onClick={resetTimer} className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                <RotateCcw size={10} />
              </button>
            </>
          )}
        </div>

        {/* Brief */}
        <button onClick={() => setBriefOpen(true)} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex-shrink-0">
          <BookOpen size={12} /> <span className="hidden md:inline">Brief</span>
        </button>

        {/* Download */}
        <button onClick={downloadDesign} title="Download answer as Markdown" className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0">
          <Save size={13} />
        </button>

        {/* AI Review */}
        <button onClick={handleReview} disabled={reviewing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold transition-all disabled:opacity-60 flex-shrink-0 shadow-lg shadow-orange-500/20">
          {reviewing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          <span>{reviewing ? 'Reviewing…' : 'AI Review'}</span>
        </button>
      </header>

      {/* ── Mobile pane switch ───────────────────────────────────────────── */}
      <div className="lg:hidden flex-shrink-0 flex gap-1 p-1.5 border-b border-zinc-800 bg-zinc-950">
        <button onClick={() => setMobilePane('canvas')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mobilePane === 'canvas' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'}`}>
          <Workflow size={13} /> Diagram
        </button>
        <button onClick={() => setMobilePane('notes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mobilePane === 'notes' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'}`}>
          <PenLine size={13} /> Answer
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 relative">

        {/* Canvas */}
        <main className={`${mobilePane === 'canvas' ? 'flex' : 'hidden'} lg:flex flex-1 min-w-0 min-h-0 flex-col p-3`}>
          <SystemCanvas fill storageKey={canvasKey} onChange={handleCanvasChange} onInteract={autoStartTimer} />
        </main>

        {/* Collapsed notes rail (desktop) */}
        {!notesOpen && (
          <button onClick={() => setNotesOpen(true)}
            className="hidden lg:flex flex-col items-center gap-3 w-11 flex-shrink-0 border-l border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors pt-4">
            <PanelRightOpen size={16} />
            <span className="text-[10px] font-semibold [writing-mode:vertical-rl] rotate-180 tracking-wide">Your Answer</span>
          </button>
        )}

        {/* Notes panel */}
        <aside className={`${mobilePane === 'notes' ? 'flex' : 'hidden'} ${notesOpen ? 'lg:flex' : 'lg:hidden'} flex-col w-full lg:w-[400px] xl:w-[460px] lg:flex-shrink-0 border-l border-zinc-800 bg-zinc-950 min-h-0`}>
          {/* header */}
          <div className="h-11 flex items-center justify-between px-3 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <PenLine size={13} className="text-orange-400" /> Your Answer
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button onClick={() => setNotesView('write')} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${notesView === 'write' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}><PenLine size={10} /> Write</button>
                <button onClick={() => setNotesView('preview')} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${notesView === 'preview' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}><Eye size={10} /> Preview</button>
              </div>
              <button onClick={() => setNotesOpen(false)} title="Hide panel" className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
                <PanelRightClose size={14} />
              </button>
            </div>
          </div>

          {/* markdown toolbar */}
          {notesView === 'write' && (
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-800 flex-shrink-0">
              {[
                { icon: <Heading2 size={13} />, label: 'H2', action: () => insertAt('\n## ') },
                { icon: <Heading3 size={13} />, label: 'H3', action: () => insertAt('\n### ') },
                { icon: <Bold size={13} />,     label: 'Bold', action: () => wrap('**', '**') },
                { icon: <List size={13} />,     label: 'List', action: () => insertAt('\n- ') },
                { icon: <Minus size={13} />,    label: 'Divider', action: () => insertAt('\n\n---\n\n') },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={action} title={label} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">{icon}</button>
              ))}
              <span className="ml-auto text-[10px] text-zinc-600 flex items-center gap-1 pr-1">
                {savedAt ? <><Save size={9} /> saved</> : 'unsaved'}
              </span>
            </div>
          )}

          {/* content */}
          {notesView === 'write' ? (
            <textarea ref={textareaRef} value={design} onChange={e => handleChange(e.target.value)} spellCheck={false}
              placeholder="Explain your design — requirements, capacity numbers, component choices, trade-offs, bottlenecks…"
              className="flex-1 min-h-0 w-full bg-zinc-950 px-4 py-3 text-sm text-zinc-200 font-mono leading-relaxed resize-none outline-none placeholder-zinc-700" />
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 leading-relaxed">
              {design.trim() ? <div dangerouslySetInnerHTML={{ __html: markdownToHtml(design) }} /> : <p className="text-zinc-600 italic text-sm">Nothing written yet.</p>}
            </div>
          )}

          {/* footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-800 flex-shrink-0 text-[10px] text-zinc-600">
            <span>{wordCount} words · {diagramNodes} diagram nodes</span>
            <span className="flex items-center gap-1"><Sparkles size={10} className="text-orange-400" /> AI reads diagram + writing</span>
          </div>
        </aside>
      </div>

      {/* ── Brief drawer ─────────────────────────────────────────────────── */}
      {briefOpen && (
        <>
          <div onClick={() => setBriefOpen(false)} className="absolute inset-0 bg-black/50 z-40" />
          <aside className="absolute left-0 top-0 bottom-0 w-[92%] sm:w-[380px] bg-zinc-950 border-r border-zinc-800 z-50 flex flex-col shadow-2xl">
            <div className="h-11 flex items-center justify-between px-3 border-b border-zinc-800 flex-shrink-0">
              <span className="text-sm font-semibold text-zinc-200">Problem Brief</span>
              <button onClick={() => setBriefOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"><X size={15} /></button>
            </div>

            {/* tabs */}
            <div className="flex gap-1 p-2 border-b border-zinc-800 flex-shrink-0">
              {([
                { id: 'problem',    icon: <ListChecks size={13} />, label: 'Problem'    },
                { id: 'framework',  icon: <BookOpen size={13} />,   label: 'Framework'  },
                { id: 'components', icon: <Cpu size={13} />,        label: 'Snippets'   },
              ] as { id: LeftTab; icon: React.ReactNode; label: string }[]).map(t => (
                <button key={t.id} onClick={() => setLeftTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${leftTab === t.id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {leftTab === 'problem' && (
                <>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-zinc-800"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">The Problem</span></div>
                    <div className="px-4 py-3 text-xs text-zinc-300 leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: markdownToHtml(problem.problem) }} />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-zinc-800"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Scale &amp; Constraints</span></div>
                    <ul className="px-4 py-3 space-y-1.5">
                      {problem.constraints.map(c => (
                        <li key={c} className="flex items-start gap-2 text-xs text-zinc-400"><span className="text-orange-400 flex-shrink-0 mt-0.5">▸</span><span>{c}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Must Cover</span>
                      <span className={`text-[10px] font-bold ${coveredCount === problem.keyAreas.length ? 'text-emerald-400' : 'text-zinc-500'}`}>{coveredCount}/{problem.keyAreas.length}</span>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {problem.keyAreas.map(area => (
                        <button key={area} onClick={() => toggleCheck(area)} className="w-full flex items-start gap-2 text-left group">
                          <span className="mt-0.5 flex-shrink-0">{checklist[area] ? <CheckCircle size={13} className="text-emerald-400" /> : <Circle size={13} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />}</span>
                          <span className={`text-xs leading-snug ${checklist[area] ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>{area}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-1.5"><Lightbulb size={12} className="text-yellow-400" /><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hints</span></div>
                    <div className="px-4 py-3 space-y-2">
                      {problem.hints.map((h, i) => (<p key={i} className="text-xs text-zinc-500 leading-relaxed">💡 {h}</p>))}
                    </div>
                  </div>
                </>
              )}

              {leftTab === 'framework' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-600 px-1">FAANG interview structure (45 min)</p>
                  {FRAMEWORK_STEPS.map(step => (
                    <div key={step.num} className={`border rounded-xl overflow-hidden ${step.bg}`}>
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-lg font-extrabold opacity-40 ${step.color} tabular-nums leading-none`}>{step.num}</span>
                          <div><p className={`text-xs font-bold ${step.color}`}>{step.title}</p><p className="text-[10px] text-zinc-600">{step.time}</p></div>
                        </div>
                        <ul className="space-y-1">
                          {step.tips.map(tip => (<li key={tip} className="flex items-start gap-1.5 text-[11px] text-zinc-400"><span className={`${step.color} mt-0.5 flex-shrink-0 text-[10px]`}>→</span>{tip}</li>))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {leftTab === 'components' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-600 px-1">Insert a detailed text template into your written answer.</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ARCH_COMPONENTS.map(c => (
                      <button key={c.label} onClick={() => { insertAt('\n' + c.snippet); openNotes(); setBriefOpen(false) }}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/60 transition-all text-left group">
                        <span className="text-base leading-none flex-shrink-0">{c.icon}</span>
                        <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors leading-snug">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* ── AI Review scorecard drawer ───────────────────────────────────── */}
      {reviewOpen && review && (
        <>
          <div onClick={() => setReviewOpen(false)} className="absolute inset-0 bg-black/50 z-40" />
          <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[440px] bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl">
            <div className="h-11 flex items-center justify-between px-4 border-b border-zinc-800 flex-shrink-0">
              <span className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><Sparkles size={14} className="text-orange-400" /> AI Review</span>
              <button onClick={() => setReviewOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"><X size={15} /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Score header */}
              <div className="p-5 flex items-center gap-4 border-b border-zinc-800 bg-gradient-to-b from-zinc-900/50 to-transparent">
                <div className="relative w-[92px] h-[92px] flex-shrink-0">
                  <svg width="92" height="92" viewBox="0 0 100 100" className="-rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={gradeStroke[review.grade] ?? '#eab308'} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - review.overallScore / 10)} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-extrabold text-zinc-100 leading-none">{review.overallScore}<span className="text-sm text-zinc-500 font-bold">/10</span></span>
                  </div>
                </div>
                <div className="min-w-0">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold ${GRADE_CONFIG[review.grade]?.color ?? ''} ${GRADE_CONFIG[review.grade]?.bg ?? ''}`}>
                    <Award size={11} /> Grade {review.grade} · {GRADE_CONFIG[review.grade]?.label ?? ''}
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed mt-2">{review.summary}</p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Section scores */}
                {Object.entries(review.sectionScores).some(([, v]) => v !== null) && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">Section Scores</p>
                    <div className="space-y-2">
                      {Object.entries(review.sectionScores).map(([key, score]) => score !== null && (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-[11px] text-zinc-400 w-24 flex-shrink-0">{SECTION_LABELS[key] ?? key}</span>
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${score * 10}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-zinc-300 w-9 text-right">{score}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {review.strengths.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle size={11} /> Strengths</p>
                    <ul className="space-y-1.5">
                      {review.strengths.map((s, i) => (<li key={i} className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" /> {s}</li>))}
                    </ul>
                  </div>
                )}

                {/* Gaps */}
                {review.gaps.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertCircle size={11} /> Gaps to Fix</p>
                    <ul className="space-y-1.5">
                      {review.gaps.map((g, i) => (<li key={i} className="flex items-start gap-2 text-sm text-zinc-300"><AlertCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" /> {g}</li>))}
                    </ul>
                  </div>
                )}

                {/* Top suggestion */}
                <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-orange-400 mb-1 flex items-center gap-1.5"><Target size={11} /> Top Priority Improvement</p>
                  <p className="text-sm text-zinc-200">{review.topSuggestion}</p>
                </div>

                {/* Interviewer note */}
                {review.interviewerNote && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1.5"><Building2 size={10} /> What the interviewer would say</p>
                    <p className="text-sm text-zinc-400 italic leading-relaxed">&ldquo;{review.interviewerNote}&rdquo;</p>
                  </div>
                )}

                {/* Re-run */}
                <button onClick={handleReview} disabled={reviewing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors disabled:opacity-60">
                  {reviewing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {reviewing ? 'Reviewing…' : 'Re-run review'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Review error toast */}
      {reviewError && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-start gap-2 px-4 py-3 bg-red-500/15 border border-red-500/40 rounded-xl text-sm text-red-200 shadow-xl max-w-md mx-3">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1">{reviewError}</span>
          <button onClick={() => setReviewError('')} className="text-red-300 hover:text-red-100 flex-shrink-0"><X size={14} /></button>
        </div>
      )}
    </div>
  )
}
