import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export async function POST(req: NextRequest) {
  try {
    const { name, email, whatsapp, tier } = await req.json()
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { error } = await supabase.from('masterclass_registrations').insert({
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      whatsapp: whatsapp?.trim() || null,
      tier:     tier || 'early',
      via:      'interest_form',
    })

    if (error) {
      // Duplicate email is fine — just acknowledge
      if (error.code === '23505') return NextResponse.json({ ok: true })
      console.error('masterclass register error:', error)
      return NextResponse.json({ error: 'Failed to save.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('masterclass register exception:', e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
