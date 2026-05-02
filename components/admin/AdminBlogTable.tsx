'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { togglePublishAction, deletePostAction } from '@/lib/blog-actions'
import type { BlogPost } from '@/lib/admin'
import { Pencil, Trash2, Globe, EyeOff, Loader2 } from 'lucide-react'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminBlogTable({ posts }: { posts: BlogPost[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggle = async (post: BlogPost) => {
    setLoading(`toggle-${post.id}`)
    await togglePublishAction(post.id, !post.published)
    router.refresh()
    setLoading(null)
  }

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    setLoading(`delete-${post.id}`)
    await deletePostAction(post.id)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Category</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Date</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-zinc-800/50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-100 truncate max-w-xs">{post.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono truncate max-w-xs">{post.slug}</p>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">
                  {post.category}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  post.published
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                }`}>
                  {post.published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                {formatDate(post.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleToggle(post)}
                    disabled={loading === `toggle-${post.id}`}
                    className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded transition-colors disabled:opacity-50"
                    title={post.published ? 'Unpublish' : 'Publish'}
                  >
                    {loading === `toggle-${post.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : post.published ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(post)}
                    disabled={loading === `delete-${post.id}`}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {loading === `delete-${post.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
