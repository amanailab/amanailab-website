import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

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
  try {
    const { author_name, author_email, title, body, type, company_slug } = await request.json()
    if (!author_name?.trim() || !title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Name, title and body are required.' }, { status: 400 })
    }
    if (body.trim().length < 30) {
      return NextResponse.json({ error: 'Body must be at least 30 characters.' }, { status: 400 })
    }
    const supabase = getAdminSupabase()
    const { error } = await supabase.from('community_posts').insert({
      author_name: author_name.trim(),
      author_email: author_email?.trim() || null,
      title: title.trim(),
      body: body.trim(),
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
