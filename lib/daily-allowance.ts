// Daily usage allowance for paid-AI routes.
//
// Anonymous visitors get a small per-IP daily allowance per tool; signed-in
// users get a generous one. Counters live in the `ai_usage` Supabase table
// (see supabase/ai_usage_schema.sql) so they survive serverless instance
// recycling; if the table/RPC is missing we degrade to an in-memory counter
// rather than blocking the tool.

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/admin'
import { getClientIp } from '@/lib/rate-limit'

const ANON_DAILY_LIMIT = 3
const AUTH_DAILY_LIMIT = 20

// In-memory fallback (per serverless instance)
const memStore = new Map<string, { day: string; count: number }>()

async function getAuthedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => { /* read-only in route handlers */ },
        },
      },
    )
    const { data } = await supabase.auth.getUser()
    return data.user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Enforce the per-day allowance for an AI feature.
 * Returns a ready-to-send 429 response when exhausted, or null when allowed.
 *
 *   const blocked = await enforceDailyAllowance(req, 'resume-analyze')
 *   if (blocked) return blocked
 */
export async function enforceDailyAllowance(req: Request, feature: string): Promise<NextResponse | null> {
  const userId = await getAuthedUserId()
  const limit = userId ? AUTH_DAILY_LIMIT : ANON_DAILY_LIMIT
  const identifier = userId ? `user:${userId}:${feature}` : `ip:${getClientIp(req)}:${feature}`
  const day = new Date().toISOString().slice(0, 10)

  let count: number | null = null
  try {
    const sb = getAdminSupabase()
    const { data, error } = await sb.rpc('increment_ai_usage', { p_identifier: identifier, p_day: day })
    if (!error && typeof data === 'number') count = data
  } catch { /* fall through to memory */ }

  if (count === null) {
    const entry = memStore.get(identifier)
    if (!entry || entry.day !== day) {
      memStore.set(identifier, { day, count: 1 })
      count = 1
    } else {
      entry.count++
      count = entry.count
    }
  }

  if (count > limit) {
    const error = userId
      ? `You've reached today's limit of ${AUTH_DAILY_LIMIT} uses for this tool. It resets at midnight UTC.`
      : `You've used today's ${ANON_DAILY_LIMIT} free runs for this tool. Create a free account to get ${AUTH_DAILY_LIMIT} per day.`
    return NextResponse.json({ error }, { status: 429 })
  }
  return null
}
