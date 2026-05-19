'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Save, Sparkles, CheckCircle, Circle, ChevronDown,
  AlertCircle, Trophy, Loader2, Eye, PenLine, Timer,
  Play, Pause, RotateCcw, Building2, BookOpen, Code2,
  Layers, HelpCircle, MessageCircle, ListChecks, Cpu,
  Bold, Heading2, Heading3, List, Minus, Cloud,
} from 'lucide-react'
import type { SDProblem } from '@/lib/system-design-problems'
import { DESIGN_TEMPLATE } from '@/lib/system-design-problems'

const STORAGE_PREFIX = 'sd_design_v2_'

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
  const [editorMode, setEditorMode]   = useState<EditorMode>('write')
  const [leftTab, setLeftTab]         = useState<LeftTab>('problem')
  const [savedAt, setSavedAt]         = useState<Date | null>(null)
  const [reviewing, setReviewing]     = useState(false)
  const [review, setReview]           = useState<ReviewResult | null>(null)
  const [reviewError, setReviewError] = useState('')
  const [showReview, setShowReview]   = useState(false)
  const [checklist, setChecklist]     = useState<Record<string, boolean>>({})
  const [timerSec, setTimerSec]       = useState(45 * 60)
  const [timerOn, setTimerOn]         = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [isLoggedIn, setIsLoggedIn]   = useState<boolean | null>(null)
  const [cloudSaved, setCloudSaved]   = useState(false)
  const saveTimer                     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cloudSaveTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerInterval                 = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef                   = useRef<HTMLTextAreaElement>(null)
  const storageKey                    = STORAGE_PREFIX + problem.slug

  // Load saved state (localStorage first for instant paint, then merge cloud if logged in)
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

    // Check login and fetch cloud copy
    import('@/lib/supabase/client').then(({ createClient }) => {
      const sb = createClient()
      sb.auth.getUser().then(({ data: { user } }) => {
        if (!user) { setIsLoggedIn(false); return }
        setIsLoggedIn(true)
        sb.from('system_design_submissions')
          .select('design, checklist, updated_at, review_json')
          .eq('user_id', user.id)
          .eq('problem_slug', problem.slug)
          .maybeSingle()
          .then(({ data }) => {
            if (!data) { setCloudSaved(true); return }
            // Cloud copy wins if it's newer than local copy
            const localTs = (() => { try { return new Date(JSON.parse(localStorage.getItem(storageKey) ?? '{}').savedAt ?? 0).getTime() } catch { return 0 } })()
            const cloudTs = new Date(data.updated_at).getTime()
            if (cloudTs > localTs) {
              setDesign(data.design || DESIGN_TEMPLATE)
              setChecklist((data.checklist as Record<string, boolean>) ?? {})
              setSavedAt(new Date(data.updated_at))
              try { localStorage.setItem(storageKey, JSON.stringify({ design: data.design, savedAt: data.updated_at, checklist: data.checklist ?? {} })) } catch {}
            }
            if (data.review_json) setReview(data.review_json as ReviewResult)
            setCloudSaved(true)
          })
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, problem.slug])

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

  const resetTimer = () => { setTimerOn(false); setTimerSec(45 * 60); setTimerStarted(false) }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current)
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

  // Auto-save (local immediately, cloud after 2.5s of idle when logged in)
  const saveDesign = useCallback((text: string, cl: Record<string, boolean>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ design: text, savedAt: new Date().toISOString(), checklist: cl }))
        setSavedAt(new Date())
      } catch {}
    }, 700)

    if (isLoggedIn) {
      setCloudSaved(false)
      if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current)
      cloudSaveTimer.current = setTimeout(() => {
        const wc = text.split(/\s+/).filter(Boolean).length
        fetch('/api/system-design/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem_slug:  problem.slug,
            problem_title: problem.title,
            design:        text,
            checklist:     cl,
            word_count:    wc,
          }),
        })
          .then(r => { if (r.ok) setCloudSaved(true) })
          .catch(() => { /* offline — local copy still safe */ })
      }, 2500)
    }
  }, [storageKey, isLoggedIn, problem.slug, problem.title])

  const handleChange = (val: string) => { setDesign(val); saveDesign(val, checklist) }

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

  // AI review
  const handleReview = async () => {
    if (design.trim().length < 100) {
      setReviewError('Write more before requesting a review — at least a few paragraphs.')
      return
    }
    setReviewing(true); setReviewError(''); setReview(null)
    try {
      const res = await fetch('/api/system-design/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: problem.problem, design }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Review failed')
      setReview(data.review)
      setShowReview(true)

      // Persist review for logged-in users so it appears on dashboard later
      if (isLoggedIn) {
        const wc = design.split(/\s+/).filter(Boolean).length
        fetch('/api/system-design/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem_slug:  problem.slug,
            problem_title: problem.title,
            design,
            checklist,
            word_count: wc,
            review: data.review,
          }),
        }).then(r => { if (r.ok) setCloudSaved(true) }).catch(() => {})
      }
    } catch (e: unknown) {
      setReviewError((e instanceof Error ? e.message : '') || 'Review failed. Try again.')
    } finally { setReviewing(false) }
  }

  const coveredCount = Object.values(checklist).filter(Boolean).length
  const wordCount    = design.split(/\s+/).filter(Boolean).length

  // ─ Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-zinc-950 flex flex-col">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-zinc-950/98 backdrop-blur-sm border-b border-zinc-800 flex-shrink-0">
        <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center gap-3">
          {/* Back */}
          <Link href="/sheet" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors flex-shrink-0">
            <ArrowLeft size={13} /> Sheet
          </Link>
          <span className="text-zinc-700">›</span>

          {/* Title */}
          <span className="text-sm font-semibold text-zinc-200 truncate flex-1 min-w-0">{problem.title}</span>

          {/* Company tags */}
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {problem.companies.slice(0, 4).map(c => (
              <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700 whitespace-nowrap">
                {c === 'Microsoft' ? 'MSFT' : c === 'Anthropic' ? 'Anth' : c === 'DeepMind' ? 'DeepM' : c}
              </span>
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-sm font-mono font-bold tabular-nums ${timerColor}`}>{fmtTime(timerSec)}</span>
            {!timerStarted ? (
              <button onClick={() => { setTimerOn(true); setTimerStarted(true) }}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                <Play size={10} /> Start
              </button>
            ) : (
              <>
                <button onClick={() => setTimerOn(v => !v)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                  {timerOn ? <Pause size={10} /> : <Play size={10} />}
                </button>
                <button onClick={resetTimer}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                  <RotateCcw size={10} />
                </button>
              </>
            )}
          </div>

          {/* Difficulty */}
          <span className={`hidden sm:inline flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full border font-medium ${
            problem.difficulty === 'Hard' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
          }`}>{problem.difficulty}</span>

          {/* Save status */}
          {savedAt && (
            <span className="hidden md:flex items-center gap-1 text-[10px] text-zinc-600 flex-shrink-0">
              <Save size={9} /> {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {/* Sync status */}
          {isLoggedIn === true && (
            <span title={cloudSaved ? 'Saved to your account' : 'Syncing…'}
              className={`hidden md:flex items-center gap-1 text-[10px] flex-shrink-0 transition-colors ${cloudSaved ? 'text-emerald-500' : 'text-zinc-600'}`}>
              {cloudSaved ? <Cloud size={10} /> : <Loader2 size={10} className="animate-spin" />}
              <span>{cloudSaved ? 'Synced' : 'Syncing…'}</span>
            </span>
          )}
          {isLoggedIn === false && (
            <Link href="/login"
              title="Sign in to save designs to your account across devices"
              className="hidden md:flex items-center gap-1 text-[10px] text-zinc-500 hover:text-orange-400 flex-shrink-0 transition-colors">
              <Cloud size={10} /> Sign in to sync
            </Link>
          )}
          {/* Download */}
          <button onClick={downloadDesign} title="Download as Markdown"
            className="hidden sm:flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0">
            <Save size={11} /> .md
          </button>

          {/* AI Review */}
          <button onClick={handleReview} disabled={reviewing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold transition-all disabled:opacity-60 flex-shrink-0">
            {reviewing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            <span className="hidden sm:inline">{reviewing ? 'Reviewing…' : 'AI Review'}</span>
          </button>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-4 grid lg:grid-cols-[320px_1fr] gap-4 items-start">

        {/* ── Left panel ────────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-14 flex flex-col gap-3 max-h-[calc(100vh-112px)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">

          {/* Tab buttons */}
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {([
              { id: 'problem',    icon: <ListChecks size={13} />, label: 'Problem'    },
              { id: 'framework',  icon: <BookOpen size={13} />,   label: 'Framework'  },
              { id: 'components', icon: <Cpu size={13} />,        label: 'Components' },
            ] as { id: LeftTab; icon: React.ReactNode; label: string }[]).map(t => (
              <button key={t.id} onClick={() => setLeftTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === t.id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Problem tab */}
          {leftTab === 'problem' && (
            <>
              {/* Problem statement */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">The Problem</span>
                </div>
                <div className="px-4 py-3 text-xs text-zinc-300 leading-relaxed space-y-2 prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(problem.problem) }} />
              </div>

              {/* Constraints */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Scale & Constraints</span>
                </div>
                <ul className="px-4 py-3 space-y-1.5">
                  {problem.constraints.map(c => (
                    <li key={c} className="flex items-start gap-2 text-xs text-zinc-400">
                      <span className="text-orange-400 flex-shrink-0 mt-0.5">▸</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Must-cover checklist */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Must Cover</span>
                  <span className={`text-[10px] font-bold ${coveredCount === problem.keyAreas.length ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {coveredCount}/{problem.keyAreas.length}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {problem.keyAreas.map(area => (
                    <button key={area} onClick={() => toggleCheck(area)}
                      className="w-full flex items-start gap-2 text-left group">
                      <span className="mt-0.5 flex-shrink-0">
                        {checklist[area]
                          ? <CheckCircle size={13} className="text-emerald-400" />
                          : <Circle size={13} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                        }
                      </span>
                      <span className={`text-xs leading-snug ${checklist[area] ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                        {area}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hints */}
              <details className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
                <summary className="px-4 py-2.5 flex items-center justify-between cursor-pointer list-none">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hints (if stuck)</span>
                  <ChevronDown size={13} className="text-zinc-600 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-3 border-t border-zinc-800 space-y-2 pt-2">
                  {problem.hints.map((h, i) => (
                    <p key={i} className="text-xs text-zinc-500 leading-relaxed">💡 {h}</p>
                  ))}
                </div>
              </details>
            </>
          )}

          {/* Framework tab */}
          {leftTab === 'framework' && (
            <div className="space-y-2">
              <p className="text-[10px] text-zinc-600 px-1">FAANG System Design Interview Structure (45 min)</p>
              {FRAMEWORK_STEPS.map(step => (
                <div key={step.num} className={`border rounded-xl overflow-hidden ${step.bg}`}>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-lg font-extrabold opacity-40 ${step.color} tabular-nums leading-none`}>{step.num}</span>
                      <div>
                        <p className={`text-xs font-bold ${step.color}`}>{step.title}</p>
                        <p className="text-[10px] text-zinc-600">{step.time}</p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {step.tips.map(tip => (
                        <li key={tip} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                          <span className={`${step.color} mt-0.5 flex-shrink-0 text-[10px]`}>→</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Components tab */}
          {leftTab === 'components' && (
            <div className="space-y-2">
              <p className="text-[10px] text-zinc-600 px-1">Click any component to insert a template snippet at cursor position</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ARCH_COMPONENTS.map(c => (
                  <button key={c.label} onClick={() => { setEditorMode('write'); insertAt('\n' + c.snippet) }}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/60 transition-all text-left group">
                    <span className="text-base leading-none flex-shrink-0">{c.icon}</span>
                    <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors leading-snug">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Editor panel ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">

          {/* Editor toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Write / Preview toggle */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              <button onClick={() => setEditorMode('write')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  editorMode === 'write' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                <PenLine size={11} /> Write
              </button>
              <button onClick={() => setEditorMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  editorMode === 'preview' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                <Eye size={11} /> Preview
              </button>
            </div>

            {/* Markdown toolbar */}
            {editorMode === 'write' && (
              <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                {[
                  { icon: <Heading2 size={13} />, label: 'H2', action: () => insertAt('\n## ') },
                  { icon: <Heading3 size={13} />, label: 'H3', action: () => insertAt('\n### ') },
                  { icon: <Bold size={13} />,     label: 'Bold', action: () => wrap('**', '**') },
                  { icon: <List size={13} />,     label: 'List', action: () => insertAt('\n- ') },
                  { icon: <Minus size={13} />,    label: 'Divider', action: () => insertAt('\n\n---\n\n') },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action} title={label}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-all">
                    {icon}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] text-zinc-600 ml-auto">
              <Timer size={10} />
              <span>{wordCount} words · auto-saved</span>
            </div>
          </div>

          {/* Editor */}
          {editorMode === 'write' ? (
            <textarea
              ref={textareaRef}
              value={design}
              onChange={e => handleChange(e.target.value)}
              placeholder="Start writing your system design…"
              spellCheck={false}
              className="w-full h-[calc(100vh-280px)] min-h-[500px] bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-2xl px-5 py-4 text-sm text-zinc-200 font-mono leading-relaxed resize-y outline-none transition-colors placeholder-zinc-700"
            />
          ) : (
            <div className="w-full min-h-[500px] max-h-[calc(100vh-280px)] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-200 leading-relaxed">
              {design.trim()
                ? <div dangerouslySetInnerHTML={{ __html: markdownToHtml(design) }} />
                : <p className="text-zinc-600 italic text-sm">Nothing to preview — switch to Write.</p>
              }
            </div>
          )}

          {/* Review error */}
          {reviewError && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              {reviewError}
            </div>
          )}

          {/* AI Review result */}
          {review && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <button onClick={() => setShowReview(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <Sparkles size={15} className="text-orange-400" />
                  <span className="font-bold text-zinc-200 text-sm">AI Review Result</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${GRADE_CONFIG[review.grade]?.color ?? ''} ${GRADE_CONFIG[review.grade]?.bg ?? ''}`}>
                    {review.grade} · {review.overallScore}/10
                  </span>
                  <span className="hidden sm:inline text-xs text-zinc-500">{GRADE_CONFIG[review.grade]?.label}</span>
                </div>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${showReview ? 'rotate-180' : ''}`} />
              </button>

              {showReview && (
                <div className="border-t border-zinc-800 px-5 py-5 space-y-4">
                  <p className="text-sm text-zinc-300 leading-relaxed">{review.summary}</p>

                  {/* Section scores */}
                  {Object.entries(review.sectionScores).some(([, v]) => v !== null) && (
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Section Scores</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(review.sectionScores).map(([key, score]) => score !== null && (
                          <div key={key} className="bg-zinc-950/60 rounded-xl px-3 py-2">
                            <div className="text-[9px] text-zinc-600 mb-1.5 uppercase tracking-wide">{SECTION_LABELS[key] ?? key}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${score * 10}%` }} />
                              </div>
                              <span className="text-xs font-bold text-zinc-300 w-8 text-right">{score}/10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {review.strengths.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">✓ Strengths</p>
                      <ul className="space-y-1.5">
                        {review.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <CheckCircle size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {review.gaps.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">✗ Gaps</p>
                      <ul className="space-y-1.5">
                        {review.gaps.map((g, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <AlertCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" /> {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Top suggestion */}
                  <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold text-orange-400 mb-1">⭐ Top Priority Improvement</p>
                    <p className="text-sm text-zinc-200">{review.topSuggestion}</p>
                  </div>

                  {/* Interviewer note */}
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1.5">
                      <Building2 size={10} /> What the interviewer would say
                    </p>
                    <p className="text-sm text-zinc-400 italic leading-relaxed">&ldquo;{review.interviewerNote}&rdquo;</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom links */}
          <div className="flex items-center justify-between text-xs text-zinc-600 pb-4">
            <Link href="/sheet" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
              <ArrowLeft size={11} /> Back to sheet
            </Link>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MessageCircle size={10} />
                <Link href="/interview" className="hover:text-orange-400 transition-colors">Mock interview</Link>
              </span>
              <span className="flex items-center gap-1">
                <HelpCircle size={10} />
                <Link href="/quiz?topic=System+Design" className="hover:text-violet-400 transition-colors">Take quiz</Link>
              </span>
              <span className="flex items-center gap-1">
                <Layers size={10} />
                <Link href="/flashcards/system-design" className="hover:text-yellow-400 transition-colors">Flashcards</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
