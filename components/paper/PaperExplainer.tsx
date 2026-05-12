'use client'

import { useState } from 'react'
import {
  Sparkles, AlertCircle, Copy, Check, BookOpen,
  Lightbulb, Zap, Target, AlertTriangle, Brain,
  ExternalLink, ChevronDown, ChevronUp, Download, Share2,
} from 'lucide-react'
import { isCaptured, saveEmail, markCaptured } from '@/lib/email-capture'
import { Mail } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeyContribution { point: string; detail: string }
interface KeyTerm         { term: string; definition: string }

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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600 transition-colors"
    >
      {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
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
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}>{level}</span>
  )
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-orange-400">{icon}</span>
          <span className="text-sm font-semibold text-zinc-100">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ─── Email field ──────────────────────────────────────────────────────────────

function EmailField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  if (isCaptured()) return null
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5 text-orange-400" />
        Your Email <span className="text-orange-400">*</span>
        <span className="normal-case font-normal text-zinc-500 ml-1">— get paper summaries weekly</span>
      </label>
      <input type="email" value={value} onChange={e => onChange(e.target.value)}
        placeholder="your@email.com"
        className="w-full bg-zinc-800 border border-orange-500/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
      />
      <p className="text-xs text-zinc-600">No spam. Unsubscribe anytime.</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaperExplainer() {
  const [input, setInput]   = useState('')
  const [email, setEmail]   = useState('')
  const [result, setResult] = useState<PaperResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [activeTab, setActiveTab] = useState<'simple' | 'deep' | 'apply'>('simple')

  async function explain() {
    if (!input.trim()) { setError('Please paste an arXiv URL or paper abstract.'); return }

    // Email gate
    if (!isCaptured()) {
      if (!email.trim()) { setError('Please enter your email to use this tool.'); return }
      try {
        await saveEmail(email.trim(), 'news_page')
        markCaptured()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Invalid email.')
        return
      }
    }

    setError(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/paper/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to explain.')
      setResult(data)
      setActiveTab('simple')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

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
      `TWEET SUMMARY: ${r.tweetSummary}`,
      '',
      '---',
      'Generated by AmanAI Lab Paper Explainer — amanailab.com/paper-explainer',
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

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <BookOpen className="w-3.5 h-3.5" /> AI Paper Explainer
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Understand Any AI Research Paper
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Paste an arXiv URL or abstract — get a clear, jargon-free explanation in seconds. No PhD required.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {/* Input */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">arXiv URL or Paper Abstract</label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Paste either:\n• arXiv URL: https://arxiv.org/abs/2303.08774\n• arXiv ID: 2303.08774\n• Or paste the paper abstract / text directly`}
              rows={5}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
            />
          </div>

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
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Explaining Paper…</>
              : <><Sparkles className="w-4 h-4" /> Explain This Paper</>
            }
          </button>

          {/* Example papers */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-zinc-600">Try:</span>
            {[
              { label: 'Attention Is All You Need', id: '1706.03762' },
              { label: 'GPT-4 Report',              id: '2303.08774' },
              { label: 'LLaMA 3',                   id: '2407.21783' },
              { label: 'RAG',                        id: '2005.11401' },
              { label: 'LoRA',                       id: '2106.09685' },
              { label: 'RLHF (InstructGPT)',         id: '2203.02155' },
            ].map(p => (
              <button key={p.id} onClick={() => setInput(`https://arxiv.org/abs/${p.id}`)}
                className="text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-14 h-14">
              <span className="absolute inset-0 border-2 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
              <BookOpen className="absolute inset-0 m-auto w-6 h-6 text-violet-400" />
            </div>
            <p className="text-zinc-300 text-sm font-medium">Reading and analyzing the paper…</p>
            <p className="text-zinc-600 text-xs max-w-xs text-center">Fetching from arXiv, extracting key insights, writing explanations at every level. This takes ~15 seconds.</p>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-5">
            {/* Paper metadata card */}
            <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div className="flex-1">
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
                      className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> arXiv
                    </a>
                  )}
                </div>
              </div>

              {/* One-liner */}
              <p className="text-sm font-medium text-zinc-200 italic mb-2">"{result.oneLiner}"</p>

              {/* Importance */}
              <p className="text-xs text-zinc-500 mb-3">{result.importanceReason}</p>

              {/* Export row */}
              <div className="flex items-center gap-2 pt-3 border-t border-violet-500/20">
                <span className="text-xs text-zinc-600 mr-auto">Save this explanation:</span>
                <CopyButton text={buildNotes(result)} />
                <button onClick={() => downloadNotes(result)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> .txt
                </button>
                <button onClick={() => navigator.clipboard.writeText(`📄 ${result.originalTitle || result.inferredTitle}\n\n${result.tweetSummary}\n\n🔗 https://amanailab.com/paper-explainer`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>

            {/* Tweet summary */}
            <div className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
              <span className="text-sky-400 shrink-0 text-xs font-bold mt-0.5">𝕏</span>
              <p className="text-sm text-zinc-300 flex-1 leading-relaxed">{result.tweetSummary}</p>
              <CopyButton text={result.tweetSummary} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
              {([
                { id: 'simple', label: 'Simple Explanation' },
                { id: 'deep',   label: 'How It Works'       },
                { id: 'apply',  label: 'Real-World Use'     },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >{tab.label}</button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'simple' && (
              <div className="flex flex-col gap-4">
                <Section title="Simple Explanation" icon={<Lightbulb className="w-4 h-4" />}>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.simpleExplanation}</p>
                </Section>
                <Section title="Problem It Solves" icon={<Target className="w-4 h-4" />}>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.problemSolved}</p>
                </Section>
                {result.keyTerms?.length > 0 && (
                  <Section title="Key Terms Explained" icon={<Brain className="w-4 h-4" />} defaultOpen={true}>
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
              </div>
            )}

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

                {/* Share tweet */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Share This Paper</p>
                    <CopyButton text={result.tweetSummary} />
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.tweetSummary}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
