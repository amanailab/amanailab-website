import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { buildTestCode, runCode, outputsMatch } from '@/lib/piston'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { slug, code } = await req.json()
    if (!slug || !code?.trim()) {
      return NextResponse.json({ error: 'slug and code are required' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { data: problem } = await supabase
      .from('code_problems')
      .select('test_cases')
      .eq('slug', slug)
      .single()

    if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 })

    const testCases = (problem.test_cases as {
      id: number; function_call: string; expected_output: string
      is_hidden: boolean; description: string
    }[]).filter(tc => !tc.is_hidden)

    const results = await Promise.all(
      testCases.map(async (tc) => {
        const fullCode = buildTestCode(code, tc.function_call)
        const start = Date.now()
        try {
          const result = await runCode(fullCode)
          const elapsed = Date.now() - start
          const passed = !result.timedOut && result.code === 0 && outputsMatch(result.stdout, tc.expected_output)
          return {
            id:          tc.id,
            description: tc.description,
            passed,
            input:       tc.function_call,
            expected:    tc.expected_output,
            got:         result.timedOut ? 'Time Limit Exceeded' : result.stderr ? `Error: ${result.stderr}` : result.stdout,
            runtime_ms:  elapsed,
          }
        } catch {
          return {
            id: tc.id, description: tc.description, passed: false,
            input: tc.function_call, expected: tc.expected_output,
            got: 'Execution error', runtime_ms: Date.now() - start,
          }
        }
      })
    )

    return NextResponse.json({ results, ran: 'visible_only' })
  } catch (err) {
    console.error('[code-lab/run]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
