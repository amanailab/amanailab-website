import { NextResponse } from 'next/server'
import { cookies }       from 'next/headers'
import { getAdminSupabase } from '@/lib/admin'
import { verifyAdminSession } from '@/lib/auth-tokens'

export const runtime = 'nodejs'

async function auth() {
  const store = await cookies()
  return verifyAdminSession(store.get('admin_session')?.value)
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// GET — list all
export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from('sd_problems')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — create
export async function POST(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const slug = body.slug?.trim() || slugify(body.title ?? '')
  if (!slug || !body.title?.trim()) {
    return NextResponse.json({ error: 'Title and slug are required.' }, { status: 400 })
  }
  const supabase = getAdminSupabase()
  const { data, error } = await supabase.from('sd_problems').insert({
    slug,
    title:                 body.title.trim(),
    difficulty:            body.difficulty ?? 'Hard',
    category:              body.category   ?? 'ML Systems',
    companies:             Array.isArray(body.companies) ? body.companies : [],
    problem:               body.problem    ?? '',
    constraints:           Array.isArray(body.constraints) ? body.constraints : [],
    key_areas:             Array.isArray(body.key_areas)   ? body.key_areas   : [],
    hints:                 Array.isArray(body.hints)        ? body.hints       : [],
    linked_sheet_item_id:  body.linked_sheet_item_id ?? '',
    is_active:             body.is_active ?? true,
    sort_order:            body.sort_order ?? 0,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT — update
export async function PUT(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })
  const supabase = getAdminSupabase()
  const { data, error } = await supabase.from('sd_problems').update({
    slug:                  body.slug?.trim(),
    title:                 body.title?.trim(),
    difficulty:            body.difficulty,
    category:              body.category,
    companies:             Array.isArray(body.companies) ? body.companies : [],
    problem:               body.problem,
    constraints:           Array.isArray(body.constraints) ? body.constraints : [],
    key_areas:             Array.isArray(body.key_areas)   ? body.key_areas   : [],
    hints:                 Array.isArray(body.hints)        ? body.hints       : [],
    linked_sheet_item_id:  body.linked_sheet_item_id,
    is_active:             body.is_active,
    sort_order:            body.sort_order,
  }).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — delete by id (query param)
export async function DELETE(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('sd_problems').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
