'use client'

import { useState } from 'react'
import { Bookmark, Check, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'

type Kind = 'roadmap' | 'skill_gap' | 'offer_analysis' | 'study_plan' | 'interview_plan' | 'company_research'

export default function SaveArtifactButton({
  kind, title, payload, className,
}: {
  kind: Kind
  title: string
  payload: unknown
  className?: string
}) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'login' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function save() {
    setState('saving')
    setErrMsg('')
    try {
      const res = await fetch('/api/career/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, title, payload }),
      })
      if (res.status === 401) { setState('login'); return }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setErrMsg(d.error ?? 'Save failed')
        setState('error')
        return
      }
      setState('saved')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setErrMsg('Save failed')
      setState('error')
    }
  }

  if (state === 'login') {
    return (
      <Link href="/login"
        className={className ?? 'flex items-center gap-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 px-3 py-2 rounded-xl transition-colors'}
        title="Sign in to save this to your history">
        <LogIn className="w-3.5 h-3.5" /> Sign in to save
      </Link>
    )
  }

  return (
    <button onClick={save} disabled={state === 'saving' || state === 'saved'}
      className={className ?? 'flex items-center gap-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 px-3 py-2 rounded-xl transition-colors disabled:opacity-60'}
      title={errMsg || 'Save to your history (visible on dashboard)'}>
      {state === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>}
      {state === 'saved'  && <><Check className="w-3.5 h-3.5 text-emerald-400" /> Saved</>}
      {state === 'idle'   && <><Bookmark className="w-3.5 h-3.5" /> Save to history</>}
      {state === 'error'  && <><Bookmark className="w-3.5 h-3.5 text-red-400" /> Retry</>}
    </button>
  )
}
