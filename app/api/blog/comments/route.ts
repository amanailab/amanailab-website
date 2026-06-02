import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Public anon client — safe for reading approved comments (RLS handles access)
function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Admin client — only needed for writes (bypasses RLS to set user_id)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

// GET /api/blog/comments?slug=xxx
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  // Never expose commenter emails/ids publicly. We read user_id only to compute
  // an `is_own` flag for the current viewer (so they see a delete button).
  const { data, error } = await getAnonClient()
    .from('blog_comments')
    .select('id, body, created_at, user_name, user_id')
    .eq('slug', slug)
    .eq('approved', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[blog/comments GET]', error)
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }

  const { data: { user } } = await (await createAuthClient()).auth.getUser()
  const comments = (data ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    user_name: c.user_name,
    is_own: !!user && c.user_id === user.id,
  }))
  return NextResponse.json({ comments })
}

// POST /api/blog/comments
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`blog-comment:${ip}`, 5, 300_000) // 5 comments per 5 min
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many comments. Please wait a few minutes.' }, { status: 429 })
  }

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required to comment' }, { status: 401 })

  const { slug, body } = await req.json()
  if (!slug || !body?.trim()) return NextResponse.json({ error: 'slug and body required' }, { status: 400 })
  if (body.trim().length < 3) return NextResponse.json({ error: 'Comment too short' }, { status: 400 })
  if (body.trim().length > 2000) return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 })

  const name = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'

  const { data, error } = await getAdminClient()
    .from('blog_comments')
    .insert({
      slug,
      body:       body.trim(),
      user_id:    user.id,
      user_email: user.email,
      user_name:  name,
      approved:   true,
    })
    .select('id, body, created_at, user_name')
    .single()

  if (error) {
    console.error('[blog/comments POST]', error)
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
  // The comment is the poster's own, so flag it for the delete UI.
  return NextResponse.json({ comment: { ...data, is_own: true } })
}

// DELETE /api/blog/comments?id=xxx  (own comments only)
export async function DELETE(req: NextRequest) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await getAdminClient()
    .from('blog_comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[blog/comments DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
