import AdminNav from '@/components/admin/AdminNav'
import { getAdminSupabase } from '@/lib/admin'
import { Users, Activity, BarChart2, Trophy } from 'lucide-react'

function anonymizeEmail(email: string): string {
  if (!email) return '---'
  const [local, domain] = email.split('@')
  if (!domain) return email.slice(0, 3) + '***'
  return local.slice(0, 3) + '***@' + domain
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '---'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function getData() {
  const supabase = getAdminSupabase()
  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: { users: authUsers } = { users: [] }, error: authError },
    { data: sessions },
    { data: xpRows },
    { data: dailyRows },
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase
      .from('user_interview_sessions')
      .select('user_id, avg_score, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('user_xp').select('user_id, xp'),
    supabase.from('daily_completions').select('user_id').eq('date', today),
  ])

  if (authError) {
    console.error('[admin/users] listUsers error:', authError)
  }

  // Index sessions by user_id
  const sessionsByUser: Record<string, { count: number; totalScore: number; lastAt: string }> = {}
  for (const s of sessions ?? []) {
    if (!s.user_id) continue
    const entry = sessionsByUser[s.user_id] ?? { count: 0, totalScore: 0, lastAt: '' }
    entry.count += 1
    if (s.avg_score != null) entry.totalScore += s.avg_score
    if (!entry.lastAt || s.created_at > entry.lastAt) entry.lastAt = s.created_at
    sessionsByUser[s.user_id] = entry
  }

  // Index XP by user_id
  const xpByUser: Record<string, number> = {}
  for (const row of xpRows ?? []) {
    if (row.user_id) xpByUser[row.user_id] = row.xp ?? 0
  }

  // Set of user_ids active today
  const activeTodaySet = new Set((dailyRows ?? []).map((r) => r.user_id))

  // Build user rows
  const rows = (authUsers ?? []).map((u) => {
    const sess = sessionsByUser[u.id]
    const sessionCount = sess?.count ?? 0
    const avgScore =
      sess && sess.count > 0 ? Math.round(sess.totalScore / sess.count) : null
    const xp = xpByUser[u.id] ?? 0
    const activeToday = activeTodaySet.has(u.id)
    const lastActive = sess?.lastAt ?? u.last_sign_in_at ?? null
    return {
      id: u.id,
      email: u.email ?? '',
      displayName: (u.user_metadata?.display_name as string) ?? '',
      signupDate: u.created_at,
      sessionCount,
      avgScore,
      xp,
      activeToday,
      lastActive,
    }
  })

  // Sort by signup date descending
  rows.sort((a, b) => (b.signupDate > a.signupDate ? 1 : -1))

  // Summary stats
  const totalUsers = rows.length
  const activeToday = rows.filter((r) => r.activeToday).length
  const totalSessions = (sessions ?? []).length
  const scoredUsers = rows.filter((r) => r.avgScore !== null)
  const overallAvgScore =
    scoredUsers.length > 0
      ? Math.round(
          scoredUsers.reduce((sum, r) => sum + (r.avgScore ?? 0), 0) /
            scoredUsers.length
        )
      : null

  return { rows, totalUsers, activeToday, totalSessions, overallAvgScore }
}

export default async function AdminUsersPage() {
  const { rows, totalUsers, activeToday, totalSessions, overallAvgScore } =
    await getData()

  const summaryCards = [
    {
      label: 'Total Users',
      value: totalUsers,
      Icon: Users,
    },
    {
      label: 'Active Today',
      value: activeToday,
      Icon: Activity,
    },
    {
      label: 'Total Sessions',
      value: totalSessions,
      Icon: BarChart2,
    },
    {
      label: 'Avg Score',
      value: overallAvgScore !== null ? `${overallAvgScore}%` : '---',
      Icon: Trophy,
    },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Users</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {totalUsers} registered users
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {summaryCards.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {label}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-orange-400" />
                  </div>
                </div>
                <span className="text-2xl font-extrabold tabular-nums text-zinc-100">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-200">
                All Users
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {[
                      'Email',
                      'Display Name',
                      'Signed Up',
                      'Sessions',
                      'Avg Score',
                      'XP',
                      'Last Active',
                      'Today',
                    ].map((col) => (
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
                  {rows.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300 whitespace-nowrap">
                        {anonymizeEmail(user.email)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {user.displayName || (
                          <span className="text-zinc-600 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {formatDate(user.signupDate)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-300 text-center">
                        {user.sessionCount > 0 ? (
                          <span className="font-semibold text-zinc-100">
                            {user.sessionCount}
                          </span>
                        ) : (
                          <span className="text-zinc-600">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-center whitespace-nowrap">
                        {user.avgScore !== null ? (
                          <span
                            className={`font-semibold ${
                              user.avgScore >= 80
                                ? 'text-green-400'
                                : user.avgScore >= 60
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {user.avgScore}%
                          </span>
                        ) : (
                          <span className="text-zinc-600">---</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-300 text-center">
                        {user.xp > 0 ? (
                          <span className="font-semibold text-orange-400">
                            {user.xp.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-zinc-600">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {formatDate(user.lastActive)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.activeToday ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-600 border border-zinc-700">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-zinc-600 text-sm"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
