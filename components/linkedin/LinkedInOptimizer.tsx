'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles, Copy, Check, TrendingUp, AlertCircle, CheckCircle2,
  Lightbulb, Upload, FileText, X, ChevronDown, ChevronUp,
  Briefcase, Zap, Search,
} from 'lucide-react'
import { EmailGateInline, isCaptured } from '@/components/shared/EmailGateModal'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ExperienceRewrite {
  role: string
  company: string
  bullets: string[]
}

interface ProfileCompleteness {
  score: number
  missing: string[]
}

interface OptimizeResult {
  optimizedHeadline: string
  optimizedAbout: string
  keywordsAdded: string[]
  improvements: string[]
  profileStrengthScore: number
  profileStrengthLabel: string
  quickTips: string[]
  // PDF-mode extras
  experienceRewrites?: ExperienceRewrite[]
  skillsToAdd?: string[]
  crossSectionKeywords?: string[]
  profileCompleteness?: ProfileCompleteness
  inputMode?: 'manual' | 'pdf'
}

type InputMode = 'manual' | 'pdf'

// ─── Constants ─────────────────────────────────────────────────────────────────

const LOADING_STEPS_MANUAL = [
  { label: 'Analyzing your profile',     sub: 'Reading headline and About…'          },
  { label: 'Identifying keyword gaps',   sub: 'Comparing to AI/ML role requirements…'},
  { label: 'Rewriting sections',         sub: 'Crafting optimized copy…'             },
]

const LOADING_STEPS_PDF = [
  { label: 'Reading your PDF',           sub: 'Extracting profile sections…'         },
  { label: 'Mapping your career',        sub: 'Parsing experience, skills, About…'   },
  { label: 'Full-profile analysis',      sub: 'Identifying gaps across all sections…'},
  { label: 'Rewriting everything',       sub: 'Headline, About, experience bullets…' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function strengthColor(s: number) {
  if (s >= 80) return 'text-green-400'
  if (s >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

function strengthBar(s: number) {
  if (s >= 80) return 'bg-green-500'
  if (s >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(text) } catch {
      const ta = document.createElement('textarea'); ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta)
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600">
      {copied ? <><Check className="w-3 h-3 text-green-400" /> {label ? 'Copied' : 'Copied'}</> : <><Copy className="w-3 h-3" /> {label ?? 'Copy'}</>}
    </button>
  )
}

function ExperienceCard({ exp, index }: { exp: ExperienceRewrite; index: number }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors">
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{exp.role}</p>
          <p className="text-xs text-zinc-500 truncate">{exp.company}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mt-3 mb-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Rewritten bullets</p>
            <CopyButton text={exp.bullets.join('\n')} label="Copy all" />
          </div>
          <ul className="flex flex-col gap-2">
            {exp.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 group">
                <span className="text-blue-400 shrink-0 mt-0.5 font-bold">•</span>
                <span className="flex-1 leading-relaxed">{b}</span>
                <button onClick={() => navigator.clipboard.writeText(b)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                  <Copy className="w-3 h-3 text-zinc-600 hover:text-zinc-300" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function LinkedInOptimizer() {
  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>('manual')
  const [pdfFile, setPdfFile]     = useState<File | null>(null)
  const [dragging, setDragging]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Manual fields
  const [headline,   setHeadline]   = useState('')
  const [about,      setAbout]      = useState('')
  const [experience, setExperience] = useState('')
  const [targetRole, setTargetRole] = useState('')

  // Result / loading
  const [result,      setResult]      = useState<OptimizeResult | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error,       setError]       = useState('')
  const [unlocked,    setUnlocked]    = useState(false)

  const canSeeDetails = unlocked || isCaptured()

  // Loading step animation
  const steps = inputMode === 'pdf' ? LOADING_STEPS_PDF : LOADING_STEPS_MANUAL
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return }
    const id = setInterval(() => setLoadingStep(s => Math.min(s + 1, steps.length - 1)), 3500)
    return () => clearInterval(id)
  }, [loading, steps.length])

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleOptimize() {
    if (inputMode === 'pdf' && !pdfFile) {
      setError('Please upload your LinkedIn profile PDF.'); return
    }
    if (inputMode === 'manual' && !headline.trim() && !about.trim()) {
      setError('Please fill in at least your headline or About section.'); return
    }
    setError(''); setLoading(true); setResult(null)

    try {
      let res: Response
      if (inputMode === 'pdf' && pdfFile) {
        const fd = new FormData()
        fd.append('pdf', pdfFile)
        fd.append('targetRole', targetRole)
        res = await fetch('/api/linkedin/optimize', { method: 'POST', body: fd })
      } else {
        res = await fetch('/api/linkedin/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ headline, about, experience, targetRole }),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to optimize.')
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ── PDF drop ────────────────────────────────────────────────────────────────

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') setPdfFile(file)
    else setError('Please drop a PDF file.')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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
            Free LinkedIn Profile Optimizer for AI/ML Engineers
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Upload your LinkedIn PDF or paste your sections — AI rewrites your full profile with the right keywords for AI/ML roles.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5 text-xs text-zinc-500">
            {['PDF Upload (full profile)', 'Headline + About rewrite', 'Experience bullet rewrites', 'Skills gap analysis', 'Cross-section keywords'].map(f => (
              <span key={f} className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3 text-blue-400 shrink-0" /> {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Input panel ── */}
          <div className="flex flex-col gap-5">

            {/* Mode tabs */}
            <div className="flex gap-1 bg-zinc-800/60 rounded-xl p-1 w-fit">
              <button onClick={() => { setInputMode('manual'); setPdfFile(null) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  inputMode === 'manual' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                <FileText className="w-3.5 h-3.5" /> Manual Input
              </button>
              <button onClick={() => setInputMode('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  inputMode === 'pdf' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                <Upload className="w-3.5 h-3.5" /> Upload PDF
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">

              {/* PDF mode */}
              {inputMode === 'pdf' ? (
                <>
                  {/* How to export instruction */}
                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-blue-400 mb-1">How to export your LinkedIn PDF</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      LinkedIn → <strong className="text-zinc-300">Me</strong> → View Profile → <strong className="text-zinc-300">More</strong> → Save to PDF
                    </p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragging
                        ? 'border-blue-500 bg-blue-500/10'
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
                          <p className="text-xs text-zinc-500">{(pdfFile.size / 1024).toFixed(0)} KB · LinkedIn PDF</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setPdfFile(null) }}
                          className="ml-2 p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          aria-label="Remove file">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-zinc-300 mb-1">Drop your LinkedIn PDF here</p>
                        <p className="text-xs text-zinc-500">or click to browse · PDF only</p>
                      </>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setPdfFile(f) }} />

                  {/* Target role (still useful for PDF mode) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                      Target Role <span className="text-zinc-600 normal-case font-normal">(optional but recommended)</span>
                    </label>
                    <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)}
                      placeholder="e.g. ML Engineer at a Series B startup"
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
                  </div>
                </>
              ) : (
                /* Manual mode — existing fields */
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                        Headline <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                      </label>
                      <span className={`text-xs font-mono ${
                        headline.length > 200 ? 'text-red-400' : headline.length > 150 ? 'text-yellow-400' : 'text-zinc-500'
                      }`}>{headline.length}/220</span>
                    </div>
                    <input type="text" value={headline} onChange={e => setHeadline(e.target.value)}
                      placeholder="e.g. AI Engineer | LLMs | RAG | Python" maxLength={220}
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                        About / Summary
                      </label>
                      <span className={`text-xs font-mono ${
                        about.length > 2400 ? 'text-red-400' : about.length > 2000 ? 'text-yellow-400' : 'text-zinc-500'
                      }`}>{about.length}/2600</span>
                    </div>
                    <textarea value={about} onChange={e => setAbout(e.target.value)}
                      placeholder="Paste your current LinkedIn About section here..." rows={7} maxLength={2600}
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                      Experience Highlights <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                    </label>
                    <textarea value={experience} onChange={e => setExperience(e.target.value)}
                      placeholder="Key roles, achievements, projects…" rows={4}
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                      Target Role <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                    </label>
                    <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)}
                      placeholder="e.g. ML Engineer at a startup"
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <button onClick={handleOptimize} disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Optimizing…</>
                  : <><Sparkles className="w-4 h-4" /> {inputMode === 'pdf' ? 'Analyze Full Profile' : 'Optimize My Profile'}</>}
              </button>
            </div>
          </div>

          {/* ── Output panel ── */}
          <div className="flex flex-col gap-5">

            {/* Empty state */}
            {!result && !loading && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px] gap-3">
                <Sparkles className="w-12 h-12 text-zinc-700 mb-1" />
                <p className="text-zinc-400 font-semibold text-sm">Your optimized profile will appear here</p>
                {inputMode === 'pdf' && (
                  <p className="text-xs text-zinc-600 max-w-xs">With PDF mode you get experience bullet rewrites, skills gap analysis, and cross-section keyword checks</p>
                )}
              </div>
            )}

            {/* Loading with steps */}
            {loading && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] gap-6">
                <div className="relative w-14 h-14">
                  <span className="absolute inset-0 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-400" />
                </div>
                <div className="w-full max-w-xs flex flex-col gap-2">
                  {steps.map((step, i) => (
                    <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${
                      i < loadingStep ? 'opacity-40' : i === loadingStep ? 'opacity-100' : 'opacity-20'
                    }`}>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        i < loadingStep ? 'bg-blue-600 border-blue-600'
                        : i === loadingStep ? 'border-blue-500 bg-blue-500/20'
                        : 'border-zinc-700 bg-zinc-900'
                      }`}>
                        {i < loadingStep
                          ? <Check className="w-3 h-3 text-white" />
                          : i === loadingStep
                            ? <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            : <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${i === loadingStep ? 'text-zinc-100' : 'text-zinc-500'}`}>{step.label}</p>
                        {i === loadingStep && <p className="text-xs text-zinc-600">{step.sub}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <>
                {/* Profile Strength */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Profile Strength</span>
                    <div className="flex items-center gap-2">
                      {result.inputMode === 'pdf' && (
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Full Profile</span>
                      )}
                      <span className={`text-2xl font-extrabold ${strengthColor(result.profileStrengthScore)}`}>
                        {result.profileStrengthScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all duration-700 ${strengthBar(result.profileStrengthScore)}`}
                      style={{ width: `${result.profileStrengthScore}%` }} />
                  </div>
                  <span className={`text-xs font-semibold ${strengthColor(result.profileStrengthScore)}`}>
                    {result.profileStrengthLabel}
                  </span>

                  {/* Profile completeness (PDF mode) */}
                  {result.profileCompleteness && result.profileCompleteness.missing.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Missing from your profile</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.profileCompleteness.missing.map(m => (
                          <span key={m} className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                            + {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Email gate */}
                {!canSeeDetails && (
                  <EmailGateInline
                    onSuccess={() => setUnlocked(true)}
                    source="linkedin_optimizer"
                    title="Unlock Your Optimized Profile"
                    subtitle="Enter your email to see your AI-rewritten headline, About section, experience bullets, and keyword analysis."
                    benefit="Unlock full optimization results"
                    emoji="💼"
                  />
                )}

                {canSeeDetails && (
                  <>
                    {/* Optimized Headline */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Optimized Headline</span>
                        <CopyButton text={result.optimizedHeadline} />
                      </div>
                      <p className="text-sm text-zinc-100 font-medium leading-relaxed">{result.optimizedHeadline}</p>
                    </div>

                    {/* Optimized About */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Optimized About Section</span>
                        <CopyButton text={result.optimizedAbout} />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{result.optimizedAbout}</p>
                      </div>
                    </div>

                    {/* Experience Rewrites (PDF mode) */}
                    {result.experienceRewrites && result.experienceRewrites.length > 0 && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Briefcase className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Experience Bullet Rewrites</span>
                          <span className="text-[10px] text-zinc-600 ml-auto">{result.experienceRewrites.length} roles</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {result.experienceRewrites.map((exp, i) => (
                            <ExperienceCard key={i} exp={exp} index={i} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keywords Added */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Keywords Added / Strengthened</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.keywordsAdded.map(kw => (
                          <span key={kw} className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{kw}</span>
                        ))}
                      </div>
                    </div>

                    {/* Skills to Add (PDF mode) */}
                    {result.skillsToAdd && result.skillsToAdd.length > 0 && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Skills to Add to Your Profile</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.skillsToAdd.map(s => (
                            <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">+ {s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cross-section keywords (PDF mode) */}
                    {result.crossSectionKeywords && result.crossSectionKeywords.length > 0 && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Search className="w-4 h-4 text-violet-400" />
                          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Missing from Headline / About</span>
                        </div>
                        <p className="text-xs text-zinc-500 mb-3">These keywords appear in your experience but are absent from your headline and About — recruiters search for them.</p>
                        <div className="flex flex-wrap gap-2">
                          {result.crossSectionKeywords.map(k => (
                            <span key={k} className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Changes Made */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Changes Made</span>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {result.improvements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <span className="text-blue-400 shrink-0 mt-0.5">→</span>{imp}
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
                            <span className="text-yellow-400 shrink-0">•</span>{tip}
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
