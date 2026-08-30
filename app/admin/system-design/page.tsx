import AdminNav from '@/components/admin/AdminNav'
import SDProblemsManager from '@/components/admin/SDProblemsManager'
import { getAdminSupabase } from '@/lib/admin'
import type { SDProblemRow } from '@/components/admin/SDProblemsManager'

async function getDBProblems(): Promise<SDProblemRow[]> {
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase
      .from('sd_problems')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    return (data as SDProblemRow[] | null) ?? []
  } catch {
    return []
  }
}

export default async function AdminSDProblemsPage() {
  const problems = await getDBProblems()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">System Design Problems</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Manage custom problems. The 19 built-in problems always load from code — add new ones here without a deploy.
            </p>
          </div>
          <SDProblemsManager initial={problems} />
        </div>
      </main>
    </div>
  )
}
