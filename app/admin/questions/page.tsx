import AdminNav from '@/components/admin/AdminNav'
import QuestionsManager from '@/components/admin/QuestionsManager'
import { getAdminSupabase } from '@/lib/admin'

export interface AdminQuestion {
  id: number
  question: string
  answer: string
  topic: string
  level: string
}

async function getAllQuestions(): Promise<AdminQuestion[]> {
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase
      .from('interview_questions')
      .select('id, question, answer, topic, level')
      .order('id', { ascending: false })
    return (data as AdminQuestion[] | null) ?? []
  } catch (err) {
    console.error('[admin/questions] error:', err)
    return []
  }
}

export default async function AdminQuestionsPage() {
  const questions = await getAllQuestions()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Interview Questions</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {questions.length} question{questions.length === 1 ? '' : 's'} total
            </p>
          </div>
          <QuestionsManager initialQuestions={questions} />
        </div>
      </main>
    </div>
  )
}
