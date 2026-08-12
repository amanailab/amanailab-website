'use client'

import { useState, useEffect, useRef } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import {
  Plus, Trash2, Eye, EyeOff, Loader2, CheckCircle,
  UploadCloud, X, FileText, ExternalLink, ImageIcon,
} from 'lucide-react'
import Image from 'next/image'
import PdfPreview from '@/components/notes/PdfPreview'
import type { Note } from '@/lib/notes-data'
import Link from 'next/link'

const GRADIENTS = [
  { label: 'Blue → Indigo',  value: 'from-blue-600 to-indigo-700' },
  { label: 'Purple',         value: 'from-purple-600 to-purple-800' },
  { label: 'Orange → Red',   value: 'from-orange-500 to-red-600'   },
  { label: 'Emerald → Teal', value: 'from-emerald-600 to-teal-700' },
  { label: 'Zinc',           value: 'from-zinc-500 to-zinc-700'    },
  { label: 'Yellow → Amber', value: 'from-yellow-500 to-amber-600' },
  { label: 'Pink → Rose',    value: 'from-pink-500 to-rose-600'    },
  { label: 'Cyan → Blue',    value: 'from-cyan-500 to-blue-600'    },
]

const EMPTY = {
  title: '', description: '', topic: '', pages: '', emoji: '📄',
  gradient: 'from-blue-600 to-indigo-700',
  preview_points: ['', '', '', '', ''],
  price: '99', is_new: false, sort_order: '0',
}

const INPUT = 'w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500/70 focus:bg-zinc-950 text-zinc-100 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all'

interface Uploaded { pdf_path: string; file_name: string; size: number }

function fmt(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`
}

export default function AdminNotesPage() {
  const [previewNote, setPreviewNote]   = useState<Note | null>(null)
  const [notes, setNotes]               = useState<Note[]>([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState(EMPTY)
  const [uploaded, setUploaded]         = useState<Uploaded | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [uploadPct, setUploadPct]       = useState(0)
  const [previewImg, setPreviewImg]     = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [banner, setBanner]             = useState<{ msg: string; ok: boolean } | null>(null)
  const [toggling, setToggling]         = useState<string | null>(null)
  const [deleting, setDeleting]         = useState<string | null>(null)
  const [dragOver, setDragOver]         = useState(false)
  const fileRef    = useRef<HTMLInputElement>(null)
  const imgRef     = useRef<HTMLInputElement>(null)

  function flash(msg: string, ok = true) {
    setBanner({ msg, ok }); setTimeout(() => setBanner(null), 4000)
  }

  async function loadNotes() {
    setLoading(true)
    const res = await fetch('/api/admin/notes')
    if (res.ok) setNotes(await res.json())
    setLoading(false)
  }
  useEffect(() => { loadNotes() }, [])

  async function handleFilePick(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      flash('PDF files only.', false); return
    }
    setUploading(true); setUploadPct(0); setBanner(null)
    // Fake progress for UX while real upload runs
    const timer = setInterval(() => setUploadPct((p) => Math.min(p + 8, 90)), 200)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res  = await fetch('/api/admin/notes/upload-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setUploadPct(100)
      setUploaded({ pdf_path: data.pdf_path, file_name: data.file_name, size: data.size })
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Upload failed', false)
    } finally {
      clearInterval(timer); setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]; if (file) handleFilePick(file)
  }

  async function handleImagePick(file: File) {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(file.type)) { flash('PNG, JPG or WebP only.', false); return }
    setUploadingImg(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res  = await fetch('/api/admin/notes/upload-preview', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setPreviewImg(data.preview_image)
      flash('Preview image uploaded!')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Image upload failed', false)
    } finally { setUploadingImg(false); if (imgRef.current) imgRef.current.value = '' }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!uploaded)          { flash('Upload a PDF first.', false); return }
    if (!form.title.trim()) { flash('Title is required.', false); return }
    if (!form.topic.trim()) { flash('Topic is required.', false); return }

    setSaving(true)
    try {
      const res  = await fetch('/api/admin/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pages:       Number(form.pages)      || 0,
          price:       Number(form.price)      || 99,
          sort_order:  Number(form.sort_order) || 0,
          preview_points: form.preview_points.filter((p) => p.trim()),
          pdf_path:    uploaded.pdf_path,
          ...(previewImg ? { preview_image: previewImg } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) { flash(data.error ?? 'Failed to save.', false); return }
      flash('Note published successfully!')
      setNotes((prev) => [data, ...prev])
      setShowForm(false); setForm(EMPTY); setUploaded(null); setPreviewImg(null)
    } finally { setSaving(false) }
  }

  async function toggleActive(note: Note) {
    setToggling(note.id)
    const res = await fetch('/api/admin/notes', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: note.id, is_active: !note.is_active }),
    })
    if (res.ok) {
      setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, is_active: !n.is_active } : n))
      flash(note.is_active ? 'Note hidden from public.' : 'Note is now live!')
    } else flash('Failed to update.', false)
    setToggling(null)
  }

  async function handleDelete(note: Note) {
    if (!confirm(`Delete "${note.title}"? This also removes the PDF from storage.`)) return
    setDeleting(note.id)
    const res = await fetch('/api/admin/notes', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: note.id }),
    })
    if (res.ok) { setNotes((prev) => prev.filter((n) => n.id !== note.id)); flash('Note deleted.') }
    else flash('Delete failed.', false)
    setDeleting(null)
  }

  const step1Done = !!uploaded
  const step2Done = !!(form.title.trim() && form.topic.trim())

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />

      {/* Toast */}
      {banner && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold border shadow-2xl transition-all ${
          banner.ok
            ? 'bg-zinc-900 border-emerald-500/30 text-emerald-400'
            : 'bg-zinc-900 border-red-500/30    text-red-400'
        }`}>
          {banner.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {banner.msg}
        </div>
      )}

      {/* ── PDF Preview Modal ── */}
      {previewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewNote(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${previewNote.gradient} flex items-center justify-center text-lg shrink-0`}>
                  {previewNote.emoji}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-100 truncate">{previewNote.title}</p>
                  <p className="text-xs text-zinc-600">{previewNote.pages} pages · {previewNote.topic}</p>
                </div>
              </div>
              <button onClick={() => setPreviewNote(null)}
                className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 rounded-lg flex items-center justify-center transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* PDF Preview — 2 pages for admin */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <PdfPreview noteId={previewNote.id} fade={false} pages={2} />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 flex flex-col gap-8">

          {/* ── Page Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Notes &amp; Study Guides</h1>
              <p className="text-zinc-600 text-sm mt-1">
                {notes.length} published ·{' '}
                <Link href="/notes" target="_blank" className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 transition-colors">
                  View live page <ExternalLink className="w-3 h-3" />
                </Link>
              </p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); if (showForm) { setForm(EMPTY); setUploaded(null); setPreviewImg(null) } }}
              className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
                showForm
                  ? 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300'
                  : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25'
              }`}
            >
              {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Note</>}
            </button>
          </div>

          {/* ── Add Note Form ── */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

              {/* Top step bar */}
              <div className="flex border-b border-zinc-800 bg-zinc-950/40">
                {[
                  { n: 1, label: 'Upload PDF',   done: step1Done, active: !step1Done },
                  { n: 2, label: 'Note Details', done: step2Done, active: step1Done && !step2Done },
                  { n: 3, label: 'Publish',      done: false,     active: step1Done && step2Done },
                ].map((s, i) => (
                  <div key={s.n} className={`flex-1 flex items-center gap-2.5 px-5 py-3.5 transition-colors ${
                    s.done ? 'bg-emerald-500/5 border-r border-zinc-800' : s.active ? 'bg-orange-500/5 border-r border-zinc-800' : 'border-r border-zinc-800'
                  } ${i === 2 ? 'border-r-0' : ''}`}>
                    <div className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 transition-colors ${
                      s.done ? 'bg-emerald-500 text-white' : s.active ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-600'
                    }`}>{s.done ? '✓' : s.n}</div>
                    <span className={`text-xs font-bold transition-colors ${s.done ? 'text-emerald-400' : s.active ? 'text-orange-400' : 'text-zinc-600'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Two-panel layout */}
              <div className="flex flex-col lg:flex-row">

                {/* LEFT — Upload panel */}
                <div className="lg:w-72 xl:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 p-6 flex flex-col gap-5">
                  <div>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Step 1</p>
                    <p className="text-sm font-bold text-zinc-200">Upload your PDF</p>
                  </div>

                  <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFilePick(f) }} />

                  {/* Drop zone / status */}
                  {!uploaded ? (
                    <button type="button"
                      onClick={() => !uploading && fileRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      disabled={uploading}
                      className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-10 px-4 text-center transition-all w-full ${
                        dragOver ? 'border-orange-500 bg-orange-500/10' : uploading ? 'border-zinc-700 cursor-not-allowed' : 'border-zinc-700 hover:border-orange-500/50 hover:bg-zinc-800/50 cursor-pointer'
                      }`}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-3 w-full px-2">
                          <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
                          <p className="text-sm font-semibold text-orange-400">Uploading…</p>
                          {/* Progress bar */}
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadPct}%` }} />
                          </div>
                          <p className="text-xs text-zinc-600">{uploadPct}%</p>
                        </div>
                      ) : (
                        <>
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${dragOver ? 'bg-orange-500/20 scale-110' : 'bg-zinc-800'}`}>
                            <UploadCloud className={`w-8 h-8 transition-colors ${dragOver ? 'text-orange-400' : 'text-zinc-500'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-300 mb-1">
                              {dragOver ? 'Drop it here!' : 'Drag PDF here'}
                            </p>
                            <p className="text-xs text-zinc-600">or <span className="text-orange-400 font-semibold">click to browse</span></p>
                          </div>
                          <span className="text-[10px] text-zinc-700 bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full">PDF only · Max 50 MB</span>
                        </>
                      )}
                    </button>
                  ) : (
                    /* Success state */
                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="text-sm font-bold text-emerald-400">Uploaded!</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 truncate">{uploaded.file_name}</p>
                          <p className="text-xs text-zinc-600 mt-0.5">{fmt(uploaded.size)}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setUploaded(null); fileRef.current?.click() }}
                        className="text-xs font-bold text-zinc-500 hover:text-orange-400 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-1.5 rounded-lg transition-all">
                        Replace file
                      </button>
                    </div>
                  )}

                  {/* Live card preview */}
                  <div className="mt-auto">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Card Preview</p>
                    <div className={`rounded-xl overflow-hidden border border-zinc-800 bg-gradient-to-br ${form.gradient}`}>
                      <div className="p-4 flex items-end justify-between h-20 relative">
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute inset-0 opacity-10"
                          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <span className="text-4xl relative z-10">{form.emoji}</span>
                        {form.is_new && <span className="relative z-10 text-[9px] font-black text-white bg-white/20 border border-white/20 px-2 py-0.5 rounded-full uppercase">NEW</span>}
                      </div>
                      <div className="bg-zinc-900 p-3">
                        <p className="text-xs font-extrabold text-zinc-200 truncate">{form.title || 'Note Title'}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{form.topic || 'Topic'} · {form.pages || '0'}p · ₹{form.price}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Details form */}
                <div className={`flex-1 p-6 flex flex-col gap-5 transition-opacity duration-200 ${!uploaded ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                  <div>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Step 2</p>
                    <p className="text-sm font-bold text-zinc-200">Fill in note details</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <F label="Title *">
                      <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="DSA Complete Notes" required className={INPUT} />
                    </F>
                    <F label="Topic *">
                      <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                        placeholder="DSA / Machine Learning / Python…" required className={INPUT} />
                    </F>
                    <F label="Description" className="sm:col-span-2">
                      <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Short description shown on the card" className={INPUT} />
                    </F>
                    <F label="Pages">
                      <input type="number" min={0} value={form.pages}
                        onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))}
                        placeholder="48" className={INPUT} />
                    </F>
                    <F label="Price (₹)">
                      <input type="number" min={1} value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                        placeholder="99" className={INPUT} />
                    </F>
                    <F label="Emoji">
                      <input value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                        placeholder="📄" className={INPUT} />
                    </F>
                    <F label="Card Gradient">
                      <select value={form.gradient} onChange={(e) => setForm((f) => ({ ...f, gradient: e.target.value }))} className={INPUT}>
                        {GRADIENTS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </F>
                    <F label="Sort Order" className="sm:col-span-2">
                      <input type="number" min={0} value={form.sort_order}
                        onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                        placeholder="0 = first" className={INPUT} />
                    </F>
                  </div>

                  {/* Preview points */}
                  <F label="What's inside — up to 5 bullet points">
                    <div className="flex flex-col gap-2">
                      {form.preview_points.map((pt, i) => (
                        <div key={i} className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">✓</span>
                          <input value={pt}
                            onChange={(e) => setForm((f) => ({
                              ...f, preview_points: f.preview_points.map((p, j) => j === i ? e.target.value : p),
                            }))}
                            placeholder={`Point ${i + 1}: "Arrays, Stacks & Queues"`}
                            className={INPUT + ' pl-8'} />
                        </div>
                      ))}
                    </div>
                  </F>

                  {/* Preview image upload */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Preview Image <span className="text-zinc-700 normal-case font-normal">(optional — screenshot of first page)</span>
                    </label>
                    <input ref={imgRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImagePick(f) }} />
                    {previewImg ? (
                      <div className="flex items-start gap-3">
                        <div className="relative w-24 h-32 rounded-xl overflow-hidden border border-zinc-700 shrink-0">
                          <Image src={previewImg} alt="Preview" fill className="object-cover" />
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                          <p className="text-xs text-emerald-400 font-semibold">✓ Preview image uploaded</p>
                          <button type="button" onClick={() => setPreviewImg(null)}
                            className="text-xs font-bold text-zinc-500 hover:text-red-400 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-all w-fit">
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => imgRef.current?.click()} disabled={uploadingImg}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-4 py-3 rounded-xl transition-all w-full justify-center">
                        {uploadingImg
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading image…</>
                          : <><ImageIcon className="w-4 h-4" /> Upload sample page screenshot (PNG / JPG)</>}
                      </button>
                    )}
                  </div>

                  {/* "New" badge toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group w-fit">
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${form.is_new ? 'bg-orange-500' : 'bg-zinc-700'}`}
                      onClick={() => setForm((f) => ({ ...f, is_new: !f.is_new }))}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_new ? 'left-5' : 'left-1'}`} />
                    </div>
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">Show &quot;New&quot; badge on card</span>
                  </label>

                  {/* Step 3 — Publish */}
                  <div className="mt-auto pt-4 border-t border-zinc-800">
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Step 3 — Publish</p>
                    <button type="submit" disabled={saving || uploading || !uploaded}
                      className="w-full flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20">
                      {saving
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Publishing…</>
                        : !uploaded
                          ? <><UploadCloud className="w-5 h-5" /> Upload a PDF first to publish</>
                          : <><CheckCircle className="w-5 h-5" /> Publish Note</>}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ── Notes List ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-300">All Notes</h2>
              <span className="text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">{notes.length} total</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-zinc-600 text-sm">Loading notes…</p>
                </div>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-400 font-bold mb-1">No notes yet</p>
                <p className="text-zinc-600 text-sm">Click &quot;Add Note&quot; above to publish your first note.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {notes.map((note) => (
                  <div key={note.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/30 transition-colors group">
                    {/* Gradient swatch */}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${note.gradient} flex items-center justify-center text-xl shrink-0`}>
                      {note.emoji}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-zinc-100 truncate">{note.title}</p>
                        {note.is_new && <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full uppercase shrink-0">New</span>}
                      </div>
                      <p className="text-xs text-zinc-600 truncate font-mono">{note.pdf_path.split('/').pop()}</p>
                    </div>
                    {/* Topic */}
                    <span className="hidden sm:block text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 shrink-0">
                      {note.topic}
                    </span>
                    {/* Price */}
                    <span className="text-sm font-bold text-zinc-300 shrink-0">₹{note.price}</span>
                    {/* Status */}
                    <div className="shrink-0">
                      {note.is_active
                        ? <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">● Live</span>
                        : <span className="text-[10px] font-black text-zinc-500 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">○ Hidden</span>}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setPreviewNote(note)}
                        title="Preview PDF"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleActive(note)} disabled={toggling === note.id}
                        title={note.is_active ? 'Hide' : 'Make live'}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-all disabled:opacity-40">
                        {toggling === note.id ? <Loader2 className="w-4 h-4 animate-spin" /> : note.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(note)} disabled={deleting === note.id}
                        title="Delete"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40">
                        {deleting === note.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

function F({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}
