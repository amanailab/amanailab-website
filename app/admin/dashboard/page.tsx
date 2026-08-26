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
  Users,
  Activity,
  Code2,
  MessageSquare,
  Clock,
  IndianRupee,
  Zap,
  ShoppingBag,
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
  const [blog, questions, resources, news, newsletter, waitlist, sessions, codeProblems, communityPosts] =
    await Promise.all([
      safeCount('blog_posts'),
      safeCount('interview_questions'),
      safeCount('resources'),
      safeCount('news'),
      safeCount('newsletter_subscribers'),
      safeCount('course_waitlist'),
      safeCount('user_interview_sessions'),
      safeCount('code_problems'),
      safeCount('community_posts'),
    ])
  return {
    blog,
    questions,
    resources,
    news,
    emails: newsletter + waitlist,
    sessions,
    codeProblems,
    communityPosts,
  }
}

async function getRevenueStats(): Promise<{ totalRevenuePaise: number; activeSubscriptions: number; totalOrders: number }> {
  try {
    const supabase = getAdminSupabase()
    const [ordersRes, subsRes] = await Promise.all([
      supabase.from('orders').select('amount, via'),
      supabase.from('sd_subscriptions').select('subscribed_until', { count: 'exact' }).gt('subscribed_until', new Date().toISOString()),
    ])
    const orders = ordersRes.data ?? []
    const revenue = orders.filter((o: { via: string }) => o.via !== 'member_code').reduce((s: number, o: { amount: number }) => s + (o.amount ?? 0), 0)
    return {
      totalRevenuePaise: revenue,
      activeSubscriptions: subsRes.count ?? 0,
      totalOrders: orders.length,
    }
  } catch {
    return { totalRevenuePaise: 0, activeSubscriptions: 0, totalOrders: 0 }
  }
}

async function getTotalUsers(): Promise<number> {
  try {
    const supabase = getAdminSupabase()
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 })
    if (error) return 0
    // The API returns total in the pagination object
    return (data as { total?: number } | null)?.total ?? (data?.users?.length ?? 0)
  } catch {
    return 0
  }
}

type RecentSession = {
  id: string
  user_id: string | null
  topic: string | null
  grade: string | null
  avg_score: number | null
  created_at: string
  userEmail: string
}

async function getRecentSessions(): Promise<RecentSession[]> {
  try {
    const supabase = getAdminSupabase()
    const { data: sessions } = await supabase
      .from('user_interview_sessions')
      .select('id, user_id, topic, grade, avg_score, created_at')
      .order('created_at', { ascending: false })
      .limit(8)

    if (!sessions || sessions.length === 0) return []

    // Fetch user emails for those session user_ids
    const userIds = [...new Set(sessions.map((s) => s.user_id).filter(Boolean))] as string[]
    const emailMap: Record<string, string> = {}

    if (userIds.length > 0) {
      // listUsers doesn't support filter by id list easily — fetch all and map
      const { data: { users } = { users: [] } } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      })
      for (const u of users ?? []) {
        emailMap[u.id] = u.email ?? ''
      }
    }

    return sessions.map((s) => ({
      ...s,
      userEmail: s.user_id ? anonymizeEmail(emailMap[s.user_id] ?? '') : '---',
    }))
  } catch (err) {
    console.error('[admin/dashboard] getRecentSessions error:', err)
    return []
  }
}

function anonymizeEmail(email: string): string {
  if (!email) return '---'
  const [local, domain] = email.split('@')
  if (!domain) return email.slice(0, 3) + '***'
  return local.slice(0, 3) + '***@' + domain
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}


export default async function DashboardPage() {
  const [counts, totalUsers, recentSessions, revenue] = await Promise.all([
    getCounts(),
    getTotalUsers(),
    getRecentSessions(),
    getRevenueStats(),
  ])

  const fmtRevenue = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`

  const CARDS = [
    { title: 'Blog Posts',         description: 'Articles, drafts, and publishing',          Icon: FileText,    href: '/admin/blog',           count: counts.blog            },
    { title: 'Interview Questions',description: 'Add, edit, and bulk import',                 Icon: HelpCircle,  href: '/admin/questions',      count: counts.questions        },
    { title: 'Cheat Sheets',       description: 'Upload and manage PDFs',                    Icon: BookOpen,    href: '/admin/resources',      count: counts.resources        },
    { title: 'News',               description: 'Manual entries + bulk refresh',              Icon: Newspaper,   href: '/admin/news',           count: counts.news             },
    { title: 'Waitlist & Emails',  description: 'Subscribers and contact messages',           Icon: Mail,        href: '/admin/emails',         count: counts.emails           },
    { title: 'Users',              description: 'Registered users and activity',              Icon: Users,       href: '/admin/users',          count: totalUsers              },
    { title: 'Code Problems',      description: 'Code Lab problem bank',                      Icon: Code2,       href: '/admin/code-problems',  count: counts.codeProblems     },
    { title: 'Community',          description: 'Pending and approved posts',                 Icon: MessageSquare,href: '/admin/community',     count: counts.communityPosts   },
    { title: 'Orders',             description: 'Purchases, subscriptions, and revenue',      Icon: ShoppingBag, href: '/admin/orders',         count: revenue.totalOrders     },
  ]

  // Stat bar at top
  const topStats = [
    { label: 'Total Users',         value: totalUsers,                          Icon: Users,         color: 'text-orange-400' },
    { label: 'Revenue',             value: fmtRevenue(revenue.totalRevenuePaise), Icon: IndianRupee, color: 'text-green-400'  },
    { label: 'Active Subscribers',  value: revenue.activeSubscriptions,          Icon: Zap,           color: 'text-blue-400'  },
    { label: 'Total Orders',        value: revenue.totalOrders,                  Icon: ShoppingBag,   color: 'text-purple-400'},
    { label: 'Total Sessions',      value: counts.sessions,                      Icon: Activity,      color: 'text-orange-400'},
    { label: 'Community Posts',     value: counts.communityPosts,                Icon: MessageSquare, color: 'text-orange-400'},
  ]

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Welcome back, Aman</p>
          </div>

          {/* Top stat bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {topStats.map(({ label, value, Icon, color }) => (
              <div
                key={label}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
                    {label}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                </div>
                <span className={`text-xl font-extrabold tabular-nums ${color}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Nav cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {CARDS.map(({ title, description, Icon, href, count }) => (
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
                    {count ?? ''}
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

          {/* Recent Activity */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-200">Recent Activity</h2>
              <span className="ml-auto text-xs text-zinc-600">Last 8 sessions</span>
            </div>

            {recentSessions.length === 0 ? (
              <p className="px-6 py-8 text-sm text-zinc-600 text-center">No sessions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['User', 'Topic', 'Grade', 'Score', 'Time'].map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {recentSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-zinc-300 whitespace-nowrap">
                          {s.userEmail}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 max-w-[180px] truncate">
                          {s.topic ?? <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                          {s.grade ?? <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          {s.avg_score !== null ? (
                            <span
                              className={`font-semibold ${
                                s.avg_score >= 80
                                  ? 'text-green-400'
                                  : s.avg_score >= 60
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {s.avg_score}%
                            </span>
                          ) : (
                            <span className="text-zinc-600">---</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                          {formatDate(s.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
