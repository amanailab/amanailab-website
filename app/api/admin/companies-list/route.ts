import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = getAdminSupabase()
  const { data } = await supabase.from('companies').select('id, name, slug, logo_emoji, tagline, hq, size, interview_rounds, is_featured').order('name')
  return NextResponse.json({ companies: data ?? [] })
}
