import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = getAdminSupabase()
  const { data } = await supabase.from('companies').select('id, name, slug, logo_emoji, tagline, hq, size, interview_rounds, is_featured').order('name')
  return NextResponse.json({ companies: data ?? [] })
}
