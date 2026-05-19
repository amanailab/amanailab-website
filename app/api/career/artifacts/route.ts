import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const VALID_KINDS = ['roadmap', 'skill_gap', 'offer_analysis', 'study_plan', 'interview_plan', 'company_research'] as const
type Kind = (typeof VALID_KINDS)[number]

interface SaveBody {
  kind: Kind
  title: string
  payload: unknown
}

// GET /api/career/artifacts?kind=roadmap (kind optional)
export async function GET(req: Request) {
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ items: [] })

    const url = new URL(req.url)
    const kind = url.searchParams.get('kind')

    let q = sb.from('career_artifacts')
      .select('id, kind, title, payload, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (kind && (VALID_KINDS as readonly string[]).includes(kind)) {
      q = q.eq('kind', kind)
    }

    const { data, error } = await q
    if (error) return NextResponse.json({ items: [] })
    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to save' }, { status: 401 })

    const body = (await req.json()) as SaveBody
    if (!body.kind || !(VALID_KINDS as readonly string[]).includes(body.kind)) {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
    }
    if (!body.title || typeof body.title !== 'string' || body.title.length > 200) {
      return NextResponse.json({ error: 'Title required (max 200 chars)' }, { status: 400 })
    }
    if (!body.payload || typeof body.payload !== 'object') {
      return NextResponse.json({ error: 'Payload required' }, { status: 400 })
    }
    // Rough payload size guard — JSONB column has no hard limit but we cap to keep things sane.
    if (JSON.stringify(body.payload).length > 200_000) {
      return NextResponse.json({ error: 'Payload too large (200KB limit)' }, { status: 400 })
    }

    const { data, error } = await sb
      .from('career_artifacts')
      .insert({ user_id: user.id, kind: body.kind, title: body.title, payload: body.payload })
      .select('id, kind, title, created_at')
      .single()

    if (error) {
      console.error('[career/artifacts]', error.message)
      return NextResponse.json({ error: 'Save failed' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, item: data })
  } catch (err) {
    console.error('[career/artifacts]', err)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await sb
      .from('career_artifacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
