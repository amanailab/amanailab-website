import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'
import { getAdminSupabase } from '@/lib/admin'
import { FileText, Globe, FileEdit, PenSquare, ExternalLink, Home } from 'lucide-react'

async function getStats() {
  const supabase = getAdminSupabase()
  const [{ count: total }, { count: published }] = await Promise.all([
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
  ])
  return {
    total: total ?? 0,
    published: published ?? 0,
    drafts: (total ?? 0) - (published ?? 0),
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Welcome back, Aman</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-zinc-400" />
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total</span>
              </div>
              <p className="text-3xl font-bold text-zinc-100">{stats.total}</p>
              <p className="text-xs text-zinc-500 mt-1">Articles</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Published</span>
              </div>
              <p className="text-3xl font-bold text-zinc-100">{stats.published}</p>
              <p className="text-xs text-zinc-500 mt-1">Live articles</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <FileEdit className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Drafts</span>
              </div>
              <p className="text-3xl font-bold text-zinc-100">{stats.drafts}</p>
              <p className="text-xs text-zinc-500 mt-1">Unpublished</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/blog/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                Write New Article
              </Link>
              <Link
                href="/admin/blog"
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg font-medium text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                Manage Articles
              </Link>
              <a
                href="/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg font-medium text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Blog
              </a>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg font-medium text-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                View Website
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
