'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import {
  Loader2,
  Plus,
  Upload,
  Download,
  Pencil,
  Trash2,
  Save,
  X,
  HelpCircle,
} from 'lucide-react'
import {
  bulkInsertQuestions,
  createQuestion,
  deleteQuestion,
  updateQuestion,
  type QuestionInput,
} from '@/lib/admin-actions'
import type { AdminQuestion } from '@/app/admin/questions/page'

const TOPICS = [
  'llm',
  'rag',
  'agents',
  'fine-tuning',
  'mlops',
  'transformers',
  'system-design',
  'python',
  'vector-db',
]
const LEVELS = ['fresher', 'mid', 'senior']
const PAGE_SIZE = 20

const inputBase =
  'w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors'

// Minimal CSV parser that handles quoted fields with commas, escaped quotes, and CR/LF.
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      current.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (field !== '' || current.length > 0) {
        current.push(field)
        rows.push(current)
        current = []
        field = ''
      }
      if (c === '\r' && text[i + 1] === '\n') i++
    } else {
      field += c
    }
  }
  if (field !== '' || current.length > 0) {
    current.push(field)
    rows.push(current)
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ''))
}

function downloadCsvTemplate() {
  const csv =
    'question,answer,topic,level\n"What is RAG?","RAG stands for Retrieval Augmented Generation...","rag","fresher"\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'interview_questions_template.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface BannerState {
  type: 'success' | 'error'
  text: string
}

export default function QuestionsManager({
  initialQuestions,
}: {
  initialQuestions: AdminQuestion[]
}) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [topicFilter, setTopicFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<QuestionInput | null>(null)
  const [banner, setBanner] = useState<BannerState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [bulkBusy, setBulkBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // ── Add form ──
  const [draft, setDraft] = useState<QuestionInput>({
    question: '',
    answer: '',
    topic: '',
    level: '',
  })

  const stats = useMemo(() => {
    const byTopic: Record<string, number> = {}
    const byLevel: Record<string, number> = {}
    for (const q of questions) {
      byTopic[q.topic] = (byTopic[q.topic] ?? 0) + 1
      byLevel[q.level] = (byLevel[q.level] ?? 0) + 1
    }
    return { total: questions.length, byTopic, byLevel }
  }, [questions])

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const t = topicFilter === 'all' || q.topic === topicFilter
      const l = levelFilter === 'all' || q.level === levelFilter
      return t && l
    })
  }, [questions, topicFilter, levelFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  function showSuccess(text: string) {
    setBanner({ type: 'success', text })
    setTimeout(() => setBanner(null), 3500)
  }
  function showError(text: string) {
    setBanner({ type: 'error', text })
  }

  function onAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.question.trim() || !draft.answer.trim() || !draft.topic || !draft.level) {
      showError('Fill in all fields before saving.')
      return
    }
    startTransition(async () => {
      const res = await createQuestion(draft)
      if (res.error) {
        showError(res.error)
        return
      }
      setQuestions((prev) => [
        { id: -Date.now(), ...draft }, // optimistic; refreshed on next nav
        ...prev,
      ])
      setDraft({ question: '', answer: '', topic: '', level: '' })
      showSuccess('Question saved.')
    })
  }

  function startEdit(q: AdminQuestion) {
    setEditingId(q.id)
    setEditDraft({ question: q.question, answer: q.answer, topic: q.topic, level: q.level })
  }
  function cancelEdit() {
    setEditingId(null)
    setEditDraft(null)
  }
  function commitEdit(id: number) {
    if (!editDraft) return
    if (
      !editDraft.question.trim() ||
      !editDraft.answer.trim() ||
      !editDraft.topic ||
      !editDraft.level
    ) {
      showError('All fields are required.')
      return
    }
    startTransition(async () => {
      const res = await updateQuestion(id, editDraft)
      if (res.error) {
        showError(res.error)
        return
      }
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...editDraft } : q))
      )
      cancelEdit()
      showSuccess('Question updated.')
    })
  }
  function handleDelete(id: number) {
    if (!confirm('Delete this question?')) return
    startTransition(async () => {
      const res = await deleteQuestion(id)
      if (res.error) {
        showError(res.error)
        return
      }
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      showSuccess('Question deleted.')
    })
  }

  async function handleCsvUpload(file: File) {
    setBulkBusy(true)
    setBanner(null)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) {
        showError('CSV is empty.')
        return
      }
      // Detect header row
      const first = rows[0].map((c) => c.trim().toLowerCase())
      const hasHeader =
        first.includes('question') &&
        first.includes('answer') &&
        first.includes('topic') &&
        first.includes('level')
      const dataRows = hasHeader ? rows.slice(1) : rows
      const parsed: QuestionInput[] = []
      const errors: string[] = []
      dataRows.forEach((row, i) => {
        const [question, answer, topic, level] = row.map((c) => (c ?? '').trim())
        if (!question || !answer || !topic || !level) {
          errors.push(`Row ${i + 1}: missing field`)
          return
        }
        parsed.push({ question, answer, topic, level })
      })
      if (parsed.length === 0) {
        showError(`No valid rows. ${errors.slice(0, 3).join(' · ')}`)
        return
      }
      const res = await bulkInsertQuestions(parsed)
      if (res.error) {
        showError(res.error)
        return
      }
      // Optimistically prepend; reload would be ideal but we'd lose unsaved edits.
      setQuestions((prev) => [
        ...parsed.map((p, i) => ({ id: -Date.now() - i, ...p })),
        ...prev,
      ])
      showSuccess(`${res.count} question${res.count === 1 ? '' : 's'} added.`)
    } catch {
      showError('Failed to parse CSV.')
    } finally {
      setBulkBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {banner && (
        <div
          className={`px-4 py-3 rounded-lg text-sm border ${
            banner.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold text-zinc-100">{stats.total}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
            By Topic
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TOPICS.map((t) => (
              <span
                key={t}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300"
              >
                {t} · {stats.byTopic[t] ?? 0}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
            By Level
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <span
                key={l}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300"
              >
                {l} · {stats.byLevel[l] ?? 0}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Add new question */}
      <form
        onSubmit={onAddSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-orange-400" />
          <h2 className="text-base font-bold text-zinc-100">Add a single question</h2>
        </div>
        <textarea
          value={draft.question}
          onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          placeholder="Question"
          rows={2}
          className={`${inputBase} resize-y`}
        />
        <textarea
          value={draft.answer}
          onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
          placeholder="Answer"
          rows={4}
          className={`${inputBase} resize-y`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={draft.topic}
            onChange={(e) => setDraft((d) => ({ ...d, topic: e.target.value }))}
            className={inputBase}
          >
            <option value="">Topic…</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={draft.level}
            onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value }))}
            className={inputBase}
          >
            <option value="">Level…</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="self-start inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Save Question
        </button>
      </form>

      {/* Bulk upload */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-orange-400" />
          <h2 className="text-base font-bold text-zinc-100">Bulk upload via CSV</h2>
        </div>
        <p className="text-xs text-zinc-500">
          CSV columns: <code className="text-zinc-300">question, answer, topic, level</code>.
          Header row optional.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={bulkBusy}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload CSV
          </button>
          <button
            onClick={downloadCsvTemplate}
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleCsvUpload(f)
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={topicFilter}
          onChange={(e) => {
            setTopicFilter(e.target.value)
            setPage(0)
          }}
          className={inputBase + ' max-w-xs'}
        >
          <option value="all">All topics</option>
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => {
            setLevelFilter(e.target.value)
            setPage(0)
          }}
          className={inputBase + ' max-w-xs'}
        >
          <option value="all">All levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">
          Showing {visible.length} of {filtered.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/40 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Question</th>
                <th className="px-4 py-3 font-semibold">Topic</th>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                    No questions match the current filters.
                  </td>
                </tr>
              )}
              {visible.map((q) => {
                const isEditing = editingId === q.id
                return (
                  <tr key={q.id} className="border-t border-zinc-800 align-top">
                    <td className="px-4 py-3 max-w-xl">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editDraft?.question ?? ''}
                            onChange={(e) =>
                              setEditDraft((d) => (d ? { ...d, question: e.target.value } : d))
                            }
                            rows={2}
                            className={`${inputBase} resize-y`}
                          />
                          <textarea
                            value={editDraft?.answer ?? ''}
                            onChange={(e) =>
                              setEditDraft((d) => (d ? { ...d, answer: e.target.value } : d))
                            }
                            rows={3}
                            className={`${inputBase} resize-y`}
                          />
                        </div>
                      ) : (
                        <p className="text-zinc-100 leading-snug line-clamp-2">{q.question}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={editDraft?.topic ?? ''}
                          onChange={(e) =>
                            setEditDraft((d) => (d ? { ...d, topic: e.target.value } : d))
                          }
                          className={inputBase}
                        >
                          {TOPICS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {q.topic}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={editDraft?.level ?? ''}
                          onChange={(e) =>
                            setEditDraft((d) => (d ? { ...d, level: e.target.value } : d))
                          }
                          className={inputBase}
                        >
                          {LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {q.level}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => commitEdit(q.id)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md"
                            >
                              <Save className="w-3 h-3" /> Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold px-2.5 py-1.5 rounded-md"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(q)}
                              className="inline-flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold px-2.5 py-1.5 rounded-md"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 text-xs text-zinc-400">
            <span>
              Page {safePage + 1} of {pageCount}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
