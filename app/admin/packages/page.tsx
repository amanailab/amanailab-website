'use client'

import { useState, useEffect } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import {
  Plus, Trash2, Eye, EyeOff, Loader2, CheckCircle, X, ExternalLink,
  UploadCloud, FileText,
} from 'lucide-react'
import { Crown } from 'lucide-react'
import type { Note, NotePackage } from '@/lib/notes-data'
import Link from 'next/link'
import { useRef } from 'react'

const GRADIENTS = [
  { label: 'Orange → Red',   value: 'from-orange-500 to-red-600'   },
  { label: 'Blue → Indigo',  value: 'from-blue-600 to-indigo-700'  },
  { label: 'Purple',         value: 'from-purple-600 to-purple-800' },
  { label: 'Emerald → Teal', value: 'from-emerald-600 to-teal-700' },
  { label: 'Zinc',           value: 'from-zinc-500 to-zinc-700'    },
  { label: 'Yellow → Amber', value: 'from-yellow-500 to-amber-600' },
  { label: 'Pink → Rose',    value: 'from-pink-500 to-rose-600'    },
  { label: 'Cyan → Blue',    value: 'from-cyan-500 to-blue-600'    },
]

const EMPTY = {
  title: '', description: '', price: '399', emoji: '📦',
  gradient: 'from-orange-500 to-red-600', sort_order: '0',
}

const INPUT = 'w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500/70 text-zinc-100 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all'

function F({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function AdminPackagesPage() {
  const [packages, setPackages]           = useState<NotePackage[]>([])
  const [notes, setNotes]                 = useState<Note[]>([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm]                   = useState(EMPTY)
  const [selectedIds, setSelectedIds]     = useState<string[]>([])
  const [saving, setSaving]               = useState(false)
  const [toggling, setToggling]           = useState<string | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  const [banner, setBanner]               = useState<{ msg: string; ok: boolean } | null>(null)
  const [quickTitle, setQuickTitle]       = useState('')
  const [quickUploading, setQuickUploading] = useState(false)
  const [showQuickUpload, setShowQuickUpload] = useState(false)
  const quickFileRef = useRef<HTMLInputElement>(null)

  function flash(msg: string, ok = true) {
    setBanner({ msg, ok }); setTimeout(() => setBanner(null), 4000)
  }

  async function load() {
    setLoading(true)
    const [pkgRes, noteRes] = await Promise.all([
      fetch('/api/admin/packages'),
      fetch('/api/admin/notes'),
    ])
    if (pkgRes.ok)  setPackages(await pkgRes.json())
    if (noteRes.ok) setNotes(await noteRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function toggleNote(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id])
  }

  async function handleQuickUpload(file: File) {
    if (!quickTitle.trim()) { flash('Enter a title for this PDF first.', false); return }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      flash('PDF files only.', false); return
    }
    setQuickUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const upRes  = await fetch('/api/admin/notes/upload-pdf', { method: 'POST', body: fd })
      const upData = await upRes.json()
      if (!upRes.ok) throw new Error(upData.error ?? 'Upload failed')

      // Create as a bundle-only note (hidden from public /notes page)
      const noteRes  = await fetch('/api/admin/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       quickTitle.trim(),
          topic:       'Bundle Only',
          pdf_path:    upData.pdf_path,
          is_new:      false,
          is_active:   false,
        }),
      })
      const newNote = await noteRes.json()
      if (!noteRes.ok) throw new Error(newNote.error ?? 'Failed to create note')

      setNotes(prev => [...prev, newNote])
      setSelectedIds(prev => [...prev, newNote.id])
      setQuickTitle(''); setShowQuickUpload(false)
      flash(`"${newNote.title}" uploaded and added to bundle!`)
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Upload failed', false)
    } finally {
      setQuickUploading(false)
      if (quickFileRef.current) quickFileRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim())    { flash('Title is required.', false); return }
    if (!selectedIds.length)   { flash('Select at least one note.', false); return }

    setSaving(true)
    try {
      const res  = await fetch('/api/admin/packages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price:      Number(form.price) || 399,
          sort_order: Number(form.sort_order) || 0,
          note_ids:   selectedIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) { flash(data.error ?? 'Failed to save.', false); return }
      flash('Bundle created!')
      setPackages(prev => [data, ...prev])
      setShowForm(false); setForm(EMPTY); setSelectedIds([])
    } finally { setSaving(false) }
  }

  async function toggleActive(pkg: NotePackage) {
    setToggling(pkg.id)
    const res = await fetch('/api/admin/packages', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pkg.id, is_active: !pkg.is_active }),
    })
    if (res.ok) {
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, is_active: !p.is_active } : p))
      flash(pkg.is_active ? 'Bundle hidden.' : 'Bundle is now live!')
    } else flash('Failed to update.', false)
    setToggling(null)
  }

  async function handleDelete(pkg: NotePackage) {
    if (!confirm(`Delete "${pkg.title}"?`)) return
    setDeleting(pkg.id)
    const res = await fetch('/api/admin/packages', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pkg.id }),
    })
    if (res.ok) { setPackages(prev => prev.filter(p => p.id !== pkg.id)); flash('Deleted.') }
    else flash('Delete failed.', false)
    setDeleting(null)
  }

  function getSavings(pkg: NotePackage) {
    const pkgNotes = notes.filter(n => pkg.note_ids.includes(n.id))
    const individual = pkgNotes.reduce((s, n) => s + n.price, 0)
    return individual - pkg.price
  }

  const selectedNotes      = notes.filter(n => selectedIds.includes(n.id))
  const selectedIndividual = selectedNotes.reduce((s, n) => s + n.price, 0)
  const selectedSavings    = selectedIndividual - Number(form.price || 399)

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />

      {banner && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold border shadow-2xl transition-all ${
          banner.ok ? 'bg-zinc-900 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900 border-red-500/30 text-red-400'
        }`}>
          {banner.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {banner.msg}
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 flex flex-col gap-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">PDF Bundles</h1>
              <p className="text-zinc-600 text-sm mt-1">
                {packages.length} bundles ·{' '}
                <Link href="/notes" target="_blank" className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 transition-colors">
                  View live page <ExternalLink className="w-3 h-3" />
                </Link>
              </p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); if (showForm) { setForm(EMPTY); setSelectedIds([]) } }}
              className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
                showForm
                  ? 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300'
                  : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25'
              }`}
            >
              {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Bundle</>}
            </button>
          </div>

          {/* Add bundle form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
              <p className="text-sm font-bold text-zinc-200">New Bundle</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Title *" className="sm:col-span-2">
                  <input value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Generative AI Interview Pack" required className={INPUT} />
                </F>
                <F label="Description" className="sm:col-span-2">
                  <input value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Everything you need for GenAI interviews" className={INPUT} />
                </F>
                <F label="Price (₹)">
                  <input type="number" min={1} value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={INPUT} />
                </F>
                <F label="Emoji">
                  <input value={form.emoji}
                    onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} className={INPUT} />
                </F>
                <F label="Card Gradient">
                  <select value={form.gradient}
                    onChange={e => setForm(f => ({ ...f, gradient: e.target.value }))} className={INPUT}>
                    {GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </F>
                <F label="Sort Order">
                  <input type="number" min={0} value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className={INPUT} />
                </F>
              </div>

              {/* Note selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  Select Notes to Include *{' '}
                  <span className="text-zinc-700 normal-case font-normal">({selectedIds.length} selected)</span>
                </label>
                {notes.length === 0 ? (
                  <p className="text-zinc-600 text-sm">No notes yet — upload a new PDF below or add notes at /admin/notes first.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {notes.map(note => {
                      const selected = selectedIds.includes(note.id)
                      return (
                        <button key={note.id} type="button" onClick={() => toggleNote(note.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            selected
                              ? 'bg-orange-500/10 border-orange-500/30'
                              : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                            selected ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'
                          }`}>
                            {selected && <span className="text-white text-[8px] font-black leading-none">✓</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-200 truncate">{note.title}</p>
                            <p className="text-[10px] text-zinc-600">
                              {note.is_active ? note.topic : <span className="text-orange-400">Bundle-only (hidden)</span>} · ₹{note.price}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Quick upload a brand new PDF for this bundle */}
                <input ref={quickFileRef} type="file" accept="application/pdf,.pdf" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleQuickUpload(f) }} />

                {showQuickUpload ? (
                  <div className="border border-dashed border-zinc-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-zinc-400">Upload new PDF to bundle</p>
                      <button type="button" onClick={() => setShowQuickUpload(false)}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input value={quickTitle} onChange={e => setQuickTitle(e.target.value)}
                      placeholder="PDF title (e.g. System Design Cheatsheet)"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500/70 text-zinc-100 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all" />
                    <button type="button" disabled={quickUploading || !quickTitle.trim()}
                      onClick={() => quickFileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border border-zinc-700 text-zinc-300 text-xs font-bold py-2.5 rounded-xl transition-all">
                      {quickUploading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                        : <><UploadCloud className="w-4 h-4" /> Choose PDF &amp; upload</>}
                    </button>
                    <p className="text-[10px] text-zinc-700">This PDF will be hidden from the public /notes page — bundle only.</p>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowQuickUpload(true)}
                    className="flex items-center justify-center gap-2 w-full border border-dashed border-zinc-700 hover:border-orange-500/40 bg-zinc-800/30 hover:bg-orange-500/5 text-zinc-500 hover:text-orange-400 text-xs font-semibold py-2.5 rounded-xl transition-all">
                    <UploadCloud className="w-4 h-4" />
                    Upload new PDF for this bundle
                  </button>
                )}
              </div>

              {/* Savings preview */}
              {selectedIds.length > 0 && (
                <div className="bg-zinc-800/40 border border-zinc-700 rounded-xl p-4 text-sm space-y-1.5">
                  <div className="flex justify-between text-zinc-500">
                    <span>{selectedIds.length} PDFs in bundle</span>
                    <span>Individual total: ₹{selectedIndividual}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Bundle price</span>
                    <span className="text-orange-400 font-bold">₹{form.price}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-700 pt-1.5">
                    <span className="font-bold text-zinc-300">Customer saves</span>
                    <span className={`font-extrabold ${selectedSavings > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedSavings > 0 ? `₹${selectedSavings}` : '⚠ Price too high — no savings'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-xs text-zinc-600 bg-orange-500/5 border border-orange-500/15 rounded-xl px-4 py-3">
                <Crown className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                YouTube members get bundle free with their monthly code — same as individual notes.
              </div>

              <button type="submit" disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20">
                {saving
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
                  : <><CheckCircle className="w-5 h-5" /> Create Bundle</>}
              </button>
            </form>
          )}

          {/* Packages list */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-300">All Bundles</h2>
              <span className="text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">
                {packages.length} total
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-zinc-400 font-bold mb-1">No bundles yet</p>
                <p className="text-zinc-600 text-sm">Click &quot;Add Bundle&quot; to create your first package.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {packages.map(pkg => {
                  const save = getSavings(pkg)
                  return (
                    <div key={pkg.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/30 transition-colors group">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center text-xl shrink-0`}>
                        {pkg.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-100 truncate">{pkg.title}</p>
                        <p className="text-xs text-zinc-600">
                          {pkg.note_ids.length} PDFs
                          {save > 0 ? ` · saves ₹${save} vs individual` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-orange-400 shrink-0">₹{pkg.price}</span>
                      <div className="shrink-0">
                        {pkg.is_active
                          ? <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">● Live</span>
                          : <span className="text-[10px] font-black text-zinc-500 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">○ Hidden</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleActive(pkg)} disabled={toggling === pkg.id}
                          title={pkg.is_active ? 'Hide' : 'Make live'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-all disabled:opacity-40">
                          {toggling === pkg.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : pkg.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(pkg)} disabled={deleting === pkg.id}
                          title="Delete"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40">
                          {deleting === pkg.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
