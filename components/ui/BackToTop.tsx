"use client"

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-zinc-800 hover:bg-orange-500 border border-zinc-700 hover:border-orange-500 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-orange-500/20 animate-slide-up"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  )
}
