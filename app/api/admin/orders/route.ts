import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminSupabase } from '@/lib/admin'
import { verifyAdminSession } from '@/lib/auth-tokens'

export const runtime = 'nodejs'

async function auth() {
  const store = await cookies()
  return verifyAdminSession(store.get('admin_session')?.value)
}

export async function GET(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(Number(searchParams.get('limit')  ?? 100), 200)
  const offset = Number(searchParams.get('offset') ?? 0)

  const supabase = getAdminSupabase()
  const { data, error, count } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data, total: count })
}
