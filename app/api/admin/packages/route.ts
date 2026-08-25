import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminSupabase } from '@/lib/admin'
import { verifyAdminSession } from '@/lib/auth-tokens'

export const runtime = 'nodejs'

async function auth() {
  const store = await cookies()
  return verifyAdminSession(store.get('admin_session')?.value)
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, description, price, emoji, gradient, note_ids, sort_order } = await req.json()
    if (!title || !note_ids?.length) {
      return NextResponse.json({ error: 'title and note_ids are required.' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('packages')
      .insert({
        title,
        description: description || '',
        price:      Number(price) || 399,
        emoji:      emoji || '📦',
        gradient:   gradient || 'from-orange-500 to-red-600',
        note_ids:   Array.isArray(note_ids) ? note_ids : [],
        is_active:  true,
        sort_order: Number(sort_order) || 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[admin/packages POST]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/packages PATCH]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

    const supabase = getAdminSupabase()
    const { error } = await supabase.from('packages').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/packages DELETE]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
