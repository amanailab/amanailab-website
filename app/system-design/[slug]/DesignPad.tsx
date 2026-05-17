'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Save, Sparkles, CheckCircle, Circle, Clock, ChevronDown,
  ChevronUp, AlertCircle, Trophy, Building2, Loader2, Eye, PenLine,
} from 'lucide-react'
import type { SDProblem } from '@/lib/system-design-problems'
import { DESIGN_TEMPLATE } from '@/lib/system-design-problems'

const STORAGE_PREFIX = 'sd_design_v1_'

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
  B: { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',       label: 'Strong Answer' },
  C: { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',   label: 'Needs Work' },
  D: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',          label: 'Major Gaps' },
}

const SECTION_LABELS: Record<string, string> = {
  requirements: 'Requirements',
  architecture: 'Architecture',
  scalability:  'Scalability',
  dataModel:    'Data Model',
  tradeoffs:    'Trade-offs',
}

export default function DesignPad({ problem }: { problem: SDProblem }) {
  const [design, setDesign]         = useState('')
  const [mode, setMode]             = useState<'write' | 'preview'>('write')
  const [savedAt, setSavedAt]       = useState<Date | null>(null)
  const [reviewing, setReviewing]   = useState(false)
  const [review, setReview]         = useState<ReviewResult | null>(null)
  const [reviewError, setReviewError] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [checklist, setChecklist]   = useState<Record<string, boolean>>({})
  const saveTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const storageKey                  = STORAGE_PREFIX + problem.slug

  // Load saved design from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setDesign(parsed.design ?? DESIGN_TEMPLATE)
        setSavedAt(parsed.savedAt ? new Date(parsed.savedAt) : null)
        setChecklist(parsed.checklist ?? {})
      } else {
        setDesign(DESIGN_TEMPLATE)
      }
    } catch {
      setDesign(DESIGN_TEMPLATE)
    }
  }, [storageKey])

  // Auto-save with debounce
  const saveDesign = useCallback((text: string, cl: Record<string, boolean>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ design: text, savedAt: new Date().toISOString(), checklist: cl }))
        setSavedAt(new Date())
      } catch {}
    }, 800)
  }, [storageKey])

  const handleChange = (val: string) => {
    setDesign(val)
    saveDesign(val, checklist)
  }

  const toggleChecklist = (area: string) => {
    const next = { ...checklist, [area]: !checklist[area] }
    setChecklist(next)
    saveDesign(design, next)
  }

  const handleReview = async () => {
    if (design.trim().length < 100) {
      setReviewError('Please write more before requesting a review — at least a few paragraphs.')
      return
    }
    setReviewing(true)
    setReviewError('')
    setReview(null)
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
    } catch (e: unknown) {
      setReviewError((e instanceof Error ? e.message : '') || 'Review failed. Please try again.')
    } finally {
      setReviewing(false)
    }
  }

  const coveredCount = Object.values(checklist).filter(Boolean).length

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/sheet" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors flex-shrink-0">
              <ArrowLeft size={14} /> Sheet
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-sm font-semibold text-zinc-200 truncate">{problem.title}</span>
            <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full border font-medium ${
              problem.difficulty === 'Hard' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
            }`}>{problem.difficulty}</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {savedAt && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-600">
                <Save size={10} /> Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleReview}
              disabled={reviewing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {reviewing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {reviewing ? 'Reviewing…' : 'AI Review'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[380px_1fr] gap-6 items-start">

        {/* ── Left: Problem panel ──────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-20 space-y-4">
          {/* Problem statement */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Problem</span>
              <div className="flex items-center gap-1.5">
                {problem.companies.slice(0, 4).map(c => (
                  <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">{c[0]}{c.length > 6 ? '' : c.slice(1, 3)}</span>
                ))}
              </div>
            </div>
            <div className="px-4 py-4 prose prose-sm prose-invert max-w-none text-zinc-300 text-sm leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(problem.problem) }} />
            </div>
          </div>

          {/* Constraints */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Scale & Constraints</span>
            </div>
            <ul className="px-4 py-3 space-y-1.5">
              {problem.constraints.map(c => (
                <li key={c} className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="text-orange-400 mt-0.5 flex-shrink-0">▸</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key areas checklist */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Must Cover</span>
              <span className="text-xs text-zinc-500">{coveredCount}/{problem.keyAreas.length}</span>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {problem.keyAreas.map(area => (
                <button
                  key={area}
                  onClick={() => toggleChecklist(area)}
                  className="w-full flex items-start gap-2 text-left group"
                >
                  <span className="mt-0.5 flex-shrink-0">
                    {checklist[area]
                      ? <CheckCircle size={13} className="text-emerald-400" />
                      : <Circle size={13} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    }
                  </span>
                  <span className={`text-xs leading-snug ${checklist[area] ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                    {area}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Hints */}
          <details className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group">
            <summary className="px-4 py-2.5 flex items-center justify-between cursor-pointer list-none">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hints (if stuck)</span>
              <ChevronDown size={14} className="text-zinc-600 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-4 pb-3 space-y-2 border-t border-zinc-800">
              {problem.hints.map((h, i) => (
                <p key={i} className="text-xs text-zinc-400 leading-relaxed pt-2 border-t border-zinc-800/60 first:border-0 first:pt-0">
                  💡 {h}
                </p>
              ))}
            </div>
          </details>
        </aside>

        {/* ── Right: Editor + Review ────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <button onClick={() => setMode('write')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'write' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                <PenLine size={12} /> Write
              </button>
              <button onClick={() => setMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'preview' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                <Eye size={12} /> Preview
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-600">
              <Clock size={10} />
              <span>Auto-saved · {design.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>

          {/* Editor */}
          {mode === 'write' ? (
            <textarea
              value={design}
              onChange={e => handleChange(e.target.value)}
              placeholder="Write your system design here using Markdown…"
              spellCheck={false}
              className="w-full h-[600px] bg-zinc-900 border border-zinc-800 focus:border-orange-500/50 rounded-2xl px-5 py-4 text-sm text-zinc-200 font-mono leading-relaxed resize-y outline-none transition-colors placeholder-zinc-700"
            />
          ) : (
            <div className="w-full min-h-[600px] bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 prose prose-sm prose-invert max-w-none text-zinc-200 leading-relaxed">
              {design.trim()
                ? <div dangerouslySetInnerHTML={{ __html: markdownToHtml(design) }} />
                : <p className="text-zinc-600 italic">Nothing to preview yet. Switch to Write and start designing.</p>
              }
            </div>
          )}

          {/* Review error */}
          {reviewError && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              {reviewError}
            </div>
          )}

          {/* AI Review result */}
          {review && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowReview(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-orange-400" />
                  <span className="font-bold text-zinc-200">AI Review</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${GRADE_CONFIG[review.grade]?.color ?? 'text-zinc-400'} ${GRADE_CONFIG[review.grade]?.bg ?? ''}`}>
                    {review.grade} · {review.overallScore}/10
                  </span>
                  <span className="hidden sm:inline text-xs text-zinc-500">{GRADE_CONFIG[review.grade]?.label}</span>
                </div>
                {showReview ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
              </button>

              {showReview && (
                <div className="border-t border-zinc-800 px-5 py-4 space-y-5">
                  {/* Summary */}
                  <p className="text-sm text-zinc-300 leading-relaxed">{review.summary}</p>

                  {/* Section scores */}
                  {Object.entries(review.sectionScores).some(([, v]) => v !== null) && (
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Section Scores</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(review.sectionScores).map(([key, score]) => (
                          score !== null && (
                            <div key={key} className="bg-zinc-950/60 rounded-xl px-3 py-2">
                              <div className="text-[10px] text-zinc-500 mb-1">{SECTION_LABELS[key] ?? key}</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${score * 10}%` }} />
                                </div>
                                <span className="text-xs font-bold text-zinc-300">{score}/10</span>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {review.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">✓ Strengths</p>
                      <ul className="space-y-1">
                        {review.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <CheckCircle size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {review.gaps.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">✗ Gaps & Improvements</p>
                      <ul className="space-y-1">
                        {review.gaps.map((g, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <AlertCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Top suggestion */}
                  <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-orange-400 mb-1">⭐ Top Priority Improvement</p>
                    <p className="text-sm text-zinc-200">{review.topSuggestion}</p>
                  </div>

                  {/* Interviewer note */}
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-zinc-500 mb-1 flex items-center gap-1.5">
                      <Building2 size={11} /> What the interviewer would say
                    </p>
                    <p className="text-sm text-zinc-400 italic leading-relaxed">&ldquo;{review.interviewerNote}&rdquo;</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="flex items-center justify-between text-xs text-zinc-600 pt-2">
            <Link href="/sheet" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
              <ArrowLeft size={11} /> Back to sheet
            </Link>
            <span className="flex items-center gap-1">
              <Trophy size={11} className="text-orange-400" />
              Complete it to mark as done in the sheet
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Minimal markdown → HTML converter (headings, bold, italic, lists, code blocks)
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-zinc-800 rounded-lg p-3 text-xs overflow-x-auto my-3"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-orange-300 text-xs">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-zinc-100 mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-extrabold text-zinc-100 mt-6 mb-2 border-b border-zinc-800 pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-extrabold text-zinc-100 mt-6 mb-3">$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-zinc-300">$1</em>')
    .replace(/^---$/gm, '<hr class="border-zinc-800 my-4" />')
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-1.5 text-zinc-300 mb-1"><span class="text-orange-400 mt-1 flex-shrink-0">•</span><span>$1</span></li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="space-y-0.5 my-2">$&</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="text-zinc-300 mb-1 ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/^(?!<[huplcibd])/gm, (m) => m)
}
