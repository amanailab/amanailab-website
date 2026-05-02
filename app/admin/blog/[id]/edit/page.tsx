import { notFound } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'
import ArticleForm from '@/components/admin/ArticleForm'
import { getAdminSupabase } from '@/lib/admin'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params
  const supabase = getAdminSupabase()
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) notFound()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100">Edit Article</h1>
          <p className="text-zinc-500 text-sm mt-1 font-mono truncate">/blog/{post.slug}</p>
        </div>
        <ArticleForm post={post} />
      </main>
    </div>
  )
}
