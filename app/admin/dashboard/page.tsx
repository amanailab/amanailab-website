import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'
import { getAdminSupabase } from '@/lib/admin'
import {
  FileText,
  HelpCircle,
  BookOpen,
  Newspaper,
  Mail,
  ArrowRight,
} from 'lucide-react'

async function safeCount(table: string): Promise<number> {
  try {
    const supabase = getAdminSupabase()
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    return count ?? 0
  } catch (err) {
    console.error(`[admin/dashboard] count(${table}) error:`, err)
    return 0
  }
}

async function getCounts() {
  const [blog, questions, resources, news, newsletter, waitlist] = await Promise.all([
    safeCount('blog_posts'),
    safeCount('interview_questions'),
    safeCount('resources'),
    safeCount('news'),
    safeCount('newsletter_subscribers'),
    safeCount('course_waitlist'),
  ])
  return { blog, questions, resources, news, emails: newsletter + waitlist }
}

const CARDS = [
  {
    title: 'Blog Posts',
    description: 'Articles, drafts, and publishing',
    Icon: FileText,
    href: '/admin/blog',
    countKey: 'blog' as const,
  },
  {
    title: "Interview Questions",
    description: 'Add, edit, and bulk import',
    Icon: HelpCircle,
    href: '/admin/questions',
    countKey: 'questions' as const,
  },
  {
    title: 'Cheat Sheets',
    description: 'Upload and manage PDFs',
    Icon: BookOpen,
    href: '/admin/resources',
    countKey: 'resources' as const,
  },
  {
    title: 'News',
    description: 'Manual entries + bulk refresh',
    Icon: Newspaper,
    href: '/admin/news',
    countKey: 'news' as const,
  },
  {
    title: 'Waitlist & Emails',
    description: 'Subscribers and contact messages',
    Icon: Mail,
    href: '/admin/emails',
    countKey: 'emails' as const,
  },
]

export default async function DashboardPage() {
  const counts = await getCounts()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Welcome back, Aman</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CARDS.map(({ title, description, Icon, href, countKey }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-3xl font-extrabold tabular-nums text-zinc-100">
                    {counts[countKey]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-zinc-100 mb-1">{title}</h3>
                  <p className="text-xs text-zinc-500">{description}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 group-hover:gap-2 transition-all">
                  Manage <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
