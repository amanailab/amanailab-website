"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2, CheckCircle2, AlertCircle, Code2, ExternalLink } from 'lucide-react'

interface Problem {
  id: string; title: string; slug: string; difficulty: string; topic: string; order_index: number
}

const DIFF_COLOR = {
  Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400',
}

export default function AdminCodeProblems() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [seeding,  setSeeding]  = useState(false)
  const [seedMsg,  setSeedMsg]  = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    fetch('/api/code-lab/problems')
      .then(r => r.json())
      .then(d => setProblems(d.problems ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function seed() {
    if (!password) { setSeedMsg('Enter admin password first'); return }
    setSeeding(true)
    setSeedMsg('')
    try {
      const res = await fetch('/api/code-lab/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.seeded) {
        setSeedMsg(`✓ Seeded ${data.seeded} problems`)
        const r = await fetch('/api/code-lab/problems')
        const d = await r.json()
        setProblems(d.problems ?? [])
      } else {
        setSeedMsg(data.error ?? 'Seed failed')
      }
    } catch {
      setSeedMsg('Network error')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Code2 className="w-5 h-5 text-orange-400" />
            <h1 className="text-xl font-bold text-zinc-100">Code Lab Problems</h1>
            <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{problems.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/code-lab" target="_blank" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> View Live
            </Link>
            <Link href="/admin/code-problems/new" className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Problem
            </Link>
          </div>
        </div>

        {/* SQL reminder */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-5">
          <p className="text-xs font-bold text-blue-400 mb-1">Before seeding — run this SQL in Supabase first:</p>
          <code className="text-[10px] text-zinc-400 font-mono">supabase/code_lab_schema.sql</code>
          <p className="text-[10px] text-zinc-600 mt-1">Open your Supabase dashboard → SQL Editor → paste the file content → Run</p>
        </div>

        {/* Seed section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-zinc-100 mb-1">Seed 20 AI/ML Problems</p>
          <p className="text-xs text-zinc-500 mb-4">Load all default problems (softmax, attention, KNN, etc.) in one click.</p>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-orange-500/50 transition-colors w-48"
            />
            <button onClick={seed} disabled={seeding}
              className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white px-4 py-2 rounded-lg transition-colors">
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Seed Problems
            </button>
          </div>
          {seedMsg && (
            <p className={`text-xs mt-2 ${seedMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{seedMsg}</p>
          )}
        </div>

        {/* Problems table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            </div>
          ) : problems.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 text-sm">No problems yet — seed them above</div>
          ) : (
            <>
              <div className="grid grid-cols-[40px_1fr_100px_120px_120px] gap-4 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                <span>#</span><span>Title</span><span>Difficulty</span><span>Topic</span><span>Actions</span>
              </div>
              {problems.map(p => (
                <div key={p.id} className="grid grid-cols-[40px_1fr_100px_120px_120px] gap-4 px-5 py-3.5 border-b border-zinc-800/50 items-center">
                  <span className="text-xs text-zinc-600 font-mono">{p.order_index}</span>
                  <span className="text-sm font-semibold text-zinc-200">{p.title}</span>
                  <span className={`text-xs font-bold ${DIFF_COLOR[p.difficulty as keyof typeof DIFF_COLOR] ?? 'text-zinc-400'}`}>{p.difficulty}</span>
                  <span className="text-xs text-zinc-500">{p.topic}</span>
                  <Link href={`/code-lab/${p.slug}`} target="_blank" className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> View
                  </Link>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
