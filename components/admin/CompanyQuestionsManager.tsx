'use client'

import { useState, useTransition, useMemo } from 'react'
import { Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react'
import {
  createCompanyQuestion, updateCompanyQuestion, deleteCompanyQuestion,
  type CompanyQuestionInput,
} from '@/lib/admin-actions'

interface Company { id: number; name: string }
interface CQ { id: number; company_id: number; question: string; model_answer: string; topic: string; level: string }

const TOPICS = ['LLM','RAG','Agents','Fine-Tuning','MLOps','Transformers','System Design','Python','Vector DB','Computer Vision','NLP','Statistics','SQL & Data','Behavioral']
const LEVELS = ['Fresher','Mid','Senior']

interface Props { initialQuestions: CQ[]; companies: Company[] }

export default function CompanyQuestionsManager({ initialQuestions, companies }: Props) {
  const [questions, setQuestions] = useState<CQ[]>(initialQuestions)
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partial<CQ>>({})
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [filterTopic, setFilterTopic] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [page, setPage] = useState(0)
  const PAGE = 20

  // Add form state
  const [form, setForm] = useState<CompanyQuestionInput>({
    company_id: companies[0]?.id ?? 0,
    question: '', model_answer: '',
    topic: TOPICS[0], level: LEVELS[1],
  })

  function showBanner(type: 'success' | 'error', msg: string) {
    setBanner({ type, msg })
    if (type === 'success') setTimeout(() => setBanner(null), 3500)
  }

  const filtered = useMemo(() => questions.filter(q =>
    (filterCompany === 'all' || String(q.company_id) === filterCompany) &&
    (filterTopic === 'all' || q.topic === filterTopic) &&
    (filterLevel === 'all' || q.level === filterLevel)
  ), [questions, filterCompany, filterTopic, filterLevel])

  const paginated = filtered.slice(page * PAGE, (page + 1) * PAGE)
  const totalPages = Math.ceil(filtered.length / PAGE)

  function companyName(id: number) { return companies.find(c => c.id === id)?.name ?? '—' }

  async function handleAdd() {
    if (!form.question.trim() || !form.model_answer.trim()) return showBanner('error', 'Question and answer required.')
    startTransition(async () => {
      const res = await createCompanyQuestion(form)
      if ('error' in res) return showBanner('error', res.error ?? 'Error')
      const newQ: CQ = { id: Date.now(), ...form }
      setQuestions(prev => [newQ, ...prev])
      setForm(f => ({ ...f, question: '', model_answer: '' }))
      showBanner('success', 'Question added.')
    })
  }

  async function handleSave(id: number) {
    startTransition(async () => {
      const res = await updateCompanyQuestion(id, draft)
      if ('error' in res) return showBanner('error', res.error ?? 'Error')
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...draft } : q))
      setEditId(null)
      showBanner('success', 'Saved.')
    })
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this question?')) return
    startTransition(async () => {
      const res = await deleteCompanyQuestion(id)
      if ('error' in res) return showBanner('error', res.error ?? 'Error')
      setQuestions(prev => prev.filter(q => q.id !== id))
      showBanner('success', 'Deleted.')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {banner && (
        <div className={`px-4 py-3 rounded-xl text-sm flex items-center justify-between ${banner.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {banner.msg}
          <button onClick={() => setBanner(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-zinc-100 mb-4">Add Company Question</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <select value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: Number(e.target.value) }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none">
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none">
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none">
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Question" rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none resize-none mb-3" />
        <textarea value={form.model_answer} onChange={e => setForm(f => ({ ...f, model_answer: e.target.value }))} placeholder="Model answer" rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none resize-none mb-3" />
        <button onClick={handleAdd} disabled={isPending} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterCompany} onChange={e => { setFilterCompany(e.target.value); setPage(0) }} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none">
          <option value="all">All Companies</option>
          {companies.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        <select value={filterTopic} onChange={e => { setFilterTopic(e.target.value); setPage(0) }} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none">
          <option value="all">All Topics</option>
          {TOPICS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(0) }} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none">
          <option value="all">All Levels</option>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <span className="text-xs text-zinc-500 self-center">{filtered.length} questions</span>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Company','Question','Topic','Level','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(q => (
              <tr key={q.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{companyName(q.company_id)}</td>
                <td className="px-4 py-3 max-w-xs">
                  {editId === q.id
                    ? <textarea value={draft.question ?? q.question} onChange={e => setDraft(d => ({ ...d, question: e.target.value }))} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 outline-none resize-none" />
                    : <p className="text-zinc-200 line-clamp-2">{q.question}</p>
                  }
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {editId === q.id
                    ? <select value={draft.topic ?? q.topic} onChange={e => setDraft(d => ({ ...d, topic: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 outline-none">
                        {TOPICS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    : <span className="text-xs text-zinc-400">{q.topic}</span>
                  }
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {editId === q.id
                    ? <select value={draft.level ?? q.level} onChange={e => setDraft(d => ({ ...d, level: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 outline-none">
                        {LEVELS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    : <span className="text-xs text-zinc-400">{q.level}</span>
                  }
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {editId === q.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleSave(q.id)} disabled={isPending} className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditId(q.id); setDraft(q) }} className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(q.id)} disabled={isPending} className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-600 text-sm">No questions yet.</td></tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-sm text-zinc-400 hover:text-zinc-100 disabled:opacity-40">← Prev</button>
            <span className="text-xs text-zinc-600">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="text-sm text-zinc-400 hover:text-zinc-100 disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
