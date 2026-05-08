"use client"

import { useState, useEffect, useCallback } from 'react'
import { Target, Calendar, ChevronRight, X, Loader2, Sparkles, Clock } from 'lucide-react'

interface DayPlan {
  day: number; focus: string; task: string; duration: string; tip: string
}

interface CountdownData {
  company: string; date: string; plan: DayPlan[]
}

const COMPANIES = ['OpenAI','Anthropic','Google','Meta','Microsoft','Amazon','Nvidia','Hugging Face','Apple','Other']

const STORAGE_KEY = 'interview_countdown'

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr); target.setHours(0,0,0,0)
  const today  = new Date();        today.setHours(0,0,0,0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function todaysPlan(plan: DayPlan[], dateStr: string): DayPlan | null {
  const total = plan.length
  const remaining = daysUntil(dateStr)
  const dayIndex = total - remaining
  return plan[Math.max(0, Math.min(dayIndex, total - 1))] ?? null
}

export default function InterviewCountdown({ weakTopics, strongTopics }: { weakTopics: string[]; strongTopics: string[] }) {
  const [data, setData]           = useState<CountdownData | null>(null)
  const [setting, setSetting]     = useState(false)
  const [company, setCompany]     = useState('Google')
  const [date, setDate]           = useState('')
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded]   = useState(false)
  const [loaded, setLoaded]       = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CountdownData
        if (daysUntil(parsed.date) > 0) setData(parsed)
        else localStorage.removeItem(STORAGE_KEY) // expired
      }
    } catch { /* ignore */ }
    setLoaded(true)
  }, [])

  const generate = useCallback(async () => {
    if (!company || !date) return
    const days = daysUntil(date)
    if (days <= 0) return

    setGenerating(true)
    try {
      const res = await fetch('/api/career/interview-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, daysLeft: days, weakTopics, strongTopics }),
      })
      const result = await res.json()
      const newData: CountdownData = { company, date, plan: result.plan ?? [] }
      setData(newData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      setSetting(false)
    } catch { /* ignore */ }
    finally { setGenerating(false) }
  }, [company, date, weakTopics, strongTopics])

  const clear = useCallback(() => {
    setData(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1)
  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 60)
  const minStr  = minDate.toISOString().split('T')[0]
  const maxStr  = maxDate.toISOString().split('T')[0]

  if (!loaded) return null

  // ── Setup form ──
  if (setting || !data) {
    return (
      <div className="bg-zinc-900 border border-orange-500/20 rounded-2xl p-5 ring-1 ring-orange-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-400" />
            <p className="text-sm font-bold text-zinc-100">Interview Countdown</p>
          </div>
          {setting && (
            <button onClick={() => setSetting(false)} className="p-1 hover:bg-zinc-800 rounded transition-colors">
              <X className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          )}
        </div>

        {!setting ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <Calendar className="w-8 h-8 text-zinc-700" />
            <p className="text-sm text-zinc-400 text-center">Set your interview date and get a personalized day-by-day prep plan.</p>
            <button onClick={() => setSetting(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Set Interview Date
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Company</label>
              <select value={company} onChange={e => setCompany(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none transition-colors">
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Interview Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                min={minStr} max={maxStr}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none transition-colors" />
            </div>
            <button onClick={generate} disabled={!date || generating}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating plan…</> : <><Sparkles className="w-3.5 h-3.5" /> Generate {date ? daysUntil(date) : '?'}-Day Plan</>}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Countdown display ──
  const days       = daysUntil(data.date)
  const today      = todaysPlan(data.plan, data.date)
  const dateLabel  = new Date(data.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-zinc-900 border border-orange-500/20 rounded-2xl overflow-hidden ring-1 ring-orange-500/5">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl justify-center">
            <span className="text-sm font-extrabold text-orange-400 leading-none">{days}</span>
            <span className="text-[8px] text-orange-400/70 leading-none">days</span>
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-100">{data.company} Interview</p>
            <p className="text-xs text-zinc-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {dateLabel}</p>
          </div>
        </div>
        <button onClick={clear} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
          <X className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400" />
        </button>
      </div>

      {/* Today's task */}
      {today && (
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-2">Today — Day {today.day}</p>
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-zinc-100">{today.focus}</p>
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <Clock className="w-3 h-3" />{today.duration}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-2">{today.task}</p>
            {today.tip && <p className="text-[10px] text-orange-400/80 italic">💡 {today.tip}</p>}
          </div>
        </div>
      )}

      {/* Full plan toggle */}
      {data.plan.length > 0 && (
        <>
          <button onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors border-t border-zinc-800">
            <span>Full {data.plan.length}-day plan</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          {expanded && (
            <div className="px-5 pb-4 max-h-48 overflow-y-auto flex flex-col gap-1.5">
              {data.plan.map(d => (
                <div key={d.day} className="flex items-start gap-2.5 py-2 border-b border-zinc-800/50 last:border-0">
                  <span className="text-[10px] font-bold text-zinc-600 w-8 shrink-0 mt-0.5">Day {d.day}</span>
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">{d.focus}</p>
                    <p className="text-[10px] text-zinc-600 leading-relaxed">{d.task}</p>
                  </div>
                  <span className="text-[9px] text-zinc-700 shrink-0 ml-auto">{d.duration}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
