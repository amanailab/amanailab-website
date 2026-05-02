import AdminNav from '@/components/admin/AdminNav'
import ArticleForm from '@/components/admin/ArticleForm'

export default function NewArticlePage() {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100">New Article</h1>
          <p className="text-zinc-500 text-sm mt-1">Write and publish a new blog post</p>
        </div>
        <ArticleForm />
      </main>
    </div>
  )
}
