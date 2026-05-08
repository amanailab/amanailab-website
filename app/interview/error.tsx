'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, BrainCircuit } from 'lucide-react'

export default function InterviewError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BrainCircuit className="w-6 h-6 text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Interview simulator failed to load</h2>
        <p className="text-zinc-500 text-sm mb-6">Something went wrong loading the questions. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link href="/questions" className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            Browse Questions
          </Link>
        </div>
      </div>
    </div>
  )
}
