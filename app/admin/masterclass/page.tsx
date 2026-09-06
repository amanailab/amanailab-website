import { getAdminSupabase } from '@/lib/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_EMAIL = 'amanchauhan7172@gmail.com'

async function getRegistrations() {
  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from('masterclass_registrations')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function MasterclassAdminPage() {
  const cookieStore = await cookies()
  const email = cookieStore.get('admin_email')?.value
  if (email !== ADMIN_EMAIL) redirect('/admin')

  const rows = await getRegistrations()

  const paid     = rows.filter(r => r.via === 'payment')
  const interest = rows.filter(r => r.via === 'interest_form')
  const revenue  = paid.reduce((s: number, r: { amount?: number }) => s + (r.amount ?? 0), 0)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1">Masterclass Registrations</h1>
          <p className="text-zinc-500 text-sm">GenAI & Agentic AI Interview Masterclass</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: `₹${(revenue / 100).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
            { label: 'Paid Seats',    value: paid.length,     color: 'text-orange-400' },
            { label: 'Interest Only', value: interest.length, color: 'text-blue-400' },
            { label: 'Total Leads',   value: rows.length,     color: 'text-zinc-300' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-sm">All Registrations</h2>
            <span className="text-xs text-zinc-600">{rows.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  {['Date', 'Name', 'Email', 'WhatsApp', 'Tier', 'Via', 'Amount', 'Payment ID'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-600">No registrations yet</td></tr>
                ) : rows.map((r: {
                  id: string; created_at: string; name?: string; email: string; whatsapp?: string;
                  tier: string; via: string; amount?: number; razorpay_payment_id?: string; status?: string
                }) => (
                  <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-200 whitespace-nowrap">{r.name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{r.email}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{r.whatsapp ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        r.tier === 'early'
                          ? 'bg-orange-500/15 text-orange-400 border-orange-500/25'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>{r.tier}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        r.via === 'payment'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          : 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                      }`}>{r.via === 'payment' ? 'Paid' : 'Interest'}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400 text-xs">
                      {r.amount ? `₹${(r.amount / 100).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-[10px] font-mono">
                      {r.razorpay_payment_id ? r.razorpay_payment_id.slice(-10) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
