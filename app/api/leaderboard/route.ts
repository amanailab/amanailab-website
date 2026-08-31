import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { resolveUserNames } from '@/lib/user-names'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const sb = getAdminSupabase()

    // Top all-time: aggregate sessions per user
    const { data, error } = await sb
      .from('user_interview_sessions')
      .select('user_id, avg_score, created_at')
      .order('created_at', { ascending: false })
      .limit(10000)

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

    // Resolve real display names (with Learner#NNNN fallback) for everyone shown
    const nameMap = await resolveUserNames(sb, [...userMap.keys()])

    // Build leaderboard
    const leaderboard = [...userMap.keys()]
      .map(uid => {
        const { scores, latest } = userMap.get(uid)!
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        return {
          uid,
          name: nameMap.get(uid)!,
          avg: Math.round(avg * 10) / 10,
          sessions: scores.length,
          latest,
        }
      })
      .filter(u => u.sessions >= 1)
      .sort((a, b) => b.avg - a.avg || b.sessions - a.sessions)
      .slice(0, 20)

    const weekly = [...weekMap.entries()]
      .map(([uid, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        return {
          uid,
          name: nameMap.get(uid)!,
          avg: Math.round(avg * 10) / 10,
          sessions: scores.length,
        }
      })
      .filter(u => u.sessions >= 1)
      .sort((a, b) => b.avg - a.avg || b.sessions - a.sessions)
      .slice(0, 20)

    return NextResponse.json({ leaderboard, weekly })
  } catch (e) {
    console.error('[leaderboard]', e)
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}
