import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { postId, reaction, sessionId } = await req.json()
    if (!postId || !sessionId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const sb = getAdminSupabase()

    if (!reaction) {
      // Remove reaction
      await sb.from('community_reactions').delete().eq('post_id', postId).eq('session_id', sessionId)
    } else {
      // Upsert reaction
      await sb.from('community_reactions').upsert(
        { post_id: postId, session_id: sessionId, reaction },
        { onConflict: 'post_id,session_id' }
      )
    }

    // Return updated counts for this post
    const { data } = await sb.from('community_reactions').select('reaction').eq('post_id', postId)
    const counts: Record<string, number> = {}
    ;(data ?? []).forEach((r: { reaction: string }) => {
      counts[r.reaction] = (counts[r.reaction] ?? 0) + 1
    })

    return NextResponse.json({ counts })
  } catch (err) {
    console.error('[community/react]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('postId')
    if (!postId) return NextResponse.json({ counts: {} })

    const sb = getAdminSupabase()
    const { data } = await sb.from('community_reactions').select('reaction').eq('post_id', postId)
    const counts: Record<string, number> = {}
    ;(data ?? []).forEach((r: { reaction: string }) => {
      counts[r.reaction] = (counts[r.reaction] ?? 0) + 1
    })
    return NextResponse.json({ counts })
  } catch {
    return NextResponse.json({ counts: {} })
  }
}
