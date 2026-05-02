import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'
import { getAdminSupabase, type BlogPost } from '@/lib/admin'
import AdminBlogTable from '@/components/admin/AdminBlogTable'
import { PenSquare } from 'lucide-react'

async function getAllPosts(): Promise<BlogPost[]> {
  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminBlogPage() {
  const posts = await getAllPosts()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">All Articles</h1>
              <p className="text-zinc-500 text-sm mt-1">{posts.length} article{posts.length !== 1 ? 's' : ''} total</p>
            </div>
            <Link
              href="/admin/blog/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              New Article
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <p className="text-zinc-500 mb-4">No articles yet.</p>
              <Link href="/admin/blog/new" className="text-orange-400 hover:text-orange-300 text-sm font-medium">
                Write your first article →
              </Link>
            </div>
          ) : (
            <AdminBlogTable posts={posts} />
          )}
        </div>
      </main>
    </div>
  )
}
