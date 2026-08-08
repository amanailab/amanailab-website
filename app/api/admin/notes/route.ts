import { NextResponse } from 'next/server'
import { cookies }       from 'next/headers'
import { getAdminSupabase } from '@/lib/admin'
import { verifyAdminSession } from '@/lib/auth-tokens'

export const runtime = 'nodejs'

async function auth() {
  const store = await cookies()
  return verifyAdminSession(store.get('admin_session')?.value)
}

// GET — list all notes
export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create note
export async function POST(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, description, topic, pages, emoji, gradient, preview_points, price, pdf_path, is_new, sort_order } = await req.json()

    if (!title || !topic || !pdf_path) {
      return NextResponse.json({ error: 'title, topic and pdf_path are required.' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('notes')
      .insert({
        title, description: description || '', topic,
        pages: Number(pages) || 0,
        emoji: emoji || '📄',
        gradient: gradient || 'from-orange-500 to-red-600',
        preview_points: Array.isArray(preview_points) ? preview_points : [],
        price: Number(price) || 99,
        pdf_path,
        is_new: Boolean(is_new),
        is_active: true,
        sort_order: Number(sort_order) || 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[admin/notes POST]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

// PATCH — update any fields (toggle active, sort order, etc.)
export async function PATCH(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('notes').update(updates).eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/notes PATCH]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

// DELETE — remove note + its PDF from storage
export async function DELETE(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

    const supabase = getAdminSupabase()
    const { data: note } = await supabase.from('notes').select('pdf_path').eq('id', id).single()
    if (note?.pdf_path) await supabase.storage.from('notes').remove([note.pdf_path])

    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/notes DELETE]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
