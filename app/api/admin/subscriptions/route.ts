import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminSupabase } from '@/lib/admin'
import { verifyAdminSession } from '@/lib/auth-tokens'

export const runtime = 'nodejs'

async function auth() {
  const store = await cookies()
  return verifyAdminSession(store.get('admin_session')?.value)
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getAdminSupabase()
  const { data: subs, error } = await supabase
    .from('sd_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!subs || subs.length === 0) {
    return NextResponse.json({ subscriptions: [] })
  }

  // Enrich with user emails
  const userIds = [...new Set(subs.map((s: { user_id: string }) => s.user_id))]
  const emailMap: Record<string, string> = {}
  try {
    const { data: { users } = { users: [] } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    for (const u of users ?? []) {
      if (userIds.includes(u.id)) emailMap[u.id] = u.email ?? ''
    }
  } catch {
    // proceed without emails
  }

  const enriched = subs.map((s: { user_id: string }) => ({ ...s, email: emailMap[s.user_id] ?? null }))
  return NextResponse.json({ subscriptions: enriched })
}
