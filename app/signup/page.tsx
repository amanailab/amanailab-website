'use client'

import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'
import Link from 'next/link'
import { BrainCircuit, Loader2, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, null)

  if (state === 'check_email') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 mb-2">Check your email</h1>
          <p className="text-sm text-zinc-400">
            We sent a confirmation link to your email. Click it to activate your account and start tracking your progress.
          </p>
          <Link href="/" className="inline-block mt-6 text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-4">
            <BrainCircuit className="w-6 h-6 text-orange-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Create your account</h1>
          <p className="text-sm text-zinc-500 mt-1">Free forever. No credit card needed.</p>
        </div>

        {/* Benefits */}
        <div className="bg-orange-500/5 border border-orange-500/15 rounded-2xl p-4 mb-6 flex flex-col gap-2">
          {['Save your interview session scores', 'Track improvement over time', 'See your weak topics at a glance'].map((b) => (
            <div key={b} className="flex items-center gap-2 text-sm text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
              {b}
            </div>
          ))}
        </div>

        <form action={action} className="flex flex-col gap-4">
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
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
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
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          {state && state !== 'check_email' && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {state}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Free Account
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
