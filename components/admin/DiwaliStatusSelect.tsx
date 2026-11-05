'use client'

import { useState } from 'react'
import { DIWALI_STATUSES } from '@/lib/diwali-config'

const LABELS: Record<string, string> = {
  new: 'New',
  call_scheduled: 'Call scheduled',
  selected: 'Selected',
  paid: 'Paid',
  rejected: 'Rejected',
}

export default function DiwaliStatusSelect({ id, status }: { id: number; status: string }) {
  const [value, setValue] = useState(status)
  const [busy, setBusy] = useState(false)

  async function change(next: string) {
    if ((next === 'paid' || next === 'selected') &&
      !window.confirm(`Mark this applicant as "${LABELS[next]}"? This takes one of the 3 seats.`)) return
    const prev = value
    setValue(next)
    setBusy(true)
    try {
      const res = await fetch('/api/admin/diwali', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      if (!res.ok) setValue(prev)
    } catch {
      setValue(prev)
    } finally {
      setBusy(false)
    }
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={e => change(e.target.value)}
      className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
    >
      {DIWALI_STATUSES.map(s => <option key={s} value={s}>{LABELS[s]}</option>)}
    </select>
  )
}
