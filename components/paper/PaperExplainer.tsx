'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, AlertCircle, Copy, Check, BookOpen,
  Lightbulb, Zap, Target, AlertTriangle, Brain,
  ExternalLink, ChevronDown, ChevronUp, Download, Share2,
  Upload, FileText, X, Clock, Send, Code2, MessageSquare,
  GraduationCap, History, RotateCcw,
} from 'lucide-react'
import { isCaptured, saveEmail, markCaptured } from '@/lib/email-capture'
import { Mail } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeyContribution { point: string; detail: string }
interface KeyTerm         { term: string; definition: string }
interface InterviewQA     { question: string; answer: string }

interface PaperResult {
  inferredTitle: string
  oneLiner: string
  simpleExplanation: string
  problemSolved: string
  howItWorks: string
  architectureDetails: string
  keyContributions: KeyContribution[]
  experimentResults: string
  practicalApplications: string[]
  limitations: string[]
  keyTerms: KeyTerm[]
  whoShouldRead: string
  importanceScore: number
  importanceReason: string
  relatedConcepts: string[]
  tweetSummary: string
  arxivId: string
  authors: string[]
  year: string
  originalTitle: string
  interviewQA: InterviewQA[]
  codeSketch: string
  bibtex: string
  level: string
}

type Level = 'eli5' | 'practitioner' | 'expert'
type Tab   = 'simple' | 'deep' | 'interview' | 'code' | 'apply'

interface ChatMessage  { role: 'user' | 'assistant'; content: string }
interface HistoryItem  { title: string; input: string; timestamp: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { label: 'Fetching paper',            sub: 'Connecting to source…'           },
  { label: 'Reading content',           sub: 'Extracting text and metadata…'   },
  { label: 'Analyzing architecture',    sub: 'Understanding the method…'       },
  { label: 'Writing explanations',      sub: 'Tailoring to your level…'        },
  { label: 'Generating interview Q&A',  sub: 'Preparing practice questions…'   },
  { label: 'Creating code sketch',      sub: 'Building Python example…'        },
]

const LEVEL_CONFIG: Record<Level, { label: string; emoji: string; desc: string; active: string; ring: string }> = {
  eli5:         { label: 'ELI5',         emoji: '🟢', desc: 'Analogies, no jargon',  active: 'bg-green-500/15 border-green-500/40 text-green-400',  ring: 'ring-green-500/30'  },
  practitioner: { label: 'Practitioner', emoji: '🟡', desc: 'For ML engineers',      active: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400', ring: 'ring-yellow-500/30' },
  expert:       { label: 'Expert',       emoji: '🔴', desc: 'Full technical depth',  active: 'bg-red-500/15 border-red-500/40 text-red-400',          ring: 'ring-red-500/30'    },
}

const EXAMPLE_PAPERS = [
  { label: 'Attention Is All You Need', id: '1706.03762' },
  { label: 'GPT-4 Report',              id: '2303.08774' },
  { label: 'LLaMA 3',                   id: '2407.21783' },
  { label: 'RAG',                       id: '2005.11401' },
  { label: 'LoRA',                      id: '2106.09685' },
  { label: 'RLHF (InstructGPT)',        id: '2203.02155' },
]

const HISTORY_KEY = 'paper_history'

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
}
function addToHistory(item: HistoryItem) {
  const history = getHistory().filter(h => h.input !== item.input)
  localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...history].slice(0, 8)))
}
function clearHistory() { localStorage.removeItem(HISTORY_KEY) }

// ─── Paper context for chat ───────────────────────────────────────────────────

function buildPaperContext(r: PaperResult): string {
  return [
    `Title: ${r.originalTitle || r.inferredTitle}`,
    r.authors.length ? `Authors: ${r.authors.join(', ')}${r.year ? ` (${r.year})` : ''}` : '',
    r.arxivId ? `arXiv: ${r.arxivId}` : '',
    '',
    `One-liner: ${r.oneLiner}`,
    '',
    `Simple explanation: ${r.simpleExplanation}`,
    '',
    `How it works: ${r.howItWorks}`,
    '',
    r.keyContributions?.length
      ? `Key contributions:\n${r.keyContributions.map((c, i) => `${i + 1}. ${c.point}: ${c.detail}`).join('\n')}`
      : '',
    '',
    r.limitations?.length ? `Limitations: ${r.limitations.join('; ')}` : '',
  ].filter(Boolean).join('\n').slice(0, 3000)
}

// ─── Download notes ───────────────────────────────────────────────────────────

function buildNotes(r: PaperResult): string {
  return [
    `PAPER: ${r.originalTitle || r.inferredTitle}`,
    r.authors.length ? `Authors: ${r.authors.join(', ')} · ${r.year}` : '',
    r.arxivId ? `arXiv: https://arxiv.org/abs/${r.arxivId}` : '',
    '',
    `ONE-LINER: ${r.oneLiner}`,
    '',
    `SIMPLE EXPLANATION:\n${r.simpleExplanation}`,
    '',
    `PROBLEM SOLVED:\n${r.problemSolved}`,
    '',
    `HOW IT WORKS:\n${r.howItWorks}`,
    '',
    `KEY CONTRIBUTIONS:\n${r.keyContributions?.map((c, i) => `${i + 1}. ${c.point}: ${c.detail}`).join('\n')}`,
    '',
    `PRACTICAL APPLICATIONS:\n${r.practicalApplications?.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
    '',
    r.keyTerms?.length ? `KEY TERMS:\n${r.keyTerms.map(t => `• ${t.term}: ${t.definition}`).join('\n')}` : '',
    '',
    r.interviewQA?.length
      ? `INTERVIEW Q&A:\n${r.interviewQA.map((qa, i) => `Q${i + 1}: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}`
      : '',
    '',
    r.codeSketch ? `CODE SKETCH:\n${r.codeSketch}` : '',
    '',
    r.bibtex ? `BIBTEX:\n${r.bibtex}` : '',
    '',
    `TWEET SUMMARY: ${r.tweetSummary}`,
    '',
    '---',
    'Generated by AmanAI Lab Paper Analyzer — amanailab.com/paper-explainer',
  ].filter(Boolean).join('\n')
}

function downloadNotes(r: PaperResult) {
  const blob = new Blob([buildNotes(r)], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${(r.originalTitle || r.inferredTitle).slice(0, 40).replace(/[^a-z0-9]+/gi, '_')}_Notes.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Small reusable components ────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for browsers that block clipboard without user gesture
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600 transition-colors"
    >
      {copied
        ? <><Check className="w-3 h-3 text-green-400" /> Copied</>
        : <><Copy className="w-3 h-3" /> {label ?? 'Copy'}</>}
    </button>
  )
}

function ShareButton({ title, text, url }: { title: string; text: string; url: string }) {
  const [state, setState] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle')

  async function handleShare() {
    // Try native Web Share API first (works on mobile + some desktop)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: `${text}\n\n🔗 ${url}`, url })
        setState('shared')
        setTimeout(() => setState('idle'), 2000)
        return
      } catch (e) {
        // User cancelled — don't fall through
        if (e instanceof Error && e.name === 'AbortError') return
      }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(`${text}\n\n🔗 ${url}`)
      setState('copied')
    } catch {
      // execCommand fallback for restrictive browsers
      try {
        const ta = document.createElement('textarea')
        ta.value = `${text}\n\n🔗 ${url}`
        ta.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setState('copied')
      } catch {
        setState('error')
      }
    }
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share this paper"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 transition-colors"
    >
      {state === 'shared'
        ? <><Check className="w-3.5 h-3.5 text-green-400" /> Shared!</>
        : state === 'copied'
          ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</>
          : state === 'error'
            ? <><AlertCircle className="w-3.5 h-3.5 text-red-400" /> Failed</>
            : <><Share2 className="w-3.5 h-3.5" /> Share</>}
    </button>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'text-green-400 bg-green-500/10 border-green-500/20'
    : score >= 6 ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    : score >= 4 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    : 'text-zinc-400 bg-zinc-800 border-zinc-700'
  return (
    <span className={`text-sm font-bold px-2.5 py-1 rounded-full border ${color}`}>
      {score}/10
    </span>
  )
}

function LevelBadge({ level }: { level: string }) {
  const color = level === 'Beginner' ? 'text-green-400 bg-green-500/10 border-green-500/20'
    : level === 'Intermediate' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    : 'text-red-400 bg-red-500/10 border-red-500/20'
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}>{level}</span>
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-violet-400">{icon}</span>
          <span className="text-sm font-semibold text-zinc-100">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <div className="absolute top-3 right-3 z-10">
        <CopyButton text={code} label="Copy code" />
      </div>
      <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  )
}

// ─── Email field ──────────────────────────────────────────────────────────────

function EmailField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  if (isCaptured()) return null
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5 text-violet-400" />
        Your Email <span className="text-violet-400">*</span>
        <span className="normal-case font-normal text-zinc-500 ml-1">— get paper summaries weekly</span>
      </label>
      <input type="email" value={value} onChange={e => onChange(e.target.value)}
        placeholder="your@email.com"
        className="w-full bg-zinc-800 border border-violet-500/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
      />
      <p className="text-xs text-zinc-600">No spam. Unsubscribe anytime.</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaperExplainer() {
  const [input, setInput]         = useState('')
  const [email, setEmail]         = useState('')
  const [level, setLevel]         = useState<Level>('practitioner')
  const [inputMode, setInputMode] = useState<'url' | 'pdf'>('url')
  const [pdfFile, setPdfFile]     = useState<File | null>(null)
  const [dragging, setDragging]   = useState(false)
  const [result, setResult]       = useState<PaperResult | null>(null)
  const [loading, setLoading]     = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError]         = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('simple')

  // Q&A chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput]     = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError]     = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Paper history
  const [history, setHistory]         = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  // Loading steps animation
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return }
    const interval = setInterval(() => {
      setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1))
    }, 2800)
    return () => clearInterval(interval)
  }, [loading])

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // ── Submit handler ────────────────────────────────────────────────────────────

  async function explain() {
    if (inputMode === 'url' && !input.trim()) {
      setError('Please paste an arXiv URL, HuggingFace/Semantic Scholar URL, or paper abstract.')
      return
    }
    if (inputMode === 'pdf' && !pdfFile) {
      setError('Please select a PDF file to upload.')
      return
    }

    if (!isCaptured()) {
      if (!email.trim()) { setError('Please enter your email to use this tool.'); return }
      try {
        await saveEmail(email.trim(), 'paper_explainer')
        markCaptured()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Invalid email.')
        return
      }
    }

    setError(''); setLoading(true); setResult(null); setChatHistory([])

    try {
      let res: Response

      if (inputMode === 'pdf' && pdfFile) {
        const fd = new FormData()
        fd.append('pdf', pdfFile)
        fd.append('level', level)
        res = await fetch('/api/paper/explain', { method: 'POST', body: fd })
      } else {
        res = await fetch('/api/paper/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: input.trim(), level }),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to analyze paper.')
      setResult(data)
      setActiveTab('simple')

      // Save to history
      const title = data.originalTitle || data.inferredTitle || (pdfFile?.name ?? input.slice(0, 60))
      const histInput = inputMode === 'pdf' ? `[PDF] ${pdfFile!.name}` : input.trim()
      const newItem: HistoryItem = { title, input: histInput, timestamp: Date.now() }
      addToHistory(newItem)
      setHistory(getHistory())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ── Chat handler ──────────────────────────────────────────────────────────────

  async function sendChat() {
    if (!chatInput.trim() || !result) return
    const question = chatInput.trim()
    setChatInput('')
    setChatError('')
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: question }]
    setChatHistory(newHistory)
    setChatLoading(true)

    try {
      const res = await fetch('/api/paper/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          paperContext: buildPaperContext(result),
          history: chatHistory.slice(-8),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to get answer.')
      setChatHistory([...newHistory, { role: 'assistant', content: data.answer }])
    } catch (e: unknown) {
      setChatError(e instanceof Error ? e.message : 'Something went wrong.')
      setChatHistory(newHistory.slice(0, -1))
    } finally {
      setChatLoading(false)
    }
  }

  // ── PDF drop handlers ─────────────────────────────────────────────────────────

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') setPdfFile(file)
    else setError('Please drop a PDF file.')
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">

      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <BookOpen className="w-3.5 h-3.5" /> AI Research Paper Analyzer
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Understand Any Research Paper
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Paste an arXiv URL, upload a PDF, or drop an abstract. Get a deep explanation, interview Q&A, and a code sketch — instantly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5 text-xs text-zinc-500">
            {['arXiv · HuggingFace · Semantic Scholar · Papers With Code', 'PDF Upload', '3 Explanation Levels', 'Interview Prep', 'Code Sketch', 'Follow-up Q&A'].map(f => (
              <span key={f} className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3 text-violet-400 shrink-0" /> {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">

        {/* ── Input card ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5 mb-6">

          {/* Level toggle */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Explanation Level</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(LEVEL_CONFIG) as Level[]).map(l => {
                const cfg = LEVEL_CONFIG[l]
                const isActive = level === l
                return (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      isActive ? `${cfg.active} ring-1 ${cfg.ring}` : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                    <span className={`font-normal ${isActive ? 'opacity-80' : 'text-zinc-600'}`}>— {cfg.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Input mode tabs */}
          <div className="flex gap-1 bg-zinc-800/60 rounded-xl p-1 w-fit">
            <button
              onClick={() => { setInputMode('url'); setPdfFile(null) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                inputMode === 'url' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> URL / Abstract
            </button>
            <button
              onClick={() => setInputMode('pdf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                inputMode === 'pdf' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload PDF
            </button>
          </div>

          {/* URL / text input */}
          {inputMode === 'url' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                arXiv · HuggingFace · Semantic Scholar · Papers With Code · or paste Abstract
              </label>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Paste any of:\n• https://arxiv.org/abs/2303.08774\n• https://huggingface.co/papers/2303.08774\n• https://paperswithcode.com/paper/attention-is-all-you-need\n• https://www.semanticscholar.org/paper/...\n• Or paste the paper abstract directly`}
                rows={5}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
              />
            </div>
          )}

          {/* PDF upload */}
          {inputMode === 'pdf' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-violet-500 bg-violet-500/10'
                  : pdfFile
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30'
              }`}
            >
              {pdfFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-6 h-6 text-green-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-100">{pdfFile.name}</p>
                    <p className="text-xs text-zinc-500">{(pdfFile.size / 1024).toFixed(0)} KB · PDF</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setPdfFile(null) }}
                    className="ml-2 p-1 text-zinc-500 hover:text-red-400 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-zinc-300 mb-1">Drop a PDF here or click to browse</p>
                  <p className="text-xs text-zinc-500">Supports full research paper PDFs · Max ~20 MB</p>
                </>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setPdfFile(f) }} />

          <EmailField value={email} onChange={setEmail} />

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
            </div>
          )}

          <button onClick={explain} disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/20"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing Paper…</>
              : <><Sparkles className="w-4 h-4" /> Analyze This Paper</>
            }
          </button>

          {/* Examples */}
          {inputMode === 'url' && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-zinc-600">Try:</span>
              {EXAMPLE_PAPERS.map(p => (
                <button key={p.id} onClick={() => setInput(`https://arxiv.org/abs/${p.id}`)}
                  className="text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Paper history ── */}
        {history.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                Recent papers ({history.length})
                <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={() => { clearHistory(); setHistory([]) }}
                className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors ml-auto">
                Clear
              </button>
            </div>
            {showHistory && (
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (h.input.startsWith('[PDF]')) return
                      setInput(h.input)
                      setInputMode('url')
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors max-w-xs"
                    title={h.input}
                  >
                    <BookOpen className="w-3 h-3 shrink-0 text-violet-400" />
                    <span className="truncate">{h.title.slice(0, 50)}</span>
                    <span className="text-zinc-700 shrink-0">{new Date(h.timestamp).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Loading steps ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="relative w-16 h-16">
              <span className="absolute inset-0 border-2 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
              <BookOpen className="absolute inset-0 m-auto w-7 h-7 text-violet-400" />
            </div>

            <div className="w-full max-w-sm flex flex-col gap-2">
              {LOADING_STEPS.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${
                  i < loadingStep ? 'opacity-40' : i === loadingStep ? 'opacity-100' : 'opacity-20'
                }`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    i < loadingStep
                      ? 'bg-violet-600 border-violet-600'
                      : i === loadingStep
                        ? 'border-violet-500 bg-violet-500/20'
                        : 'border-zinc-700 bg-zinc-900'
                  }`}>
                    {i < loadingStep
                      ? <Check className="w-3 h-3 text-white" />
                      : i === loadingStep
                        ? <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                        : <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${i === loadingStep ? 'text-zinc-100' : 'text-zinc-500'}`}>
                      {step.label}
                    </p>
                    {i === loadingStep && (
                      <p className="text-xs text-zinc-600">{step.sub}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-zinc-600 text-xs text-center max-w-xs">
              Fetching, analyzing architecture, writing explanations, generating interview questions & code. ~20–30s
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <div className="flex flex-col gap-5">

            {/* Metadata card */}
            <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-zinc-100 leading-tight mb-1">
                    {result.originalTitle || result.inferredTitle}
                  </h2>
                  {result.authors.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {result.authors.join(', ')}{result.year ? ` · ${result.year}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <LevelBadge level={result.whoShouldRead} />
                  <ScoreBadge score={result.importanceScore} />
                  {result.arxivId && (
                    <a href={`https://arxiv.org/abs/${result.arxivId}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 transition-colors">
                      <ExternalLink className="w-3 h-3" /> arXiv
                    </a>
                  )}
                </div>
              </div>

              <p className="text-sm font-medium text-zinc-200 italic mb-2">"{result.oneLiner}"</p>
              <p className="text-xs text-zinc-500 mb-4">{result.importanceReason}</p>

              {/* Export row */}
              <div className="flex items-center gap-2 pt-3 border-t border-violet-500/20 flex-wrap">
                <span className="text-xs text-zinc-600 mr-auto">Export:</span>
                <CopyButton text={buildNotes(result)} label="Copy notes" />
                {result.bibtex && <CopyButton text={result.bibtex} label="BibTeX" />}
                <button onClick={() => downloadNotes(result)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 transition-colors">
                  <Download className="w-3.5 h-3.5" /> .txt
                </button>
                <ShareButton
                  title={result.originalTitle || result.inferredTitle}
                  text={`📄 ${result.originalTitle || result.inferredTitle}\n\n${result.tweetSummary}`}
                  url="https://amanailab.com/paper-explainer"
                />
                <button onClick={() => { setResult(null); setChatHistory([]); setInput(''); setPdfFile(null) }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> New
                </button>
              </div>
            </div>

            {/* Tweet summary */}
            <div className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
              <span className="text-sky-400 shrink-0 text-xs font-bold mt-0.5">𝕏</span>
              <p className="text-sm text-zinc-300 flex-1 leading-relaxed">{result.tweetSummary}</p>
              <CopyButton text={result.tweetSummary} />
            </div>

            {/* Tabs — 5 tabs */}
            <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 overflow-x-auto">
              {([
                { id: 'simple',    label: 'Simple',        icon: <Lightbulb className="w-3.5 h-3.5" />   },
                { id: 'deep',      label: 'Deep Dive',     icon: <Brain className="w-3.5 h-3.5" />       },
                { id: 'interview', label: 'Interview',     icon: <GraduationCap className="w-3.5 h-3.5" /> },
                { id: 'code',      label: 'Code Sketch',   icon: <Code2 className="w-3.5 h-3.5" />      },
                { id: 'apply',     label: 'Real-World',    icon: <Target className="w-3.5 h-3.5" />      },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Simple */}
            {activeTab === 'simple' && (
              <div className="flex flex-col gap-4">
                <Section title="Simple Explanation" icon={<Lightbulb className="w-4 h-4" />}>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.simpleExplanation}</p>
                </Section>
                <Section title="Problem It Solves" icon={<Target className="w-4 h-4" />}>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.problemSolved}</p>
                </Section>
                {result.keyTerms?.length > 0 && (
                  <Section title="Key Terms Explained" icon={<Brain className="w-4 h-4" />}>
                    <div className="flex flex-col gap-4">
                      {result.keyTerms.map((t, i) => (
                        <div key={i} className="border-l-2 border-violet-500/40 pl-4">
                          <span className="text-sm font-bold text-violet-400 block mb-1">{t.term}</span>
                          <span className="text-sm text-zinc-400 leading-relaxed">{t.definition}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* Tab: Deep Dive */}
            {activeTab === 'deep' && (
              <div className="flex flex-col gap-4">
                <Section title="How It Actually Works" icon={<Brain className="w-4 h-4" />}>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.howItWorks}</p>
                </Section>
                {result.architectureDetails && (
                  <Section title="Architecture & Technical Details" icon={<Zap className="w-4 h-4" />}>
                    <p className="text-sm text-zinc-300 leading-relaxed">{result.architectureDetails}</p>
                  </Section>
                )}
                <Section title="Key Contributions" icon={<Zap className="w-4 h-4" />}>
                  <div className="flex flex-col gap-5">
                    {result.keyContributions?.map((c, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-100 mb-1">{c.point}</p>
                          <p className="text-sm text-zinc-400 leading-relaxed">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
                {result.experimentResults && (
                  <Section title="Experiments & Results" icon={<Target className="w-4 h-4" />}>
                    <p className="text-sm text-zinc-300 leading-relaxed">{result.experimentResults}</p>
                  </Section>
                )}
                {result.limitations?.length > 0 && (
                  <Section title="Limitations" icon={<AlertTriangle className="w-4 h-4" />} defaultOpen={false}>
                    <ul className="flex flex-col gap-3">
                      {result.limitations.map((l, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                          <span className="text-yellow-400 shrink-0 mt-0.5">•</span>
                          <span className="leading-relaxed">{l}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
                {result.bibtex && (
                  <Section title="BibTeX Citation" icon={<BookOpen className="w-4 h-4" />} defaultOpen={false}>
                    <CodeBlock code={result.bibtex} />
                  </Section>
                )}
              </div>
            )}

            {/* Tab: Interview */}
            {activeTab === 'interview' && (
              <div className="flex flex-col gap-4">
                <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl px-4 py-3">
                  <p className="text-xs text-violet-300 font-semibold mb-0.5">Interview Preparation</p>
                  <p className="text-xs text-zinc-500">These are the questions Google, OpenAI, Meta, and other top AI labs may ask about this paper. Practice your answers before the interview.</p>
                </div>
                {result.interviewQA?.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {result.interviewQA.map((qa, i) => (
                      <InterviewQACard key={i} index={i} qa={qa} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-600 text-sm">
                    No interview questions generated. Try re-analyzing the paper.
                  </div>
                )}
              </div>
            )}

            {/* Tab: Code */}
            {activeTab === 'code' && (
              <div className="flex flex-col gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Code2 className="w-4 h-4 text-violet-400" />
                    <p className="text-sm font-semibold text-zinc-100">Core Idea in Python</p>
                    <span className="text-xs text-zinc-600 ml-auto">Minimal implementation of the key concept</span>
                  </div>
                  {result.codeSketch ? (
                    <CodeBlock code={result.codeSketch} />
                  ) : (
                    <p className="text-sm text-zinc-600 text-center py-8">No code sketch available for this paper.</p>
                  )}
                </div>
                {result.relatedConcepts?.length > 0 && (
                  <Section title="Related Concepts to Know" icon={<BookOpen className="w-4 h-4" />}>
                    <div className="flex flex-wrap gap-2">
                      {result.relatedConcepts.map(c => (
                        <span key={c} className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">{c}</span>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* Tab: Real-World */}
            {activeTab === 'apply' && (
              <div className="flex flex-col gap-4">
                <Section title="Practical Applications" icon={<Target className="w-4 h-4" />}>
                  <ul className="flex flex-col gap-3">
                    {result.practicalApplications?.map((a, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                        {a}
                      </li>
                    ))}
                  </ul>
                </Section>
                {result.relatedConcepts?.length > 0 && (
                  <Section title="Related Concepts to Know" icon={<BookOpen className="w-4 h-4" />}>
                    <div className="flex flex-wrap gap-2">
                      {result.relatedConcepts.map(c => (
                        <span key={c} className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">{c}</span>
                      ))}
                    </div>
                  </Section>
                )}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Share This Paper</p>
                    <CopyButton text={result.tweetSummary} />
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.tweetSummary}</p>
                </div>
              </div>
            )}

            {/* ── Q&A Chat ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Ask Anything About This Paper</p>
                  <p className="text-xs text-zinc-500">Explain Figure 3, compare to BERT, show how to implement attention, etc.</p>
                </div>
              </div>

              {chatHistory.length > 0 && (
                <div className="px-5 py-4 flex flex-col gap-3 max-h-96 overflow-y-auto">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white rounded-tr-sm'
                          : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                        <span className="flex gap-1">
                          {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {chatError && (
                <div className="mx-5 mb-3 flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{chatError}
                </div>
              )}

              <div className="px-4 py-4 flex gap-2 border-t border-zinc-800">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                  placeholder="How does the attention mechanism work? How does this compare to BERT?"
                  className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                  disabled={chatLoading}
                />
                <button
                  onClick={sendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  aria-label="Send question"
                  className="flex items-center justify-center w-10 h-10 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {chatHistory.length === 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {[
                    'How does this compare to BERT?',
                    'Show a Python implementation',
                    'What are the key hyperparameters?',
                    'Explain the loss function',
                    'What datasets were used?',
                  ].map(q => (
                    <button key={q} onClick={() => { setChatInput(q); }}
                      className="text-xs text-zinc-500 hover:text-violet-400 bg-zinc-800/60 hover:bg-violet-500/10 border border-zinc-700 hover:border-violet-500/30 px-2.5 py-1 rounded-lg transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </section>
  )
}

// ─── Interview Q&A Card ───────────────────────────────────────────────────────

function InterviewQACard({ index, qa }: { index: number; qa: InterviewQA }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 p-4 text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0 mt-0.5">
          Q{index + 1}
        </div>
        <p className="flex-1 text-sm font-semibold text-zinc-200 leading-snug">{qa.question}</p>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold shrink-0">
              A
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{qa.answer}</p>
          </div>
          <div className="mt-3 flex justify-end">
            <CopyButton text={`Q: ${qa.question}\nA: ${qa.answer}`} label="Copy Q&A" />
          </div>
        </div>
      )}
    </div>
  )
}
