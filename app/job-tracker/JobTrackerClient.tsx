"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Briefcase, Plus, X, ChevronRight, ChevronLeft,
  Trash2, Edit2, Check, AlertCircle, Building2, ArrowLeft,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import LoginPromptModal from '@/components/ui/LoginPromptModal'

interface Application {
  id: string; company_name: string; role_title: string; status: string
  location: string | null; salary_range: string | null; notes: string | null
  applied_date: string | null; company_slug: string | null; created_at: string
}

const STATUSES = [
  { id: 'wishlist',     label: '💭 Wishlist',      color: 'border-zinc-700 bg-zinc-900' },
  { id: 'applied',      label: '📤 Applied',        color: 'border-blue-500/30 bg-blue-500/5' },
  { id: 'phone_screen', label: '📞 Phone Screen',   color: 'border-yellow-500/30 bg-yellow-500/5' },
  { id: 'technical',    label: '💻 Technical',      color: 'border-orange-500/30 bg-orange-500/5' },
  { id: 'final',        label: '🎯 Final Round',    color: 'border-purple-500/30 bg-purple-500/5' },
  { id: 'offer',        label: '🎉 Offer',          color: 'border-green-500/30 bg-green-500/5' },
  { id: 'rejected',     label: '❌ Rejected',       color: 'border-red-500/30 bg-red-500/5' },
]

const STATUS_ORDER = STATUSES.map(s => s.id)

interface AppCardProps { app: Application; onMove: (id: string, steps: number) => void; onDelete: (id: string) => void; onEdit: (app: Application) => void }

function AppCard({ app, onMove, onDelete, onEdit }: AppCardProps) {
  const idx = STATUS_ORDER.indexOf(app.status)
  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 flex flex-col gap-2 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-100 truncate">{app.company_name}</p>
          <p className="text-xs text-zinc-500 truncate">{app.role_title}</p>
          {app.location && <p className="text-[10px] text-zinc-700 mt-0.5">{app.location}</p>}
        </div>
        {app.company_slug && (
          <Link href={`/companies/${app.company_slug}`}
            className="shrink-0 w-7 h-7 bg-zinc-800 hover:bg-orange-500/10 border border-zinc-700 hover:border-orange-500/30 rounded-lg flex items-center justify-center transition-colors"
            title="Company prep">
            <Building2 className="w-3.5 h-3.5 text-zinc-500 hover:text-orange-400" />
          </Link>
        )}
      </div>

      {(app.salary_range || app.applied_date) && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
          {app.salary_range && <span>💰 {app.salary_range}</span>}
          {app.applied_date && <span>📅 {new Date(app.applied_date + 'T12:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>}
        </div>
      )}

      {app.notes && <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">{app.notes}</p>}

      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <div className="flex items-center gap-0.5">
          {idx > 0 && idx < STATUS_ORDER.length - 2 && (
            <button onClick={() => onMove(app.id, -1)} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-300"><ChevronLeft className="w-3.5 h-3.5" /></button>
          )}
          {idx < STATUS_ORDER.length - 1 && idx !== STATUS_ORDER.length - 2 && (
            <button onClick={() => onMove(app.id, 1)} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-300" title="Move to next stage"><ChevronRight className="w-3.5 h-3.5" /></button>
          )}
          {/* Direct offer button */}
          {app.status !== 'offer' && app.status !== 'rejected' && (
            <button onClick={() => onMove(app.id, STATUS_ORDER.indexOf('offer') - idx)} className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors">Offer ✓</button>
          )}
          {app.status !== 'rejected' && (
            <button onClick={() => onMove(app.id, STATUS_ORDER.indexOf('rejected') - idx)} className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors">Reject ✗</button>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => onEdit(app)} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-300"><Edit2 className="w-3 h-3" /></button>
          <button onClick={() => onDelete(app.id)} className="p-1 hover:bg-red-500/10 rounded transition-colors text-zinc-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  )
}

const COMPANIES_WITH_SLUGS = ['google','meta','openai','anthropic','microsoft','amazon','nvidia','hugging-face','apple']

export default function JobTrackerClient() {
  const user = useUser()
  const [apps, setApps]           = useState<Application[]>([])
  const [loading, setLoading]     = useState(true)
  const [tableReady, setTableReady] = useState(false)
  const [authModal, setAuthModal] = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [editApp, setEditApp]     = useState<Application | null>(null)
  const [form, setForm] = useState({ company_name:'', role_title:'', status:'applied', location:'', salary_range:'', notes:'', applied_date:'', company_slug:'' })

  const load = useCallback(async () => {
    if (!user || user === 'loading') return
    setLoading(true)
    try {
      const res = await fetch('/api/user/job-tracker')
      if (res.ok) {
        const d = await res.json()
        setApps(d.applications ?? [])
        setTableReady(true) // table exists — hide SQL notice
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => {
    if (user === null) { setLoading(false); return }
    if (user !== 'loading') load()
  }, [user, load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (user === null) { setAuthModal(true); return }
    try {
      if (editApp) {
        const res = await fetch('/api/user/job-tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editApp.id, ...form }) })
        const d = await res.json(); setApps(prev => prev.map(a => a.id === editApp.id ? d.application : a))
      } else {
        const res = await fetch('/api/user/job-tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const d = await res.json(); setApps(prev => [d.application, ...prev])
      }
      setShowForm(false); setEditApp(null); setForm({ company_name:'', role_title:'', status:'applied', location:'', salary_range:'', notes:'', applied_date:'', company_slug:'' })
    } catch { /* silent */ }
  }

  async function handleMove(id: string, steps: number) {
    const app = apps.find(a => a.id === id); if (!app) return
    const currentIdx = STATUS_ORDER.indexOf(app.status)
    const newIdx = Math.max(0, Math.min(STATUS_ORDER.length - 1, currentIdx + steps))
    const newStatus = STATUS_ORDER[newIdx]
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    await fetch('/api/user/job-tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: newStatus }) })
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this application?')) return
    setApps(prev => prev.filter(a => a.id !== id))
    await fetch('/api/user/job-tracker', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  }

  function openEdit(app: Application) {
    setEditApp(app)
    setForm({ company_name: app.company_name, role_title: app.role_title, status: app.status, location: app.location ?? '', salary_range: app.salary_range ?? '', notes: app.notes ?? '', applied_date: app.applied_date ?? '', company_slug: app.company_slug ?? '' })
    setShowForm(true)
  }

  const byStatus = (status: string) => apps.filter(a => a.status === status)
  const total = apps.length
  const active = apps.filter(a => !['rejected','offer'].includes(a.status)).length

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <LoginPromptModal isOpen={authModal} onClose={() => setAuthModal(false)} feature="track job applications" returnPath="/job-tracker" />
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-100">Job Tracker</h1>
              <p className="text-xs text-zinc-500 mt-0.5">{total} applications · {active} active</p>
            </div>
          </div>
          <button onClick={() => { if (user === null) { setAuthModal(true); return }; setEditApp(null); setForm({ company_name:'', role_title:'', status:'applied', location:'', salary_range:'', notes:'', applied_date:'', company_slug:'' }); setShowForm(true) }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>

        {/* SQL notice — hidden once table is confirmed working */}
        {!tableReady && <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-400">Run SQL migration first (once)</p>
            <p className="text-xs text-zinc-500 mt-0.5">Supabase Dashboard → SQL Editor → paste <code className="text-zinc-400 font-mono">supabase/job_tracker_schema.sql</code> → Run</p>
          </div>
        </div>}

        {/* Add/Edit form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-zinc-100">{editApp ? 'Edit Application' : 'New Application'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-4 h-4 text-zinc-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input value={form.company_name} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, company_name: v, company_slug: COMPANIES_WITH_SLUGS.find(s => v.toLowerCase().includes(s.replace('-', ' ').toLowerCase()) || v.toLowerCase().includes(s)) ?? '' })); }} placeholder="Company name *" required className="bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none" />
                <input value={form.role_title} onChange={e => setForm(f => ({ ...f, role_title: e.target.value }))} placeholder="Role title * (e.g. Senior ML Engineer)" required className="bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none">
                    {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <input type="date" value={form.applied_date} onChange={e => setForm(f => ({ ...f, applied_date: e.target.value }))} className="bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none" />
                  <input value={form.salary_range} onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))} placeholder="Salary range" className="bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none" />
                </div>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (referral, contact, deadline...)" rows={2} className="bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none resize-none" />
                <button type="submit" className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
                  <Check className="w-4 h-4" /> {editApp ? 'Save Changes' : 'Add Application'}
                </button>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : user === null ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <Briefcase className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-300 font-semibold mb-2">Sign in to track applications</p>
            <p className="text-zinc-600 text-sm mb-6">Keep all your job applications in one place, linked to company prep</p>
            <Link href="/login?next=/job-tracker" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Sign In Free
            </Link>
          </div>
        ) : (
          /* Kanban columns */
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4 min-w-max">
              {STATUSES.filter(s => s.id !== 'rejected').map(status => {
                const items = byStatus(status.id)
                return (
                  <div key={status.id} className={`w-64 shrink-0 rounded-2xl border p-3 ${status.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-zinc-300">{status.label}</p>
                      <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800/80 px-1.5 py-0.5 rounded-full">{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {items.map(app => (
                        <AppCard key={app.id} app={app} onMove={handleMove} onDelete={handleDelete} onEdit={openEdit} />
                      ))}
                      {items.length === 0 && (
                        <p className="text-[10px] text-zinc-700 text-center py-4 border border-dashed border-zinc-800 rounded-xl">No applications</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {/* Rejected column */}
              {byStatus('rejected').length > 0 && (
                <div className="w-64 shrink-0 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-zinc-300">❌ Rejected</p>
                    <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800/80 px-1.5 py-0.5 rounded-full">{byStatus('rejected').length}</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {byStatus('rejected').map(app => (
                      <AppCard key={app.id} app={app} onMove={handleMove} onDelete={handleDelete} onEdit={openEdit} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
