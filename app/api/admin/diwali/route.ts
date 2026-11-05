import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { DIWALI_STATUSES } from '@/lib/diwali-config'

// Auth is enforced for /api/admin/* by proxy.ts
export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()
    if (!Number.isInteger(id) || !DIWALI_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }
    const supabase = getAdminSupabase()
    const { error } = await supabase.from('diwali_applications').update({ status }).eq('id', id)
    if (error) {
      console.error('admin diwali update error:', error)
      return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
