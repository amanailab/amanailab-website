'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Check, RefreshCw } from 'lucide-react'

export default function SeedBlogButton() {
  const [loading, setLoading] = useState<false | 'seed' | 'force'>(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error' | ''>('')

  async function run(force: boolean) {
    setLoading(force ? 'force' : 'seed')
    setMsg('')
    setMsgType('')
    try {
      const res = await fetch('/api/admin/seed-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error ?? 'Failed'); setMsgType('error'); return }
      const seeded  = data.seeded  ?? 0
      const updated = data.updated ?? 0
      const skipped = data.skipped ?? 0
      const errors  = (data.updateErrors as string[] | undefined) ?? []

      if (errors.length > 0) {
        setMsg(`Partial: ${seeded} new, ${updated} updated. Errors: ${errors.join('; ')}`)
        setMsgType('error')
        return
      }

      if (seeded > 0 || updated > 0) {
        const parts: string[] = []
        if (seeded > 0)  parts.push(`${seeded} new post${seeded === 1 ? '' : 's'} published`)
        if (updated > 0) parts.push(`${updated} existing post${updated === 1 ? '' : 's'} reformatted`)
        setMsg(`${parts.join(' · ')}. Refreshing…`)
        setMsgType('success')
        setTimeout(() => window.location.reload(), 1500)
      } else if (skipped > 0) {
        setMsg(force
          ? 'Force ran but no posts matched.'
          : `All ${skipped} starter posts already exist with proper formatting. Use "Force reformat" to overwrite.`)
        setMsgType('success')
      } else {
        setMsg('No posts returned.')
        setMsgType('error')
      }
    } catch {
      setMsg('Network error')
      setMsgType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => run(false)}
          disabled={loading !== false}
          title="Insert 6 starter blog posts. Skips slugs that already exist with proper HTML."
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          {loading === 'seed' ? <Loader2 className="w-4 h-4 animate-spin" /> : msgType === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-orange-400" />}
          Seed Starter Posts
        </button>
        <button
          onClick={() => {
            if (!confirm('Force-reformat ALL starter posts? This overwrites content + cover image of any post with matching slug, even if you have edits.')) return
            run(true)
          }}
          disabled={loading !== false}
          title="Overwrite content and cover_image of every starter post, even if user-edited."
          className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg font-medium text-xs transition-colors disabled:opacity-50"
        >
          {loading === 'force' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Force reformat
        </button>
      </div>
      {msg && (
        <p className={`text-[11px] font-medium max-w-[420px] text-right leading-snug ${msgType === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
