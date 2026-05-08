import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'
import { buildTestCode, runCode, outputsMatch } from '@/lib/piston'

export const runtime = 'nodejs'
export const maxDuration = 45

export async function POST(req: Request) {
  try {
    const { slug, code } = await req.json()
    if (!slug || !code?.trim()) {
      return NextResponse.json({ error: 'slug and code are required' }, { status: 400 })
    }

    const adminSb = getAdminSupabase()
    const { data: problem } = await adminSb
      .from('code_problems')
      .select('id, test_cases')
      .eq('slug', slug)
      .single()

    if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 })

    const testCases = problem.test_cases as {
      id: number; function_call: string; expected_output: string
      is_hidden: boolean; description: string
    }[]

    // Run all test cases (including hidden)
    const start = Date.now()
    const results = await Promise.all(
      testCases.map(async (tc) => {
        const fullCode = buildTestCode(code, tc.function_call)
        try {
          const result = await runCode(fullCode)
          const passed = !result.timedOut && result.code === 0 && outputsMatch(result.stdout, tc.expected_output)
          return {
            id: tc.id, is_hidden: tc.is_hidden, description: tc.description, passed,
            input: tc.function_call, expected: tc.expected_output,
            got: result.timedOut ? 'Time Limit Exceeded' : result.stderr ? `Error: ${result.stderr}` : result.stdout,
          }
        } catch {
          return { id: tc.id, is_hidden: tc.is_hidden, description: tc.description, passed: false,
            input: tc.function_call, expected: tc.expected_output, got: 'Execution error' }
        }
      })
    )

    const runtime_ms   = Date.now() - start
    const passedCount  = results.filter(r => r.passed).length
    const totalCount   = results.length
    const status       = passedCount === totalCount ? 'Accepted' : 'Wrong Answer'

    // Save submission if user is logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await adminSb.from('code_submissions').insert({
        user_id:      user.id,
        problem_id:   problem.id,
        code,
        status,
        passed_tests: passedCount,
        total_tests:  totalCount,
        runtime_ms,
      })
    }

    return NextResponse.json({
      status,
      passed_tests: passedCount,
      total_tests:  totalCount,
      runtime_ms,
      results: results.map(r => ({
        ...r,
        // Hide expected/got for hidden test cases that passed (don't reveal answers)
        expected: r.is_hidden && r.passed ? '(hidden)' : r.expected,
        got:      r.is_hidden && r.passed ? '(hidden)' : r.got,
      })),
    })
  } catch (err) {
    console.error('[code-lab/submit]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
