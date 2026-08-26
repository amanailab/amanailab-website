import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

const FREE_LIMIT = 2
const PAID_DAILY = 15

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ authenticated: false })

    const admin = getAdminSupabase()

    const { data: sub } = await admin
      .from('sd_subscriptions')
      .select('subscribed_until, plan')
      .eq('user_id', user.id)
      .maybeSingle()

    const now          = new Date()
    const isSubscribed = !!sub && new Date(sub.subscribed_until) > now
    const plan         = isSubscribed ? (sub!.plan as string) : 'free'

    if (isSubscribed) {
      // IST (UTC+5:30) daily window — matches the review route's timezone
      const IST_MS   = 5.5 * 60 * 60 * 1000
      const nowIst   = new Date(Date.now() + IST_MS)
      const istStart = new Date(
        Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - IST_MS,
      )
      const { count }  = await admin
        .from('sd_review_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('used_at', istStart.toISOString())

      return NextResponse.json({
        authenticated:   true,
        isSubscribed:    true,
        plan,
        subscribedUntil: sub!.subscribed_until,
        dailyUsed:       count ?? 0,
        dailyLimit:      PAID_DAILY,
      })
    }

    const { count } = await admin
      .from('sd_review_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      authenticated: true,
      isSubscribed:  false,
      plan:          'free',
      freeUsed:      count ?? 0,
      freeLimit:     FREE_LIMIT,
    })
  } catch (err) {
    console.error('[sd-pro/status]', err)
    return NextResponse.json({ authenticated: false })
  }
}
