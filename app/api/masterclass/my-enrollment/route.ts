import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ enrolled: false })

    const admin = getAdminSupabase()
    // Match by user_id (linked) OR email (paid before login)
    const { data } = await admin
      .from('masterclass_registrations')
      .select('id, tier, amount, created_at, status')
      .eq('status', 'paid')
      .or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`)
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ enrolled: !!data, enrollment: data ?? null })
  } catch (e) {
    console.error('[masterclass/my-enrollment]', e)
    return NextResponse.json({ enrolled: false })
  }
}
