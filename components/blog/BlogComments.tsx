"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Send, Trash2, MessageSquare, Loader2 } from 'lucide-react'

interface Comment {
  id: string
  body: string
  created_at: string
  user_name: string
  user_email: string
}

interface Props { slug: string }

export default function BlogComments({ slug }: Props) {
  const [comments, setComments]   = useState<Comment[]>([])
  const [loading, setLoading]     = useState(true)
  const [body, setBody]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`)
    const data = await res.json()
    setComments(data.comments ?? [])
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchComments() }, [fetchComments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/blog/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, body }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error); return }
    setBody('')
    setComments(prev => [...prev, data.comment])
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await fetch(`/api/blog/comments?id=${id}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="mt-10 pt-8 border-t border-zinc-800">
      <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">
        <MessageSquare className="w-4 h-4" />
        Discussion {comments.length > 0 && <span className="text-zinc-600 font-normal normal-case">({comments.length})</span>}
      </h2>

      {/* Comment list */}
      {loading ? (
        <div className="flex items-center gap-2 text-zinc-600 text-sm mb-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-600 mb-6">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-4 mb-8">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                {c.user_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-200">{c.user_name}</span>
                  <span className="text-xs text-zinc-600">{timeAgo(c.created_at)}</span>
                  {userEmail === c.user_email && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="ml-auto text-zinc-700 hover:text-red-400 transition-colors"
                      aria-label="Delete comment"
                    >
                      {deletingId === c.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      {userEmail ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share your thoughts…"
            rows={3}
            maxLength={2000}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/60 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none transition-colors"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-700">{body.length}/2000</span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
          <p className="text-sm text-zinc-400 mb-3">Sign in to join the discussion</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Login to Comment
          </Link>
        </div>
      )}
    </div>
  )
}
