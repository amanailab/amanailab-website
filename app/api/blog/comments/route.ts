import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

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
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/blog/comments?slug=xxx
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const { data, error } = await getAnonClient()
    .from('blog_comments')
    .select('id, body, created_at, user_name, user_email')
    .eq('slug', slug)
    .eq('approved', true)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

// POST /api/blog/comments
export async function POST(req: NextRequest) {
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
    .select('id, body, created_at, user_name, user_email')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
