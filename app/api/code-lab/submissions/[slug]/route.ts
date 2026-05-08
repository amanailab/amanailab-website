import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ submissions: [] })

    const adminSb = getAdminSupabase()

    // Get problem id
    const { data: problem } = await adminSb
      .from('code_problems')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!problem) return NextResponse.json({ submissions: [] })

    const { data: submissions } = await adminSb
      .from('code_submissions')
      .select('id, status, passed_tests, total_tests, runtime_ms, created_at, code')
      .eq('user_id', user.id)
      .eq('problem_id', problem.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ submissions: submissions ?? [] })
  } catch (err) {
    console.error('[submissions]', err)
    return NextResponse.json({ submissions: [] })
  }
}
