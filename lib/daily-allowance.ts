// Daily usage allowance for paid-AI routes.
//
// Anonymous visitors get a small per-IP daily allowance per tool; signed-in
// users get a generous one; Full Bundle subscribers get unlimited.
// Counters live in the `ai_usage` Supabase table (see supabase/ai_usage_schema.sql);
// if the table/RPC is missing we degrade to in-memory rather than blocking.

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/admin'
import { getClientIp } from '@/lib/rate-limit'

const ANON_DAILY_LIMIT   = 3
const AUTH_DAILY_LIMIT   = 20
const BUNDLE_DAILY_LIMIT = 999   // effectively unlimited

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

type ActivePlan = 'free' | 'sd_pro' | 'full_bundle'

async function getActivePlan(userId: string): Promise<ActivePlan> {
  try {
    const admin = getAdminSupabase()
    const { data } = await admin
      .from('sd_subscriptions')
      .select('plan, subscribed_until')
      .eq('user_id', userId)
      .maybeSingle()
    if (!data || new Date(data.subscribed_until) <= new Date()) return 'free'
    return data.plan === 'full_bundle' ? 'full_bundle' : 'sd_pro'
  } catch {
    return 'free'
  }
}

export interface AllowanceOptions {
  /** Per-day limit for anonymous visitors (default 3). */
  anonLimit?: number
  /** Per-day limit for signed-in free users (default 20). */
  authLimit?: number
  /** Per-day limits by subscription plan. Defaults to unlimited for full_bundle only. */
  planLimits?: Partial<Record<Exclude<ActivePlan, 'free'>, number>>
}

/**
 * Enforce the per-day allowance for an AI feature.
 * Returns a ready-to-send response when exhausted, or null when allowed.
 *
 *   const blocked = await enforceDailyAllowance(req, 'resume-analyze')
 *   if (blocked) return blocked
 */
export async function enforceDailyAllowance(
  req: Request,
  feature: string,
  opts: AllowanceOptions = {},
): Promise<NextResponse | null> {
  const userId = await getAuthedUserId()

  let limit = userId ? (opts.authLimit ?? AUTH_DAILY_LIMIT) : (opts.anonLimit ?? ANON_DAILY_LIMIT)

  if (userId) {
    const plan = await getActivePlan(userId)
    if (plan !== 'free') {
      const planLimit = opts.planLimits?.[plan] ?? (plan === 'full_bundle' ? BUNDLE_DAILY_LIMIT : undefined)
      if (planLimit !== undefined) limit = planLimit
    }
    // Unlimited plans skip the counter entirely
    if (limit >= BUNDLE_DAILY_LIMIT) return null
  }

  const identifier = userId ? `user:${userId}:${feature}` : `ip:${getClientIp(req)}:${feature}`
  const day        = new Date().toISOString().slice(0, 10)

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
    if (userId) {
      // Logged-in user hit limit → 402 so clients can show upgrade prompt
      return NextResponse.json(
        {
          error:  `You've reached today's limit of ${limit} uses for this tool. Upgrade for more access.`,
          code:   'PAYWALL',
          limit,
        },
        { status: 402 },
      )
    }
    // Anonymous user hit limit → 429
    return NextResponse.json(
      {
        error: `You've used today's ${limit} free runs for this tool. Sign in to get more per day, or upgrade to the Full AI Career Bundle for unlimited access.`,
        code:  'RATE_LIMIT',
        limit,
      },
      { status: 429 },
    )
  }
  return null
}
