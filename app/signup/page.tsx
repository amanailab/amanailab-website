'use client'

import { useActionState, useState, useEffect } from 'react'
import { signup } from '@/app/actions/auth'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, CheckCircle2, TrendingUp, BrainCircuit, BarChart2, Mail } from 'lucide-react'

// ─── Steps preview ────────────────────────────────────────────────────────────

function StepsPreview() {
  const steps = [
    { n: '1', title: 'Create your account', desc: 'Takes 30 seconds. Free forever.' },
    { n: '2', title: 'Complete an interview session', desc: 'Pick a topic, answer questions, get AI feedback.' },
    { n: '3', title: 'Watch your readiness score grow', desc: 'Track improvement across all AI/ML topics.' },
  ]
  return (
    <div className="flex flex-col gap-4">
      {steps.map((s) => (
        <div key={s.n} className="flex items-start gap-3">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5">
            {s.n}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">{s.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Check email screen ───────────────────────────────────────────────────────

function CheckEmailScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Mail className="w-7 h-7 text-green-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-100 mb-2">Check your email</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          We sent a confirmation link to your email. Click it to activate your account and start tracking your interview progress.
        </p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 text-left flex flex-col gap-2">
          {['Confirm your email', 'Complete your first interview session', 'See your readiness score'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 text-sm text-zinc-400">
              <div className="w-5 h-5 bg-orange-500/15 rounded-full flex items-center justify-center text-[10px] font-bold text-orange-400 shrink-0">{i + 1}</div>
              {step}
            </div>
          ))}
        </div>
        <Link href="/login" className="text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors">
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, null)
  const [nextPath, setNextPath] = useState('/dashboard')
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get('next')
    if (n?.startsWith('/')) setNextPath(n)
  }, [])

  if (state === 'check_email') return <CheckEmailScreen />

  return (
    <div className="min-h-screen flex bg-zinc-950">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] bg-zinc-900 border-r border-zinc-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <Image src="/logo.jpg" alt="AmanAI Lab" width={36} height={36} className="rounded-xl ring-1 ring-zinc-700" />
          <span className="font-bold text-base text-zinc-100">
            Aman<span className="text-orange-500">AI</span>
            <span className="text-zinc-400 font-normal"> Lab</span>
          </span>
        </Link>

        <div className="flex flex-col gap-8 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-xs text-orange-400 font-semibold">Free forever</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
              The smartest way to<br />prep for AI/ML interviews
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Practice with real questions, get instant AI feedback, and track your improvement over time — all in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: <BarChart2 className="w-4 h-4" />, title: 'Interview Readiness Score', desc: 'A single number showing how ready you are' },
              { icon: <BrainCircuit className="w-4 h-4" />, title: 'Topic Mastery Breakdown', desc: 'Know exactly where to focus your study time' },
              { icon: <TrendingUp className="w-4 h-4" />, title: 'Progress Tracking', desc: 'See your scores improve session by session' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-3">
                <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{item.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">How it works</p>
            <StepsPreview />
          </div>
        </div>

        <p className="text-xs text-zinc-600 relative z-10">Free forever · No credit card needed · Cancel anytime</p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Image src="/logo.jpg" alt="AmanAI Lab" width={28} height={28} className="rounded-lg ring-1 ring-zinc-700" />
            <span className="font-bold text-sm text-zinc-100">
              Aman<span className="text-orange-500">AI</span>
              <span className="text-zinc-400 font-normal"> Lab</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-zinc-100 mb-1">Create your account</h1>
            <p className="text-sm text-zinc-500">Start tracking your interview progress today</p>
          </div>

          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={nextPath} />
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
              <label htmlFor="password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
            </div>

            {state && state !== 'check_email' && (
              <div className="flex items-start gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="shrink-0 mt-0.5">⚠</span>
                {state}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 mt-1"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Create Free Account
            </button>
          </form>

          <p className="text-center text-xs text-zinc-600 mt-4">
            By signing up you agree to our terms of service.
          </p>

          <p className="text-center text-sm text-zinc-500 mt-4">
            Already have an account?{' '}
            <Link href={nextPath !== '/dashboard' ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'} className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
