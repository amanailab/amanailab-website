import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'
import { enforceRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Records a submission graded in-browser (Pyodide) for instant feedback.
// NOTE: counts come from the client, so this endpoint is not fully tamper-proof —
// the authoritative grader is /api/code-lab/submit (re-runs via Piston server-side).
// We still harden it: auth required, inputs validated/clamped, and the stored
// `status` is DERIVED from the pass counts (not trusted from the body), which
// blocks the trivial `{status:'Accepted'}` forgery.
const ALLOWED_STATUS = new Set(['Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Error'])
const MAX_CODE_CHARS = 20_000

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, 'save-submission', 30, 60_000)
    if (limited) return limited

    const { problem_id, code, status, passed_tests, total_tests, runtime_ms } = await req.json()
    if (!problem_id || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (code.length > MAX_CODE_CHARS) {
      return NextResponse.json({ error: 'Code too large' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ saved: false })

    // Clamp the client-reported counts and derive the status from them so a
    // user can't mark a problem "Accepted" without also claiming a full pass.
    const total = Number.isInteger(total_tests) && total_tests >= 0 ? Math.min(total_tests, 1000) : 0
    const passed = Number.isInteger(passed_tests) && passed_tests >= 0 ? Math.min(passed_tests, total) : 0
    const safeRuntime = Number.isInteger(runtime_ms) && runtime_ms >= 0 ? Math.min(runtime_ms, 600_000) : 0
    const safeStatus =
      total > 0 && passed === total
        ? 'Accepted'
        : ALLOWED_STATUS.has(status)
          ? status
          : 'Wrong Answer'

    const adminSb = getAdminSupabase()
    await adminSb.from('code_submissions').insert({
      user_id: user.id, problem_id, code,
      status: safeStatus, passed_tests: passed, total_tests: total, runtime_ms: safeRuntime,
    })

    return NextResponse.json({ saved: true })
  } catch (err) {
    console.error('[save-submission]', err)
    return NextResponse.json({ saved: false })
  }
}
