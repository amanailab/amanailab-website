'use client'

import { useActionState, useState, useEffect, useRef, useTransition } from 'react'
import { signup, resendVerification } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
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

function CheckEmailScreen({ email }: { email: string }) {
  const [resendState, setResendState] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [isPending, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startCooldown() {
    setCooldown(60)
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function handleResend() {
    setResendState('pending')
    startTransition(async () => {
      const result = await resendVerification(email)
      if (result === 'sent') {
        setResendState('sent')
        startCooldown()
      } else {
        setResendState('error')
        setErrorMsg(result)
      }
    })
  }

  const buttonDisabled = resendState === 'pending' || isPending || cooldown > 0

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Mail className="w-7 h-7 text-green-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-100 mb-2">Check your email</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          We sent a confirmation link to{' '}
          <span className="text-zinc-200 font-medium">{email}</span>. Click it to activate
          your account and start tracking your interview progress.
        </p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 text-left flex flex-col gap-2">
          {['Confirm your email', 'Complete your first interview session', 'See your readiness score'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 text-sm text-zinc-400">
              <div className="w-5 h-5 bg-orange-500/15 rounded-full flex items-center justify-center text-[10px] font-bold text-orange-400 shrink-0">{i + 1}</div>
              {step}
            </div>
          ))}
        </div>

        {/* Resend button */}
        <div className="mb-6">
          {resendState === 'sent' ? (
            <p className="text-sm text-green-400 font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Email sent!{cooldown > 0 && <span className="text-zinc-500 font-normal"> Resend in {cooldown}s</span>}
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={handleResend}
                disabled={buttonDisabled}
                className="text-sm text-orange-400 hover:text-orange-300 disabled:text-zinc-600 disabled:cursor-not-allowed font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                {(resendState === 'pending' || isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email'}
              </button>
              {resendState === 'error' && (
                <p className="text-xs text-red-400 mt-1.5">{errorMsg}</p>
              )}
            </>
          )}
        </div>

        <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, null)
  const [googlePending, setGooglePending] = useState(false)
  const [nextPath, setNextPath] = useState('/dashboard')
  const [submittedEmail, setSubmittedEmail] = useState('')
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

  function handleFormAction(formData: FormData) {
    setSubmittedEmail((formData.get('email') as string) ?? '')
    return action(formData)
  }

  if (state === 'check_email') return <CheckEmailScreen email={submittedEmail} />

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

          <form action={handleFormAction} className="flex flex-col gap-4">
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
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all"
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
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all"
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
