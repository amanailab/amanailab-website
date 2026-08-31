import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

interface PkgRow  { id: string; title: string; emoji: string; note_ids: string[] }
interface NoteRow { id: string; title: string; emoji: string; pdf_path: string }
interface PurchaseItem { title: string; url: string }
interface Purchase {
  kind: 'note' | 'package'
  title: string
  emoji: string
  purchasedAt: string
  items: PurchaseItem[]
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const admin = getAdminSupabase()
    const email = user.email ?? ''

    // Orders belonging to this user — matched by user_id (newer orders) or the
    // email used at checkout (older / pay-without-account orders).
    const orFilter = email
      ? `user_id.eq.${user.id},customer_email.eq.${email}`
      : `user_id.eq.${user.id}`

    // Only PAID purchases build a permanent re-download library. Free
    // member-code redemptions (via='member_code', amount=0) still get their
    // one-time link at redemption but must NOT grant lasting free access.
    const { data: orders } = await admin
      .from('orders')
      .select('type, item_id, item_title, created_at')
      .in('type', ['note', 'package'])
      .eq('status', 'completed')
      .eq('via', 'payment')
      .gt('amount', 0)
      .or(orFilter)
      .order('created_at', { ascending: false })

    if (!orders?.length) return NextResponse.json({ purchases: [] })

    // Dedup by type+item (a user may have re-bought / re-verified the same item)
    const seen = new Set<string>()
    const noteIds: string[] = []
    const pkgIds: string[]  = []
    const uniqueOrders = orders.filter(o => {
      const key = `${o.type}:${o.item_id}`
      if (seen.has(key)) return false
      seen.add(key)
      if (o.type === 'note') noteIds.push(o.item_id)
      else pkgIds.push(o.item_id)
      return true
    })

    // Fetch packages (for their note_ids + emoji/title)
    const packages: PkgRow[] = pkgIds.length
      ? ((await admin.from('packages').select('id, title, emoji, note_ids').in('id', pkgIds)).data as PkgRow[] ?? [])
      : []
    const pkgMap = new Map<string, PkgRow>(packages.map(p => [p.id, p]))

    // All note ids we need to resolve (direct notes + notes inside packages)
    const allNoteIds = new Set<string>(noteIds)
    for (const p of packages) for (const nid of p.note_ids ?? []) allNoteIds.add(nid)

    const notes: NoteRow[] = allNoteIds.size
      ? ((await admin.from('notes').select('id, title, emoji, pdf_path').in('id', [...allNoteIds])).data as NoteRow[] ?? [])
      : []
    const noteMap = new Map<string, NoteRow>(notes.map(n => [n.id, n]))

    // Sign every needed pdf_path once (1-hour links), in parallel
    const paths = [...new Set(notes.map(n => n.pdf_path).filter(Boolean))]
    const signed = new Map<string, string>()
    await Promise.all(paths.map(async path => {
      const { data } = await admin.storage.from('notes').createSignedUrl(path, 3600)
      if (data?.signedUrl) signed.set(path, data.signedUrl)
    }))

    // Build the response in original (newest-first) order
    const purchases: Purchase[] = []
    for (const o of uniqueOrders) {
      if (o.type === 'note') {
        const n = noteMap.get(o.item_id)
        if (!n) continue
        const url = signed.get(n.pdf_path)
        if (!url) continue
        purchases.push({
          kind: 'note',
          title: n.title || o.item_title,
          emoji: n.emoji || '📄',
          purchasedAt: o.created_at,
          items: [{ title: n.title, url }],
        })
      } else {
        const p = pkgMap.get(o.item_id)
        if (!p) continue
        const items = (p.note_ids ?? [])
          .map((nid: string) => noteMap.get(nid))
          .filter((n): n is NoteRow => !!n && signed.has(n.pdf_path))
          .map((n: NoteRow) => ({ title: n.title, url: signed.get(n.pdf_path)! }))
        if (!items.length) continue
        purchases.push({
          kind: 'package',
          title: p.title || o.item_title,
          emoji: p.emoji || '📦',
          purchasedAt: o.created_at,
          items,
        })
      }
    }

    return NextResponse.json({ purchases })
  } catch (err) {
    console.error('[notes/my-purchases]', err)
    return NextResponse.json({ error: 'Failed to load purchases.' }, { status: 500 })
  }
}
