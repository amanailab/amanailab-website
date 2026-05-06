'use client'

import { useState } from 'react'
import {
  BrainCircuit, Sparkles, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, Target, Lightbulb, BookOpen, ArrowRight, Briefcase,
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

// ─── Skill badge colors ───────────────────────────────────────────────────────

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

// ─── Question card (expandable) ───────────────────────────────────────────────

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="w-7 h-7 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-orange-400 shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 leading-relaxed">{q.question}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
            <Target className="w-3 h-3 shrink-0" /> {q.why}
          </p>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 mt-1" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-zinc-800">
          <div className="flex items-start gap-2 mt-4">
            <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-2">Model Answer</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{q.model_answer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PLACEHOLDER = `Paste a full job description here. For example:

We are looking for a Senior ML Engineer to join our foundation models team. You will work on large-scale LLM training, RLHF pipelines, and model evaluation.

Requirements:
- 4+ years of ML engineering experience
- Strong Python, PyTorch, and distributed training (FSDP/DeepSpeed)
- Experience with RLHF, DPO, or similar alignment techniques
- Familiarity with evaluation frameworks and model benchmarking
- Knowledge of transformer architectures and attention mechanisms
...`

export default function JobPrepPage() {
  const [jd, setJd]           = useState('')
  const [result, setResult]   = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jd.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/job-prep/generate', {
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
      setLoading(false)
    }
  }

  // Build the interview link with the most relevant topic
  function interviewLink(result: Result) {
    const topicMap: Record<string, string> = {
      'llm': 'LLM', 'gpt': 'LLM', 'language model': 'LLM', 'transformer': 'Transformers',
      'rag': 'RAG', 'retrieval': 'RAG', 'agent': 'Agents', 'fine-tun': 'Fine-Tuning',
      'mlops': 'MLOps', 'deployment': 'MLOps', 'python': 'Python', 'pytorch': 'Python',
      'computer vision': 'Computer Vision', 'cv': 'Computer Vision', 'nlp': 'NLP',
      'sql': 'SQL & Data', 'data engineer': 'SQL & Data', 'behavioral': 'Behavioral',
      'system design': 'System Design', 'vector': 'Vector DB',
    }
    const roleAndSkills = `${result.role} ${result.skills.join(' ')}`.toLowerCase()
    for (const [key, topic] of Object.entries(topicMap)) {
      if (roleAndSkills.includes(key)) return `/interview?topic=${encodeURIComponent(topic)}&level=${encodeURIComponent(result.level)}`
    }
    return '/interview'
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <Briefcase className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Job-Specific Prep</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 mb-3">
            Job Description → Interview Questions
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
            Paste any AI/ML job description. Get the exact skills required, 6 tailored interview questions, and a study plan — in seconds.
          </p>
        </div>

        {/* Input form */}
        {!result && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden focus-within:border-orange-500/50 transition-colors">
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={12}
                className="w-full bg-transparent px-5 py-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800">
                <span className="text-xs text-zinc-600">{jd.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span className="text-xs text-zinc-600">Paste any job description — LinkedIn, company website, etc.</span>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="shrink-0">⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || jd.trim().length < 50}
              className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing job description…</>
                : <><Sparkles className="w-4 h-4" /> Generate My Interview Questions</>
              }
            </button>
          </form>
        )}

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-5">

            {/* Role header */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-1">Analyzing role</p>
                  <h2 className="text-xl font-extrabold text-zinc-100">{result.role}</h2>
                  {result.company && <p className="text-sm text-zinc-400 mt-0.5">at {result.company}</p>}
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  {result.level} Level
                </span>
              </div>
            </div>

            {/* Required skills */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <p className="text-sm font-bold text-zinc-100">Required Skills</p>
                <span className="text-xs text-zinc-500 ml-auto">{result.skills.length} extracted</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.skills.map((skill, i) => (
                  <span
                    key={skill}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
                  >
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
                <span className="text-xs text-zinc-500 ml-auto">Click to reveal model answers</span>
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
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-orange-400" />
                  <p className="text-sm font-bold text-orange-300">Study Tips for This Role</p>
                </div>
                <div className="flex flex-col gap-2">
                  {result.study_tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-orange-400 font-bold shrink-0">{i + 1}.</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <Link
                href={interviewLink(result)}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
              >
                <BrainCircuit className="w-4 h-4" /> Practice Interview for This Role <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => { setResult(null); setJd('') }}
                className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
              >
                Analyze a Different JD
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
