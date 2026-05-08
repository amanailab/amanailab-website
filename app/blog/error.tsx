'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, ArrowLeft } from 'lucide-react'

export default function BlogError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">📝</p>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Couldn't load blog</h2>
        <p className="text-zinc-500 text-sm mb-6">There was a problem loading the blog. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link href="/" className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  )
}
