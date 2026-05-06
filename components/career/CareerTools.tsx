'use client'

import { useState } from 'react'
import { Map, CalendarDays, FileText, Building2, Sparkles, AlertCircle, CheckCircle2, XCircle, Lightbulb, Clock, Target, BookOpen, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { EmailGateInline, isCaptured } from '@/components/shared/EmailGateModal'

type Tab = 'roadmap' | 'study-plan' | 'offer' | 'company'

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600 transition-colors"
    >
      {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  )
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-sm font-semibold text-zinc-100">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-12 h-12">
        <span className="absolute inset-0 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
        <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-orange-400" />
      </div>
      <p className="text-zinc-500 text-sm">{label}</p>
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{msg}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// TAB 1 — CAREER ROADMAP
// ════════════════════════════════════════════════════════════════

interface RoadmapPhase {
  phase: number; title: string; duration: string; goal: string
  topics: string[]; resources: string[]; milestone: string; projects: string[]
}
interface RoadmapResult {
  totalDuration: string; overview: string; phases: RoadmapPhase[]
  keySkills: string[]; jobReadySignals: string[]; tips: string[]
}

function RoadmapTab() {
  const [targetRole, setTargetRole] = useState('')
  const [currentSkills, setCurrentSkills] = useState('')
  const [currentLevel, setCurrentLevel] = useState('Beginner')
  const [timePerWeek, setTimePerWeek] = useState('10')
  const [result, setResult] = useState<RoadmapResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  const canSee = unlocked || isCaptured()

  async function generate() {
    if (!targetRole.trim()) { setError('Please enter your target role.'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/career/roadmap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, currentSkills, currentLevel, timePerWeek }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate.')
      setResult(data)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Input */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-zinc-100">Your Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Target Role *</label>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. ML Engineer, AI Research Scientist, LLM Engineer"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Current Level</label>
            <select value={currentLevel} onChange={e => setCurrentLevel(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors">
              {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Hours Per Week</label>
            <select value={timePerWeek} onChange={e => setTimePerWeek(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors">
              {['5', '10', '15', '20', '30', '40+'].map(h => <option key={h} value={h}>{h} hrs/week</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Current Skills <span className="normal-case font-normal text-zinc-600">(optional)</span></label>
            <textarea value={currentSkills} onChange={e => setCurrentSkills(e.target.value)} rows={2}
              placeholder="e.g. Python, basic ML, some PyTorch..."
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none" />
          </div>
        </div>
        {error && <ErrorState msg={error} />}
        <button onClick={generate} disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
          {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating Roadmap…</> : <><Map className="w-4 h-4" /> Generate My Roadmap</>}
        </button>
      </div>

      {loading && <LoadingState label="Building your personalized roadmap…" />}

      {result && (
        <>
          {/* Overview */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className="text-lg font-bold text-zinc-100">{result.totalDuration} Roadmap</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{result.overview}</p>
          </div>

          {!canSee ? (
            <EmailGateInline onSuccess={() => setUnlocked(true)} source="resume_analyzer"
              title="Unlock Your Full Roadmap" subtitle="Enter your email to see all phases, resources, milestones and projects."
              benefit="Unlock all phases + milestones" emoji="🗺️" />
          ) : (
            <>
              {/* Phases */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Learning Phases</p>
                {result.phases.map((phase) => (
                  <div key={phase.phase} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{phase.phase}</div>
                        <div>
                          <p className="text-sm font-bold text-zinc-100">{phase.title}</p>
                          <p className="text-xs text-zinc-500">{phase.duration}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">{phase.goal}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 mb-1.5">Topics</p>
                        <ul className="flex flex-col gap-1">{phase.topics.map((t, i) => <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5"><span className="text-orange-500 shrink-0">•</span>{t}</li>)}</ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 mb-1.5">Resources</p>
                        <ul className="flex flex-col gap-1">{phase.resources.map((r, i) => <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5"><span className="text-blue-400 shrink-0">→</span>{r}</li>)}</ul>
                      </div>
                    </div>
                    {phase.milestone && (
                      <div className="mt-3 flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                        <Target className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-green-300">{phase.milestone}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Key Skills */}
              <Section title="Key Skills to Master">
                <div className="flex flex-wrap gap-2">
                  {result.keySkills.map(s => <span key={s} className="text-xs font-medium px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">{s}</span>)}
                </div>
              </Section>

              {/* Job Ready Signals */}
              <Section title="You're Job Ready When…">
                <ul className="flex flex-col gap-2">
                  {result.jobReadySignals.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Tips */}
              <Section title="Pro Tips">
                <ul className="flex flex-col gap-2">
                  {result.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />{t}
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// TAB 2 — STUDY PLAN
// ════════════════════════════════════════════════════════════════

interface StudyDay { day: number; date: string; topic: string; tasks: string[]; practice: string; timeEstimate: string }
interface StudyWeek { week: number; focus: string; days: StudyDay[] }
interface StudyPlanResult {
  summary: string; totalDays: number; dailyHours: number
  weeks: StudyWeek[]; priorityTopics: string[]; dailyRoutine: string[]; doNotForget: string[]
}

function StudyPlanTab() {
  const [targetRole, setTargetRole] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [currentLevel, setCurrentLevel] = useState('Mid')
  const [weakTopics, setWeakTopics] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState('2')
  const [result, setResult] = useState<StudyPlanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openWeek, setOpenWeek] = useState(0)
  const [unlocked, setUnlocked] = useState(false)

  const canSee = unlocked || isCaptured()

  async function generate() {
    if (!targetRole.trim() || !interviewDate) { setError('Target role and interview date are required.'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/career/study-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, interviewDate, currentLevel, weakTopics, hoursPerDay }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate.')
      setResult(data); setOpenWeek(0)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  // min date = tomorrow
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-zinc-100">Interview Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Target Role *</label>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. ML Engineer at Google"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Interview Date *</label>
            <input type="date" min={minDateStr} value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Current Level</label>
            <select value={currentLevel} onChange={e => setCurrentLevel(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors">
              {['Fresher', 'Mid', 'Senior'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Hours Per Day</label>
            <select value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors">
              {['1', '2', '3', '4', '5', '6+'].map(h => <option key={h} value={h}>{h} hr{h !== '1' ? 's' : ''}/day</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Weak Topics <span className="normal-case font-normal text-zinc-600">(optional)</span></label>
            <input value={weakTopics} onChange={e => setWeakTopics(e.target.value)} placeholder="e.g. transformers, system design, probability"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
          </div>
        </div>
        {error && <ErrorState msg={error} />}
        <button onClick={generate} disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
          {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating Plan…</> : <><CalendarDays className="w-4 h-4" /> Generate Study Plan</>}
        </button>
      </div>

      {loading && <LoadingState label="Building your day-by-day study plan…" />}

      {result && (
        <>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
            <p className="text-sm text-zinc-300">{result.summary}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-zinc-500">{result.totalDays} days</span>
              <span className="text-xs text-zinc-500">{result.dailyHours} hrs/day</span>
            </div>
          </div>

          {!canSee ? (
            <EmailGateInline onSuccess={() => setUnlocked(true)} source="resume_analyzer"
              title="Unlock Your Full Study Plan" subtitle="Enter your email to see your complete day-by-day schedule."
              benefit="Unlock full schedule + daily routine" emoji="📅" />
          ) : (
            <>
              {/* Priority Topics */}
              <Section title="Priority Topics">
                <div className="flex flex-wrap gap-2">
                  {result.priorityTopics.map(t => <span key={t} className="text-xs font-medium px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{t}</span>)}
                </div>
              </Section>

              {/* Weekly Plan */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Weekly Schedule</p>
                {result.weeks.map((week, wi) => (
                  <div key={week.week} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <button onClick={() => setOpenWeek(openWeek === wi ? -1 : wi)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold">{week.week}</div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">Week {week.week}</p>
                          <p className="text-xs text-zinc-500">{week.focus}</p>
                        </div>
                      </div>
                      {openWeek === wi ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </button>
                    {openWeek === wi && (
                      <div className="px-5 pb-5 flex flex-col gap-2">
                        {week.days.map(day => (
                          <div key={day.day} className="flex gap-3 py-2 border-t border-zinc-800/50 first:border-t-0">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">{day.day}</div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-zinc-200">{day.topic}</p>
                              <ul className="mt-1 flex flex-col gap-0.5">
                                {day.tasks.map((t, i) => <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5"><span className="text-orange-500 shrink-0">•</span>{t}</li>)}
                              </ul>
                              <p className="text-xs text-blue-400 mt-1">Practice: {day.practice}</p>
                            </div>
                            <span className="text-xs text-zinc-600 shrink-0 mt-0.5">{day.timeEstimate}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Daily Routine + Don't Forget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section title="Daily Routine">
                  <ul className="flex flex-col gap-2">
                    {result.dailyRoutine.map((r, i) => <li key={i} className="text-xs text-zinc-300 flex items-start gap-2"><Clock className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />{r}</li>)}
                  </ul>
                </Section>
                <Section title="Don't Forget">
                  <ul className="flex flex-col gap-2">
                    {result.doNotForget.map((r, i) => <li key={i} className="text-xs text-zinc-300 flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />{r}</li>)}
                  </ul>
                </Section>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// TAB 3 — OFFER ANALYZER
// ════════════════════════════════════════════════════════════════

interface OfferResult {
  overallVerdict: string; overallScore: number; summary: string
  compensation: { baseSalary: string; equity: string; bonus: string; benefits: string[]; marketComparison: string; marketNote: string }
  redFlags: string[]; greenFlags: string[]; missingClauses: string[]
  negotiationScript: string; questionsToAsk: string[]
  recommendation: string; recommendationReason: string
}

function OfferTab() {
  const [offerText, setOfferText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [location, setLocation] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [result, setResult] = useState<OfferResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  const canSee = unlocked || isCaptured()

  async function analyze() {
    if (!offerText.trim()) { setError('Please paste your offer letter.'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/career/offer-analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerText, targetRole, location, yearsOfExperience }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to analyze.')
      setResult(data)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  const verdictColor = (v: string) => {
    if (v?.includes('Strong')) return 'text-green-400 bg-green-500/10 border-green-500/20'
    if (v?.includes('Fair')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    if (v?.includes('Below')) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    return 'text-red-400 bg-red-500/10 border-red-500/20'
  }

  const recColor = (r: string) => r === 'Accept' ? 'text-green-400' : r === 'Negotiate' ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-zinc-100">Offer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Role</label>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. ML Engineer"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bangalore, Remote"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Years of Exp.</label>
            <input value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)} placeholder="e.g. 3"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Offer Letter / Key Terms *</label>
          <textarea value={offerText} onChange={e => setOfferText(e.target.value)} rows={8}
            placeholder="Paste your offer letter, compensation details, or key terms here..."
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none" />
        </div>
        {error && <ErrorState msg={error} />}
        <button onClick={analyze} disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
          {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing Offer…</> : <><FileText className="w-4 h-4" /> Analyze My Offer</>}
        </button>
      </div>

      {loading && <LoadingState label="Analyzing your offer letter…" />}

      {result && (
        <>
          {/* Verdict */}
          <div className={`border rounded-2xl p-6 flex items-center justify-between gap-4 ${verdictColor(result.overallVerdict)}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Overall Verdict</p>
              <p className="text-xl font-bold">{result.overallVerdict}</p>
              <p className="text-sm opacity-80 mt-1">{result.summary}</p>
            </div>
            <div className="text-center shrink-0">
              <p className="text-4xl font-extrabold">{result.overallScore}</p>
              <p className="text-xs opacity-60">/100</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-start gap-3">
            <div className={`text-2xl font-extrabold shrink-0 ${recColor(result.recommendation)}`}>{result.recommendation}</div>
            <p className="text-sm text-zinc-300">{result.recommendationReason}</p>
          </div>

          {!canSee ? (
            <EmailGateInline onSuccess={() => setUnlocked(true)} source="cover_letter_reviewer"
              title="Unlock Full Offer Analysis" subtitle="Enter your email to see compensation breakdown, red flags, negotiation script and more."
              benefit="Unlock negotiation script + full breakdown" emoji="📄" />
          ) : (
            <>
              {/* Compensation */}
              <Section title="Compensation Breakdown">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[['Base Salary', result.compensation.baseSalary], ['Equity', result.compensation.equity], ['Bonus', result.compensation.bonus], ['Market', result.compensation.marketComparison]].map(([k, v]) => (
                    <div key={k} className="bg-zinc-800 rounded-xl p-3">
                      <p className="text-xs text-zinc-500 mb-1">{k}</p>
                      <p className="text-sm font-semibold text-zinc-100">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">{result.compensation.marketNote}</p>
                {result.compensation.benefits.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.compensation.benefits.map(b => <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{b}</span>)}
                  </div>
                )}
              </Section>

              {/* Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.greenFlags.length > 0 && (
                  <Section title="Green Flags ✅">
                    <ul className="flex flex-col gap-2">
                      {result.greenFlags.map((f, i) => <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />{f}</li>)}
                    </ul>
                  </Section>
                )}
                {result.redFlags.length > 0 && (
                  <Section title="Red Flags ⚠️">
                    <ul className="flex flex-col gap-2">
                      {result.redFlags.map((f, i) => <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />{f}</li>)}
                    </ul>
                  </Section>
                )}
              </div>

              {/* Missing Clauses */}
              {result.missingClauses.length > 0 && (
                <Section title="Missing Clauses">
                  <ul className="flex flex-col gap-2">
                    {result.missingClauses.map((c, i) => <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />{c}</li>)}
                  </ul>
                </Section>
              )}

              {/* Negotiation Script */}
              <Section title="Negotiation Script">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-zinc-500">Use this word-for-word</p>
                  <CopyButton text={result.negotiationScript} />
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-800 rounded-xl p-4">{result.negotiationScript}</p>
              </Section>

              {/* Questions to Ask */}
              <Section title="Questions to Ask Them">
                <ul className="flex flex-col gap-2">
                  {result.questionsToAsk.map((q, i) => <li key={i} className="flex items-start gap-2 text-sm text-zinc-300"><span className="text-orange-400 shrink-0 font-bold">{i + 1}.</span>{q}</li>)}
                </ul>
              </Section>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// TAB 4 — COMPANY RESEARCH
// ════════════════════════════════════════════════════════════════

interface InterviewRound { round: string; description: string; tips: string }
interface CompanyResult {
  companyOverview: string; aiMlFocus: string; techStack: string[]
  interviewProcess: InterviewRound[]; cultureSignals: string[]
  topicsToStudy: string[]; commonInterviewQuestions: string[]
  questionsToAskThem: string[]; salaryRange: string
  prosAndCons: { pros: string[]; cons: string[] }
  insiderTips: string[]; disclaimer: string
}

function CompanyTab() {
  const [companyName, setCompanyName] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [result, setResult] = useState<CompanyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  const canSee = unlocked || isCaptured()

  async function research() {
    if (!companyName.trim()) { setError('Please enter a company name.'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/career/company-research', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, targetRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to research.')
      setResult(data)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-zinc-100">Company Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Company Name *</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Google, OpenAI, Anthropic, Swiggy"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Target Role <span className="normal-case font-normal text-zinc-600">(optional)</span></label>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. ML Engineer"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
          </div>
        </div>
        {error && <ErrorState msg={error} />}
        <button onClick={research} disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
          {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Researching…</> : <><Building2 className="w-4 h-4" /> Research Company</>}
        </button>
      </div>

      {loading && <LoadingState label={`Researching ${companyName || 'company'}…`} />}

      {result && (
        <>
          {/* Overview */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-5 h-5 text-orange-400" />
              <h3 className="text-base font-bold text-zinc-100">{companyName}</h3>
              {result.salaryRange && <span className="text-xs text-zinc-500 ml-auto">{result.salaryRange}</span>}
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mb-3">{result.companyOverview}</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{result.aiMlFocus}</p>
          </div>

          {/* Tech Stack */}
          <Section title="Tech Stack">
            <div className="flex flex-wrap gap-2">
              {result.techStack.map(t => <span key={t} className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">{t}</span>)}
            </div>
          </Section>

          {!canSee ? (
            <EmailGateInline onSuccess={() => setUnlocked(true)} source="linkedin_optimizer"
              title="Unlock Full Company Intel" subtitle="Enter your email to see the interview process, insider tips, common questions and more."
              benefit="Unlock interview process + insider tips" emoji="🏢" />
          ) : (
            <>
              {/* Interview Process */}
              <Section title="Interview Process">
                <div className="flex flex-col gap-3">
                  {result.interviewProcess.map((round, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{round.round}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{round.description}</p>
                        <p className="text-xs text-orange-300 mt-1">Tip: {round.tips}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Topics + Common Qs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section title="Topics to Study">
                  <ul className="flex flex-col gap-2">
                    {result.topicsToStudy.map((t, i) => <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />{t}</li>)}
                  </ul>
                </Section>
                <Section title="Common Interview Questions">
                  <ul className="flex flex-col gap-2">
                    {result.commonInterviewQuestions.map((q, i) => <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-orange-400 shrink-0 font-bold">{i + 1}.</span>{q}</li>)}
                  </ul>
                </Section>
              </div>

              {/* Culture + Pros/Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section title="Culture Signals">
                  <ul className="flex flex-col gap-2">
                    {result.cultureSignals.map((c, i) => <li key={i} className="text-xs text-zinc-300 flex items-start gap-2"><span className="text-zinc-500 shrink-0">•</span>{c}</li>)}
                  </ul>
                </Section>
                <Section title="Pros & Cons">
                  <div className="flex flex-col gap-2">
                    {result.prosAndCons.pros.map((p, i) => <div key={i} className="flex items-start gap-2 text-xs text-green-300"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />{p}</div>)}
                    {result.prosAndCons.cons.map((c, i) => <div key={i} className="flex items-start gap-2 text-xs text-red-300"><XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{c}</div>)}
                  </div>
                </Section>
              </div>

              {/* Insider Tips + Questions to Ask */}
              <Section title="Insider Tips">
                <ul className="flex flex-col gap-2">
                  {result.insiderTips.map((t, i) => <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />{t}</li>)}
                </ul>
              </Section>

              <Section title="Questions to Ask the Interviewer">
                <ul className="flex flex-col gap-2">
                  {result.questionsToAskThem.map((q, i) => <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-orange-400 shrink-0 font-bold">{i + 1}.</span>{q}</li>)}
                </ul>
              </Section>

              <p className="text-xs text-zinc-600 italic">{result.disclaimer}</p>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'roadmap', label: 'Career Roadmap', icon: <Map className="w-4 h-4" />, description: 'Personalized learning path to your target role' },
  { id: 'study-plan', label: 'Study Plan', icon: <CalendarDays className="w-4 h-4" />, description: 'Day-by-day interview prep schedule' },
  { id: 'offer', label: 'Offer Analyzer', icon: <FileText className="w-4 h-4" />, description: 'Analyze offers + negotiation scripts' },
  { id: 'company', label: 'Company Research', icon: <Building2 className="w-4 h-4" />, description: 'Interview intel on any company' },
]

export default function CareerTools() {
  const [activeTab, setActiveTab] = useState<Tab>('roadmap')

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <Target className="w-3.5 h-3.5" /> Career Tools
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Land Your AI/ML Job
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Everything you need — from planning your learning path to analyzing your offer letter.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {/* Tab selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {tab.icon}
              <span className="text-xs font-semibold leading-tight">{tab.label}</span>
              <span className="text-xs opacity-60 leading-tight hidden md:block">{tab.description}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'roadmap' && <RoadmapTab />}
        {activeTab === 'study-plan' && <StudyPlanTab />}
        {activeTab === 'offer' && <OfferTab />}
        {activeTab === 'company' && <CompanyTab />}
      </div>
    </section>
  )
}
