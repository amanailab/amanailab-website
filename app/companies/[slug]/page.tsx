'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, BrainCircuit, Lightbulb, Target, Briefcase } from 'lucide-react'

interface Company {
  id: number; name: string; slug: string; logo_emoji: string
  tagline: string; description: string; hq: string; size: string
  interview_rounds: number; interview_format: string
  what_they_look_for: string[]; tips: string[]
}

interface Question {
  id: number; question: string; model_answer: string; topic: string; level: string
}

const TOPIC_COLORS: Record<string, string> = {
  LLM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  RAG: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Agents: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Fine-Tuning': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  MLOps: 'bg-green-500/20 text-green-300 border-green-500/30',
  Transformers: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'System Design': 'bg-red-500/20 text-red-300 border-red-500/30',
  Python: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  'Vector DB': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Computer Vision': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  NLP: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Statistics: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'SQL & Data': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Behavioral: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

const LEVEL_COLORS: Record<string, string> = {
  Fresher: 'bg-green-500/10 text-green-300 border-green-500/20',
  Mid:     'bg-blue-500/10 text-blue-300 border-blue-500/20',
  Senior:  'bg-orange-500/10 text-orange-300 border-orange-500/20',
}

function QuestionCard({ q }: { q: Question }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 p-4 text-left hover:bg-zinc-800/30 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TOPIC_COLORS[q.topic] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{q.topic}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[q.level] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{q.level}</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{q.question}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800">
          <div className="flex items-start gap-2 mt-3">
            <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1.5">Model Answer</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{q.model_answer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('')
  const [company, setCompany] = useState<Company | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTopic, setFilterTopic] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return
    fetch(`/api/companies/${slug}`)
      .then(r => r.json())
      .then(d => { setCompany(d.company); setQuestions(d.questions ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  const topics = [...new Set(questions.map(q => q.topic))]
  const levels = [...new Set(questions.map(q => q.level))]
  const filtered = questions.filter(q =>
    (filterTopic === 'all' || q.topic === filterTopic) &&
    (filterLevel === 'all' || q.level === filterLevel)
  )

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )

  if (!company) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-zinc-400 mb-4">Company not found.</p>
        <Link href="/companies" className="text-orange-400 hover:text-orange-300 text-sm font-semibold">← Back to Companies</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">

        {/* Back */}
        <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Companies
        </Link>

        {/* Hero */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-5xl">{company.logo_emoji}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-zinc-100 mb-1">{company.name}</h1>
              <p className="text-zinc-400 text-sm">{company.tagline}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs text-zinc-500">{company.hq}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">{company.size} employees</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">{company.interview_rounds} interview rounds</span>
              </div>
            </div>
            <Link
              href={`/interview`}
              className="hidden sm:flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              <BrainCircuit className="w-3.5 h-3.5" /> Practice Now
            </Link>
          </div>
          {company.description && <p className="text-sm text-zinc-400 leading-relaxed">{company.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Interview format */}
          {company.interview_format && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-orange-400" />
                <p className="text-sm font-bold text-zinc-100">Interview Format</p>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{company.interview_format}</p>
            </div>
          )}

          {/* What they look for */}
          {company.what_they_look_for?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-bold text-zinc-100">What They Look For</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {company.what_they_look_for.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" /> {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {company.tips?.length > 0 && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-orange-400" />
              <p className="text-sm font-bold text-orange-300">Insider Tips</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {company.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-orange-400 font-bold shrink-0">{i + 1}.</span> {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm font-bold text-zinc-100">{questions.length} Interview Questions</p>
            <div className="flex gap-2">
              {topics.length > 1 && (
                <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none">
                  <option value="all">All Topics</option>
                  {topics.map(t => <option key={t}>{t}</option>)}
                </select>
              )}
              {levels.length > 1 && (
                <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none">
                  <option value="all">All Levels</option>
                  {levels.map(l => <option key={l}>{l}</option>)}
                </select>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <BrainCircuit className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No questions yet for this company.</p>
              <p className="text-zinc-600 text-xs mt-1">Questions are being added regularly.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map(q => <QuestionCard key={q.id} q={q} />)}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex gap-3">
          <Link href="/interview" className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
            <BrainCircuit className="w-4 h-4" /> Practice Interview
          </Link>
          <Link href="/companies" className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-3.5 rounded-xl transition-colors">
            All Companies
          </Link>
        </div>
      </div>
    </div>
  )
}
