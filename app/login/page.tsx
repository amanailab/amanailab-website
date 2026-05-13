'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, CheckCircle2, TrendingUp, BrainCircuit, BarChart2 } from 'lucide-react'

// ─── Left panel demo card ─────────────────────────────────────────────────────

function DemoCard() {
  const topics = [
    { name: 'LLM', score: 8.4, color: 'bg-blue-500' },
    { name: 'RAG', score: 7.1, color: 'bg-violet-500' },
    { name: 'Agents', score: 5.8, color: 'bg-orange-500' },
    { name: 'MLOps', score: 9.0, color: 'bg-green-500' },
  ]
  return (
    <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-5 w-full max-w-xs shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Interview Readiness</p>
          <p className="text-3xl font-extrabold text-white mt-0.5">78<span className="text-lg text-zinc-400">%</span></p>
        </div>
        <div className="w-12 h-12 bg-orange-500/15 border border-orange-500/25 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-orange-400" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {topics.map((t) => (
          <div key={t.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">{t.name}</span>
              <span className="text-zinc-300 font-semibold">{t.score}/10</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${t.color} rounded-full opacity-80`}
                style={{ width: `${t.score * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-3">
        <div className="text-center flex-1">
          <p className="text-sm font-bold text-zinc-100">12</p>
          <p className="text-[10px] text-zinc-600">Sessions</p>
        </div>
        <div className="w-px h-6 bg-zinc-800" />
        <div className="text-center flex-1">
          <p className="text-sm font-bold text-green-400">7.6</p>
          <p className="text-[10px] text-zinc-600">Avg Score</p>
        </div>
        <div className="w-px h-6 bg-zinc-800" />
        <div className="text-center flex-1">
          <p className="text-sm font-bold text-orange-400">🔥 5</p>
          <p className="text-[10px] text-zinc-600">Day Streak</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [error, setError]     = useState<string | null>(null)
  const [pending, setPending]   = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const [nextPath, setNextPath] = useState('/dashboard')

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get('next')
    if (n?.startsWith('/')) setNextPath(n)
  }, [])

  async function handleGoogleSignIn() {
    setGooglePending(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const data = new FormData(e.currentTarget)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.get('email') as string,
      password: data.get('password') as string,
    })
    setPending(false)
    if (authError) { setError(authError.message); return }
    // Client-side sign-in fires SIGNED_IN on all listeners (including Navbar)
    router.push(nextPath)
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] bg-zinc-900 border-r border-zinc-800 p-12 relative overflow-hidden">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <Image src="/logo.jpg" alt="AmanAI Lab" width={36} height={36} className="rounded-xl ring-1 ring-zinc-700" />
          <span className="font-bold text-base text-zinc-100">
            Aman<span className="text-orange-500">AI</span>
            <span className="text-zinc-400 font-normal"> Lab</span>
          </span>
        </Link>

        {/* Middle content */}
        <div className="flex flex-col gap-8 relative z-10">
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Track your AI/ML<br />interview journey
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The only platform that shows you exactly where you stand, what to improve, and how fast you&apos;re progressing.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: <BarChart2 className="w-4 h-4" />, text: 'Interview Readiness Score — know how prepared you are' },
              { icon: <BrainCircuit className="w-4 h-4" />, text: 'Per-topic mastery breakdown — know exactly what to study' },
              { icon: <TrendingUp className="w-4 h-4" />, text: 'Score trend & streak — stay consistent and improve fast' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <DemoCard />
        </div>

        {/* Bottom */}
        <p className="text-xs text-zinc-600 relative z-10">Free forever · No credit card needed</p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Image src="/logo.jpg" alt="AmanAI Lab" width={28} height={28} className="rounded-lg ring-1 ring-zinc-700" />
            <span className="font-bold text-sm text-zinc-100">
              Aman<span className="text-orange-500">AI</span>
              <span className="text-zinc-400 font-normal"> Lab</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-zinc-100 mb-1">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to see your progress dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="shrink-0 mt-0.5">⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 mt-1"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Sign In
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googlePending || pending}
            className="flex items-center justify-center gap-3 w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed border border-zinc-700 hover:border-zinc-600 text-zinc-100 text-sm font-semibold px-4 py-3 rounded-xl transition-all"
          >
            {googlePending ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href={nextPath !== '/dashboard' ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'} className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
