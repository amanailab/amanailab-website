'use client'

import { useState, useTransition } from 'react'
import { Check, Trash2, X } from 'lucide-react'
import { approveCommunityPost, deleteCommunityPost } from '@/lib/admin-actions'

interface Post {
  id: string
  author_name: string
  title: string
  body: string
  type: string
  company_slug: string | null
  approved: boolean
  created_at: string
}

interface Props { pending: Post[]; approved: Post[] }

function PostCard({ post, onApprove, onDelete, showApprove }: {
  post: Post
  onApprove?: () => void
  onDelete: () => void
  showApprove: boolean
}) {
  const typeColor = post.type === 'experience' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
    : post.type === 'tip' ? 'bg-green-500/10 text-green-300 border-green-500/20'
    : 'bg-orange-500/10 text-orange-300 border-orange-500/20'

  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColor}`}>{post.type}</span>
          {post.company_slug && <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded-full">{post.company_slug}</span>}
          <span className="text-xs text-zinc-600">{post.author_name}</span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {showApprove && onApprove && (
            <button onClick={onApprove} className="flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 px-2 py-1 rounded-lg transition-colors">
              <Check className="w-3 h-3" /> Approve
            </button>
          )}
          <button onClick={onDelete} className="flex items-center gap-1 text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-colors">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
      <p className="text-sm font-semibold text-zinc-100 mb-1">{post.title}</p>
      <p className="text-xs text-zinc-400 line-clamp-3">{post.body}</p>
      <p className="text-[10px] text-zinc-600 mt-2">{new Date(post.created_at).toLocaleDateString()}</p>
    </div>
  )
}

const PAGE_SIZE = 20

export default function CommunityManager({ pending: initialPending, approved: initialApproved }: Props) {
  const [pending, setPending] = useState<Post[]>(initialPending)
  const [approved, setApproved] = useState<Post[]>(initialApproved)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function showBanner(type: 'success' | 'error', msg: string) {
    setBanner({ type, msg })
    setTimeout(() => setBanner(null), 3000)
  }

  function handleApprove(post: Post) {
    startTransition(async () => {
      const res = await approveCommunityPost(post.id)
      if ('error' in res) return showBanner('error', res.error ?? 'Error')
      setPending(p => p.filter(x => x.id !== post.id))
      setApproved(a => [{ ...post, approved: true }, ...a])
      showBanner('success', 'Post approved.')
    })
  }

  function handleDelete(id: string, fromApproved: boolean) {
    if (!confirm('Delete this post?')) return
    startTransition(async () => {
      const res = await deleteCommunityPost(id)
      if ('error' in res) return showBanner('error', res.error ?? 'Error')
      if (fromApproved) setApproved(a => a.filter(x => x.id !== id))
      else setPending(p => p.filter(x => x.id !== id))
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

      {/* Pending */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-zinc-100">Pending Approval</h2>
          {pending.length > 0 && <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{pending.length}</span>}
        </div>
        {pending.length === 0
          ? <p className="text-sm text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-xl p-4">No pending posts.</p>
          : <div className="flex flex-col gap-2">{pending.map(p => <PostCard key={p.id} post={p} showApprove onApprove={() => handleApprove(p)} onDelete={() => handleDelete(p.id, false)} />)}</div>
        }
      </div>

      {/* Approved */}
      <div>
        <h2 className="text-sm font-bold text-zinc-100 mb-3">Approved Posts ({approved.length})</h2>
        {approved.length === 0
          ? <p className="text-sm text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-xl p-4">No approved posts yet.</p>
          : (
            <div className="flex flex-col gap-2">
              {approved.slice(0, visibleCount).map(p => (
                <PostCard key={p.id} post={p} showApprove={false} onDelete={() => handleDelete(p.id, true)} />
              ))}
              {visibleCount < approved.length && (
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  className="self-center mt-2 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-5 py-2 rounded-lg transition-colors"
                >
                  Load more ({approved.length - visibleCount} remaining)
                </button>
              )}
            </div>
          )
        }
      </div>
    </div>
  )
}
