'use client'

import { useState } from 'react'
import {
  FileText, Sparkles, Copy, Check, CheckCircle2, XCircle,
  AlertCircle, Zap, Download, Share2, ArrowRight, Target,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { EmailGateInline, isCaptured } from '@/components/shared/EmailGateModal'

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

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800/80 transition-colors"
    >
      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> {label}</>}
    </button>
  )
}

function gradeColor(grade: string) {
  if (grade === 'A') return { text: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', bar: 'bg-green-500' }
  if (grade === 'B') return { text: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/30',  bar: 'bg-blue-500'  }
  if (grade === 'C') return { text: 'text-yellow-400',bg: 'bg-yellow-500/10 border-yellow-500/30',bar: 'bg-yellow-500'}
  return { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', bar: 'bg-red-500' }
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400 font-medium">{label}</span>
        <span className="text-zinc-300 font-semibold">{value}/100</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function CoverLetterReviewer() {
  const [coverLetter,    setCoverLetter]    = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [targetRole,     setTargetRole]     = useState('')
  const [result,         setResult]         = useState<ReviewResult | null>(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [tab,            setTab]            = useState<'feedback' | 'rewrite'>('feedback')
  const [unlocked,       setUnlocked]       = useState(false)

  const canSeeDetails = unlocked || isCaptured()

  async function handleReview() {
    if (!coverLetter.trim()) { setError('Please paste your cover letter.'); return }
    if (!jobDescription.trim()) { setError('Please paste the job description.'); return }
    setError(''); setLoading(true); setResult(null)
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

  function downloadImproved() {
    if (!result) return
    const blob = new Blob([result.improvedVersion], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${targetRole ? targetRole.replace(/[^a-z0-9]+/gi, '_') : 'Cover_Letter'}_Improved.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clr = result ? gradeColor(result.grade) : null

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <FileText className="w-3.5 h-3.5" /> Cover Letter Reviewer
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Will Your Cover Letter Get You an Interview?
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            AI scores your letter against the JD, shows exactly what to fix, and rewrites it for maximum impact.
          </p>
          <div className="flex items-center justify-center gap-5 mt-5 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-purple-500" /> ATS keyword check</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-500" /> Instant feedback</span>
            <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-green-500" /> Full AI rewrite</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Input ── */}
          <div className="flex flex-col gap-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-base font-bold text-zinc-100">Your Cover Letter + Job Description</h2>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Target Role (optional)</label>
                <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. ML Engineer at Google"
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Job Description</label>
                  <span className="text-xs text-zinc-600">{jobDescription.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here — the more detail, the better the feedback…"
                  rows={6}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Your Cover Letter</label>
                  <span className="text-xs text-zinc-600">{coverLetter.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Paste your cover letter here…"
                  rows={11}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <button onClick={handleReview} disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Reviewing your cover letter…</>
                  : <><Sparkles className="w-4 h-4" /> Review My Cover Letter</>
                }
              </button>
            </div>

            {/* CTA links */}
            {!result && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-600 text-center">Also useful:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { href: '/resume', label: 'Resume Analyzer' },
                    { href: '/resume', label: 'Build ATS Resume' },
                  ].map(l => (
                    <Link key={l.href} href={l.href}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 transition-colors"
                    >
                      {l.label} <ArrowRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Output ── */}
          <div className="flex flex-col gap-5">
            {!result && !loading && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <FileText className="w-12 h-12 text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-sm font-medium">Your review will appear here</p>
                <p className="text-zinc-600 text-xs mt-1.5 max-w-xs">Paste your cover letter and job description on the left, then hit review.</p>
              </div>
            )}

            {loading && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
                <span className="w-10 h-10 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin mb-4" />
                <p className="text-zinc-300 text-sm font-medium">Analyzing your cover letter…</p>
                <p className="text-zinc-600 text-xs mt-1.5">Checking tone, keywords, structure & match</p>
              </div>
            )}

            {result && clr && (
              <>
                {/* ── Score + Grade ── */}
                <div className={`rounded-2xl p-6 border ${clr.bg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-0.5">Overall Score</p>
                      <p className="text-3xl font-black text-zinc-100">{result.overallScore}<span className="text-lg text-zinc-500">/100</span></p>
                    </div>
                    <div className={`text-4xl font-black px-5 py-3 rounded-2xl border-2 ${clr.bg} ${clr.text}`}>
                      {result.grade}
                    </div>
                  </div>
                  <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all duration-700 ${clr.bar}`} style={{ width: `${result.overallScore}%` }} />
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.summary}</p>
                </div>

                {/* ── Score breakdown ── */}
                {canSeeDetails && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Score Breakdown</p>
                    <ScoreBar label="Keyword Match"    value={Math.round(result.overallScore * (result.missingKeywords.length > 5 ? 0.65 : result.missingKeywords.length > 2 ? 0.80 : 0.95))} color={clr.bar} />
                    <ScoreBar label="Tone & Voice"     value={result.toneAnalysis.label.includes('Professional') ? 88 : 65} color={clr.bar} />
                    <ScoreBar label="Length & Format"  value={result.lengthAnalysis.verdict === 'Good Length' ? 92 : 60} color={clr.bar} />
                    <ScoreBar label="Strengths shown"  value={Math.min(95, Math.round(result.overallScore * 1.05))} color={clr.bar} />
                  </div>
                )}

                {/* Email gate */}
                {!canSeeDetails && (
                  <EmailGateInline
                    onSuccess={() => setUnlocked(true)}
                    source="cover_letter_reviewer"
                    title="Unlock Your Full Review"
                    subtitle="See quick fixes, detailed feedback, missing keywords, and the AI-rewritten version."
                    benefit="Unlock feedback + AI rewrite"
                    emoji="📄"
                  />
                )}

                {/* Tabs */}
                {canSeeDetails && (
                  <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
                    {(['feedback', 'rewrite'] as const).map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${
                          tab === t ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >{t === 'feedback' ? 'Feedback' : 'AI Rewrite'}</button>
                    ))}
                  </div>
                )}

                {/* Feedback tab */}
                {canSeeDetails && tab === 'feedback' && (
                  <>
                    {/* Quick Fixes */}
                    <div className="bg-zinc-900 border border-yellow-500/20 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold text-zinc-100">Quick Fixes</span>
                        <span className="text-xs text-zinc-500 ml-auto">Do these first</span>
                      </div>
                      <ul className="flex flex-col gap-2.5">
                        {result.quickFixes.map((fix, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300 bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-4 py-3">
                            <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <span className="leading-relaxed">{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Strengths + Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-zinc-900 border border-green-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">What Works</span>
                        </div>
                        <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                          {result.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Needs Work</span>
                        </div>
                        <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                          {result.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    {result.missingKeywords.length > 0 && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                          Missing Keywords from JD ({result.missingKeywords.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.missingKeywords.map((kw) => (
                            <span key={kw} className="text-xs font-semibold px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{kw}</span>
                          ))}
                        </div>
                        <p className="text-xs text-zinc-600 mt-3">Add these keywords naturally in your rewrite — the AI rewrite does this automatically.</p>
                      </div>
                    )}

                    {/* Tone + Length */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Tone</p>
                        <p className="text-sm font-bold text-zinc-200">{result.toneAnalysis.label}</p>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{result.toneAnalysis.suggestion}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Length</p>
                        <p className="text-sm font-bold text-zinc-200">{result.lengthAnalysis.verdict}</p>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{result.lengthAnalysis.suggestion}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Rewrite tab */}
                {canSeeDetails && tab === 'rewrite' && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">AI-Optimised Rewrite</p>
                        <p className="text-xs text-zinc-600 mt-0.5">Keywords added, tone fixed, ATS-optimised</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CopyBtn text={result.improvedVersion} label="Copy" />
                        <button onClick={downloadImproved}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800/80 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> .txt
                        </button>
                      </div>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 max-h-96 overflow-y-auto">
                      <p className="text-sm text-zinc-300 leading-[1.8] whitespace-pre-line">{result.improvedVersion}</p>
                    </div>
                  </div>
                )}

                {/* Share */}
                {canSeeDetails && (
                  <div className="flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Share2 className="w-4 h-4 text-zinc-500 shrink-0" />
                      <p className="text-xs text-zinc-500">Help a friend — share this free tool</p>
                    </div>
                    <CopyBtn text="Free cover letter review + AI rewrite: https://amanailab.com/cover-letter-review" label="Copy Link" />
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
