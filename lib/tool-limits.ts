import { getAdminSupabase } from '@/lib/admin'

// Tool name constants — used as keys in ai_tool_usage
export const TOOLS = {
  RESUME:    'resume_analyze',
  INTERVIEW: 'interview_session',
  COVER:     'cover_letter',
  LINKEDIN:  'linkedin_optimize',
  CAREER:    'career_tool',
} as const

export type ToolKey = typeof TOOLS[keyof typeof TOOLS]

export type Plan = 'free' | 'sd_pro' | 'full_bundle'

// Daily limits per plan per tool
const LIMITS: Record<Plan, number> = {
  free:        5,
  sd_pro:      5,     // SD Pro only unlocks system design, not career tools
  full_bundle: 9999,  // effectively unlimited
}

export interface ToolUsage {
  allowed:      boolean
  used:         number
  limit:        number
  plan:         Plan
  isSubscribed: boolean
}

export async function checkToolUsage(userId: string, tool: ToolKey): Promise<ToolUsage> {
  const admin = getAdminSupabase()

  const { data: sub } = await admin
    .from('sd_subscriptions')
    .select('plan, subscribed_until')
    .eq('user_id', userId)
    .maybeSingle()

  const isActive     = !!sub && new Date(sub.subscribed_until) > new Date()
  const plan: Plan   = isActive ? (sub!.plan as Plan) : 'free'
  const limit        = LIMITS[plan]

  const todayStart   = new Date(); todayStart.setHours(0, 0, 0, 0)
  const { count }    = await admin
    .from('ai_tool_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tool', tool)
    .gte('used_at', todayStart.toISOString())

  const used = count ?? 0
  return { allowed: used < limit, used, limit, plan, isSubscribed: isActive }
}

export function recordToolUsage(userId: string, tool: ToolKey): void {
  const admin = getAdminSupabase()
  void admin.from('ai_tool_usage').insert({
    user_id: userId,
    tool,
    used_at: new Date().toISOString(),
  })
}
