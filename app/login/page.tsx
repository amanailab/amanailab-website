'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'
import { BrainCircuit, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-4">
            <BrainCircuit className="w-6 h-6 text-orange-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Welcome back</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your AmanAI Lab account</p>
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
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
