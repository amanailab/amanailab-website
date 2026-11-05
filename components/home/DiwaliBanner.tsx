import Link from 'next/link'
import { Flame, ArrowRight } from 'lucide-react'
import { DIWALI, applicationsClosed } from '@/lib/diwali-config'

export default function DiwaliBanner() {
  if (applicationsClosed()) return null
  return (
    <Link
      href="/diwali-accelerator"
      className="block bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-black text-center px-4 py-2.5 text-sm font-bold hover:brightness-105"
    >
      <span className="inline-flex items-center gap-2 flex-wrap justify-center">
        <Flame className="w-4 h-4" />
        Diwali AI Accelerator 2026: only {DIWALI.totalSeats} seats, 1:1 mentoring, 2 real projects. Apply by {DIWALI.deadlineLabel}
        <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  )
}
