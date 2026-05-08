import AdminNav from '@/components/admin/AdminNav'
import { getAdminSupabase } from '@/lib/admin'
import CodeProblemsManager from '@/components/admin/CodeProblemsManager'

interface Problem {
  id: string; title: string; slug: string; difficulty: string
  topic: string; order_index: number
}

async function getProblems(): Promise<Problem[]> {
  try {
    const sb = getAdminSupabase()
    const { data } = await sb
      .from('code_problems')
      .select('id, title, slug, difficulty, topic, order_index')
      .order('order_index', { ascending: true })
    return (data as Problem[] | null) ?? []
  } catch {
    return []
  }
}

export default async function AdminCodeProblemsPage() {
  const problems = await getProblems()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <CodeProblemsManager problems={problems} />
        </div>
      </main>
    </div>
  )
}
