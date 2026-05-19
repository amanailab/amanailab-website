'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Check } from 'lucide-react'

export default function SeedBlogButton() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error' | ''>('')

  async function seed() {
    setLoading(true); setMsg(''); setMsgType('')
    try {
      const res = await fetch('/api/admin/seed-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error ?? 'Failed'); setMsgType('error'); return }
      const seeded  = data.seeded  ?? 0
      const skipped = data.skipped ?? 0
      if (seeded > 0) {
        setMsg(`${seeded} new post${seeded === 1 ? '' : 's'} published${skipped ? ` (${skipped} already existed)` : ''}. Refresh to see them.`)
        setMsgType('success')
        // Refresh the server component listing after a moment so the new posts appear
        setTimeout(() => window.location.reload(), 1500)
      } else if (skipped > 0) {
        setMsg(`All ${skipped} starter posts already exist.`)
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
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={seed}
        disabled={loading}
        title="Insert 6 starter blog posts (RAG, LoRA, Anthropic interview, etc.) as published. Safe to re-run."
        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : msgType === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-orange-400" />}
        Seed Starter Posts
      </button>
      {msg && (
        <p className={`text-[11px] font-medium max-w-[280px] text-right ${msgType === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
