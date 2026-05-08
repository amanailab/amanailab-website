import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ solved: [], attempted: [] })

    const adminSb = getAdminSupabase()
    const { data: subs } = await adminSb
      .from('code_submissions')
      .select('problem_id, status')
      .eq('user_id', user.id)

    if (!subs) return NextResponse.json({ solved: [], attempted: [] })

    const solved    = [...new Set(subs.filter(s => s.status === 'Accepted').map(s => s.problem_id))]
    const attempted = [...new Set(subs.filter(s => s.status !== 'Accepted').map(s => s.problem_id))]
                        .filter(id => !solved.includes(id))

    return NextResponse.json({ solved, attempted })
  } catch {
    return NextResponse.json({ solved: [], attempted: [] })
  }
}
