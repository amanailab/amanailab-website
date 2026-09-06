import { getAdminSupabase } from '@/lib/admin'
import AdminNav from '@/components/admin/AdminNav'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_EMAIL = 'amanchauhan7172@gmail.com'
const WA_GROUP    = 'https://chat.whatsapp.com/DjiaMTHaWDrG3mmZdDlbxN'

async function getRegistrations() {
  try {
    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('masterclass_registrations')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[admin/masterclass] fetch error:', error.message)
      return { rows: [], dbError: error.message }
    }
    return { rows: data ?? [], dbError: null }
  } catch (e) {
    console.error('[admin/masterclass] unexpected error:', e)
    return { rows: [], dbError: String(e) }
  }
}

export default async function MasterclassAdminPage() {
  const cookieStore = await cookies()
  const email = cookieStore.get('admin_email')?.value
  if (email !== ADMIN_EMAIL) redirect('/admin')

  const { rows, dbError } = await getRegistrations()

  const paid      = rows.filter(r => r.status === 'paid')
  const interest  = rows.filter(r => r.status !== 'paid')
  const revenue   = paid.reduce((s: number, r: { amount?: number }) => s + (r.amount ?? 0), 0)
  const linked    = paid.filter(r => r.user_id).length
  const earlyBird = paid.filter(r => r.tier === 'early').length

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6 text-zinc-100">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1">Masterclass Registrations</h1>
            <p className="text-zinc-500 text-sm">GenAI & Agentic AI Interview Masterclass</p>
          </div>
          <a href={WA_GROUP} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bb5a] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all">
            📲 Open WhatsApp Group
          </a>
        </div>

        {/* DB error banner */}
        {dbError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4">
            <p className="text-red-400 font-bold text-sm mb-1">Database Error</p>
            <p className="text-red-300 text-xs font-mono">{dbError}</p>
            <p className="text-zinc-400 text-xs mt-2">Run <code className="bg-zinc-800 px-1 rounded">supabase/masterclass_schema.sql</code> in your Supabase SQL Editor to create the table.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Revenue',   value: `₹${(revenue / 100).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
            { label: 'Paid Seats',      value: paid.length,     color: 'text-orange-400' },
            { label: 'Early Bird',      value: earlyBird,       color: 'text-amber-400' },
            { label: 'Account Linked',  value: linked,          color: 'text-blue-400' },
            { label: 'Interest Leads',  value: interest.length, color: 'text-zinc-300' },
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
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  {['Date', 'Name', 'Email', 'WhatsApp', 'Tier', 'Amount', 'Account', 'Payment ID'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paid.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-600">No paid students yet</td></tr>
                ) : paid.map((r: {
                  id: string; created_at: string; name?: string; email: string; whatsapp?: string;
                  tier: string; amount?: number; razorpay_payment_id?: string; user_id?: string
                }) => (
                  <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-200 whitespace-nowrap">{r.name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{r.email}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.whatsapp ? (
                        <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="text-[#25D366] hover:underline">{r.whatsapp}</a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        r.tier === 'early'
                          ? 'bg-orange-500/15 text-orange-400 border-orange-500/25'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>{r.tier}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400 text-xs whitespace-nowrap">
                      {r.amount ? `₹${(r.amount / 100).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        r.user_id
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                          : 'bg-zinc-800 text-zinc-600 border-zinc-700'
                      }`}>{r.user_id ? 'Linked' : 'Guest'}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-[10px] font-mono">
                      {r.razorpay_payment_id ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interest leads */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-sm text-blue-400">Interest Leads ({interest.length})</h2>
            <span className="text-xs text-zinc-600">Not yet paid — follow up on WhatsApp</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  {['Date', 'Name', 'Email', 'WhatsApp', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interest.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-600">No interest leads yet</td></tr>
                ) : interest.map((r: {
                  id: string; created_at: string; name?: string; email: string; whatsapp?: string
                }) => (
                  <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-200">{r.name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{r.email}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.whatsapp ? (
                        <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(r.name ?? '')}%2C%20I%27m%20Aman%20from%20AmanAI%20Lab.%20You%20showed%20interest%20in%20the%20GenAI%20Masterclass%20%E2%80%94%20would%20you%20like%20to%20reserve%20your%20seat%3F`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[#25D366] hover:underline">{r.whatsapp}</a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.whatsapp && (
                        <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(r.name ?? '')}%2C%20I%27m%20Aman%20from%20AmanAI%20Lab%21`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[10px] bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/25 px-2.5 py-1 rounded-lg font-bold hover:bg-[#25D366]/25 transition-colors">
                          Follow Up →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      </main>
    </div>
  )
}
