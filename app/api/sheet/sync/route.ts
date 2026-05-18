import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

// POST /api/sheet/sync
// Body: { item_ids: string[] }
// Bulk-upserts all completed items from localStorage when user logs in
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { item_ids } = await req.json()
    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json({ ok: true, synced: 0 })
    }

    const admin = getAdminSupabase()
    const rows = item_ids.map((id: string) => ({
      user_id: user.id,
      item_id: id,
      completed_at: new Date().toISOString(),
    }))

    const { error } = await admin
      .from('sheet_progress')
      .upsert(rows, { onConflict: 'user_id,item_id', ignoreDuplicates: true })

    if (error) throw error
    return NextResponse.json({ ok: true, synced: rows.length })
  } catch (err) {
    console.error('[sheet/sync POST]', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
