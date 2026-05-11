'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, BrainCircuit } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-100 mb-2">Something went wrong</h1>
        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
          An unexpected error occurred. Try refreshing the page — if the issue persists, the team has been notified.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={reset}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link href="/"
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link href="/interview?tab=simulator"
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            <BrainCircuit className="w-4 h-4" /> Practice Interview
          </Link>
        </div>
        {error.digest && <p className="text-[10px] text-zinc-700 mt-6 font-mono">Error ID: {error.digest}</p>}
      </div>
    </div>
  )
}
