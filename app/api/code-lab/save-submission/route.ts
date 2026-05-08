import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { problem_id, code, status, passed_tests, total_tests, runtime_ms } = await req.json()
    if (!problem_id || !code || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ saved: false })

    const adminSb = getAdminSupabase()
    await adminSb.from('code_submissions').insert({
      user_id: user.id, problem_id, code, status,
      passed_tests, total_tests, runtime_ms,
    })

    return NextResponse.json({ saved: true })
  } catch (err) {
    console.error('[save-submission]', err)
    return NextResponse.json({ saved: false })
  }
}
