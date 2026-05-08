"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2, CheckCircle2, Code2, ExternalLink, Database } from 'lucide-react'

interface Problem {
  id: string; title: string; slug: string; difficulty: string; topic: string; order_index: number
}

const DIFF = {
  Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400',
} as const

export default function CodeProblemsManager({ problems: initial }: { problems: Problem[] }) {
  const [problems, setProblems] = useState(initial)
  const [seeding, setSeeding]   = useState(false)
  const [msg, setMsg]           = useState('')
  const [password, setPassword] = useState('')

  async function seed() {
    if (!password) { setMsg('Enter admin password'); return }
    setSeeding(true); setMsg('')
    try {
      const res = await fetch('/api/code-lab/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.seeded) {
        setMsg(`✓ Seeded ${data.seeded} problems successfully`)
        const r = await fetch('/api/code-lab/problems')
        const d = await r.json()
        setProblems(d.problems ?? [])
      } else {
        setMsg(data.error ?? 'Failed')
      }
    } catch { setMsg('Network error') }
    finally { setSeeding(false) }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Code Lab Problems</h1>
          <p className="text-zinc-500 text-sm mt-1">{problems.length} problems loaded</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/code-lab" target="_blank"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> View Live
          </Link>
          <Link href="/admin/code-problems/new"
            className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white px-3 py-2 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Problem
          </Link>
        </div>
      </div>

      {/* SQL reminder */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
        <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-blue-400">Step 1 — Run SQL migration first (once only)</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Supabase Dashboard → SQL Editor → paste <code className="text-zinc-400 font-mono">supabase/code_lab_schema.sql</code> → Run
          </p>
        </div>
      </div>

      {/* Seed card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Code2 className="w-4 h-4 text-orange-400" />
          <p className="text-sm font-bold text-zinc-100">Step 2 — Seed 20 AI/ML Problems</p>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Loads softmax, attention, KNN, cosine similarity, perplexity and 15 more problems instantly.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && seed()}
            placeholder="Admin password"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-orange-500/50 transition-colors w-48"
          />
          <button onClick={seed} disabled={seeding}
            className="flex items-center gap-1.5 text-sm font-semibold bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors">
            {seeding
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Seeding…</>
              : <><CheckCircle2 className="w-4 h-4" /> Seed All Problems</>
            }
          </button>
        </div>
        {msg && (
          <p className={`text-xs mt-3 font-medium ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
            {msg}
          </p>
        )}
      </div>

      {/* Problems list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_90px_110px_80px] gap-4 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
          <span>#</span><span>Title</span><span>Difficulty</span><span>Topic</span><span>Action</span>
        </div>
        {problems.length === 0 ? (
          <div className="py-16 text-center">
            <Code2 className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm font-medium">No problems yet</p>
            <p className="text-zinc-700 text-xs mt-1">Run the SQL migration then seed above</p>
          </div>
        ) : (
          problems.map(p => (
            <div key={p.id}
              className="grid grid-cols-[40px_1fr_90px_110px_80px] gap-4 px-5 py-3.5 border-b border-zinc-800/50 items-center hover:bg-zinc-800/20 transition-colors">
              <span className="text-xs text-zinc-600 font-mono">{p.order_index}</span>
              <span className="text-sm font-medium text-zinc-200 truncate">{p.title}</span>
              <span className={`text-xs font-bold ${DIFF[p.difficulty as keyof typeof DIFF] ?? 'text-zinc-400'}`}>
                {p.difficulty}
              </span>
              <span className="text-xs text-zinc-500">{p.topic}</span>
              <Link href={`/code-lab/${p.slug}`} target="_blank"
                className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
                <ExternalLink className="w-3 h-3" /> Open
              </Link>
            </div>
          ))
        )}
      </div>
    </>
  )
}
