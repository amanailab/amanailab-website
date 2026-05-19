import AdminNav from '@/components/admin/AdminNav'
import CompanyQuestionsManager from '@/components/admin/CompanyQuestionsManager'
import SeedCompanyQuestionsButton from '@/components/admin/SeedCompanyQuestionsButton'
import { getAdminSupabase } from '@/lib/admin'

async function getData() {
  const supabase = getAdminSupabase()
  const [{ data: questions }, { data: companies }] = await Promise.all([
    supabase.from('company_questions').select('id, company_id, question, model_answer, topic, level').order('id', { ascending: false }),
    supabase.from('companies').select('id, name').order('name'),
  ])
  return { questions: questions ?? [], companies: companies ?? [] }
}

export default async function CompanyQuestionsPage() {
  const { questions, companies } = await getData()
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Company Questions</h1>
              <p className="text-zinc-500 text-sm mt-1">{questions.length} questions across {companies.length} companies</p>
            </div>
            <SeedCompanyQuestionsButton />
          </div>
          <CompanyQuestionsManager initialQuestions={questions} companies={companies} />
        </div>
      </main>
    </div>
  )
}
