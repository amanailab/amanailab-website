import AdminNav from '@/components/admin/AdminNav'
import NewProblemForm from '@/components/admin/NewProblemForm'
import { getAdminSupabase } from '@/lib/admin'

async function getProblemsCount(): Promise<number> {
  try {
    const sb = getAdminSupabase()
    const { count } = await sb
      .from('code_problems')
      .select('*', { count: 'exact', head: true })
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function NewCodeProblemPage() {
  const count = await getProblemsCount()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">New Code Problem</h1>
            <p className="text-zinc-500 text-sm mt-1">Create a new AI/ML coding challenge for Code Lab</p>
          </div>
          <NewProblemForm defaultOrderIndex={count + 1} />
        </div>
      </main>
    </div>
  )
}
