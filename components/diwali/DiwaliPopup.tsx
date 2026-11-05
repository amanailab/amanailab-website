'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Flame, Download, CheckCircle } from 'lucide-react'
import { DIWALI, applicationsClosed } from '@/lib/diwali-config'

const KEY = 'diwali-popup-seen'
// Pages where interrupting the visitor would be annoying
const SKIP = ['/diwali-accelerator', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/upgrade', '/stripe-success', '/auth']

/** One-time (per browser session) announcement for new visitors. */
export default function DiwaliPopup() {
  const pathname = usePathname() ?? ''
  const [open, setOpen] = useState(false)

  const close = useCallback(() => {
    setOpen(false)
    try { sessionStorage.setItem(KEY, '1') } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (applicationsClosed() || SKIP.some(p => pathname.startsWith(p))) return
    try { if (sessionStorage.getItem(KEY)) return } catch { /* storage blocked: still show once per load */ }
    const t = setTimeout(() => setOpen(true), 3500)
    return () => clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={close}
      role="dialog" aria-modal="true" aria-label="Diwali AI Accelerator 2026"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-orange-500/30 bg-zinc-950 p-7 shadow-2xl shadow-orange-500/10"
      >
        <button onClick={close} aria-label="Close" className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200">
          <X className="w-5 h-5" />
        </button>
        <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
          <Flame className="w-3.5 h-3.5" /> Diwali Special &middot; Only {DIWALI.totalSeats} seats
        </div>
        <h2 className="mt-4 text-2xl font-black text-zinc-50 leading-tight">
          Become a GenAI &amp; Agentic AI Engineer with 1:1 mentoring
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-300">
          {['8 weeks of personalized 1:1 mentoring with Aman', 'GenAI, RAG, Agentic AI, MCP, A2A, system design', 'Interview and system design discussion every week'].map(t => (
            <li key={t} className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{t}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-zinc-400">
          <span className="text-3xl font-black text-orange-400">&#8377;{DIWALI.price.toLocaleString('en-IN')}</span>
          <span className="ml-2 line-through text-zinc-600">&#8377;{DIWALI.regularPrice.toLocaleString('en-IN')}</span>
        </p>
        <p className="text-xs text-zinc-500">Apply by {DIWALI.deadlineLabel}</p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/diwali-accelerator#apply" onClick={close}
            className="flex-1 text-center bg-orange-500 hover:bg-orange-400 text-black font-black py-3 rounded-xl text-sm"
          >
            Apply &amp; reserve my seat
          </Link>
          <a
            href={DIWALI.pdf} download onClick={close}
            className="flex-1 inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-semibold py-3 rounded-xl text-sm"
          >
            <Download className="w-4 h-4" /> Free PDF
          </a>
        </div>
        <Link href="/diwali-accelerator" onClick={close} className="block mt-3 text-center text-xs text-zinc-500 hover:text-zinc-300">
          See the full syllabus &rarr;
        </Link>
      </div>
    </div>
  )
}
