'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Calendar, LayoutDashboard, LogOut, Trash2, Save, Loader2, BrainCircuit, AlertTriangle } from 'lucide-react'

interface Stats { sessions: number; avgScore: number; streak: number }

export default function ProfilePage() {
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [name, setName]           = useState('')
  const [joinedAt, setJoinedAt]   = useState('')
  const [stats, setStats]         = useState<Stats | null>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [banner, setBanner]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      setName(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '')
      setJoinedAt(new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))

      // Fetch basic stats
      const { data: sessions } = await supabase
        .from('user_interview_sessions')
        .select('avg_score, created_at')
        .order('created_at', { ascending: false })

      if (sessions?.length) {
        const avg = sessions.reduce((a, b) => a + b.avg_score, 0) / sessions.length
        // Simple streak
        const dates = [...new Set(sessions.map(s => s.created_at.split('T')[0]))].sort((a, b) => b.localeCompare(a))
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        let streak = 0
        if (dates[0] === today || dates[0] === yesterday) {
          streak = 1
          for (let i = 1; i < dates.length; i++) {
            const diff = (new Date(dates[i-1]).getTime() - new Date(dates[i]).getTime()) / 86400000
            if (diff <= 1.5) streak++
            else break
          }
        }
        setStats({ sessions: sessions.length, avgScore: Math.round(avg * 10) / 10, streak })
      } else {
        setStats({ sessions: 0, avgScore: 0, streak: 0 })
      }
      setLoading(false)
    })
  }, [router])

  async function handleSaveName() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } })
    setSaving(false)
    if (error) setBanner({ type: 'error', msg: error.message })
    else { setBanner({ type: 'success', msg: 'Name updated.' }); setTimeout(() => setBanner(null), 3000) }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleDeleteAccount() {
    if (!confirm('This will permanently delete your account and ALL progress data (sessions, submissions, subscriptions). This cannot be undone. Are you sure?')) return
    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Failed to delete account'); return }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch {
      alert('Failed to delete account. Please try again or contact support.')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-lg mx-auto px-4">

        <h1 className="text-2xl font-extrabold text-zinc-100 mb-6">My Profile</h1>

        {banner && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${banner.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {banner.msg}
          </div>
        )}

        {/* Avatar + email */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shrink-0">
              {name[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-base font-bold text-zinc-100">{name}</p>
              <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {email}
              </p>
              <p className="text-xs text-zinc-600 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3" /> Member since {joinedAt}
              </p>
            </div>
          </div>

          {/* Display name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Display Name
            </label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
              />
              <button
                onClick={handleSaveName}
                disabled={saving || !name.trim()}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Sessions', value: String(stats.sessions), color: 'text-yellow-400' },
              { label: 'Avg Score', value: stats.sessions > 0 ? `${stats.avgScore}/10` : '—', color: 'text-blue-400' },
              { label: 'Streak', value: stats.streak > 0 ? `${stats.streak}d` : '—', color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 flex flex-col gap-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors">
            <LayoutDashboard className="w-4 h-4 text-zinc-500" /> My Progress Dashboard
          </Link>
          <Link href="/interview?tab=simulator" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors">
            <BrainCircuit className="w-4 h-4 text-zinc-500" /> Practice Interview
          </Link>
        </div>

        {/* Sign out + delete */}
        <div className="flex flex-col gap-2">
          <button onClick={handleSignOut} className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm font-semibold py-3 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>

          {!showDelete ? (
            <button onClick={() => setShowDelete(true)} className="text-xs text-zinc-600 hover:text-red-400 transition-colors py-2">
              Delete account
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">This will permanently delete your account and all progress data. This cannot be undone.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDelete(false)} className="flex-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold py-2 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} className="flex-1 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Account
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
