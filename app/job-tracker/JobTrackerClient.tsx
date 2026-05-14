"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Briefcase, Plus, X, Trash2, Edit2, Check, AlertCircle,
  Building2, Star, Calendar, Link2, ChevronRight, ChevronLeft,
  Search, TrendingUp, Target, Clock, Award, ChevronDown, ChevronUp,
  Loader2, ExternalLink, Mail, BarChart2, Download,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import LoginPromptModal from '@/components/ui/LoginPromptModal'

// ─── Pipeline stages ─────────────────────────────────────────────────────────

const STAGES = [
  { id: 'wishlist',     label: 'Wishlist',         short: 'Wishlist',    icon: '💭', color: 'border-zinc-700/60 bg-zinc-900/60',              dot: 'bg-zinc-500'   },
  { id: 'applied',      label: 'Applied',           short: 'Applied',     icon: '📤', color: 'border-blue-500/30 bg-blue-500/5',               dot: 'bg-blue-400'   },
  { id: 'oa',           label: 'OA / Test',         short: 'OA',          icon: '📝', color: 'border-cyan-500/30 bg-cyan-500/5',               dot: 'bg-cyan-400'   },
  { id: 'recruiter',    label: 'Recruiter Screen',  short: 'Recruiter',   icon: '📞', color: 'border-sky-500/30 bg-sky-500/5',                 dot: 'bg-sky-400'    },
  { id: 'technical_1',  label: 'Technical 1',       short: 'Tech 1',      icon: '💻', color: 'border-violet-500/30 bg-violet-500/5',           dot: 'bg-violet-400' },
  { id: 'technical_2',  label: 'Technical 2',       short: 'Tech 2',      icon: '🔧', color: 'border-purple-500/30 bg-purple-500/5',           dot: 'bg-purple-400' },
  { id: 'manager',      label: 'Manager Round',     short: 'Manager',     icon: '👔', color: 'border-amber-500/30 bg-amber-500/5',             dot: 'bg-amber-400'  },
  { id: 'hr',           label: 'HR / Final Round',  short: 'HR/Final',    icon: '👥', color: 'border-orange-500/30 bg-orange-500/5',           dot: 'bg-orange-400' },
  { id: 'offer',        label: 'Offer Received',    short: 'Offer 🎉',    icon: '🎉', color: 'border-green-500/30 bg-green-500/5',             dot: 'bg-green-400'  },
  { id: 'rejected',     label: 'Rejected',          short: 'Rejected',    icon: '❌', color: 'border-red-500/20 bg-red-500/5',                 dot: 'bg-red-400'    },
] as const

type StageId = (typeof STAGES)[number]['id']

// Map old status values → new stage IDs (backward compatibility)
const LEGACY_MAP: Record<string, StageId> = {
  phone_screen: 'recruiter',
  technical:    'technical_1',
  final:        'hr',
}

function normaliseStatus(s: string): StageId {
  return (LEGACY_MAP[s] ?? s) as StageId
}

const STAGE_IDS = STAGES.map(s => s.id)
const ACTIVE_STAGES: string[] = STAGE_IDS.filter(id => id !== 'rejected' && id !== 'offer')

// ─── Types ────────────────────────────────────────────────────────────────────

interface Application {
  id: string
  company_name: string
  role_title: string
  status: string
  location: string | null
  salary_range: string | null
  notes: string | null
  applied_date: string | null
  company_slug: string | null
  priority: 'high' | 'normal' | 'low' | null
  interview_date: string | null
  job_url: string | null
  recruiter_name: string | null
  created_at: string
  updated_at: string
}

type FormState = {
  company_name: string; role_title: string; status: string
  location: string; salary_range: string; notes: string
  applied_date: string; company_slug: string
  priority: string; interview_date: string; job_url: string; recruiter_name: string
}

const EMPTY_FORM: FormState = {
  company_name: '', role_title: '', status: 'applied',
  location: '', salary_range: '', notes: '',
  applied_date: '', company_slug: '',
  priority: 'normal', interview_date: '', job_url: '', recruiter_name: '',
}

const KNOWN_SLUGS = [
  'google','meta','openai','anthropic','microsoft','amazon','nvidia',
  'apple','hugging-face','deepmind','tesla','netflix','uber','airbnb','stripe',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(iso: string | null) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function daysUntil(iso: string | null) {
  if (!iso) return null
  return Math.ceil((new Date(iso + 'T12:00:00').getTime() - Date.now()) / 86400000)
}

function stageDurationColor(days: number) {
  if (days <= 6)  return 'text-green-400 bg-green-500/10'
  if (days <= 13) return 'text-yellow-400 bg-yellow-500/10'
  return 'text-red-400 bg-red-500/10'
}

function avatarColor(name: string) {
  const colors = [
    'bg-blue-500','bg-violet-500','bg-orange-500','bg-green-500',
    'bg-pink-500','bg-teal-500','bg-amber-500','bg-cyan-500',
  ]
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return colors[h % colors.length]
}

function exportCSV(apps: Application[]) {
  const headers = ['Company', 'Role', 'Stage', 'Priority', 'Applied Date', 'Interview Date', 'Location', 'Salary Range', 'Recruiter', 'Job URL', 'Notes']
  const rows = apps.map(a => [
    a.company_name, a.role_title, a.status, a.priority ?? 'normal',
    a.applied_date ?? '', a.interview_date ?? '', a.location ?? '',
    a.salary_range ?? '', a.recruiter_name ?? '', a.job_url ?? '',
    (a.notes ?? '').replace(/\n/g, ' '),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `job_applications_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatsBar({ apps }: { apps: Application[] }) {
  const total   = apps.length
  const active  = apps.filter(a => ACTIVE_STAGES.includes(normaliseStatus(a.status))).length
  const offers  = apps.filter(a => normaliseStatus(a.status) === 'offer').length
  const applied = apps.filter(a => normaliseStatus(a.status) !== 'wishlist').length

  // Interviews in the next 7 days
  const upcoming = apps.filter(a => {
    const d = daysUntil(a.interview_date)
    return d !== null && d >= 0 && d <= 7
  }).length

  const successRate = applied > 0 ? Math.round((offers / applied) * 100) : 0

  const stats = [
    { label: 'Total',        value: total,           icon: <Briefcase className="w-3.5 h-3.5" />, color: 'text-zinc-300'   },
    { label: 'Active',       value: active,          icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-blue-400'   },
    { label: 'Interviews ≤7d', value: upcoming,      icon: <Calendar className="w-3.5 h-3.5" />,   color: 'text-orange-400' },
    { label: 'Offers',       value: offers,          icon: <Award className="w-3.5 h-3.5" />,       color: 'text-green-400'  },
    { label: 'Offer rate',   value: `${successRate}%`, icon: <Target className="w-3.5 h-3.5" />,   color: 'text-violet-400' },
  ]

  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-center">
          <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
          <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// Pipeline progress bar (mini funnel view)
function PipelineBar({ apps }: { apps: Application[] }) {
  const counts = STAGES.filter(s => s.id !== 'rejected').map(s => ({
    ...s,
    count: apps.filter(a => normaliseStatus(a.status) === s.id).length,
  }))
  const max = Math.max(1, ...counts.map(c => c.count))

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-3.5 h-3.5 text-zinc-500" />
        <p className="text-xs font-semibold text-zinc-400">Pipeline Funnel</p>
      </div>
      <div className="flex items-end gap-1.5 h-12">
        {counts.map(({ id, short, dot, count }) => (
          <div key={id} className="flex-1 flex flex-col items-center gap-1" title={`${short}: ${count}`}>
            <span className="text-[9px] text-zinc-600 font-mono">{count || ''}</span>
            <div
              className={`w-full rounded-sm transition-all ${dot} opacity-70`}
              style={{ height: `${Math.max(2, (count / max) * 40)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1.5 mt-1">
        {counts.map(({ id, short }) => (
          <p key={id} className="flex-1 text-center text-[8px] text-zinc-700 truncate">{short}</p>
        ))}
      </div>
    </div>
  )
}

interface CardProps {
  app: Application
  onMove:   (id: string, toStage: StageId) => void
  onDelete: (id: string) => void
  onEdit:   (app: Application) => void
  onStar:   (id: string, priority: string) => void
}

function AppCard({ app, onMove, onDelete, onEdit, onStar }: CardProps) {
  const stage   = normaliseStatus(app.status)
  const stageIdx = STAGE_IDS.indexOf(stage)
  const stageInfo = STAGES.find(s => s.id === stage)!
  const days    = daysAgo(app.updated_at)
  const intDays = daysUntil(app.interview_date)
  const isHigh  = app.priority === 'high'
  const [open, setOpen] = useState(false)

  const prevStage = stageIdx > 0 ? STAGE_IDS[stageIdx - 1] as StageId : null
  const nextStage = stageIdx < STAGE_IDS.length - 1 ? STAGE_IDS[stageIdx + 1] as StageId : null

  return (
    <div className={`bg-zinc-900/80 border rounded-xl overflow-hidden transition-all ${isHigh ? 'border-orange-500/40 ring-1 ring-orange-500/15' : 'border-zinc-800 hover:border-zinc-700'}`}>
      {/* Main content */}
      <div className="p-3">
        <div className="flex items-start gap-2.5 mb-2">
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-lg ${avatarColor(app.company_name)} flex items-center justify-center text-white text-sm font-extrabold shrink-0`}>
            {app.company_name[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-100 truncate">{app.company_name}</p>
                <p className="text-[10px] text-zinc-500 truncate leading-tight">{app.role_title}</p>
              </div>
              <button
                onClick={() => onStar(app.id, isHigh ? 'normal' : 'high')}
                className={`shrink-0 transition-colors ${isHigh ? 'text-orange-400' : 'text-zinc-700 hover:text-zinc-500'}`}
                title={isHigh ? 'Remove priority' : 'Mark as priority'}
              >
                <Star className="w-3.5 h-3.5" fill={isHigh ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Interview date countdown */}
        {intDays !== null && (
          <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 w-fit ${
            intDays < 0  ? 'bg-zinc-800 text-zinc-500' :
            intDays === 0 ? 'bg-orange-500/20 text-orange-400' :
            intDays <= 3  ? 'bg-red-500/15 text-red-400' :
            'bg-blue-500/10 text-blue-400'
          }`}>
            <Calendar className="w-2.5 h-2.5" />
            {intDays < 0 ? `${Math.abs(intDays)}d ago` : intDays === 0 ? 'Today!' : `In ${intDays}d`}
            {' — Interview'}
          </div>
        )}

        {/* Offer analyze shortcut */}
        {stage === 'offer' && (
          <Link
            href={`/career?tab=offer`}
            onClick={() => localStorage.setItem('career_prefill', JSON.stringify({ offerRole: app.role_title, offerCompany: app.company_name, source: 'job-tracker' }))}
            className="flex items-center gap-1 text-[10px] font-semibold text-green-400 hover:text-green-300 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg transition-colors mb-2 w-fit"
          >
            Analyze Offer →
          </Link>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-zinc-600">
          {app.location && <span>{app.location}</span>}
          {app.salary_range && <span className="text-zinc-500">💰 {app.salary_range}</span>}
          {app.applied_date && (
            <span>📅 {new Date(app.applied_date + 'T12:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
          )}
          {days !== null && days > 0 && (
            <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${stageDurationColor(days)}`}>
              {days}d in stage
            </span>
          )}
        </div>
      </div>

      {/* Expandable notes */}
      {(app.notes || app.recruiter_name || app.job_url) && (
        <div className="border-t border-zinc-800/50">
          <button
            onClick={() => setOpen(v => !v)}
            className="w-full flex items-center gap-1 px-3 py-1.5 text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {open ? 'Hide details' : 'Show details'}
          </button>
          {open && (
            <div className="px-3 pb-2.5 flex flex-col gap-1.5">
              {app.recruiter_name && (
                <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" />{app.recruiter_name}
                </p>
              )}
              {app.job_url && (
                <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate transition-colors">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{app.job_url.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {app.notes && <p className="text-[10px] text-zinc-500 leading-relaxed">{app.notes}</p>}
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="border-t border-zinc-800/50 px-2 py-1.5 flex items-center justify-between gap-1">
        {/* Stage navigation */}
        <div className="flex items-center gap-0.5">
          {prevStage && prevStage !== 'rejected' && (
            <button
              onClick={() => onMove(app.id, prevStage)}
              className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-300"
              title={`Back to ${STAGES.find(s => s.id === prevStage)?.short}`}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}
          {nextStage && nextStage !== 'rejected' && nextStage !== 'offer' && (
            <button
              onClick={() => onMove(app.id, nextStage)}
              className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-300"
              title={`Advance to ${STAGES.find(s => s.id === nextStage)?.short}`}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {stage !== 'offer' && stage !== 'rejected' && (
            <button
              onClick={() => onMove(app.id, 'offer')}
              className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors font-semibold"
              title="Mark as Offer"
            >Offer</button>
          )}
          {stage !== 'rejected' && (
            <button
              onClick={() => onMove(app.id, 'rejected')}
              className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors font-semibold"
              title="Mark as Rejected"
            >Reject</button>
          )}
          {app.company_slug && (
            <Link href={`/companies/${app.company_slug}`}
              className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-700 hover:text-orange-400"
              title="Company Prep">
              <Building2 className="w-3 h-3" />
            </Link>
          )}
        </div>
        {/* Edit / Delete */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => onEdit(app)} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-700 hover:text-zinc-300"><Edit2 className="w-3 h-3" /></button>
          <button onClick={() => onDelete(app.id)} className="p-1 hover:bg-red-500/10 rounded transition-colors text-zinc-700 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  )
}

// ─── Add / Edit form ─────────────────────────────────────────────────────────

function AppForm({
  initial, onSubmit, onClose, saving,
}: {
  initial: FormState
  onSubmit: (f: FormState) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<FormState>(initial)
  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleCompany(v: string) {
    const slug = KNOWN_SLUGS.find(s =>
      v.toLowerCase().includes(s.replace('-', ' ')) || v.toLowerCase().includes(s)
    ) ?? ''
    setForm(f => ({ ...f, company_name: v, company_slug: slug }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-sm font-bold text-zinc-100">
            {initial.company_name ? 'Edit Application' : 'New Application'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="p-5 flex flex-col gap-3">
          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Company *</label>
              <input value={form.company_name} onChange={e => handleCompany(e.target.value)} required
                placeholder="e.g. Google" className="input-field" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Role *</label>
              <input value={form.role_title} onChange={e => set('role_title', e.target.value)} required
                placeholder="e.g. Senior ML Engineer" className="input-field" />
            </div>
          </div>

          {/* Stage + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Stage</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className="input-field">
                <option value="high">⭐ High Priority</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Applied Date + Interview Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Applied Date</label>
              <input type="date" value={form.applied_date} onChange={e => set('applied_date', e.target.value)} className="input-field" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Next Interview</label>
              <input type="date" value={form.interview_date} onChange={e => set('interview_date', e.target.value)} className="input-field" />
            </div>
          </div>

          {/* Location + Salary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. Remote / NYC" className="input-field" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Salary Range</label>
              <input value={form.salary_range} onChange={e => set('salary_range', e.target.value)}
                placeholder="e.g. $150k–$200k" className="input-field" />
            </div>
          </div>

          {/* Recruiter + Job URL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Recruiter Name</label>
              <input value={form.recruiter_name} onChange={e => set('recruiter_name', e.target.value)}
                placeholder="e.g. Jane Smith" className="input-field" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Job URL</label>
              <input type="url" value={form.job_url} onChange={e => set('job_url', e.target.value)}
                placeholder="https://..." className="input-field" />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="Referral contact, deadlines, impressions…"
              className="input-field resize-none" />
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors mt-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {initial.company_name ? 'Save Changes' : 'Add Application'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function JobTrackerClient() {
  const user = useUser()
  const [apps, setApps]           = useState<Application[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [tableReady, setTableReady] = useState(false)
  const [authModal, setAuthModal] = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [editApp, setEditApp]     = useState<Application | null>(null)
  const [search, setSearch]       = useState('')
  const [showRejected, setShowRejected] = useState(false)
  const [view, setView]           = useState<'kanban' | 'list'>('kanban')
  const [rejectTarget, setRejectTarget] = useState<{ id: string; company: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    if (!user || user === 'loading') return
    setLoading(true)
    try {
      const res = await fetch('/api/user/job-tracker')
      if (res.ok) {
        const d = await res.json()
        setApps(d.applications ?? [])
        setTableReady(true)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => {
    if (user === null) { setLoading(false); return }
    if (user !== 'loading') load()
  }, [user, load])

  const filtered = useMemo(() => {
    if (!search.trim()) return apps
    const q = search.toLowerCase()
    return apps.filter(a =>
      a.company_name.toLowerCase().includes(q) ||
      a.role_title.toLowerCase().includes(q) ||
      a.location?.toLowerCase().includes(q)
    )
  }, [apps, search])

  async function handleSubmit(form: FormState) {
    if (user === null) { setAuthModal(true); return }
    setSaving(true)
    try {
      if (editApp) {
        const res = await fetch('/api/user/job-tracker', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editApp.id, ...form }),
        })
        const d = await res.json()
        setApps(prev => prev.map(a => a.id === editApp.id ? d.application : a))
      } else {
        const res = await fetch('/api/user/job-tracker', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const d = await res.json()
        setApps(prev => [d.application, ...prev])
      }
      setShowForm(false); setEditApp(null)
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  async function handleMove(id: string, toStage: StageId) {
    const snapshot = apps.find(a => a.id === id)
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: toStage, updated_at: new Date().toISOString() } : a))
    const res = await fetch('/api/user/job-tracker', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: toStage }),
    })
    if (!res.ok && snapshot) {
      setApps(prev => prev.map(a => a.id === id ? snapshot : a))
    }
  }

  function handleMoveOrReject(id: string, toStage: StageId) {
    if (toStage === 'rejected') {
      const app = apps.find(a => a.id === id)
      setRejectTarget({ id, company: app?.company_name ?? '' })
      setRejectReason('')
    } else {
      handleMove(id, toStage)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this application?')) return
    const snapshot = apps.find(a => a.id === id)
    setApps(prev => prev.filter(a => a.id !== id))
    const res = await fetch('/api/user/job-tracker', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok && snapshot) {
      setApps(prev => [...prev, snapshot].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
    }
  }

  async function handleStar(id: string, priority: string) {
    const snapshot = apps.find(a => a.id === id)
    setApps(prev => prev.map(a => a.id === id ? { ...a, priority: priority as Application['priority'] } : a))
    const res = await fetch('/api/user/job-tracker', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, priority }),
    })
    if (!res.ok && snapshot) {
      setApps(prev => prev.map(a => a.id === id ? snapshot : a))
    }
  }

  function openEdit(app: Application) {
    setEditApp(app)
    setShowForm(true)
  }

  function openAdd() {
    if (user === null) { setAuthModal(true); return }
    setEditApp(null)
    setShowForm(true)
  }

  const editInitial: FormState = editApp ? {
    company_name: editApp.company_name, role_title: editApp.role_title,
    status: normaliseStatus(editApp.status), location: editApp.location ?? '',
    salary_range: editApp.salary_range ?? '', notes: editApp.notes ?? '',
    applied_date: editApp.applied_date ?? '', company_slug: editApp.company_slug ?? '',
    priority: editApp.priority ?? 'normal', interview_date: editApp.interview_date ?? '',
    job_url: editApp.job_url ?? '', recruiter_name: editApp.recruiter_name ?? '',
  } : EMPTY_FORM

  const byStage = (id: StageId) =>
    filtered.filter(a => normaliseStatus(a.status) === id)
      .sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1
        if (b.priority === 'high' && a.priority !== 'high') return 1
        return 0
      })

  const rejectedApps = byStage('rejected')

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      {/* Tailwind inline styles for reused input class */}
      <style>{`.input-field{background:#27272a;border:1px solid #3f3f46;border-radius:.75rem;padding:.625rem .75rem;font-size:.875rem;color:#f4f4f5;outline:none;width:100%;transition:border-color .15s}.input-field:focus{border-color:rgba(249,115,22,.6)}.input-field::placeholder{color:#52525b}`}</style>

      <LoginPromptModal isOpen={authModal} onClose={() => setAuthModal(false)} feature="track job applications" returnPath="/job-tracker" />

      {showForm && (
        <AppForm
          initial={editInitial}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditApp(null) }}
          saving={saving}
        />
      )}

      {/* Rejection reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <p className="text-sm font-bold text-zinc-100 mb-1">Mark as Rejected</p>
            <p className="text-xs text-zinc-500 mb-4">{rejectTarget.company} — optional: note why</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['Ghosted', 'Failed OA', 'Failed Technical', 'No offer extended', 'Withdrew', 'Offer below expectations'].map(r => (
                <button key={r} onClick={() => setRejectReason(r)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${rejectReason === r ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}>
                  {r}
                </button>
              ))}
            </div>
            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Or type a reason…"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setRejectTarget(null)}
                className="flex-1 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => {
                const reason = rejectReason.trim()
                if (reason) {
                  // Append rejection reason to notes
                  const app = apps.find(a => a.id === rejectTarget.id)
                  const existingNotes = app?.notes ?? ''
                  const newNotes = existingNotes ? `${existingNotes}\n[Rejected: ${reason}]` : `[Rejected: ${reason}]`
                  fetch('/api/user/job-tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: rejectTarget.id, notes: newNotes }) }).catch(() => {})
                  setApps(prev => prev.map(a => a.id === rejectTarget.id ? { ...a, notes: newNotes } : a))
                }
                handleMove(rejectTarget.id, 'rejected')
                setRejectTarget(null)
              }}
                className="flex-1 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl transition-colors">
                Confirm Rejected
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-100">Job Tracker</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Track every application through the full interview pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 placeholder:text-zinc-500 outline-none focus:border-orange-500/50 w-44 transition-colors" />
            </div>
            {/* Export CSV */}
            {apps.length > 0 && (
              <button onClick={() => exportCSV(apps)}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 px-3 py-2 rounded-xl transition-colors">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            )}
            {/* View toggle */}
            <button
              onClick={() => setView(v => v === 'kanban' ? 'list' : 'kanban')}
              className="p-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title={view === 'kanban' ? 'Switch to list view' : 'Switch to kanban'}
            >
              {view === 'kanban' ? <BarChart2 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
              <Plus className="w-4 h-4" /> Add Application
            </button>
          </div>
        </div>

        {/* Migration notice */}
        {!loading && !tableReady && user && user !== 'loading' && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-400">Run SQL migration first (once)</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Supabase Dashboard → SQL Editor → paste <code className="text-zinc-400 font-mono">supabase/job_tracker_schema.sql</code> → Run
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-zinc-600 animate-spin" />
          </div>
        ) : user === null ? (
          <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <Briefcase className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-200 font-bold text-lg mb-2">Track every application in one place</p>
            <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">Full 9-stage pipeline from wishlist to offer. Star priority roles, track interview dates, link company prep.</p>
            <Link href="/login?next=/job-tracker"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
              Sign In Free — Start Tracking
            </Link>
          </div>
        ) : apps.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <div className="text-5xl mb-4">🚀</div>
            <p className="text-zinc-200 font-bold text-lg mb-2">Your pipeline is empty</p>
            <p className="text-zinc-500 text-sm mb-6">Add your first application and track it through every round</p>
            <button onClick={openAdd}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Add First Application
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <StatsBar apps={apps} />

            {/* Pipeline funnel — only when enough apps */}
            {apps.length >= 3 && <PipelineBar apps={apps} />}

            {view === 'list' ? (
              /* List view */
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_120px_100px_90px_80px] gap-3 px-4 py-2.5 border-b border-zinc-800 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                  <span>Company / Role</span><span>Stage</span><span>Interview</span><span>Salary</span><span>Days</span>
                </div>
                {filtered.sort((a, b) => {
                  if (a.priority === 'high' && b.priority !== 'high') return -1
                  if (b.priority === 'high' && a.priority !== 'high') return 1
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                }).map(app => {
                  const stage = STAGES.find(s => s.id === normaliseStatus(app.status))!
                  const days  = daysAgo(app.updated_at)
                  const intD  = daysUntil(app.interview_date)
                  return (
                    <div key={app.id} className="grid grid-cols-[1fr_120px_100px_90px_80px] gap-3 items-center px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg ${avatarColor(app.company_name)} flex items-center justify-center text-white text-xs font-extrabold shrink-0`}>
                          {app.company_name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {app.priority === 'high' && <Star className="w-3 h-3 text-orange-400 shrink-0" fill="currentColor" />}
                            <p className="text-sm font-semibold text-zinc-200 truncate">{app.company_name}</p>
                          </div>
                          <p className="text-[10px] text-zinc-500 truncate">{app.role_title}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-400">{stage.icon} {stage.short}</span>
                      </div>
                      <div>
                        {intD !== null ? (
                          <span className={`text-[10px] font-semibold ${intD < 0 ? 'text-zinc-600' : intD <= 3 ? 'text-red-400' : 'text-blue-400'}`}>
                            {intD < 0 ? `${Math.abs(intD)}d ago` : intD === 0 ? 'Today!' : `In ${intD}d`}
                          </span>
                        ) : <span className="text-[10px] text-zinc-700">—</span>}
                      </div>
                      <div>
                        {app.salary_range
                          ? <span className="text-[10px] text-zinc-500 truncate">{app.salary_range}</span>
                          : <span className="text-[10px] text-zinc-700">—</span>}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        {days !== null && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${stageDurationColor(days)}`}>{days}d</span>}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(app)} className="p-0.5 hover:bg-zinc-700 rounded text-zinc-600 hover:text-zinc-300"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(app.id)} className="p-0.5 hover:bg-zinc-700 rounded text-zinc-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Kanban view */
              <div className="overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-3" style={{ minWidth: `${(STAGES.length - 1) * 220}px` }}>
                  {STAGES.filter(s => s.id !== 'rejected').map(stage => {
                    const items = byStage(stage.id)
                    return (
                      <div key={stage.id} style={{ width: 210 }} className={`shrink-0 rounded-2xl border p-3 ${stage.color}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{stage.icon}</span>
                            <p className="text-xs font-bold text-zinc-300">{stage.short}</p>
                          </div>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-zinc-900/70 ${items.length > 0 ? 'text-zinc-300' : 'text-zinc-700'}`}>{items.length}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {items.map(app => (
                            <AppCard key={app.id} app={app} onMove={handleMoveOrReject} onDelete={handleDelete} onEdit={openEdit} onStar={handleStar} />
                          ))}
                          {items.length === 0 && (
                            <p className="text-[10px] text-zinc-700 text-center py-5 border border-dashed border-zinc-800/60 rounded-xl">Empty</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Rejected — collapsible */}
            {rejectedApps.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowRejected(v => !v)}
                  className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors"
                >
                  {showRejected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  ❌ Rejected ({rejectedApps.length})
                </button>
                {showRejected && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {rejectedApps.map(app => (
                      <AppCard key={app.id} app={app} onMove={handleMoveOrReject} onDelete={handleDelete} onEdit={openEdit} onStar={handleStar} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
