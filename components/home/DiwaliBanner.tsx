import Link from 'next/link'
import { Flame, ArrowRight } from 'lucide-react'
import { DIWALI, applicationsClosed } from '@/lib/diwali-config'

export default function DiwaliBanner() {
  if (applicationsClosed()) return null
  return (
    <section className="px-4 sm:px-6 py-6">
      <Link
        href="/diwali-accelerator"
        className="group max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/15 via-orange-500/10 to-amber-500/15 px-5 py-4 hover:border-orange-500/60 transition-colors"
      >
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className="hidden sm:flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
            <Flame className="w-5 h-5" />
          </span>
          <div>
            <p className="text-sm sm:text-base font-bold text-zinc-100">
              Diwali AI Accelerator 2026: only {DIWALI.totalSeats} seats
            </p>
            <p className="text-xs sm:text-sm text-zinc-400">
              Personalized 1:1 GenAI &amp; Agentic AI mentoring &middot; Apply by {DIWALI.deadlineLabel}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 shrink-0 rounded-xl bg-orange-500 group-hover:bg-orange-400 text-black text-sm font-black px-5 py-2.5">
          Apply now <ArrowRight className="w-4 h-4" />
        </span>
      </Link>
    </section>
  )
}
