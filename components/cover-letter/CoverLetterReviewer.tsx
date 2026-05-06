'use client'

import { useState } from 'react'
import { FileText, Sparkles, Copy, Check, CheckCircle2, XCircle, AlertCircle, Zap } from 'lucide-react'

interface ReviewResult {
  overallScore: number
  grade: string
  summary: string
  strengths: string[]
  weaknesses: string[]
  missingKeywords: string[]
  toneAnalysis: { label: string; suggestion: string }
  lengthAnalysis: { verdict: string; suggestion: string }
  improvedVersion: string
  quickFixes: string[]
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600"
    >
      {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  )
}

function gradeColor(grade: string) {
  if (grade === 'A') return 'text-green-400 bg-green-500/10 border-green-500/20'
  if (grade === 'B') return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  if (grade === 'C') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
  return 'text-red-400 bg-red-500/10 border-red-500/20'
}

function scoreBar(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function CoverLetterReviewer() {
  const [coverLetter, setCoverLetter] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'feedback' | 'rewrite'>('feedback')

  async function handleReview() {
    if (!coverLetter.trim()) { setError('Please paste your cover letter.'); return }
    if (!jobDescription.trim()) { setError('Please paste the job description.'); return }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/cover-letter/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter, jobDescription, targetRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to review.')
      setResult(data)
      setTab('feedback')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <FileText className="w-3.5 h-3.5" />
            Cover Letter Reviewer
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Does Your Cover Letter Get Interviews?
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            AI scores your cover letter against the job description and rewrites it for maximum impact.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="flex flex-col gap-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-base font-bold text-zinc-100">Your Cover Letter + JD</h2>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Target Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. ML Engineer at Google"
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={6}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Your Cover Letter</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Paste your cover letter here..."
                  rows={10}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <button
                onClick={handleReview}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Reviewing…</>
                  : <><Sparkles className="w-4 h-4" /> Review My Cover Letter</>
                }
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-5">
            {!result && !loading && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <FileText className="w-12 h-12 text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-sm">Your cover letter review will appear here</p>
              </div>
            )}

            {loading && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
                <span className="w-8 h-8 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 text-sm">Analyzing your cover letter…</p>
              </div>
            )}

            {result && (
              <>
                {/* Score + Grade */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Overall Score</p>
                      <div className="w-48 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBar(result.overallScore)}`} style={{ width: `${result.overallScore}%` }} />
                      </div>
                    </div>
                    <div className={`text-3xl font-extrabold px-4 py-2 rounded-xl border ${gradeColor(result.grade)}`}>
                      {result.grade}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mt-3">{result.summary}</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 gap-4">
                  <button onClick={() => setTab('feedback')} className={`pb-2 text-sm font-semibold transition-colors ${tab === 'feedback' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-zinc-500 hover:text-zinc-300'}`}>Feedback</button>
                  <button onClick={() => setTab('rewrite')} className={`pb-2 text-sm font-semibold transition-colors ${tab === 'rewrite' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-zinc-500 hover:text-zinc-300'}`}>AI Rewrite</button>
                </div>

                {tab === 'feedback' && (
                  <>
                    {/* Quick Fixes */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-yellow-400" /><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Quick Fixes</span></div>
                      <ul className="flex flex-col gap-2">
                        {result.quickFixes.map((fix, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300"><span className="text-yellow-400 shrink-0">→</span>{fix}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Strengths */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Strengths</span></div>
                      <ul className="flex flex-col gap-2">
                        {result.strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />{s}</li>)}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3"><XCircle className="w-4 h-4 text-red-400" /><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Needs Improvement</span></div>
                      <ul className="flex flex-col gap-2">
                        {result.weaknesses.map((w, i) => <li key={i} className="flex items-start gap-2 text-sm text-zinc-300"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />{w}</li>)}
                      </ul>
                    </div>

                    {/* Missing Keywords */}
                    {result.missingKeywords.length > 0 && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Missing Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {result.missingKeywords.map((kw) => (
                            <span key={kw} className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tone + Length */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Tone: <span className="text-zinc-300 normal-case font-normal">{result.toneAnalysis.label}</span></p>
                        <p className="text-xs text-zinc-500">{result.toneAnalysis.suggestion}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Length: <span className="text-zinc-300 normal-case font-normal">{result.lengthAnalysis.verdict}</span></p>
                        <p className="text-xs text-zinc-500">{result.lengthAnalysis.suggestion}</p>
                      </div>
                    </div>
                  </>
                )}

                {tab === 'rewrite' && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">AI-Optimized Version</span>
                      <CopyButton text={result.improvedVersion} />
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{result.improvedVersion}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
