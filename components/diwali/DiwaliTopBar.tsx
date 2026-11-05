'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Download } from 'lucide-react'
import { DIWALI } from '@/lib/diwali-config'

const BAR_H = 36

/**
 * Site-wide announcement bar pinned above the navbar.
 * It sets --diwali-bar-h so the fixed navbar (and sticky bars) shift down
 * and page content gets matching top padding. Hidden on the offer page itself.
 */
export default function DiwaliTopBar({ initialOpen }: { initialOpen: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(initialOpen)

  // Hide the bar at the deadline even if this page was served from a cache.
  useEffect(() => {
    const ms = Math.min(Math.max(0, new Date(DIWALI.deadline).getTime() - Date.now()), 2 ** 31 - 1)
    const t = setTimeout(() => setOpen(false), ms)
    return () => clearTimeout(t)
  }, [])

  if (!open || pathname?.startsWith('/diwali-accelerator')) return null

  return (
    <>
      <style>{`:root{--diwali-bar-h:${BAR_H}px}body{padding-top:${BAR_H}px}`}</style>
      <div
        className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 sm:gap-4 px-3 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-black"
        style={{ height: BAR_H }}
      >
        <Flame className="w-4 h-4 shrink-0 hidden sm:block" />
        <Link href="/diwali-accelerator" className="text-xs sm:text-sm font-bold truncate hover:underline">
          <span className="sm:hidden">Diwali AI Accelerator: only {DIWALI.totalSeats} seats</span>
          <span className="hidden sm:inline">
            Diwali AI Accelerator 2026: only {DIWALI.totalSeats} seats &middot; 1:1 mentoring &middot; Apply by {DIWALI.deadlineLabel}
          </span>
        </Link>
        <Link
          href="/diwali-accelerator#apply"
          className="shrink-0 rounded-full bg-black text-orange-300 text-[11px] sm:text-xs font-black px-3 py-1 hover:bg-zinc-900"
        >
          Apply now
        </Link>
        <a
          href={DIWALI.pdf}
          download
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-black/60 text-[11px] sm:text-xs font-bold px-2.5 py-1 hover:bg-black/10"
        >
          <Download className="w-3 h-3" /> <span className="hidden xs:inline sm:inline">PDF</span>
        </a>
      </div>
    </>
  )
}
