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
}

async function getApplications() {
  try {
    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('diwali_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return { rows: [] as Application[], dbError: error.message }
    return { rows: (data ?? []) as Application[], dbError: null }
  } catch (e) {
    return { rows: [] as Application[], dbError: String(e) }
  }
}

export default async function DiwaliAdminPage() {
  const { rows, dbError } = await getApplications()
  const taken = rows.filter(r => r.status === 'selected' || r.status === 'paid').length
  const seatsLeft = Math.max(0, DIWALI.totalSeats - taken)

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6 text-zinc-100">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-black">Diwali AI Accelerator</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Applications close {DIWALI.deadlineLabel}. Set a learner to Selected or Paid to take a seat.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              ['Applications', rows.length],
              ['Selected / Paid', taken],
              ['Seats left', `${seatsLeft} / ${DIWALI.totalSeats}`],
              ['New', rows.filter(r => r.status === 'new').length],
            ].map(([l, v]) => (
              <div key={l as string} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-2xl font-black text-orange-400">{v}</p>
                <p className="text-xs text-zinc-500 mt-1">{l}</p>
              </div>
            ))}
          </div>

          {dbError && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              Could not load applications: {dbError}. Run <code>supabase/diwali_applications_schema.sql</code> in the Supabase SQL editor.
            </div>
          )}

          <div className="mt-6 space-y-3">
            {rows.length === 0 && !dbError && <p className="text-sm text-zinc-500">No applications yet.</p>}
            {rows.map(r => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{r.name}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                  <DiwaliStatusSelect id={r.id} status={r.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline">
                    WhatsApp +{r.whatsapp}
                  </a>
                  <a href={`mailto:${r.email}`} className="text-sky-400 hover:underline">{r.email}</a>
                  {r.role && <span className="text-zinc-400">{r.role}</span>}
                  {r.experience && <span className="text-zinc-400">{r.experience}</span>}
                  {r.python_level && <span className="text-zinc-400">Python: {r.python_level}</span>}
                </div>
                {r.goal && <p className="mt-2 text-sm text-zinc-300"><span className="text-zinc-500">Goal: </span>{r.goal}</p>}
                {r.why && <p className="mt-1 text-sm text-zinc-300"><span className="text-zinc-500">Why: </span>{r.why}</p>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
