'use client'

import { useState, useEffect, useTransition } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { updateCompany, deleteCompany } from '@/lib/admin-actions'
import { Pencil, Trash2, Check, X, Star } from 'lucide-react'

interface Company {
  id: number; name: string; slug: string; logo_emoji: string
  tagline: string; hq: string; size: string; interview_rounds: number
  is_featured: boolean
}

function CompaniesManager({ initial }: { initial: Company[] }) {
  const [companies, setCompanies] = useState(initial)
  const [editId, setEditId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partial<Company>>({})
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<string | null>(null)

  function showBanner(msg: string) { setBanner(msg); setTimeout(() => setBanner(null), 3000) }

  async function handleSave(id: number) {
    startTransition(async () => {
      const res = await updateCompany(id, draft)
      if ('error' in res) return
      setCompanies(c => c.map(x => x.id === id ? { ...x, ...draft } : x))
      setEditId(null)
      showBanner('Saved.')
    })
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this company and all its questions?')) return
    startTransition(async () => {
      const res = await deleteCompany(id)
      if ('error' in res) return
      setCompanies(c => c.filter(x => x.id !== id))
    })
  }

  async function toggleFeatured(company: Company) {
    startTransition(async () => {
      await updateCompany(company.id, { is_featured: !company.is_featured })
      setCompanies(c => c.map(x => x.id === company.id ? { ...x, is_featured: !x.is_featured } : x))
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {banner && <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">{banner}</div>}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['', 'Name', 'Slug', 'HQ', 'Size', 'Rounds', 'Featured', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                <td className="px-4 py-3 text-2xl">{c.logo_emoji}</td>
                <td className="px-4 py-3">
                  {editId === c.id
                    ? <input value={draft.name ?? c.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 outline-none w-36" />
                    : <span className="font-semibold text-zinc-200">{c.name}</span>}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{c.slug}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {editId === c.id
                    ? <input value={draft.hq ?? c.hq} onChange={e => setDraft(d => ({ ...d, hq: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 outline-none w-32" />
                    : c.hq}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{c.size}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{c.interview_rounds}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleFeatured(c)} className={`p-1.5 rounded transition-colors ${c.is_featured ? 'text-yellow-400 bg-yellow-500/10' : 'text-zinc-600 hover:text-yellow-400'}`}>
                    <Star className="w-4 h-4" fill={c.is_featured ? 'currentColor' : 'none'} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  {editId === c.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleSave(c.id)} disabled={isPending} className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditId(c.id); setDraft(c) }} className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(c.id)} disabled={isPending} className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/companies-list')
      .then(r => r.json())
      .then(d => { setCompanies(d.companies ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Companies</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage company profiles. Add questions in Company Q&apos;s tab.</p>
          </div>
          {loading ? <p className="text-zinc-500">Loading…</p> : <CompaniesManager initial={companies} />}
        </div>
      </main>
    </div>
  )
}
