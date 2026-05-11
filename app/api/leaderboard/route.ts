import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function anonymize(email: string, name: string | null): string {
  if (name && name.length > 1) return name
  const local = email.split('@')[0]
  return local.slice(0, 2) + '***'
}

export async function GET() {
  try {
    const sb = getClient()

    // Top all-time: aggregate sessions per user
    const { data, error } = await sb
      .from('user_interview_sessions')
      .select('user_id, avg_score, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Aggregate by user
    const userMap = new Map<string, { scores: number[]; latest: string }>()
    for (const row of data ?? []) {
      const existing = userMap.get(row.user_id)
      if (existing) {
        existing.scores.push(row.avg_score)
      } else {
        userMap.set(row.user_id, { scores: [row.avg_score], latest: row.created_at })
      }
    }

    // Get display names for top users
    const userIds = [...userMap.keys()]
    const { data: users } = await sb.auth.admin.listUsers()
    const userNameMap = new Map<string, { email: string; name: string | null }>()
    for (const u of users?.users ?? []) {
      userNameMap.set(u.id, {
        email: u.email ?? '',
        name: u.user_metadata?.display_name ?? null,
      })
    }

    // Build leaderboard
    const leaderboard = userIds
      .map(uid => {
        const { scores, latest } = userMap.get(uid)!
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        const info = userNameMap.get(uid)
        return {
          uid,
          name: info ? anonymize(info.email, info.name) : 'User',
          avg: Math.round(avg * 10) / 10,
          sessions: scores.length,
          latest,
        }
      })
      .filter(u => u.sessions >= 1)
      .sort((a, b) => b.avg - a.avg || b.sessions - a.sessions)
      .slice(0, 20)

    // Weekly (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const weekMap = new Map<string, number[]>()
    for (const row of data ?? []) {
      if (row.created_at >= weekAgo) {
        const arr = weekMap.get(row.user_id) ?? []
        arr.push(row.avg_score)
        weekMap.set(row.user_id, arr)
      }
    }

    const weekly = [...weekMap.entries()]
      .map(([uid, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        const info = userNameMap.get(uid)
        return {
          uid,
          name: info ? anonymize(info.email, info.name) : 'User',
          avg: Math.round(avg * 10) / 10,
          sessions: scores.length,
        }
      })
      .filter(u => u.sessions >= 1)
      .sort((a, b) => b.avg - a.avg || b.sessions - a.sessions)
      .slice(0, 20)

    return NextResponse.json({ leaderboard, weekly })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
