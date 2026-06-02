import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { sanitizeTestCasesForClient } from '@/lib/code-grading'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const sb = getAdminSupabase()
  const { data, error } = await sb
    .from('code_problems')
    .select('id, test_cases')
    .eq('slug', slug)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Hidden tests' expected outputs are stripped (hashed) so answers aren't exposed.
  return NextResponse.json({
    id: data.id,
    test_cases: await sanitizeTestCasesForClient(data.test_cases),
  })
}
