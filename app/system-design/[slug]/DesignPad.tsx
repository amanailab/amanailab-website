'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, Save, Sparkles, CheckCircle, Circle, AlertCircle, Loader2,
  Eye, PenLine, X, RefreshCw, Play, Pause, RotateCcw, Building2, BookOpen,
  ListChecks, Cpu, Lightbulb, Target, Award, Bold, Heading2, Heading3,
  List, Minus, Plus, Code2, ChevronRight, ChevronLeft, GripVertical,
  Trophy, Hash, Maximize2, Crown, LogIn, ShieldCheck, Zap, Star, FileText, Briefcase,
} from 'lucide-react'
import { serializeDiagram } from './diagram-utils'
import type { SDProblem } from '@/lib/system-design-problems'
import { DESIGN_TEMPLATE } from '@/lib/system-design-problems'

// ── Dynamic imports ────────────────────────────────────────────────────────────
const SystemCanvas = dynamic(() => import('./SystemCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-0 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center">
      <Loader2 size={14} className="animate-spin text-zinc-600" />
    </div>
  ),
})

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-0 bg-zinc-900/30 flex items-center justify-center">
      <Loader2 size={14} className="animate-spin text-zinc-600" />
    </div>
  ),
})

// ── Types ──────────────────────────────────────────────────────────────────────
type MobilePane = 'problem' | 'canvas' | 'answer'
type RightTab   = 'write' | 'code' | 'preview'
type LeftTab    = 'problem' | 'framework' | 'components'
type CodeLang   = 'sql' | 'python' | 'typescript' | 'yaml' | 'plaintext'

interface CodeSnippet { id: string; name: string; language: CodeLang; code: string }

interface ReviewResult {
  overallScore: number
  grade: string
  summary: string
  strengths: string[]
  gaps: string[]
  sectionScores: Record<string, number | null>
  codeQuality: { score: number; notes: string } | null
  topSuggestion: string
  interviewerNote: string
}

type PlanType = 'free' | 'sd_pro' | 'full_bundle'

interface ProStatus {
  authenticated: boolean
  isSubscribed?: boolean
  plan?: PlanType
  subscribedUntil?: string
  dailyUsed?: number
  dailyLimit?: number
  freeUsed?: number
  freeLimit?: number
}

// ── Storage ────────────────────────────────────────────────────────────────────
const STORAGE_PREFIX    = 'sd_design_v2_'
const CANVAS_PREFIX     = 'sd_canvas_v1_'
const CODE_PREFIX       = 'sd_code_v1_'
const COMPLETION_PREFIX = 'sd_best_v1_'

const CODE_LANGS: { id: CodeLang; label: string }[] = [
  { id: 'sql',        label: 'SQL'        },
  { id: 'python',     label: 'Python'     },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'yaml',       label: 'YAML'       },
  { id: 'plaintext',  label: 'Pseudocode' },
]

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  A: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Interview-Ready' },
  B: { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',       label: 'Strong Answer'  },
  C: { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',   label: 'Needs Work'     },
  D: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         label: 'Major Gaps'     },
}

const SECTION_LABELS: Record<string, string> = {
  requirements: 'Requirements',
  architecture: 'Architecture',
  scalability:  'Scalability',
  dataModel:    'Data Model',
  tradeoffs:    'Trade-offs',
}

const SECTION_TIPS: Record<string, { low: string; mid: string }> = {
  requirements: {
    low: 'State 3+ functional requirements, define your SLA (latency, availability), and explicitly say what you are NOT building.',
    mid: 'Add specific numbers to non-functional requirements — e.g. P99 ≤ 200ms, 99.9% uptime, 5M DAU.',
  },
  architecture: {
    low: 'Describe all major components with data flow. Name each service and justify your database choice.',
    mid: 'Add API contracts between services. Justify every component — why this queue, why this cache technology?',
  },
  scalability: {
    low: 'Identify your main bottleneck. Add at least one of: caching strategy, sharding, or horizontal scaling.',
    mid: 'Specify cache TTL, shard key strategy, replication factor, and auto-scaling triggers.',
  },
  dataModel: {
    low: 'Define your schema with field types. Justify SQL vs NoSQL and show key indexes.',
    mid: 'Model read/write query patterns explicitly. Add partition key reasoning for distributed storage.',
  },
  tradeoffs: {
    low: 'Compare your choices to at least one alternative. Explain why you rejected other approaches.',
    mid: 'Quantify trade-offs — latency vs cost, consistency vs availability, complexity vs simplicity.',
  },
}

interface Phase { step: number; name: string; shortName: string; color: string; bg: string; time: string; tip: string }

const PHASES: Phase[] = [
  { step: 1, name: 'Clarify Requirements', shortName: 'Clarify',      color: 'text-blue-400',   bg: 'bg-blue-500',   time: '0–3m',   tip: 'State 3 core requirements, scale, SLA, and what you\'re NOT building.' },
  { step: 2, name: 'Capacity Estimation',  shortName: 'Estimate',     color: 'text-cyan-400',   bg: 'bg-cyan-500',   time: '3–6m',   tip: 'DAU → QPS → storage → bandwidth. Quick math, then move on.' },
  { step: 3, name: 'High-Level Design',    shortName: 'Architecture', color: 'text-green-400',  bg: 'bg-green-500',  time: '6–21m',  tip: 'Draw main components, name each service, choose DB, explain data flow.' },
  { step: 4, name: 'Deep Dive',            shortName: 'Deep Dive',    color: 'text-violet-400', bg: 'bg-violet-500', time: '21–41m', tip: 'Pick 2–3 critical components. Go deep: schema, API, algorithms, trade-offs.' },
  { step: 5, name: 'Trade-offs & Scale',   shortName: 'Trade-offs',   color: 'text-orange-400', bg: 'bg-orange-500', time: '41–45m', tip: 'What did you trade off? How would you handle 10× load? What would you change?' },
]

function getPhase(timerSec: number, started: boolean): Phase | null {
  if (!started) return null
  const elapsed = 45 * 60 - timerSec
  if (elapsed < 3 * 60)  return PHASES[0]
  if (elapsed < 6 * 60)  return PHASES[1]
  if (elapsed < 21 * 60) return PHASES[2]
  if (elapsed < 41 * 60) return PHASES[3]
  return PHASES[4]
}

const ARCH_COMPONENTS = [
  { label: 'Load Balancer',    icon: '⚖️', snippet: '**Load Balancer** (nginx / AWS ALB)\n- Distributes requests across N app-server instances\n- Health checks every 30s, sticky sessions optional\n- Algorithm: round-robin / least-connections\n' },
  { label: 'API Gateway',      icon: '🚪', snippet: '**API Gateway** (Kong / AWS API GW)\n- Rate limiting: token bucket (__ req/s per user)\n- Auth (JWT / OAuth 2), routing, logging\n- Target overhead: < 2ms P99\n' },
  { label: 'Cache (Redis)',     icon: '⚡', snippet: '**Cache** (Redis Cluster)\n- Strategy: Cache-aside / Write-through\n- TTL: __ s, Eviction: LRU\n- Hit-rate target: __%, Storage: __ GB\n' },
  { label: 'SQL Database',     icon: '🗄️', snippet: '**SQL Database** (PostgreSQL / MySQL)\n- 1 primary + N read replicas\n- Sharding by `user_id` (range / consistent hash)\n- Key indexes: `(user_id)`, `(created_at)`\n' },
  { label: 'NoSQL Database',   icon: '📦', snippet: '**NoSQL** (DynamoDB / Cassandra)\n- Partition key: `__`, Sort key: `__`\n- Consistency: eventual / strong\n- Throughput: __ RCU / __ WCU\n' },
  { label: 'Message Queue',    icon: '📨', snippet: '**Message Queue** (Kafka / SQS)\n- Topics: __, Partitions: __ (parallelism)\n- Consumer groups: __, Retention: __ days\n- Throughput: __ msg/s; at-least-once delivery\n' },
  { label: 'CDN',              icon: '🌐', snippet: '**CDN** (CloudFront / Cloudflare)\n- Caches static assets at PoP edges\n- Cache-Control: `max-age=__`\n- Origin fallback on cache miss\n' },
  { label: 'Vector Database',  icon: '🔢', snippet: '**Vector DB** (Qdrant / Pinecone)\n- Index: HNSW, Dimensions: __, ef_construction: __\n- Metric: cosine / dot / L2\n- P99 search latency: __ ms at __% recall@10\n' },
  { label: 'ML Model Server',  icon: '🤖', snippet: '**Model Server** (vLLM / Triton)\n- Model: __, Quantisation: FP16 / INT8 / AWQ\n- Hardware: __ × A100/H100 GPU\n- Throughput: __ req/s, P99 TTFT: __ ms\n' },
  { label: 'Stream Processor', icon: '🌊', snippet: '**Stream Processor** (Flink / Spark Streaming)\n- Window: tumbling __ / sliding __ / session\n- Watermark: __ s for late data\n- Throughput: __ events/s, Latency: __ ms\n' },
  { label: 'Feature Store',    icon: '🏪', snippet: '**Feature Store** (Feast / Tecton)\n- Online store: Redis → __ ms serving latency\n- Offline store: S3 / BigQuery → batch training\n- Point-in-time joins for training set generation\n' },
  { label: 'Object Storage',   icon: '🗂️', snippet: '**Object Storage** (S3 / GCS)\n- Stores: models, logs, datasets, embeddings\n- Lifecycle: Glacier after __ days\n- Versioning enabled; signed URLs for secure access\n' },
]

const FRAMEWORK_STEPS = [
  { num: '01', time: '2–3 min',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/25',   title: 'Clarify Requirements',       tips: ['What are the 3 core functional requirements?', 'What scale? (users, QPS, data volume)', 'Latency SLA? Availability SLA?', 'State what you are NOT building'] },
  { num: '02', time: '2–3 min',   color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/25',   title: 'Capacity Estimation',         tips: ['DAU → QPS: divide by 86,400', 'Storage: record_size × daily_writes × retention', 'Bandwidth: avg_request_size × QPS', "Move on quickly — don't over-engineer this step"] },
  { num: '03', time: '10–15 min', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/25', title: 'High-Level Architecture',     tips: ['Draw main components and data flow', 'Choose SQL vs NoSQL — justify why', 'Identify stateless vs stateful services', 'Explain each component in one sentence'] },
  { num: '04', time: '15–20 min', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25',title: 'Deep Dive (2–3 Components)',  tips: ['Pick the most critical or risky components', 'Detail schemas, APIs, key algorithms', "Discuss trade-offs — don't just describe", 'Cover failure modes and edge cases'] },
  { num: '05', time: '5–10 min',  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25',title: 'Scale & Trade-offs',          tips: ["Identify your design's bottlenecks", 'How would you handle 10× traffic?', 'What did you trade off and why?', 'What would you change with more time?'] },
]

const SECTION_JUMPS = [
  { label: 'Req',   heading: '## 1. Requirements Clarification' },
  { label: 'Cap',   heading: '## 2. Capacity Estimation' },
  { label: 'Arch',  heading: '## 3. High-Level Architecture' },
  { label: 'Dive',  heading: '## 4. Core Component Design' },
  { label: 'Trade', heading: '## 9. Trade-offs & Alternatives Considered' },
]

// ── Improved Markdown → HTML ───────────────────────────────────────────────────
function mdToHtml(md: string): string {
  let out = md.replace(/<!--[\s\S]*?-->/g, '')

  // Escape HTML
  out = out.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Fenced code blocks — styled dark box
  out = out.replace(/```[\w]*\n?([\s\S]*?)```/g,
    '<pre class="my-3 rounded-xl border border-zinc-800 bg-[#0d0d0f] overflow-x-auto"><div class="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/60"><span class="w-2.5 h-2.5 rounded-full bg-red-500/60"></span><span class="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span><span class="w-2.5 h-2.5 rounded-full bg-green-500/60"></span></div><code class="block px-4 py-3 text-[12.5px] font-mono leading-6 text-orange-200 whitespace-pre">$1</code></pre>')

  // Inline code
  out = out.replace(/`([^`\n]+)`/g,
    '<code class="px-1.5 py-0.5 rounded-md bg-zinc-800 text-orange-300 text-[12px] font-mono border border-zinc-700/60">$1</code>')

  // Bold + italic
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-semibold text-zinc-100">$1</strong>')
  out = out.replace(/\*([^*\n]+)\*/g, '<em class="text-zinc-300 not-italic font-medium">$1</em>')

  // H2 — section header with left accent + top border
  out = out.replace(/^## (.+)$/gm,
    '<h2 class="flex items-center gap-2.5 text-[13px] font-extrabold text-orange-400 uppercase tracking-widest mt-6 mb-3 pt-5 border-t border-zinc-800/70 first:mt-0 first:pt-0 first:border-0"><span class="w-1 h-4 rounded-full bg-orange-500 flex-shrink-0"></span>$1</h2>')

  // H3 — sub-section
  out = out.replace(/^### (.+)$/gm,
    '<h3 class="text-[12.5px] font-bold text-zinc-200 mt-4 mb-2 flex items-center gap-1.5"><span class="text-orange-500/60 font-mono text-[10px]">###</span> $1</h3>')

  // H1
  out = out.replace(/^# (.+)$/gm,
    '<h1 class="text-base font-extrabold text-zinc-100 mt-5 mb-2.5">$1</h1>')

  // HR
  out = out.replace(/^---$/gm, '<hr class="border-zinc-800 my-4" />')

  // Ordered list items
  out = out.replace(/^(\d+)\. (.+)$/gm,
    '<li class="flex items-start gap-2.5 text-zinc-300 mb-1.5 text-sm leading-relaxed"><span class="text-orange-400/70 font-bold font-mono text-[11px] flex-shrink-0 mt-0.5 min-w-[18px] text-right">$1.</span><span>$2</span></li>')

  // Unordered list items
  out = out.replace(/^- (.+)$/gm,
    '<li class="flex items-start gap-2 text-zinc-300 mb-1.5 text-sm leading-relaxed"><span class="text-orange-400 flex-shrink-0 mt-[5px] text-[8px]">◆</span><span>$1</span></li>')

  // Wrap consecutive <li> blocks
  out = out.replace(/(<li[\s\S]*?<\/li>\n?)+/g,
    m => `<ul class="space-y-0 my-2 pl-1">${m}</ul>`)

  // Paragraphs
  out = out.split(/\n\n+/).map(block => {
    const t = block.trim()
    if (!t) return ''
    if (t.startsWith('<')) return t
    return `<p class="mb-2.5 text-zinc-300 text-sm leading-[1.75]">${t.replace(/\n/g, ' ')}</p>`
  }).join('\n')

  return out
}

function makeSnippet(name = 'Schema', lang: CodeLang = 'sql'): CodeSnippet {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID() : `s_${Date.now()}_${Math.random()}`
  return { id, name, language: lang, code: '' }
}

// ── Load Razorpay script dynamically ─────────────────────────────────────────
function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve(false)
    if ((window as Record<string, unknown>).Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DesignPad({ problem }: { problem: SDProblem }) {

  const [mobilePane, setMobilePane]     = useState<MobilePane>('canvas')
  const [rightTab, setRightTab]         = useState<RightTab>('write')
  const [leftTab, setLeftTab]           = useState<LeftTab>('problem')
  const [leftOpen, setLeftOpen]         = useState(true)
  const [rightWidth, setRightWidth]     = useState(420)

  const [design, setDesign]             = useState('')
  const [snippets, setSnippets]         = useState<CodeSnippet[]>([])
  const [activeId, setActiveId]         = useState('')
  const [checklist, setChecklist]       = useState<Record<string, boolean>>({})
  const [savedAt, setSavedAt]           = useState<Date | null>(null)
  const [diagramNodes, setDiagramNodes] = useState(0)

  const [renamingId, setRenamingId]     = useState<string | null>(null)
  const [renameVal, setRenameVal]       = useState('')

  const [timerSec, setTimerSec]         = useState(45 * 60)
  const [timerOn, setTimerOn]           = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)

  const [reviewing, setReviewing]       = useState(false)
  const [review, setReview]             = useState<ReviewResult | null>(null)
  const [reviewError, setReviewError]   = useState('')
  const [reviewOpen, setReviewOpen]     = useState(false)

  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [bestScore, setBestScore] = useState<{ score: number; grade: string } | null>(null)
  const [problemExpanded, setProblemExpanded] = useState(false)

  // ── Pro state ──────────────────────────────────────────────────────────────
  const [proStatus, setProStatus]         = useState<ProStatus | null>(null)
  const [showPaywall, setShowPaywall]     = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [purchasing, setPurchasing]       = useState(false)
  const [selectedPlan, setSelectedPlan]   = useState<'sd_pro' | 'full_bundle'>('full_bundle')

  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const saveTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerInterval  = useRef<ReturnType<typeof setInterval> | null>(null)
  const diagramTextRef = useRef('')
  const startedRef     = useRef(false)
  const resizingRef    = useRef(false)
  const resizeStartX   = useRef(0)
  const resizeStartW   = useRef(0)

  const snap = useRef({ design, checklist, snippets, activeId })
  snap.current = { design, checklist, snippets, activeId }

  const storageKey    = STORAGE_PREFIX    + problem.slug
  const canvasKey     = CANVAS_PREFIX     + problem.slug
  const codeKey       = CODE_PREFIX       + problem.slug
  const completionKey = COMPLETION_PREFIX + problem.slug

  // ── Fetch pro status on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/sd-pro/status')
      .then(r => r.json())
      .then((d: ProStatus) => setProStatus(d))
      .catch(() => {})
  }, [])

  const refreshStatus = useCallback(() => {
    fetch('/api/sd-pro/status')
      .then(r => r.json())
      .then((d: ProStatus) => setProStatus(d))
      .catch(() => {})
  }, [])

  // ── Razorpay purchase ─────────────────────────────────────────────────────
  const handlePurchase = useCallback(async (plan: 'sd_pro' | 'full_bundle') => {
    setSelectedPlan(plan)
    setPurchasing(true)
    try {
      const ok = await loadRazorpay()
      if (!ok) { alert('Payment system failed to load. Please refresh and try again.'); return }

      const endpoint    = plan === 'full_bundle' ? '/api/sd-pro/create-bundle-order' : '/api/sd-pro/create-order'
      const res         = await fetch(endpoint, { method: 'POST' })
      const od          = await res.json()
      if (!res.ok) {
        if (res.status === 401) { setShowPaywall(false); setShowLoginPrompt(true) }
        else alert(od.error ?? 'Could not create order.')
        return
      }

      const description = plan === 'full_bundle' ? 'Interview Prep Kit — 30 Days' : 'System Design Pro — 30 Days'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key:      od.key,
        amount:   od.amount,
        currency: od.currency,
        order_id: od.id,
        name:     'AmanAI Lab',
        description,
        theme:    { color: '#f97316' },
        handler:  async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const vr = await fetch('/api/sd-pro/verify-payment', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              paymentId: resp.razorpay_payment_id,
              orderId:   resp.razorpay_order_id,
              signature: resp.razorpay_signature,
              plan,
            }),
          })
          const vd = await vr.json()
          if (vr.ok) { setShowPaywall(false); refreshStatus() }
          else alert(vd.error ?? 'Payment verification failed. Contact support.')
        },
        modal: { ondismiss: () => setPurchasing(false) },
      })
      rzp.open()
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }, [refreshStatus])

  // ── Panel resize ──────────────────────────────────────────────────────────
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current  = true
    resizeStartX.current = e.clientX
    resizeStartW.current = rightWidth
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      setRightWidth(Math.max(340, Math.min(740, resizeStartW.current + (resizeStartX.current - ev.clientX))))
    }
    const onUp = () => { resizingRef.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [rightWidth])

  const autoStartTimer = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setTimerOn(true)
    setTimerStarted(true)
  }, [])

  const handleCanvasChange = useCallback((text: string, count: number) => {
    diagramTextRef.current = text; setDiagramNodes(count)
  }, [])

  // ── Load saved state ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) { const p = JSON.parse(raw); setDesign(p.design ?? DESIGN_TEMPLATE); setSavedAt(p.savedAt ? new Date(p.savedAt) : null); setChecklist(p.checklist ?? {}) }
      else setDesign(DESIGN_TEMPLATE)
    } catch { setDesign(DESIGN_TEMPLATE) }

    try {
      const raw = localStorage.getItem(codeKey)
      if (raw) { const p = JSON.parse(raw); const snips: CodeSnippet[] = Array.isArray(p.snippets) && p.snippets.length ? p.snippets : [makeSnippet()]; setSnippets(snips); setActiveId(p.activeId ?? snips[0].id) }
      else { const s = makeSnippet(); setSnippets([s]); setActiveId(s.id) }
    } catch { const s = makeSnippet(); setSnippets([s]); setActiveId(s.id) }

    try {
      const raw = localStorage.getItem(canvasKey)
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.nodes) && p.nodes.length) { diagramTextRef.current = serializeDiagram(p.nodes, p.edges ?? []); setDiagramNodes(p.nodes.length) } }
    } catch {}

    try { const raw = localStorage.getItem(completionKey); if (raw) setBestScore(JSON.parse(raw)) } catch {}
  }, [storageKey, codeKey, canvasKey, completionKey])

  // ── Timer tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerOn) {
      timerInterval.current = setInterval(() => {
        setTimerSec(s => { if (s <= 1) { clearInterval(timerInterval.current!); setTimerOn(false); return 0 } return s - 1 })
      }, 1000)
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current) }
  }, [timerOn])

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (timerInterval.current) clearInterval(timerInterval.current)
  }, [])

  // ── Persist ────────────────────────────────────────────────────────────────
  const persist = useCallback((d: string, cl: Record<string, boolean>, snips: CodeSnippet[], aid: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify({ design: d, savedAt: new Date().toISOString(), checklist: cl })); localStorage.setItem(codeKey, JSON.stringify({ snippets: snips, activeId: aid })); setSavedAt(new Date()) } catch {}
    }, 700)
  }, [storageKey, codeKey])

  const handleDesignChange = (val: string) => { autoStartTimer(); setDesign(val); const { checklist: cl, snippets: snips, activeId: aid } = snap.current; persist(val, cl, snips, aid) }
  const handleCodeChange   = (code: string) => { autoStartTimer(); const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current; const next = snips.map(s => s.id === aid ? { ...s, code } : s); setSnippets(next); persist(d, cl, next, aid) }
  const handleLangChange   = (lang: CodeLang) => { const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current; const next = snips.map(s => s.id === aid ? { ...s, language: lang } : s); setSnippets(next); persist(d, cl, next, aid) }

  const addSnippet = () => { const { design: d, checklist: cl, snippets: snips } = snap.current; const s = makeSnippet('New Snippet', 'python'); const next = [...snips, s]; setSnippets(next); setActiveId(s.id); persist(d, cl, next, s.id) }
  const deleteSnippet = (id: string) => { const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current; if (snips.length <= 1) return; const next = snips.filter(s => s.id !== id); const newAid = id === aid ? next[0].id : aid; setSnippets(next); setActiveId(newAid); persist(d, cl, next, newAid) }
  const commitRename  = (id: string) => { if (!renameVal.trim()) { setRenamingId(null); return } const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current; const next = snips.map(s => s.id === id ? { ...s, name: renameVal.trim() } : s); setSnippets(next); setRenamingId(null); persist(d, cl, next, aid) }
  const toggleCheck   = (area: string) => { const { design: d, snippets: snips, activeId: aid } = snap.current; const next = { ...checklist, [area]: !checklist[area] }; setChecklist(next); persist(d, next, snips, aid) }

  const insertAt = useCallback((text: string) => {
    const el = textareaRef.current; if (!el) return
    autoStartTimer()
    const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current
    const s = el.selectionStart, e = el.selectionEnd
    const next = d.slice(0, s) + text + d.slice(e)
    setDesign(next); persist(next, cl, snips, aid)
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + text.length; el.focus() })
  }, [persist, autoStartTimer])

  const wrap = useCallback((before: string, after = '') => {
    const el = textareaRef.current; if (!el) return
    autoStartTimer()
    const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current
    const s = el.selectionStart, e = el.selectionEnd
    const sel = d.slice(s, e)
    const next = d.slice(0, s) + before + sel + after + d.slice(e)
    setDesign(next); persist(next, cl, snips, aid)
    requestAnimationFrame(() => { el.selectionStart = s + before.length; el.selectionEnd = s + before.length + sel.length; el.focus() })
  }, [persist, autoStartTimer])

  const handleWriteKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    if (e.key === 'Tab') {
      e.preventDefault()
      const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current
      const s = el.selectionStart, end = el.selectionEnd
      const next = d.slice(0, s) + '  ' + d.slice(end)
      setDesign(next); persist(next, cl, snips, aid)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2 })
    }
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); wrap('**', '**') }
    if (e.key === 'i' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); wrap('*', '*') }
  }, [wrap, persist])

  const jumpToSection = useCallback((heading: string) => {
    const el = textareaRef.current; if (!el) return
    setRightTab('write')
    if (mobilePane !== 'answer') setMobilePane('answer')
    const idx = el.value.indexOf(heading)
    if (idx >= 0) { const linesBefore = el.value.substring(0, idx).split('\n').length; el.scrollTop = Math.max(0, (linesBefore - 2) * 22); el.focus(); el.setSelectionRange(idx + heading.length, idx + heading.length) }
    else insertAt('\n' + heading + '\n\n')
  }, [mobilePane, insertAt])

  const fmt       = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const tClr      = timerSec <= 300 ? 'text-red-400' : timerSec <= 600 ? 'text-orange-400' : 'text-zinc-200'
  const resetTimer = () => { setTimerOn(false); setTimerSec(45 * 60); setTimerStarted(false); startedRef.current = false }
  const startTimer = () => { startedRef.current = true; setTimerOn(true); setTimerStarted(true) }

  const downloadMd = () => {
    const blob = new Blob([design], { type: 'text/markdown;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${problem.slug}-design.md` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // ── AI review ─────────────────────────────────────────────────────────────
  const handleReview = async () => {
    const { snippets: snips } = snap.current
    const hasText    = design.trim().length >= 100
    const hasDiagram = diagramNodes >= 2
    const hasCode    = snips.some(s => s.code.trim().length > 0)
    if (!hasText && !hasDiagram && !hasCode) {
      setReviewError('Add more content first — write a few paragraphs, draw 2+ diagram components, or add code.')
      return
    }
    setReviewing(true); setReviewError(''); setReview(null)
    try {
      const diagram = diagramTextRef.current.trim()
      let d = design.trim()
      if (diagram) d += `\n\n---\n\n## Architecture Diagram (visual canvas)\n${diagram}`

      const res = await fetch('/api/system-design/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug:         problem.slug,
          problem:      problem.problem,
          design:       d,
          codeSnippets: snips.filter(s => s.code.trim()).map(s => ({ name: s.name, language: s.language, code: s.code })),
        }),
      })
      const data = await res.json()

      if (res.status === 401) { setShowLoginPrompt(true); return }
      if (res.status === 402) { setShowPaywall(true); return }
      if (res.status === 429) { setReviewError(data.error ?? "You've hit today's review limit. Resets at midnight IST."); return }
      if (!res.ok) throw new Error(data.error ?? 'Review failed')

      setReview(data.review)
      setReviewOpen(true)
      refreshStatus()

      if (!bestScore || data.review.overallScore > bestScore.score) {
        const next = { score: data.review.overallScore, grade: data.review.grade }
        setBestScore(next)
        try { localStorage.setItem(completionKey, JSON.stringify(next)) } catch {}
      }
    } catch (e: unknown) {
      setReviewError((e instanceof Error ? e.message : '') || 'Review failed. Try again.')
    } finally { setReviewing(false) }
  }

  const phase        = getPhase(timerSec, timerStarted)
  const coveredCount = Object.values(checklist).filter(Boolean).length
  const wordCount    = design.split(/\s+/).filter(Boolean).length
  const codeLines    = snippets.reduce((a, s) => a + s.code.split('\n').filter(Boolean).length, 0)
  const activeSnippet = snippets.find(s => s.id === activeId) ?? snippets[0]
  const RING_C       = 2 * Math.PI * 42
  const gradeColor: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#eab308', D: '#ef4444' }

  // ── Usage badge helper ────────────────────────────────────────────────────
  const UsageBadge = () => {
    if (!proStatus) return null

    if (!proStatus.authenticated) {
      // Nudge unauthenticated visitors to sign in
      return (
        <button onClick={() => setShowLoginPrompt(true)}
          className="hidden md:flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
          <LogIn size={10} />
          <span>Sign in for free reviews</span>
        </button>
      )
    }

    if (proStatus.isSubscribed) {
      const used  = proStatus.dailyUsed  ?? 0
      const limit = proStatus.dailyLimit ?? 15
      const pct   = Math.round((used / limit) * 100)
      const planLabel = proStatus.plan === 'full_bundle' ? 'Prep Kit' : 'SD Pro'
      return (
        <div className="hidden md:flex items-center gap-1.5 text-[10px] flex-shrink-0">
          <Crown size={10} className="text-orange-400" />
          <span className="text-orange-400/70 font-semibold">{planLabel}</span>
          <span className={`font-semibold tabular-nums ${used >= limit ? 'text-red-400' : 'text-zinc-300'}`}>{used}/{limit}</span>
          <span className="text-zinc-600">today</span>
          <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )
    }

    const used  = proStatus.freeUsed  ?? 0
    const limit = proStatus.freeLimit ?? 5
    const remaining = limit - used
    return (
      <div className="hidden md:flex items-center gap-1.5 text-[10px] flex-shrink-0">
        <span className={`tabular-nums font-semibold ${remaining <= 1 ? 'text-orange-400' : 'text-zinc-500'}`}>{used}/{limit}</span>
        <span className="text-zinc-600">free reviews</span>
        <button onClick={() => setShowPaywall(true)}
          className={`font-semibold transition-colors ${remaining <= 2 ? 'text-orange-400 hover:text-orange-300' : 'text-zinc-600 hover:text-zinc-400'}`}>
          Upgrade
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="h-14 flex-shrink-0 flex items-center gap-2 px-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur z-30">

        <Link href="/system-design"
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-200 text-xs transition-colors flex-shrink-0">
          <ArrowLeft size={13} /><span className="hidden sm:inline">Problems</span>
        </Link>
        <span className="text-zinc-700 hidden sm:inline text-sm">›</span>
        <span className="text-sm font-semibold text-zinc-100 truncate max-w-[130px] sm:max-w-[240px] lg:max-w-none">{problem.title}</span>

        <span className={`hidden md:inline flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-bold ${
          problem.difficulty === 'Hard' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
        }`}>{problem.difficulty}</span>

        {/* Phase timeline */}
        <div className="hidden lg:flex items-center gap-1 ml-2 flex-shrink-0">
          {PHASES.map((p, i) => {
            const isCurrent = phase?.step === p.step
            const isPast    = (phase?.step ?? 0) > p.step
            return (
              <div key={p.step} className="flex items-center gap-0.5">
                <div title={`${p.name} · ${p.time}`}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all text-[10px] font-semibold cursor-default ${
                    isCurrent ? `${p.color} bg-zinc-800 ring-1 ring-inset ring-zinc-700` : isPast ? 'text-zinc-700' : 'text-zinc-800'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${isCurrent ? `${p.bg} shadow-sm` : isPast ? 'bg-zinc-700' : 'bg-zinc-800'}`} />
                  {p.shortName}
                </div>
                {i < PHASES.length - 1 && <span className="text-zinc-800 text-xs">›</span>}
              </div>
            )
          })}
        </div>

        {bestScore && (
          <div className={`hidden lg:flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold ${GRADE_CONFIG[bestScore.grade]?.color ?? 'text-zinc-400'} ${GRADE_CONFIG[bestScore.grade]?.bg ?? 'bg-zinc-800 border-zinc-700'}`}>
            <Trophy size={10} />{bestScore.score}/10
          </div>
        )}

        <div className="flex-1" />

        <UsageBadge />

        {/* Timer */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-sm font-mono font-bold tabular-nums ${tClr}`}>{fmt(timerSec)}</span>
          {!timerStarted ? (
            <button onClick={startTimer} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors font-semibold">
              <Play size={10} /><span className="hidden sm:inline">Start</span>
            </button>
          ) : (
            <>
              <button onClick={() => setTimerOn(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                {timerOn ? <Pause size={11} /> : <Play size={11} />}
              </button>
              <button onClick={resetTimer} className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                <RotateCcw size={10} />
              </button>
            </>
          )}
        </div>

        <button onClick={downloadMd} title="Download as Markdown"
          className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0">
          <Save size={13} />
        </button>

        <button onClick={handleReview} disabled={reviewing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white text-xs font-semibold transition-all disabled:opacity-60 flex-shrink-0 shadow-lg shadow-orange-500/20">
          {reviewing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          <span className="hidden sm:inline">{reviewing ? 'Reviewing…' : 'AI Review'}</span>
          <span className="sm:hidden">{reviewing ? '…' : 'Review'}</span>
        </button>
      </header>

      {/* Phase tip bar */}
      {phase && timerStarted && (
        <div className={`hidden lg:flex flex-shrink-0 items-center gap-2 px-4 py-1.5 border-b border-zinc-900/80 text-[11px] ${phase.color}`}
          style={{ background: 'rgba(9,9,11,0.95)' }}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${phase.bg} animate-pulse`} />
          <span className="font-bold">{phase.name}</span>
          <span className="text-zinc-700 mx-0.5">·</span>
          <span className="text-zinc-500">{phase.tip}</span>
        </div>
      )}

      {/* ═══ MOBILE TAB BAR ══════════════════════════════════════════════════ */}
      <div className="xl:hidden flex-shrink-0 flex border-b border-zinc-800 bg-zinc-950">
        {([
          { id: 'problem' as MobilePane, icon: <ListChecks size={12} />, label: 'Problem' },
          { id: 'canvas'  as MobilePane, icon: <Code2 size={12} />,      label: 'Diagram' },
          { id: 'answer'  as MobilePane, icon: <PenLine size={12} />,    label: 'Write'   },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setMobilePane(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all border-b-2 ${
              mobilePane === tab.id ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ═══ MAIN BODY ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
        <aside className={`${mobilePane === 'problem' ? 'flex' : 'hidden'} ${leftOpen ? 'xl:flex xl:w-[340px]' : 'xl:hidden'} flex-col w-full xl:flex-shrink-0 border-r border-zinc-800 bg-zinc-950 min-h-0`}>

          <div className="flex items-center gap-0.5 p-1.5 border-b border-zinc-800 flex-shrink-0">
            {([
              { id: 'problem'    as LeftTab, icon: <ListChecks size={12} />, label: 'Problem'   },
              { id: 'framework'  as LeftTab, icon: <BookOpen size={12} />,   label: 'Framework' },
              { id: 'components' as LeftTab, icon: <Cpu size={12} />,        label: 'Snippets'  },
            ]).map(t => (
              <button key={t.id} onClick={() => setLeftTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  leftTab === t.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}>
                {t.icon}<span className="hidden xl:inline">{t.label}</span>
              </button>
            ))}
            <button onClick={() => setLeftOpen(false)} title="Collapse"
              className="hidden xl:flex w-7 h-7 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all flex-shrink-0">
              <ChevronLeft size={13} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-2.5 space-y-2.5">

            {/* ─── PROBLEM TAB ─── */}
            {leftTab === 'problem' && (
              <>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-zinc-800/70 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">The Problem</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${
                      problem.category === 'LLM Infrastructure' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20'
                      : problem.category === 'ML Systems' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                      : 'text-green-400 bg-green-500/10 border-green-500/20'
                    }`}>{problem.category}</span>
                    <button onClick={() => setProblemExpanded(true)} title="Read full problem"
                      className="ml-auto w-6 h-6 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0">
                      <Maximize2 size={11} />
                    </button>
                  </div>
                  <div className="px-3 py-3 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: mdToHtml(problem.problem) }} />
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-zinc-800/70">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Scale &amp; Constraints</span>
                  </div>
                  <ul className="px-3 py-2.5 space-y-1.5">
                    {problem.constraints.map(c => (
                      <li key={c} className="flex items-start gap-1.5 text-xs text-zinc-400">
                        <span className="text-orange-400/80 flex-shrink-0 mt-0.5 text-[10px]">▸</span>
                        <span className="leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-zinc-800/70 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Must Cover</span>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${(coveredCount / Math.max(problem.keyAreas.length, 1)) * 100}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums flex-shrink-0 ${coveredCount === problem.keyAreas.length ? 'text-emerald-400' : 'text-zinc-600'}`}>{coveredCount}/{problem.keyAreas.length}</span>
                  </div>
                  <div className="px-3 py-2.5 space-y-2">
                    {problem.keyAreas.map(area => (
                      <button key={area} onClick={() => toggleCheck(area)} className="w-full flex items-start gap-2.5 text-left group">
                        {checklist[area]
                          ? <CheckCircle size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          : <Circle size={13} className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0 mt-0.5" />}
                        <span className={`text-xs leading-snug transition-colors ${checklist[area] ? 'line-through text-zinc-700' : 'text-zinc-300 group-hover:text-zinc-100'}`}>{area}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-zinc-800/70 flex items-center gap-1.5">
                    <Lightbulb size={11} className="text-yellow-400 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hints</span>
                    {hintsRevealed > 0 && <span className="ml-auto text-[10px] text-zinc-600 tabular-nums">{hintsRevealed}/{problem.hints.length}</span>}
                  </div>
                  <div className="px-3 py-2.5 space-y-2.5">
                    {hintsRevealed === 0 ? (
                      <p className="text-[11px] text-zinc-600 italic">Try on your own first. Reveal hints only when stuck.</p>
                    ) : (
                      problem.hints.slice(0, hintsRevealed).map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                          <span className="text-yellow-400/80 flex-shrink-0 font-bold mt-0.5 text-[10px]">{i + 1}.</span>
                          <span>{h}</span>
                        </div>
                      ))
                    )}
                    {hintsRevealed < problem.hints.length && (
                      <button onClick={() => setHintsRevealed(n => n + 1)}
                        className="w-full flex items-center gap-1.5 justify-center text-[11px] px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors font-semibold">
                        <Lightbulb size={11} />{hintsRevealed === 0 ? 'Show first hint' : 'Show next hint'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ─── FRAMEWORK TAB ─── */}
            {leftTab === 'framework' && (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-600 px-0.5 pb-0.5">FAANG interview structure · 45 min total</p>
                {timerStarted && (
                  <div className="flex gap-1 px-0.5 mb-3">
                    {PHASES.map(p => (
                      <div key={p.step} title={p.name}
                        className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${(phase?.step ?? 0) >= p.step ? p.bg : 'bg-zinc-800'}`} />
                    ))}
                  </div>
                )}
                {FRAMEWORK_STEPS.map((step, i) => (
                  <div key={step.num} className={`border rounded-xl transition-all ${step.bg} ${phase?.step === i + 1 ? 'shadow-lg' : ''}`}>
                    <div className="px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xl font-extrabold opacity-20 ${step.color} tabular-nums leading-none`}>{step.num}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${step.color}`}>{step.title}</p>
                          <p className="text-[10px] text-zinc-600">{step.time}</p>
                        </div>
                        {phase?.step === i + 1 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-300 font-bold flex-shrink-0">NOW</span>}
                      </div>
                      <ul className="space-y-1">
                        {step.tips.map(tip => (
                          <li key={tip} className="flex items-start gap-1.5 text-[11px] text-zinc-400 leading-snug">
                            <span className={`${step.color} mt-0.5 flex-shrink-0 text-[9px]`}>→</span>{tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── COMPONENTS TAB ─── */}
            {leftTab === 'components' && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-600 px-0.5 pb-1">Click a component to insert its template into your written answer.</p>
                {ARCH_COMPONENTS.map(c => (
                  <button key={c.label}
                    onClick={() => { insertAt('\n' + c.snippet); setRightTab('write'); if (mobilePane !== 'answer') setMobilePane('answer') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/70 transition-all text-left group">
                    <span className="text-base leading-none flex-shrink-0">{c.icon}</span>
                    <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-100 transition-colors flex-1 min-w-0">{c.label}</span>
                    <ChevronRight size={11} className="text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Collapsed sidebar expander */}
        {!leftOpen && (
          <button onClick={() => setLeftOpen(true)} title="Open problem panel"
            className="hidden xl:flex w-8 flex-shrink-0 border-r border-zinc-800 flex-col items-center justify-center gap-2 hover:bg-zinc-900 transition-colors cursor-pointer group">
            <ListChecks size={13} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            <ChevronRight size={12} className="text-zinc-800 group-hover:text-zinc-500 transition-colors" />
          </button>
        )}

        {/* ═══ CANVAS ══════════════════════════════════════════════════════ */}
        <main className={`${mobilePane === 'canvas' ? 'flex' : 'hidden'} xl:flex flex-1 min-w-0 min-h-0 flex-col p-2`}>
          <SystemCanvas fill storageKey={canvasKey} onChange={handleCanvasChange} onInteract={autoStartTimer} />
        </main>

        {/* Resize handle */}
        <div onMouseDown={onResizeStart}
          className="hidden xl:flex w-1.5 flex-shrink-0 cursor-col-resize items-center justify-center group relative z-10 hover:bg-orange-500/20 transition-colors"
          title="Drag to resize">
          <GripVertical size={12} className="text-zinc-700 group-hover:text-orange-400 transition-colors" />
        </div>

        {/* ═══ RIGHT PANEL ═════════════════════════════════════════════════ */}
        <aside style={{ width: rightWidth }}
          className={`${mobilePane === 'answer' ? 'flex' : 'hidden'} xl:flex flex-col w-full xl:flex-shrink-0 border-l border-zinc-800 bg-zinc-950 min-h-0`}>

          {/* Tab bar */}
          <div className="h-11 flex items-center gap-2 px-2 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              {([
                { id: 'write'   as RightTab, icon: <PenLine size={11} />, label: 'Write'   },
                { id: 'code'    as RightTab, icon: <Code2 size={11} />,   label: 'Code'    },
                { id: 'preview' as RightTab, icon: <Eye size={11} />,     label: 'Preview' },
              ]).map(t => (
                <button key={t.id} onClick={() => setRightTab(t.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    rightTab === t.id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            {savedAt && (
              <span className="ml-auto text-[10px] text-zinc-700 flex items-center gap-1"><Save size={9} />saved</span>
            )}
          </div>

          {/* ── WRITE TAB ──────────────────────────────────────────────────── */}
          {rightTab === 'write' && (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/60 overflow-x-auto">
                <div className="flex items-center gap-0.5 border-r border-zinc-800 pr-2 mr-1">
                  {[
                    { icon: <Heading2 size={12} />, label: 'H2',      action: () => insertAt('\n## ')          },
                    { icon: <Heading3 size={12} />, label: 'H3',      action: () => insertAt('\n### ')         },
                    { icon: <Bold size={12} />,     label: 'Bold',    action: () => wrap('**', '**')           },
                    { icon: <List size={12} />,     label: 'List',    action: () => insertAt('\n- ')           },
                    { icon: <Minus size={12} />,    label: 'Divider', action: () => insertAt('\n\n---\n\n')    },
                    { icon: <Code2 size={12} />,    label: 'Code',    action: () => insertAt('\n```sql\n\n```\n') },
                  ].map(({ icon, label, action }) => (
                    <button key={label} onClick={action} title={label}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all flex-shrink-0">
                      {icon}
                    </button>
                  ))}
                </div>

                {/* Section jump */}
                {SECTION_JUMPS.map(s => (
                  <button key={s.label} onClick={() => jumpToSection(s.heading)} title={`Jump to ${s.label}`}
                    className="flex items-center gap-0.5 px-1.5 h-7 rounded-md text-[10px] text-zinc-600 hover:text-orange-400 hover:bg-zinc-800 transition-all font-semibold flex-shrink-0">
                    <Hash size={8} />{s.label}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-2 flex-shrink-0 pl-1">
                  <span className="text-[10px] text-zinc-700 tabular-nums font-mono">{wordCount}w</span>
                </div>
              </div>

              {/* ── Improved textarea ─────────────────────────────────────── */}
              <textarea
                ref={textareaRef}
                value={design}
                onChange={e => handleDesignChange(e.target.value)}
                onKeyDown={handleWriteKeyDown}
                spellCheck={false}
                placeholder="Start writing your system design…"
                className="flex-1 min-h-0 w-full bg-zinc-950 px-5 py-4 text-[13.5px] text-zinc-100 font-mono leading-7 resize-none outline-none placeholder-zinc-700 selection:bg-orange-500/25"
                style={{ tabSize: 2, fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace' }}
              />
            </>
          )}

          {/* ── CODE TAB ───────────────────────────────────────────────────── */}
          {rightTab === 'code' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center border-b border-zinc-800 bg-zinc-900/40 flex-shrink-0 overflow-x-auto">
                {snippets.map(s => (
                  <div key={s.id}
                    className={`flex items-center flex-shrink-0 border-r border-zinc-800 transition-colors ${activeId === s.id ? 'bg-zinc-950' : 'hover:bg-zinc-900/60'}`}
                    style={activeId === s.id ? { borderBottom: '2px solid #f97316' } : {}}>
                    {renamingId === s.id ? (
                      <input autoFocus value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onBlur={() => commitRename(s.id)}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(s.id); if (e.key === 'Escape') setRenamingId(null) }}
                        className="px-3 py-2 bg-transparent text-xs text-zinc-200 outline-none w-28"
                      />
                    ) : (
                      <button onClick={() => setActiveId(s.id)} onDoubleClick={() => { setRenamingId(s.id); setRenameVal(s.name) }}
                        title="Double-click to rename"
                        className={`px-3 py-2 text-[11px] font-medium transition-colors ${activeId === s.id ? 'text-zinc-100' : 'text-zinc-500'}`}>
                        {s.name}
                      </button>
                    )}
                    {snippets.length > 1 && (
                      <button onClick={() => deleteSnippet(s.id)} className="pr-2 pl-0 text-zinc-700 hover:text-red-400 transition-colors">
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addSnippet} className="flex items-center gap-1 px-2.5 py-2 text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0">
                  <Plus size={11} />
                </button>
                {activeSnippet && (
                  <div className="ml-auto flex items-center px-2 flex-shrink-0">
                    <select value={activeSnippet.language} onChange={e => handleLangChange(e.target.value as CodeLang)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] rounded-md px-2 py-0.5 outline-none cursor-pointer">
                      {CODE_LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {activeSnippet && (
                <div className="flex-1 min-h-0">
                  <MonacoEditor
                    height="100%"
                    language={activeSnippet.language}
                    value={activeSnippet.code}
                    onChange={val => handleCodeChange(val ?? '')}
                    theme="vs-dark"
                    options={{
                      fontSize: 13,
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      lineNumbers: 'on' as const,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on' as const,
                      padding: { top: 12, bottom: 12 },
                      lineHeight: 20,
                      glyphMargin: false,
                      folding: false,
                      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                      tabSize: 2,
                    }}
                  />
                </div>
              )}

              <div className="flex items-center px-3 py-1.5 border-t border-zinc-800 flex-shrink-0 text-[10px] text-zinc-600">
                <span>{snippets.length} snippet{snippets.length !== 1 ? 's' : ''} · {codeLines} lines</span>
                <span className="ml-auto">Double-click tab to rename</span>
              </div>
            </div>
          )}

          {/* ── PREVIEW TAB ────────────────────────────────────────────────── */}
          {rightTab === 'preview' && (
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
              {design.trim()
                ? <div className="prose-custom" dangerouslySetInnerHTML={{ __html: mdToHtml(design) }} />
                : <p className="text-zinc-600 italic text-sm">Nothing written yet.</p>}

              {snippets.some(s => s.code.trim()) && (
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 size={11} />Code Snippets
                  </p>
                  {snippets.filter(s => s.code.trim()).map(s => (
                    <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800">
                        <span className="text-[11px] font-semibold text-zinc-300">{s.name}</span>
                        <span className="text-[10px] text-zinc-600 uppercase font-mono">{s.language}</span>
                      </div>
                      <pre className="px-4 py-3 text-[12.5px] text-orange-200 font-mono overflow-x-auto leading-6 whitespace-pre">{s.code}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status bar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-zinc-800 flex-shrink-0 text-[10px] text-zinc-600">
            <span className="tabular-nums">{wordCount}w</span>
            <span className="text-zinc-800">·</span>
            <span className="tabular-nums">{diagramNodes} nodes</span>
            {codeLines > 0 && <><span className="text-zinc-800">·</span><span className="tabular-nums">{codeLines} lines</span></>}
            <span className="text-zinc-800">·</span>
            <span className={coveredCount === problem.keyAreas.length ? 'text-emerald-500 font-semibold' : ''}>{coveredCount}/{problem.keyAreas.length} covered</span>
            {bestScore && <><span className="text-zinc-800">·</span><span className={`font-semibold ${GRADE_CONFIG[bestScore.grade]?.color ?? ''}`}>Best {bestScore.score}/10</span></>}
            <span className="ml-auto flex items-center gap-1 text-orange-500/40"><Sparkles size={8} />AI reads all three</span>
          </div>
        </aside>
      </div>

      {/* ═══ PROBLEM EXPAND MODAL ══════════════════════════════════════════ */}
      {problemExpanded && (
        <>
          <div onClick={() => setProblemExpanded(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm z-40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl max-h-[88vh] flex flex-col bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-800 flex-shrink-0">
              <div>
                <p className="text-sm font-bold text-zinc-100">{problem.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${problem.difficulty === 'Hard' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'}`}>{problem.difficulty}</span>
                  <span className="text-[10px] text-zinc-600">Asked at: {problem.companies.slice(0, 4).join(', ')}</span>
                </div>
              </div>
              <button onClick={() => setProblemExpanded(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex-shrink-0"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: mdToHtml(problem.problem) }} />
              <div className="px-6 pb-6">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Scale &amp; Constraints</p>
                <ul className="space-y-2">
                  {problem.constraints.map(c => (
                    <li key={c} className="flex items-start gap-2 text-sm text-zinc-400 leading-snug">
                      <span className="text-orange-400/80 flex-shrink-0 mt-0.5">▸</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-zinc-800 flex-shrink-0">
              <button onClick={() => setProblemExpanded(false)} className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors">Back to Editor</button>
            </div>
          </div>
        </>
      )}

      {/* ═══ AI REVIEW DRAWER ═══════════════════════════════════════════════ */}
      {reviewOpen && review && (
        <>
          <div onClick={() => setReviewOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl">
            <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 flex-shrink-0">
              <span className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Sparkles size={14} className="text-orange-400" />AI Review
              </span>
              <button onClick={() => setReviewOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"><X size={15} /></button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-5 flex items-center gap-5 border-b border-zinc-800 bg-gradient-to-b from-zinc-900/50 to-transparent">
                <div className="relative w-[88px] h-[88px] flex-shrink-0">
                  <svg width="88" height="88" viewBox="0 0 100 100" className="-rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="9" />
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={gradeColor[review.grade] ?? '#eab308'} strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - review.overallScore / 10)} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-zinc-100 leading-none">{review.overallScore}</span>
                    <span className="text-[10px] text-zinc-500 font-bold">/10</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${GRADE_CONFIG[review.grade]?.color ?? ''} ${GRADE_CONFIG[review.grade]?.bg ?? ''}`}>
                    <Award size={12} />Grade {review.grade} · {GRADE_CONFIG[review.grade]?.label ?? ''}
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed mt-2.5">{review.summary}</p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {Object.entries(review.sectionScores).some(([, v]) => v !== null) && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Section Scores</p>
                    <div className="space-y-3">
                      {Object.entries(review.sectionScores).map(([key, score]) => {
                        if (score === null) return null
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-zinc-400 w-24 flex-shrink-0">{SECTION_LABELS[key] ?? key}</span>
                              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${score * 10}%` }} />
                              </div>
                              <span className={`text-[11px] font-bold w-8 text-right tabular-nums ${score >= 8 ? 'text-emerald-400' : score >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>{score}/10</span>
                            </div>
                            {score < 8 && SECTION_TIPS[key] && (
                              <p className="text-[10px] text-zinc-500 ml-[108px] leading-snug italic">→ {score < 5 ? SECTION_TIPS[key].low : SECTION_TIPS[key].mid}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {review.codeQuality && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Code2 size={11} />Code Quality</p>
                      <span className={`text-xs font-bold ${review.codeQuality.score >= 8 ? 'text-emerald-400' : review.codeQuality.score >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>{review.codeQuality.score}/10</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-2.5">
                      <div className={`h-full rounded-full ${review.codeQuality.score >= 8 ? 'bg-emerald-500' : review.codeQuality.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${review.codeQuality.score * 10}%` }} />
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{review.codeQuality.notes}</p>
                  </div>
                )}

                {review.strengths.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><CheckCircle size={11} />Strengths</p>
                    <ul className="space-y-2">
                      {review.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-snug"><CheckCircle size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {review.gaps.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><AlertCircle size={11} />Gaps to Fix</p>
                    <ul className="space-y-2">
                      {review.gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-snug"><AlertCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl px-4 py-3.5">
                  <p className="text-[10px] font-bold text-orange-400 mb-2 flex items-center gap-1.5"><Target size={11} />Top Priority Improvement</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">{review.topSuggestion}</p>
                </div>

                {review.interviewerNote && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3.5">
                    <p className="text-[10px] font-bold text-zinc-500 mb-2 flex items-center gap-1.5"><Building2 size={10} />What the interviewer would say</p>
                    <p className="text-sm text-zinc-400 italic leading-relaxed">&ldquo;{review.interviewerNote}&rdquo;</p>
                  </div>
                )}

                <button onClick={handleReview} disabled={reviewing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors disabled:opacity-60">
                  {reviewing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {reviewing ? 'Reviewing…' : 'Re-run Review'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ═══ PAYWALL MODAL ══════════════════════════════════════════════════ */}
      {showPaywall && (
        <>
          <div onClick={() => setShowPaywall(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">

            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                  <Crown size={18} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-100">Unlock AI Reviews</p>
                  <p className="text-[11px] text-zinc-500">You&apos;ve used all 5 free reviews — pick a plan to continue</p>
                </div>
                <button onClick={() => setShowPaywall(false)} className="ml-auto text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

                {/* SD Pro card */}
                <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={15} className="text-orange-400" />
                    <span className="text-sm font-bold text-zinc-100">System Design Pro</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <span className="text-2xl font-extrabold text-zinc-100">₹799</span>
                    <span className="text-zinc-500 text-xs">/ 30 days</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 mb-4">One-time · No auto-renewal</p>
                  <ul className="space-y-2 mb-5 flex-1">
                    {[
                      { icon: <Zap size={11} className="text-orange-400" />,           text: '15 AI Reviews / day' },
                      { icon: <ShieldCheck size={11} className="text-emerald-400" />,  text: 'Section scores & strengths/gaps' },
                      { icon: <RefreshCw size={11} className="text-blue-400" />,       text: 'Re-run after fixing your answer' },
                      { icon: <Sparkles size={11} className="text-violet-400" />,      text: 'Interviewer perspective note' },
                    ].map(({ icon, text }) => (
                      <li key={text} className="flex items-start gap-2 text-[11.5px] text-zinc-300">
                        <span className="flex-shrink-0 mt-0.5">{icon}</span>
                        <span className="leading-snug">{text}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePurchase('sd_pro')}
                    disabled={purchasing}
                    className="w-full py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-zinc-100 font-semibold text-xs transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {purchasing && selectedPlan === 'sd_pro'
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Crown size={13} />}
                    {purchasing && selectedPlan === 'sd_pro' ? 'Opening payment…' : 'Get SD Pro — ₹799'}
                  </button>
                </div>

                {/* Full Bundle card */}
                <div className="relative rounded-xl border border-orange-500/60 bg-orange-500/5 p-5 flex flex-col">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full tracking-wide">BEST VALUE</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 mt-1">
                    <Star size={15} className="text-orange-400" />
                    <span className="text-sm font-bold text-zinc-100">Interview Prep Kit</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <span className="text-2xl font-extrabold text-orange-400">₹999</span>
                    <span className="text-zinc-500 text-xs">/ 30 days</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 mb-4">One-time · No auto-renewal</p>
                  <ul className="space-y-2 mb-5 flex-1">
                    {[
                      { icon: <Zap size={11} className="text-orange-400" />,          text: 'Everything in SD Pro' },
                      { icon: <FileText size={11} className="text-sky-400" />,         text: 'Resume Analyzer — unlimited' },
                      { icon: <Sparkles size={11} className="text-violet-400" />,      text: 'Cover Letter Generator — unlimited' },
                      { icon: <Briefcase size={11} className="text-emerald-400" />,    text: 'LinkedIn Optimizer — unlimited' },
                      { icon: <Star size={11} className="text-yellow-400" />,          text: 'Mock Interviews — unlimited' },
                      { icon: <ShieldCheck size={11} className="text-teal-400" />,     text: 'All Career AI Tools — unlimited' },
                    ].map(({ icon, text }) => (
                      <li key={text} className="flex items-start gap-2 text-[11.5px] text-zinc-200">
                        <span className="flex-shrink-0 mt-0.5">{icon}</span>
                        <span className="leading-snug">{text}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePurchase('full_bundle')}
                    disabled={purchasing}
                    className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-bold text-xs transition-all disabled:opacity-60 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    {purchasing && selectedPlan === 'full_bundle'
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Star size={13} />}
                    {purchasing && selectedPlan === 'full_bundle' ? 'Opening payment…' : 'Get Interview Prep Kit — ₹999'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600">
                <ShieldCheck size={10} className="text-zinc-700" />
                <span>Secure payment via Razorpay · Instant activation · No hidden charges</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ LOGIN PROMPT MODAL ══════════════════════════════════════════════ */}
      {showLoginPrompt && (
        <>
          <div onClick={() => setShowLoginPrompt(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-violet-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <LogIn size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-100">Sign in to use AI Review</p>
                  <p className="text-[11px] text-zinc-500">Get 5 free reviews just for signing in</p>
                </div>
                <button onClick={() => setShowLoginPrompt(false)} className="ml-auto text-zinc-600 hover:text-zinc-300 flex-shrink-0"><X size={16} /></button>
              </div>

              <div className="space-y-2 mb-5 text-[12.5px] text-zinc-400">
                <div className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-400 flex-shrink-0" /><span>5 free AI Reviews on sign-up</span></div>
                <div className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-400 flex-shrink-0" /><span>Your progress saved to your account</span></div>
                <div className="flex items-center gap-2"><CheckCircle size={12} className="text-blue-400 flex-shrink-0" /><span>All tools still free without sign-in</span></div>
              </div>

              <Link href="/login" onClick={() => setShowLoginPrompt(false)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
                <LogIn size={15} />Sign in / Create account
              </Link>
              <p className="text-center text-[10px] text-zinc-600 mt-3">Free · No credit card required</p>
            </div>
          </div>
        </>
      )}

      {/* Error toast */}
      {reviewError && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-start gap-2 px-4 py-3 bg-red-500/15 border border-red-500/40 rounded-xl text-sm text-red-200 shadow-xl max-w-sm w-[calc(100%-2rem)]">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1">{reviewError}</span>
          <button onClick={() => setReviewError('')} className="text-red-300 hover:text-red-100 flex-shrink-0"><X size={14} /></button>
        </div>
      )}
    </div>
  )
}
