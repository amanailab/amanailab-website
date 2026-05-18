'use client'

import { useState, useTransition } from 'react'
import {
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import {
  createNewsArticle,
  deleteNewsArticle,
  updateNewsArticle,
  type NewsInput,
} from '@/lib/admin-actions'
import type { AdminNewsArticle } from '@/app/admin/news/page'

const CATEGORIES: NewsInput['category'][] = [
  'models',
  'research',
  'tools',
  'agents',
  'india_ai',
  'general',
]
const IMPACTS: NewsInput['impact_score'][] = [
  'game_changer',
  'important',
  'good_to_know',
]

const IMPACT_LABEL: Record<NewsInput['impact_score'], string> = {
  game_changer: 'Game Changer',
  important: 'Important',
  good_to_know: 'Good to Know',
}

const inputBase =
  'w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors'

interface BannerState {
  type: 'success' | 'error'
  text: string
}

const EMPTY: NewsInput = {
  title: '',
  source: '',
  source_url: '',
  summary: '',
  developer_take: '',
  impact_score: 'important',
  category: 'general',
  published_at: new Date().toISOString().slice(0, 10),
}

// ─── Inline Edit Row ──────────────────────────────────────────────────────────

function EditRow({
  article,
  onSave,
  onCancel,
  isPending,
}: {
  article: AdminNewsArticle
  onSave: (draft: Partial<NewsInput>) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [draft, setDraft] = useState<NewsInput>({
    title: article.title,
    source: article.source,
    source_url: article.source_url,
    summary: article.summary,
    developer_take: article.developer_take,
    impact_score: article.impact_score,
    category: article.category,
    published_at: article.published_at.slice(0, 10),
  })

  function set<K extends keyof NewsInput>(key: K, value: NewsInput[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <tr className="border-t border-orange-500/20 bg-zinc-900/60">
      <td colSpan={6} className="px-4 py-4">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Title"
            className={inputBase}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={draft.source}
              onChange={(e) => set('source', e.target.value)}
              placeholder="Source name"
              className={inputBase}
            />
            <input
              type="url"
              value={draft.source_url}
              onChange={(e) => set('source_url', e.target.value)}
              placeholder="Source URL"
              className={inputBase}
            />
          </div>
          <textarea
            value={draft.summary}
            onChange={(e) => set('summary', e.target.value)}
            placeholder="Summary"
            rows={3}
            className={`${inputBase} resize-y`}
          />
          <textarea
            value={draft.developer_take}
            onChange={(e) => set('developer_take', e.target.value)}
            placeholder="Developer take"
            rows={3}
            className={`${inputBase} resize-y`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={draft.impact_score}
              onChange={(e) => set('impact_score', e.target.value as NewsInput['impact_score'])}
              className={inputBase}
            >
              {IMPACTS.map((i) => (
                <option key={i} value={i}>{IMPACT_LABEL[i]}</option>
              ))}
            </select>
            <select
              value={draft.category}
              onChange={(e) => set('category', e.target.value as NewsInput['category'])}
              className={inputBase}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="date"
              value={draft.published_at.slice(0, 10)}
              onChange={(e) => set('published_at', e.target.value)}
              className={inputBase}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSave(draft)}
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewsManager({
  initialArticles,
}: {
  initialArticles: AdminNewsArticle[]
}) {
  const [articles, setArticles] = useState(initialArticles)
  const [draft, setDraft] = useState<NewsInput>(EMPTY)
  const [banner, setBanner] = useState<BannerState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [refreshing, setRefreshing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  function showSuccess(text: string) {
    setBanner({ type: 'success', text })
    setTimeout(() => setBanner(null), 3500)
  }
  function showError(text: string) {
    setBanner({ type: 'error', text })
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !draft.title.trim() ||
      !draft.source.trim() ||
      !draft.source_url.trim() ||
      !draft.summary.trim() ||
      !draft.developer_take.trim() ||
      !draft.published_at
    ) {
      showError('Please fill in all fields.')
      return
    }
    const payload: NewsInput = {
      ...draft,
      published_at: new Date(draft.published_at).toISOString(),
    }
    startTransition(async () => {
      const res = await createNewsArticle(payload)
      if (res.error) {
        showError(res.error)
        return
      }
      setArticles((prev) => [
        { id: -Date.now(), ...payload },
        ...prev,
      ])
      setDraft(EMPTY)
      showSuccess('Article saved.')
    })
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this article?')) return
    startTransition(async () => {
      const res = await deleteNewsArticle(id)
      if (res.error) {
        showError(res.error)
        return
      }
      setArticles((prev) => prev.filter((a) => a.id !== id))
      showSuccess('Article deleted.')
    })
  }

  function handleEdit(id: number, draft: Partial<NewsInput>) {
    startTransition(async () => {
      const payload = {
        ...draft,
        ...(draft.published_at ? { published_at: new Date(draft.published_at).toISOString() } : {}),
      }
      const res = await updateNewsArticle(id, payload)
      if (res.error) {
        showError(res.error)
        return
      }
      setArticles((prev) =>
        prev.map((a) => a.id === id ? { ...a, ...payload } as AdminNewsArticle : a)
      )
      setEditId(null)
      showSuccess('Article updated.')
    })
  }

  async function handleBulkRefresh() {
    setRefreshing(true)
    setBanner(null)
    try {
      const res = await fetch('/api/news/fetch', { method: 'GET' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Refresh failed')
      showSuccess(
        `Latest news refresh kicked off${
          typeof data.added === 'number' ? ` — ${data.added} new` : ''
        }.`
      )
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setRefreshing(false)
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-bold text-zinc-100">Manual entry</h2>
        <button
          onClick={handleBulkRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-60 text-zinc-100 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Fetch Latest AI News
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4"
      >
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Title"
          className={inputBase}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={draft.source}
            onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
            placeholder="Source name"
            className={inputBase}
          />
          <input
            type="url"
            value={draft.source_url}
            onChange={(e) => setDraft((d) => ({ ...d, source_url: e.target.value }))}
            placeholder="Source URL"
            className={inputBase}
          />
        </div>
        <textarea
          value={draft.summary}
          onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
          placeholder="Summary"
          rows={3}
          className={`${inputBase} resize-y`}
        />
        <textarea
          value={draft.developer_take}
          onChange={(e) => setDraft((d) => ({ ...d, developer_take: e.target.value }))}
          placeholder="Developer take"
          rows={3}
          className={`${inputBase} resize-y`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={draft.impact_score}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                impact_score: e.target.value as NewsInput['impact_score'],
              }))
            }
            className={inputBase}
          >
            {IMPACTS.map((i) => (
              <option key={i} value={i}>
                {IMPACT_LABEL[i]}
              </option>
            ))}
          </select>
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                category: e.target.value as NewsInput['category'],
              }))
            }
            className={inputBase}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={draft.published_at.slice(0, 10)}
            onChange={(e) => setDraft((d) => ({ ...d, published_at: e.target.value }))}
            className={inputBase}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="self-start inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Save Article
        </button>
      </form>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/40 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Impact</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    No articles yet. Use the form above or hit Fetch Latest AI News.
                  </td>
                </tr>
              )}
              {articles.map((a) => (
                <>
                  <tr key={a.id} className={`border-t border-zinc-800 ${editId === a.id ? 'bg-zinc-800/40' : ''}`}>
                    <td className="px-4 py-3 max-w-md">
                      <p className="text-zinc-100 font-medium line-clamp-2">{a.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={a.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
                      >
                        {a.source}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-300">{a.category}</td>
                    <td className="px-4 py-3 text-xs text-zinc-300">
                      {IMPACT_LABEL[a.impact_score]}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums">
                      {new Date(a.published_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditId(editId === a.id ? null : a.id)}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors ${
                            editId === a.id
                              ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'
                          }`}
                        >
                          {editId === a.id ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                          {editId === a.id ? 'Close' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editId === a.id && (
                    <EditRow
                      key={`edit-${a.id}`}
                      article={a}
                      onSave={(draft) => handleEdit(a.id, draft)}
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
    </div>
  )
}
