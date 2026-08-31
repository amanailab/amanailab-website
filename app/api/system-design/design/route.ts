import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

const MAX_DESIGN = 20_000
const MAX_JSON   = 200_000 // guard against oversized canvas/code blobs

function clampJson(v: unknown): object {
  try {
    const s = JSON.stringify(v ?? {})
    if (s.length > MAX_JSON) return {}
    return (v && typeof v === 'object') ? v as object : {}
  } catch { return {} }
}

// GET /api/system-design/design?slug=... → saved design for this user (or null)
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const slug = new URL(req.url).searchParams.get('slug')?.trim()
  if (!slug) return NextResponse.json({ error: 'Missing slug.' }, { status: 400 })

  try {
    const admin = getAdminSupabase()
    const { data } = await admin
      .from('sd_saved_designs')
      .select('design, checklist, code, canvas, updated_at')
      .eq('user_id', user.id)
      .eq('slug', slug)
      .maybeSingle()
    return NextResponse.json({ design: data ?? null })
  } catch {
    // Table not created yet — behave as "no cloud copy" so local still works
    return NextResponse.json({ design: null })
  }
}

// PUT /api/system-design/design → upsert this user's design for a slug
export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  try {
    const body = await req.json()
    const slug = typeof body?.slug === 'string' ? body.slug.trim() : ''
    if (!slug) return NextResponse.json({ error: 'Missing slug.' }, { status: 400 })

    const design = typeof body?.design === 'string' ? body.design.slice(0, MAX_DESIGN) : ''

    const admin = getAdminSupabase()
    const { error } = await admin.from('sd_saved_designs').upsert({
      user_id:    user.id,
      slug,
      design,
      checklist:  clampJson(body?.checklist),
      code:       clampJson(body?.code),
      canvas:     clampJson(body?.canvas),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,slug' })

    if (error) {
      // Missing table etc. — report soft failure; client keeps localStorage
      console.error('[system-design/design] upsert failed:', error.message)
      return NextResponse.json({ saved: false }, { status: 200 })
    }
    return NextResponse.json({ saved: true })
  } catch (err) {
    console.error('[system-design/design]', err)
    return NextResponse.json({ saved: false }, { status: 200 })
  }
}
