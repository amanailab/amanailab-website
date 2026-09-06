'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, MessageCircle, Download, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface Enrollment {
  id: string
  tier: string
  amount: number
  created_at: string
  status: string
}

export default function MasterclassCard() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [checked, setChecked]       = useState(false)

  useEffect(() => {
    fetch('/api/masterclass/my-enrollment')
      .then(r => r.json())
      .then(d => { if (d.enrolled) setEnrollment(d.enrollment) })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [])

  if (!checked || !enrollment) return null

  const paidOn = new Date(enrollment.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const amount = enrollment.amount ? `₹${(enrollment.amount / 100).toLocaleString('en-IN')}` : ''

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-orange-400" />
          <p className="text-sm font-bold text-zinc-200">My Live Course</p>
          <span className="ml-auto text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Enrolled
          </span>
        </div>

        <p className="text-xs font-bold text-zinc-100 mb-0.5">GenAI & Agentic AI Interview Masterclass</p>
        <p className="text-[11px] text-zinc-500 mb-4">
          24 live sessions · {amount && `${amount} · `}Enrolled {paidOn}
        </p>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs text-zinc-400">Seat confirmed — sessions starting soon</span>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <a href="https://chat.whatsapp.com/DjiaMTHaWDrG3mmZdDlbxN"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bb5a] text-white text-xs font-bold py-2.5 rounded-xl transition-all">
            <MessageCircle className="w-3.5 h-3.5" /> Join WhatsApp Group
          </a>
          <div className="flex gap-2">
            <a href="/pdfs/masterclass-syllabus.pdf" download target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-bold py-2 rounded-xl transition-all">
              <Download className="w-3.5 h-3.5" /> Syllabus
            </a>
            <Link href="/masterclass"
              className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-bold py-2 rounded-xl transition-all">
              View Course →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
