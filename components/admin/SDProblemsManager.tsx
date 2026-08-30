'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Save, X, Loader2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'

export interface SDProblemRow {
  id: number
  slug: string
  title: string
  difficulty: 'Medium' | 'Hard'
  category: string
  companies: string[]
  problem: string
  constraints: string[]
  key_areas: string[]
  hints: string[]
  linked_sheet_item_id: string
  is_active: boolean
  sort_order: number
  created_at: string
}

const BLANK: Omit<SDProblemRow, 'id' | 'created_at'> = {
  slug: '', title: '', difficulty: 'Hard', category: 'ML Systems',
  companies: [], problem: '', constraints: [], key_areas: [], hints: [],
  linked_sheet_item_id: '', is_active: true, sort_order: 0,
}

const CATEGORIES = ['LLM Infrastructure', 'ML Systems', 'Classic Tech']

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors'
const labelCls = 'block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5'

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
function arrToText(a: string[]) { return a.join('\n') }
function textToArr(t: string) { return t.split('\n').map(s => s.trim()).filter(Boolean) }

// ── Form ───────────────────────────────────────────────────────────────────────
function ProblemForm({
  initial, onSave, onCancel, saving,
}: {
  initial: Omit<SDProblemRow, 'id' | 'created_at'>
  onSave: (data: Omit<SDProblemRow, 'id' | 'created_at'>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [f, setF] = useState(initial)
  const [constraintsText, setConstraintsText] = useState(arrToText(initial.constraints))
  const [keyAreasText,    setKeyAreasText]    = useState(arrToText(initial.key_areas))
  const [hintsText,       setHintsText]       = useState(arrToText(initial.hints))
  const [companiesText,   setCompaniesText]   = useState(initial.companies.join(', '))

  function handleTitleChange(title: string) {
    setF(p => ({ ...p, title, slug: p.slug || slugify(title) }))
  }

  function handleSubmit() {
    if (!f.title.trim() || !f.slug.trim()) return
    onSave({
      ...f,
      companies:   companiesText.split(',').map(s => s.trim()).filter(Boolean),
      constraints: textToArr(constraintsText),
      key_areas:   textToArr(keyAreasText),
      hints:       textToArr(hintsText),
    })
  }

  return (
    <div className="space-y-5">
      {/* Row 1: Title + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Title *</label>
          <input value={f.title} onChange={e => handleTitleChange(e.target.value)}
            placeholder="e.g. Design a RAG Pipeline" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Slug * (URL path)</label>
          <input value={f.slug} onChange={e => setF(p => ({ ...p, slug: e.target.value }))}
            placeholder="e.g. rag-pipeline" className={inputCls} />
        </div>
      </div>

      {/* Row 2: Difficulty + Category + Sort + Active */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Difficulty</label>
          <select value={f.difficulty} onChange={e => setF(p => ({ ...p, difficulty: e.target.value as 'Medium' | 'Hard' }))}
            className={inputCls}>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}
            className={inputCls}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Sort Order</label>
          <input type="number" value={f.sort_order} onChange={e => setF(p => ({ ...p, sort_order: Number(e.target.value) }))}
            className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Active?</label>
          <select value={f.is_active ? 'yes' : 'no'} onChange={e => setF(p => ({ ...p, is_active: e.target.value === 'yes' }))}
            className={inputCls}>
            <option value="yes">Yes</option>
            <option value="no">No (hidden)</option>
          </select>
        </div>
      </div>

      {/* Companies */}
      <div>
        <label className={labelCls}>Companies (comma-separated)</label>
        <input value={companiesText} onChange={e => setCompaniesText(e.target.value)}
          placeholder="Google, Meta, Amazon, Microsoft" className={inputCls} />
      </div>

      {/* Problem statement */}
      <div>
        <label className={labelCls}>Problem Statement (Markdown)</label>
        <textarea value={f.problem} onChange={e => setF(p => ({ ...p, problem: e.target.value }))}
          rows={12} placeholder="## Problem&#10;&#10;Design a system that..." className={`${inputCls} resize-y font-mono text-xs leading-relaxed`} />
      </div>

      {/* Constraints + Key Areas + Hints */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Constraints (one per line)</label>
          <textarea value={constraintsText} onChange={e => setConstraintsText(e.target.value)}
            rows={6} placeholder="100K RPS&#10;P99 < 200ms&#10;99.9% availability"
            className={`${inputCls} resize-y text-xs`} />
        </div>
        <div>
          <label className={labelCls}>Key Areas / Checklist (one per line)</label>
          <textarea value={keyAreasText} onChange={e => setKeyAreasText(e.target.value)}
            rows={6} placeholder="Requirements&#10;Architecture&#10;Scalability&#10;Data Model&#10;Trade-offs"
            className={`${inputCls} resize-y text-xs`} />
        </div>
        <div>
          <label className={labelCls}>Hints (one per line)</label>
          <textarea value={hintsText} onChange={e => setHintsText(e.target.value)}
            rows={6} placeholder="Start with capacity estimation&#10;Consider caching hot embeddings"
            className={`${inputCls} resize-y text-xs`} />
        </div>
      </div>

      {/* Linked sheet item */}
      <div>
        <label className={labelCls}>Linked Sheet Item ID (optional)</label>
        <input value={f.linked_sheet_item_id} onChange={e => setF(p => ({ ...p, linked_sheet_item_id: e.target.value }))}
          placeholder="e.g. sdl-20" className={inputCls} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSubmit} disabled={saving || !f.title.trim() || !f.slug.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-sm transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Problem'}
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-colors">
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main manager ───────────────────────────────────────────────────────────────
export default function SDProblemsManager({ initial }: { initial: SDProblemRow[] }) {
  const [problems, setProblems] = useState(initial)
  const [editing,  setEditing]  = useState<number | 'new' | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError]   = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const editingProblem = editing === 'new'
    ? BLANK
    : problems.find(p => p.id === editing)

  async function save(data: Omit<SDProblemRow, 'id' | 'created_at'>) {
    setError('')
    startTransition(async () => {
      const isNew = editing === 'new'
      const res = await fetch('/api/admin/sd-problems', {
        method:  isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(isNew ? data : { ...data, id: editing }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Save failed.'); return }
      setProblems(prev =>
        isNew ? [json, ...prev] : prev.map(p => p.id === json.id ? json : p)
      )
      setEditing(null)
    })
  }

  async function toggleActive(p: SDProblemRow) {
    startTransition(async () => {
      const res = await fetch('/api/admin/sd-problems', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...p, is_active: !p.is_active }),
      })
      const json = await res.json()
      if (res.ok) setProblems(prev => prev.map(x => x.id === json.id ? json : x))
    })
  }

  async function remove(id: number) {
    if (!confirm('Delete this problem permanently? This cannot be undone.')) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/sd-problems?id=${id}`, { method: 'DELETE' })
      if (res.ok) setProblems(prev => prev.filter(p => p.id !== id))
      else { const j = await res.json(); setError(j.error ?? 'Delete failed.') }
    })
  }

  return (
    <div className="space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{problems.length} DB problem{problems.length !== 1 ? 's' : ''} (static problems load from code)</p>
        <button onClick={() => { setEditing('new'); setError('') }}
          disabled={editing !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-sm transition-colors">
          <Plus size={14} /> Add New Problem
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-300">{error}</div>
      )}

      {/* New / Edit form */}
      {editing !== null && editingProblem && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-orange-500/30">
          <h2 className="text-base font-bold text-zinc-100 mb-5">
            {editing === 'new' ? 'Add New System Design Problem' : `Edit: ${editingProblem.title}`}
          </h2>
          <ProblemForm initial={editingProblem} onSave={save} onCancel={() => setEditing(null)} saving={isPending} />
        </div>
      )}

      {/* Problem list */}
      {problems.length === 0 && editing === null && (
        <div className="text-center py-16 text-zinc-600 text-sm">
          No DB problems yet. Static problems from code are always loaded automatically.<br />
          Click <span className="text-orange-400">Add New Problem</span> to create additional ones.
        </div>
      )}

      <div className="space-y-2">
        {problems.map(p => (
          <div key={p.id} className={`rounded-xl border transition-colors ${p.is_active ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950 border-zinc-800/50 opacity-60'}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Difficulty badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${p.difficulty === 'Hard' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'}`}>
                {p.difficulty}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate">{p.title}</p>
                <p className="text-[11px] text-zinc-600 truncate">/system-design/{p.slug} · {p.category} · {p.companies.slice(0, 3).join(', ')}{p.companies.length > 3 ? '…' : ''}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleActive(p)} title={p.is_active ? 'Hide' : 'Show'}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {p.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {expanded === p.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button onClick={() => { setEditing(p.id); setError('') }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => remove(p.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Expanded preview */}
            {expanded === p.id && (
              <div className="px-4 pb-4 pt-1 border-t border-zinc-800 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <p className="text-zinc-600 font-bold uppercase tracking-wider mb-1">Key Areas</p>
                    <ul className="space-y-0.5">
                      {p.key_areas.map(k => <li key={k} className="text-zinc-400">• {k}</li>)}
                      {p.key_areas.length === 0 && <li className="text-zinc-700">none</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="text-zinc-600 font-bold uppercase tracking-wider mb-1">Constraints</p>
                    <ul className="space-y-0.5">
                      {p.constraints.map(c => <li key={c} className="text-zinc-400">• {c}</li>)}
                      {p.constraints.length === 0 && <li className="text-zinc-700">none</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="text-zinc-600 font-bold uppercase tracking-wider mb-1">Hints</p>
                    <ul className="space-y-0.5">
                      {p.hints.map(h => <li key={h} className="text-zinc-400">• {h}</li>)}
                      {p.hints.length === 0 && <li className="text-zinc-700">none</li>}
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="text-zinc-600 font-bold uppercase tracking-wider text-[11px] mb-1">Problem (first 300 chars)</p>
                  <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">{p.problem.slice(0, 300)}{p.problem.length > 300 ? '…' : ''}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
