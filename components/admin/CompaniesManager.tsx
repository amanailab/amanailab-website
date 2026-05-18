'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Check, X, Star, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { createCompany, updateCompany, deleteCompany, type CompanyInput } from '@/lib/admin-actions'
import type { AdminCompany } from '@/app/admin/companies/page'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputBase =
  'w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors'

const SIZE_OPTIONS = ['Startup', 'Mid-size', 'Large', 'Big Tech']

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Dynamic list editor ──────────────────────────────────────────────────────

function DynamicList({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  function update(idx: number, val: string) {
    const next = [...items]
    next[idx] = val
    onChange(next)
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }
  function add() {
    onChange([...items, ''])
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</label>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <textarea
            value={item}
            onChange={(e) => update(idx, e.target.value)}
            rows={2}
            className={`${inputBase} resize-y flex-1`}
            placeholder={`${label} ${idx + 1}`}
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="self-start p-2 rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Plus className="w-3 h-3" /> Add {label}
      </button>
    </div>
  )
}

// ─── Add Company Form ──────────────────────────────────────────────────────────

const EMPTY_FORM: CompanyInput = {
  name: '',
  slug: '',
  logo_emoji: '',
  tagline: '',
  description: '',
  hq: '',
  size: 'Startup',
  interview_rounds: 3,
  interview_format: '',
  what_they_look_for: [],
  tips: [],
  is_featured: false,
}

function AddCompanyForm({
  onCreated,
  onCancel,
}: {
  onCreated: (company: AdminCompany) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<CompanyInput>(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required.')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await createCompany(form)
      if ('error' in res && res.error) {
        setError(res.error)
        return
      }
      // Optimistic: generate a temporary negative id; server will revalidate
      onCreated({
        id: -Date.now(),
        name: form.name,
        slug: form.slug,
        logo_emoji: form.logo_emoji,
        tagline: form.tagline,
        description: form.description,
        hq: form.hq,
        size: form.size,
        interview_rounds: form.interview_rounds,
        what_they_look_for: form.what_they_look_for,
        tips: form.tips,
        is_featured: form.is_featured,
      })
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-zinc-100">Add Company</h2>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Row 1: name + emoji */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Google"
            className={inputBase}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Logo Emoji</label>
          <input
            type="text"
            value={form.logo_emoji}
            onChange={(e) => set('logo_emoji', e.target.value)}
            placeholder="🔍"
            className={inputBase}
          />
        </div>
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Slug *</label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => set('slug', e.target.value)}
          placeholder="auto-generated from name"
          className={inputBase}
          required
        />
      </div>

      {/* Tagline */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Tagline</label>
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => set('tagline', e.target.value)}
          placeholder="Short one-liner"
          className={inputBase}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Longer description of the company"
          className={`${inputBase} resize-y`}
        />
      </div>

      {/* HQ + Size + Rounds */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">HQ</label>
          <input
            type="text"
            value={form.hq}
            onChange={(e) => set('hq', e.target.value)}
            placeholder="e.g. Mountain View, CA"
            className={inputBase}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Size</label>
          <select
            value={form.size}
            onChange={(e) => set('size', e.target.value)}
            className={inputBase}
          >
            {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Interview Rounds</label>
          <input
            type="number"
            min={1}
            max={8}
            value={form.interview_rounds}
            onChange={(e) => set('interview_rounds', Number(e.target.value))}
            className={inputBase}
          />
        </div>
      </div>

      {/* What they look for */}
      <DynamicList
        label="What They Look For"
        items={form.what_they_look_for}
        onChange={(items) => set('what_they_look_for', items)}
      />

      {/* Tips */}
      <DynamicList
        label="Tips"
        items={form.tips}
        onChange={(items) => set('tips', items)}
      />

      {/* Featured */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_featured}
          onChange={(e) => set('is_featured', e.target.checked)}
          className="w-4 h-4 rounded accent-orange-500"
        />
        <span className="text-sm text-zinc-300">Featured company</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          {isPending ? 'Saving…' : 'Create Company'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────

function EditPanel({
  company,
  onSave,
  onCancel,
  isPending,
}: {
  company: AdminCompany
  onSave: (draft: Partial<CompanyInput>) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [draft, setDraft] = useState<Partial<CompanyInput>>({
    name: company.name,
    slug: company.slug,
    logo_emoji: company.logo_emoji,
    tagline: company.tagline,
    description: company.description,
    hq: company.hq,
    size: company.size,
    interview_rounds: company.interview_rounds,
    what_they_look_for: [...(company.what_they_look_for ?? [])],
    tips: [...(company.tips ?? [])],
    is_featured: company.is_featured,
  })

  function set<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <tr>
      <td colSpan={8} className="px-4 pb-4">
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 flex flex-col gap-4 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Name</label>
              <input type="text" value={draft.name ?? ''} onChange={(e) => set('name', e.target.value)} className={inputBase} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Slug</label>
              <input type="text" value={draft.slug ?? ''} onChange={(e) => set('slug', e.target.value)} className={inputBase} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Logo Emoji</label>
              <input type="text" value={draft.logo_emoji ?? ''} onChange={(e) => set('logo_emoji', e.target.value)} className={inputBase} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Tagline</label>
            <input type="text" value={draft.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} className={inputBase} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Description</label>
            <textarea value={draft.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={3} className={`${inputBase} resize-y`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">HQ</label>
              <input type="text" value={draft.hq ?? ''} onChange={(e) => set('hq', e.target.value)} className={inputBase} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Size</label>
              <select value={draft.size ?? 'Startup'} onChange={(e) => set('size', e.target.value)} className={inputBase}>
                {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Interview Rounds</label>
              <input type="number" min={1} max={8} value={draft.interview_rounds ?? 3} onChange={(e) => set('interview_rounds', Number(e.target.value))} className={inputBase} />
            </div>
          </div>
          <DynamicList
            label="What They Look For"
            items={draft.what_they_look_for ?? []}
            onChange={(items) => set('what_they_look_for', items)}
          />
          <DynamicList
            label="Tips"
            items={draft.tips ?? []}
            onChange={(items) => set('tips', items)}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={draft.is_featured ?? false} onChange={(e) => set('is_featured', e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
            <span className="text-sm text-zinc-300">Featured company</span>
          </label>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onSave(draft)}
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> {isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onCancel} className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompaniesManager({ initial }: { initial: AdminCompany[] }) {
  const [companies, setCompanies] = useState(initial)
  const [editId, setEditId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<string | null>(null)

  function showBanner(msg: string) {
    setBanner(msg)
    setTimeout(() => setBanner(null), 3000)
  }

  function handleSave(id: number, draft: Partial<CompanyInput>) {
    startTransition(async () => {
      const res = await updateCompany(id, draft)
      if ('error' in res && res.error) return
      setCompanies((c) => c.map((x) => x.id === id ? { ...x, ...draft } as AdminCompany : x))
      setEditId(null)
      showBanner('Saved.')
    })
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this company and all its questions?')) return
    startTransition(async () => {
      const res = await deleteCompany(id)
      if ('error' in res && res.error) return
      setCompanies((c) => c.filter((x) => x.id !== id))
    })
  }

  function toggleFeatured(company: AdminCompany) {
    startTransition(async () => {
      await updateCompany(company.id, { is_featured: !company.is_featured })
      setCompanies((c) => c.map((x) => x.id === company.id ? { ...x, is_featured: !x.is_featured } : x))
    })
  }

  function handleCreated(company: AdminCompany) {
    setCompanies((c) => [company, ...c])
    setShowAdd(false)
    showBanner('Company created.')
  }

  return (
    <div className="flex flex-col gap-4">
      {banner && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">{banner}</div>
      )}

      {/* Header row with Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{companies.length} {companies.length === 1 ? 'company' : 'companies'}</p>
        <button
          onClick={() => { setShowAdd((v) => !v); setEditId(null) }}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {showAdd ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancel' : 'Add Company'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <AddCompanyForm
          onCreated={handleCreated}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['', 'Name', 'Slug', 'HQ', 'Size', 'Rounds', 'Featured', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">No companies yet.</td>
              </tr>
            )}
            {companies.map((c) => (
              <>
                <tr key={c.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 ${editId === c.id ? 'bg-zinc-800/30' : ''}`}>
                  <td className="px-4 py-3 text-2xl">{c.logo_emoji}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-zinc-200">{c.name}</span>
                    {c.tagline && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{c.tagline}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{c.slug}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.hq}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.size}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.interview_rounds}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFeatured(c)}
                      className={`p-1.5 rounded transition-colors ${c.is_featured ? 'text-yellow-400 bg-yellow-500/10' : 'text-zinc-600 hover:text-yellow-400'}`}
                    >
                      <Star className="w-4 h-4" fill={c.is_featured ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditId(editId === c.id ? null : c.id)}
                        className={`p-1.5 rounded transition-colors ${editId === c.id ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'}`}
                      >
                        {editId === c.id ? <ChevronUp className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {editId === c.id && (
                  <EditPanel
                    key={`edit-${c.id}`}
                    company={c}
                    onSave={(draft) => handleSave(c.id, draft)}
                    onCancel={() => setEditId(null)}
                    isPending={isPending}
                  />
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
