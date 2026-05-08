import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { SEED_PROBLEMS } from './problems'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}))
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminSupabase()
  const { error } = await supabase
    .from('code_problems')
    .upsert(SEED_PROBLEMS, { onConflict: 'slug' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ seeded: SEED_PROBLEMS.length })
}
