'use client'
import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

export default function ResumeError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">📄</p>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Resume analyzer failed</h2>
        <p className="text-zinc-500 text-sm mb-6">Something went wrong. Please try again or refresh the page.</p>
        <button onClick={reset} className="flex items-center gap-2 mx-auto bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  )
}
