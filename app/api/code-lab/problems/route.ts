import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from('code_problems')
    .select('id, title, slug, difficulty, topic, tags, companies, order_index')
    .order('order_index', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ problems: data ?? [] })
}
