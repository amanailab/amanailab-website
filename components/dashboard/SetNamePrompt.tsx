'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCircle, Check, X, Loader2 } from 'lucide-react'

export default function SetNamePrompt() {
  const [name, setName]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError]     = useState('')

  if (dismissed) return null

  async function save() {
    const trimmed = name.trim()
    if (trimmed.length < 2) { setError('Enter at least 2 characters.'); return }
    if (trimmed.length > 40) { setError('Keep it under 40 characters.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { display_name: trimmed } })
    setSaving(false)
    if (error) { setError(error.message); return }
    setSaved(true)
    setTimeout(() => setDismissed(true), 1500)
  }

  if (saved) {
    return (
      <div className="mb-6 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3 flex items-center gap-2.5">
        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-sm text-emerald-300 font-semibold">Name saved — you&apos;ll show up on the leaderboard now.</p>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-gradient-to-br from-orange-500/10 to-zinc-900 border border-orange-500/25 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
          <UserCircle className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-100 mb-0.5">Add your name for the leaderboard</p>
          <p className="text-xs text-zinc-500 mb-3">
            Right now others see you as an anonymous learner. Set a public name so your rank shows who you are.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') save() }}
              placeholder="e.g. Aman C."
              maxLength={40}
              className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
            />
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save name
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
        </div>
        <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-zinc-600 hover:text-zinc-400 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
