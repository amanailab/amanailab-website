import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

// GET /api/sheet/progress
// Returns all completed item IDs for the logged-in user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ items: [] })

    const admin = getAdminSupabase()
    const { data, error } = await admin
      .from('sheet_progress')
      .select('item_id, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

// POST /api/sheet/progress
// Body: { item_id: string, completed: boolean }
// Adds or removes a single item from progress
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { item_id, completed } = await req.json()
    if (!item_id) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

    const admin = getAdminSupabase()

    if (completed) {
      await admin.from('sheet_progress').upsert(
        { user_id: user.id, item_id, completed_at: new Date().toISOString() },
        { onConflict: 'user_id,item_id' }
      )
    } else {
      await admin.from('sheet_progress').delete()
        .eq('user_id', user.id)
        .eq('item_id', item_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sheet/progress POST]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
