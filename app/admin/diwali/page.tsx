import { getAdminSupabase } from '@/lib/admin'
import AdminNav from '@/components/admin/AdminNav'
import DiwaliStatusSelect from '@/components/admin/DiwaliStatusSelect'
import { DIWALI } from '@/lib/diwali-config'

export const dynamic = 'force-dynamic'

type Application = {
  id: number
  created_at: string
  name: string
  email: string
  whatsapp: string
  role: string | null
  experience: string | null
  python_level: string | null
  goal: string | null
  why: string | null
  status: string
  payment_plan: string | null
  amount_paid: number | null
  razorpay_payment_id: string | null
  paid_at: string | null
}

async function getApplications() {
  try {
    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('diwali_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[admin/diwali] fetch error:', error.message)
      return { rows: [] as Application[], dbError: error.message }
    }
    return { rows: (data ?? []) as Application[], dbError: null }
  } catch (e) {
    console.error('[admin/diwali] unexpected error:', e)
    return { rows: [] as Application[], dbError: String(e) }
  }
}

const th = 'px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600'
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`
const wa = (n: string, text?: string) =>
  `https://wa.me/${n.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export default async function DiwaliAdminPage() {
  const { rows, dbError } = await getApplications()

  // Same split as the Masterclass page: paid vs registered-but-not-paid
  const paid = rows.filter(r => r.status === 'paid')
  const leads = rows.filter(r => r.status !== 'paid')
  const revenue = paid.reduce((s, r) => s + (r.amount_paid ?? 0), 0)
  const seatsTaken = rows.filter(r => r.status === 'paid' || r.status === 'selected').length
  const seatsLeft = Math.max(0, DIWALI.totalSeats - seatsTaken)

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6 text-zinc-100">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black mb-1">Diwali AI Accelerator</h1>
              <p className="text-zinc-500 text-sm">
                Applications close {DIWALI.deadlineLabel} &middot; {DIWALI.totalSeats} seats &middot; &#8377;{DIWALI.price.toLocaleString('en-IN')}
              </p>
            </div>
            <a href="/diwali-accelerator" target="_blank" rel="noopener noreferrer"
              className="text-sm font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25 px-4 py-2.5 rounded-xl hover:bg-orange-500/25">
              View public page &rarr;
            </a>
          </div>

          {dbError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4">
              <p className="text-red-400 font-bold text-sm mb-1">Database Error</p>
              <p className="text-red-300 text-xs font-mono">{dbError}</p>
              <p className="text-zinc-400 text-xs mt-2">Run <code className="bg-zinc-800 px-1 rounded">supabase/diwali_applications_schema.sql</code> in your Supabase SQL Editor.</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Revenue',        value: inr(revenue),                          color: 'text-emerald-400' },
              { label: 'Paid Seats',           value: paid.length,                           color: 'text-orange-400' },
              { label: 'Seats Left',           value: `${seatsLeft} / ${DIWALI.totalSeats}`, color: 'text-amber-400' },
              { label: 'Registered, Not Paid', value: leads.length,                          color: 'text-blue-400' },
              { label: 'Total Applications',   value: rows.length,                           color: 'text-zinc-300' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Paid students */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-bold text-sm text-emerald-400">Paid Students ({paid.length})</h2>
              <span className="text-xs text-zinc-600">Seat confirmed. Schedule the fit call on WhatsApp</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left">
                    {['Date', 'Name', 'Email', 'WhatsApp', 'Plan', 'Paid', 'Balance due', 'Payment ID', 'Status'].map(h => <th key={h} className={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paid.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-600">No paid students yet</td></tr>
                  ) : paid.map(r => {
                    const paidPaise = r.amount_paid ?? 0
                    const balance = Math.max(0, DIWALI.price * 100 - paidPaise)
                    return (
                      <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{fmtDate(r.paid_at ?? r.created_at)}</td>
                        <td className="px-4 py-3 font-medium text-zinc-200 whitespace-nowrap">{r.name}</td>
                        <td className="px-4 py-3 text-zinc-400 text-xs">{r.email}</td>
                        <td className="px-4 py-3 text-xs">
                          <a href={wa(r.whatsapp, `Hi ${r.name}, I'm Aman from AmanAI Lab. Your Diwali AI Accelerator seat is confirmed! Let's schedule your fit call.`)}
                            target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline">+{r.whatsapp}</a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border bg-orange-500/15 text-orange-400 border-orange-500/25">
                            {r.payment_plan ?? 'manual'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400 text-xs whitespace-nowrap">{paidPaise ? inr(paidPaise) : '—'}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {paidPaise ? (balance > 0 ? <span className="text-amber-400">{inr(balance)}</span> : <span className="text-zinc-600">Nil</span>) : '—'}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-[10px] font-mono">
                          {r.razorpay_payment_id ?? <span className="text-amber-400 font-sans">Marked manually, no Razorpay payment</span>}
                        </td>
                        <td className="px-4 py-3"><DiwaliStatusSelect id={r.id} status={r.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Registered, not paid */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-bold text-sm text-blue-400">Registered, Not Paid ({leads.length})</h2>
              <span className="text-xs text-zinc-600">Follow up on WhatsApp</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left">
                    {['Date', 'Name', 'Email', 'WhatsApp', 'Background', 'Goal', 'Status', 'Action'].map(h => <th key={h} className={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-600">No unpaid registrations</td></tr>
                  ) : leads.map(r => (
                    <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors align-top">
                      <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{fmtDate(r.created_at)}</td>
                      <td className="px-4 py-3 font-medium text-zinc-200 whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{r.email}</td>
                      <td className="px-4 py-3 text-xs">
                        <a href={wa(r.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline">+{r.whatsapp}</a>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {[r.role, r.experience, r.python_level && `Python: ${r.python_level}`].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 max-w-[260px]">{r.goal || '—'}</td>
                      <td className="px-4 py-3"><DiwaliStatusSelect id={r.id} status={r.status} /></td>
                      <td className="px-4 py-3">
                        <a
                          href={wa(r.whatsapp, `Hi ${r.name}, I'm Aman from AmanAI Lab. Thanks for applying to the Diwali AI Accelerator 2026! Only ${DIWALI.totalSeats} seats are available. You can reserve yours here: https://www.amanailab.com/diwali-accelerator#apply`)}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[10px] bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/25 px-2.5 py-1 rounded-lg font-bold hover:bg-[#25D366]/25 transition-colors whitespace-nowrap">
                          Follow Up &rarr;
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-6 text-xs text-zinc-600">
            Payments made on the website appear under Paid Students automatically, with the Razorpay payment ID. If someone pays another way (for example, UPI on WhatsApp), set their status to Paid here after you confirm the money has arrived.
          </p>
        </div>
      </main>
    </div>
  )
}
