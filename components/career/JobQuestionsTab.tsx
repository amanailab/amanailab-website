'use client'

import { useState } from 'react'
import {
  BrainCircuit, Sparkles, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, Target, Lightbulb, BookOpen, ArrowRight,
  Copy, Check, Download, Zap,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  question: string
  why: string
  model_answer: string
}

interface Result {
  role: string
  company: string | null
  level: string
  skills: string[]
  questions: Question[]
  study_tips: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SKILL_COLORS = [
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'bg-green-500/20 text-green-300 border-green-500/30',
  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
]

const LEVEL_COLORS: Record<string, string> = {
  Fresher:   'bg-green-500/10 border-green-500/30 text-green-400',
  Mid:       'bg-blue-500/10 border-blue-500/30 text-blue-400',
  Senior:    'bg-violet-500/10 border-violet-500/30 text-violet-400',
  Staff:     'bg-orange-500/10 border-orange-500/30 text-orange-400',
  Principal: 'bg-red-500/10 border-red-500/30 text-red-400',
}

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800/80 transition-colors shrink-0"
    >
      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> {label}</>}
    </button>
  )
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(false)
  const fullText = `Q${index + 1}: ${q.question}\n\nWhy asked: ${q.why}\n\nModel Answer: ${q.model_answer}`

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="w-7 h-7 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-orange-400 shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 leading-relaxed">{q.question}</p>
          <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5">
            <Target className="w-3 h-3 shrink-0" />
            <span className="truncate">{q.why}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CopyBtn text={fullText} />
          {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-zinc-800">
          <div className="flex items-start gap-2 mt-4 bg-orange-500/5 border border-orange-500/15 rounded-xl p-4">
            <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-2">Model Answer</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{q.model_answer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

const PLACEHOLDER = `Paste a full job description here. For example:

We are looking for a Senior ML Engineer to join our foundation models team. You will work on large-scale LLM training, RLHF pipelines, and model evaluation.

Requirements:
- 4+ years of ML engineering experience
- Strong Python, PyTorch, and distributed training (FSDP/DeepSpeed)
- Experience with RLHF, DPO, or similar alignment techniques
- Familiarity with evaluation frameworks and model benchmarking
- Knowledge of transformer architectures and attention mechanisms
...`

const LOADING_STEPS = [
  'Reading job description…',
  'Extracting required skills…',
  'Generating targeted questions…',
  'Writing model answers…',
  'Preparing study tips…',
]

function interviewLink(result: Result) {
  const topicMap: Record<string, string> = {
    'llm': 'LLM', 'gpt': 'LLM', 'language model': 'LLM', 'transformer': 'Transformers',
    'rag': 'RAG', 'retrieval': 'RAG', 'agent': 'Agents', 'fine-tun': 'Fine-Tuning',
    'mlops': 'MLOps', 'deployment': 'MLOps', 'python': 'Python', 'pytorch': 'Python',
    'computer vision': 'Computer Vision', 'cv': 'Computer Vision', 'nlp': 'NLP',
    'sql': 'SQL & Data', 'data engineer': 'SQL & Data', 'behavioral': 'Behavioral',
    'system design': 'System Design', 'vector': 'Vector DB',
  }
  const combined = `${result.role} ${result.skills.join(' ')}`.toLowerCase()
  for (const [key, topic] of Object.entries(topicMap)) {
    if (combined.includes(key)) return `/interview?topic=${encodeURIComponent(topic)}&level=${encodeURIComponent(result.level)}`
  }
  return '/interview'
}

export default function JobQuestionsTab() {
  const [jd,            setJd]            = useState('')
  const [result,        setResult]        = useState<Result | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [loadingStep,   setLoadingStep]   = useState(0)
  const [error,         setError]         = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jd.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setLoadingStep(0)

    // Animate steps
    const stepInterval = setInterval(() => {
      setLoadingStep(s => s < LOADING_STEPS.length - 1 ? s + 1 : s)
    }, 1200)

    try {
      const res = await fetch('/api/career/job-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to analyze')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }

  function buildExportText(r: Result): string {
    const lines: string[] = [
      `INTERVIEW PREP: ${r.role}${r.company ? ` at ${r.company}` : ''}`,
      `Level: ${r.level}`,
      `Required Skills: ${r.skills.join(', ')}`,
      '',
      '━━━ INTERVIEW QUESTIONS ━━━',
      '',
      ...r.questions.map((q, i) =>
        `${i + 1}. ${q.question}\n   Why asked: ${q.why}\n   Model Answer: ${q.model_answer}`
      ),
      '',
      '━━━ STUDY TIPS ━━━',
      '',
      ...r.study_tips.map((t, i) => `${i + 1}. ${t}`),
      '',
      'Generated by AmanAI Lab — amanailab.com/career',
    ]
    return lines.join('\n')
  }

  function downloadTxt(r: Result) {
    const blob = new Blob([buildExportText(r)], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${r.role.replace(/[^a-z0-9]+/gi, '_')}_Interview_Prep.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const wordCount = jd.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="flex flex-col gap-5">

      {/* Intro */}
      {!result && (
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-zinc-100 mb-2">
            Paste JD → Get Interview Questions
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
            Paste any AI/ML job description. Get required skills, 6 tailored questions with model answers, and personalised study tips — in 10 seconds.
          </p>
          <div className="flex items-center justify-center gap-5 mt-4 text-xs text-zinc-500 flex-wrap">
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-500" /> 6 tailored questions</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Model answers</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-blue-500" /> Study tips</span>
          </div>
        </div>
      )}

      {/* Input */}
      {!result && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden focus-within:border-orange-500/50 transition-colors">
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={13}
              className="w-full bg-transparent px-5 py-4 text-sm text-zinc-200 placeholder-zinc-500 outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800">
              <span className={`text-xs ${wordCount >= 50 ? 'text-green-400' : 'text-zinc-600'}`}>
                {wordCount} words {wordCount < 50 ? `(need at least 50)` : '✓'}
              </span>
              <span className="text-xs text-zinc-600">Works with LinkedIn, company sites, any JD</span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="shrink-0">⚠</span> {error}
            </div>
          )}

          <button type="submit" disabled={loading || wordCount < 50}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {LOADING_STEPS[loadingStep]}</>
              : <><Sparkles className="w-4 h-4" /> Generate My Interview Prep</>
            }
          </button>
        </form>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-5">

          {/* Role header + export row */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-1">Role detected</p>
                <h2 className="text-xl font-extrabold text-zinc-100">{result.role}</h2>
                {result.company && <p className="text-sm text-zinc-400 mt-0.5">@ {result.company}</p>}
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${LEVEL_COLORS[result.level] ?? 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                {result.level}
              </span>
            </div>
            {/* Export actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-500 mr-auto">Export this prep guide:</span>
              <CopyBtn text={buildExportText(result)} label="Copy All" />
              <button onClick={() => downloadTxt(result)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800/80 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download .txt
              </button>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <p className="text-sm font-bold text-zinc-100">Required Skills</p>
              <span className="text-xs text-zinc-500 ml-auto">{result.skills.length} extracted from JD</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.skills.map((skill, i) => (
                <span key={skill} className={`text-xs font-semibold px-3 py-1 rounded-full border ${SKILL_COLORS[i % SKILL_COLORS.length]}`}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-4 h-4 text-orange-400" />
              <p className="text-sm font-bold text-zinc-100">Tailored Interview Questions</p>
              <span className="text-xs text-zinc-500 ml-auto">Tap to reveal model answers</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {result.questions.map((q, i) => (
                <QuestionCard key={i} q={q} index={i} />
              ))}
            </div>
          </div>

          {/* Study tips */}
          {result.study_tips.length > 0 && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-400" />
                  <p className="text-sm font-bold text-orange-300">Personalised Study Tips</p>
                </div>
                <CopyBtn text={result.study_tips.map((t, i) => `${i + 1}. ${t}`).join('\n')} label="Copy Tips" />
              </div>
              <div className="flex flex-col gap-3">
                {result.study_tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Link href={interviewLink(result)}
              className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
            >
              <BrainCircuit className="w-4 h-4" /> Practice These Topics in Mock Interview <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={() => { setResult(null); setJd('') }}
              className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
            >
              Analyze a Different JD
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
