import AdminNav from '@/components/admin/AdminNav'
import NewsManager from '@/components/admin/NewsManager'
import { getAdminSupabase } from '@/lib/admin'

export interface AdminNewsArticle {
  id: number
  title: string
  source: string
  source_url: string
  summary: string
  developer_take: string
  impact_score: 'game_changer' | 'important' | 'good_to_know'
  category: 'models' | 'research' | 'tools' | 'agents' | 'india_ai' | 'general'
  published_at: string
}

async function getRecentArticles(): Promise<AdminNewsArticle[]> {
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase
      .from('news')
      .select(
        'id, title, source, source_url, summary, developer_take, impact_score, category, published_at'
      )
      .order('published_at', { ascending: false })
      .limit(50)
    return (data as AdminNewsArticle[] | null) ?? []
  } catch (err) {
    console.error('[admin/news] error:', err)
    return []
  }
}

export default async function AdminNewsPage() {
  const articles = await getRecentArticles()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">News</h1>
            <p className="text-zinc-500 text-sm mt-1">Latest 50 articles</p>
          </div>
          <NewsManager initialArticles={articles} />
        </div>
      </main>
    </div>
  )
}
