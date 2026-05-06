'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, TrendingUp, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react'
import { EmailGateInline, isCaptured } from '@/components/shared/EmailGateModal'

interface OptimizeResult {
  optimizedHeadline: string
  optimizedAbout: string
  keywordsAdded: string[]
  improvements: string[]
  profileStrengthScore: number
  profileStrengthLabel: string
  quickTips: string[]
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600"
    >
      {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  )
}

function strengthColor(score: number) {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

function strengthBar(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function LinkedInOptimizer() {
  const [headline, setHeadline] = useState('')
  const [about, setAbout] = useState('')
  const [experience, setExperience] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  const canSeeDetails = unlocked || isCaptured()

  async function handleOptimize() {
    if (!headline.trim() && !about.trim()) {
      setError('Please fill in at least your headline or About section.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/linkedin/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, about, experience, targetRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to optimize.')
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            LinkedIn Profile Optimizer
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Get Noticed by Recruiters
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Paste your LinkedIn sections and AI rewrites them with the right keywords, tone, and structure for AI/ML roles.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="flex flex-col gap-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-base font-bold text-zinc-100">Your Profile Sections</h2>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Headline <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. AI Engineer | LLMs | RAG | Python"
                  maxLength={220}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                />
                <p className="text-xs text-zinc-600 text-right">{headline.length}/220</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  About / Summary <span className="text-zinc-600 normal-case font-normal">(paste your current About)</span>
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Paste your current LinkedIn About section here..."
                  rows={7}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Experience Highlights <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Key roles, achievements, projects..."
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Target Role <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. ML Engineer at a startup"
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                onClick={handleOptimize}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Optimizing Profile…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Optimize My Profile</>
                )}
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-5">
            {!result && !loading && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <Sparkles className="w-12 h-12 text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-sm">Your optimized profile will appear here</p>
              </div>
            )}

            {loading && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
                <span className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 text-sm">Analyzing and rewriting your profile…</p>
              </div>
            )}

            {result && (
              <>
                {/* Strength Score */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Profile Strength</span>
                    <span className={`text-2xl font-extrabold ${strengthColor(result.profileStrengthScore)}`}>
                      {result.profileStrengthScore}/100
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${strengthBar(result.profileStrengthScore)}`}
                      style={{ width: `${result.profileStrengthScore}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${strengthColor(result.profileStrengthScore)}`}>
                    {result.profileStrengthLabel}
                  </span>
                </div>

                {!canSeeDetails && (
                  <EmailGateInline
                    onSuccess={() => setUnlocked(true)}
                    source="linkedin_optimizer"
                    title="Unlock Your Optimized Profile"
                    subtitle="Enter your email to get your AI-rewritten headline, About section, keywords added, and tips."
                    benefit="Unlock optimized headline + About section"
                    emoji="💼"
                  />
                )}

                {/* Optimized Headline */}
                {canSeeDetails && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Optimized Headline</span>
                    <CopyButton text={result.optimizedHeadline} />
                  </div>
                  <p className="text-sm text-zinc-100 font-medium">{result.optimizedHeadline}</p>
                </div>
                )}

                {canSeeDetails && (
                <>
                {/* Optimized About */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Optimized About Section</span>
                    <CopyButton text={result.optimizedAbout} />
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{result.optimizedAbout}</p>
                </div>

                {/* Keywords Added */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Keywords Added</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.keywordsAdded.map((kw) => (
                      <span key={kw} className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Changes Made</span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {result.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                        <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quick Tips */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Quick Tips</span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {result.quickTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                        <span className="text-yellow-400 shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
