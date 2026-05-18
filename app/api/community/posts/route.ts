import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import sanitizeHtml from 'sanitize-html'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const supabase = getAdminSupabase()

  let query = supabase
    .from('community_posts')
    .select('id, author_name, title, body, type, company_slug, created_at')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (type && type !== 'all') query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`community-post:${ip}`, 3, 300_000) // 3 posts per 5 min
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many posts. Please wait a few minutes.' }, { status: 429 })
  }

  try {
    const { author_name, author_email, title, body, type, company_slug } = await request.json()
    if (!author_name?.trim() || !title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Name, title and body are required.' }, { status: 400 })
    }
    if (body.trim().length < 30) {
      return NextResponse.json({ error: 'Body must be at least 30 characters.' }, { status: 400 })
    }
    if (body.trim().length > 5000) {
      return NextResponse.json({ error: 'Body must be under 5000 characters.' }, { status: 400 })
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'Title must be under 200 characters.' }, { status: 400 })
    }
    if (author_name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be under 100 characters.' }, { status: 400 })
    }

    // Strip all HTML — posts are plain text
    const clean = (s: string) => sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} })

    const supabase = getAdminSupabase()
    const { error } = await supabase.from('community_posts').insert({
      author_name: clean(author_name.trim()),
      author_email: author_email?.trim() ? clean(author_email.trim()) : null,
      title: clean(title.trim()),
      body: clean(body.trim()),
      type: type ?? 'experience',
      company_slug: company_slug || null,
      approved: false,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
