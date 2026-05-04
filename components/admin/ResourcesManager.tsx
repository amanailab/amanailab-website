'use client'

import { useRef, useState, useTransition } from 'react'
import {
  Loader2,
  Plus,
  UploadCloud,
  Trash2,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { createResource, deleteResource } from '@/lib/admin-actions'
import type { AdminResource } from '@/app/admin/resources/page'

const CATEGORIES = [
  'LLM',
  'RAG',
  'Agents',
  'Fine-Tuning',
  'MLOps',
  'Python',
  'System Design',
  'Transformers',
  'Vector DB',
  'General',
]

const inputBase =
  'w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors'

interface BannerState {
  type: 'success' | 'error'
  text: string
}

interface UploadedFile {
  url: string
  path: string
  file_name: string
  size: number
}

function formatSize(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function ResourcesManager({
  initialResources,
}: {
  initialResources: AdminResource[]
}) {
  const [resources, setResources] = useState(initialResources)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null)
  const [banner, setBanner] = useState<BannerState | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement | null>(null)

  function showSuccess(text: string) {
    setBanner({ type: 'success', text })
    setTimeout(() => setBanner(null), 3500)
  }
  function showError(text: string) {
    setBanner({ type: 'error', text })
  }

  async function handleFileSelect(file: File) {
    setUploading(true)
    setBanner(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/resources/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setUploaded({ url: data.url, path: data.path, file_name: data.file_name, size: data.size })
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function onAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !category || !uploaded) {
      showError('Title, category and PDF are required.')
      return
    }
    startTransition(async () => {
      const res = await createResource({
        title: title.trim(),
        description: description.trim(),
        category,
        file_url: uploaded.url,
        file_name: uploaded.file_name,
      })
      if (res.error) {
        showError(res.error)
        return
      }
      setResources((prev) => [
        {
          id: `tmp-${Date.now()}`,
          title: title.trim(),
          description: description.trim(),
          category,
          file_url: uploaded.url,
          file_name: uploaded.file_name,
          is_free: true,
          download_count: 0,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setTitle('')
      setDescription('')
      setCategory('')
      setUploaded(null)
      showSuccess('Resource saved.')
    })
  }

  function handleDelete(r: AdminResource) {
    if (!confirm(`Delete "${r.title}"?`)) return
    // Try to extract storage path from public URL so we can clean it up.
    const path = (() => {
      const marker = '/storage/v1/object/public/pdfs/'
      const idx = r.file_url.indexOf(marker)
      return idx === -1 ? null : r.file_url.slice(idx + marker.length)
    })()
    startTransition(async () => {
      const res = await deleteResource(r.id, path)
      if (res.error) {
        showError(res.error)
        return
      }
      setResources((prev) => prev.filter((x) => x.id !== r.id))
      showSuccess('Resource deleted.')
    })
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

      {/* Add new */}
      <form
        onSubmit={onAddSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-orange-400" />
          <h2 className="text-base font-bold text-zinc-100">Add a cheat sheet</h2>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={inputBase}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          className={`${inputBase} resize-y`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputBase}
        >
          <option value="">Choose category…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="self-start inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-60 text-zinc-100 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {uploaded ? 'Replace PDF' : 'Upload PDF'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileSelect(f)
            }}
          />
          {uploaded && (
            <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-orange-400" />
              <span className="truncate flex-1">{uploaded.file_name}</span>
              <span className="text-zinc-500">{formatSize(uploaded.size)}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-start inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Save Resource
        </button>
      </form>

      {/* Existing list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/40 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Downloads</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                    No resources yet. Add your first cheat sheet above.
                  </td>
                </tr>
              )}
              {resources.map((r) => (
                <tr key={r.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3">
                    <p className="text-zinc-100 font-medium">{r.title}</p>
                    {r.description && (
                      <p className="text-xs text-zinc-500 line-clamp-1">{r.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">
                      {r.category ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 truncate max-w-[200px]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {r.file_name ?? 'open'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-xs tabular-nums">
                    {r.download_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
