import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function DELETE() {
  try {
    const supabase      = await createClient()
    const adminSb       = getAdminSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Delete user's data first (cascade deletes handle most, but be explicit)
    await Promise.allSettled([
      adminSb.from('user_interview_sessions').delete().eq('user_id', user.id),
      adminSb.from('code_submissions').delete().eq('user_id', user.id),
      adminSb.from('newsletter_subscribers').delete().eq('email', user.email),
    ])

    // Delete the auth user — requires service role key
    const { error } = await adminSb.auth.admin.deleteUser(user.id)
    if (error) {
      console.error('[delete-account]', error)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('[delete-account]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
