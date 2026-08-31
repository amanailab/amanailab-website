import type { getAdminSupabase } from '@/lib/admin'

type Admin = ReturnType<typeof getAdminSupabase>

// Stable, privacy-safe alias derived from the user id — same uid always maps
// to the same "Learner#NNNN". Used when a user hasn't set a public display name.
export function pseudonym(uid: string): string {
  let h = 0
  for (let i = 0; i < uid.length; i++) {
    h = (h * 31 + uid.charCodeAt(i)) >>> 0
  }
  const n = 1000 + (h % 9000) // 1000–9999
  return `Learner#${n}`
}

// Clean a raw display_name from user_metadata. Returns null if unusable so
// callers fall back to a pseudonym (we never expose the email as a name).
function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  if (t.length < 2 || t.length > 40) return null
  return t
}

/**
 * Resolve public display names for a set of user ids.
 * Returns a map of uid -> display name, applying the Learner#NNNN pseudonym
 * for any user without a valid display_name. Paginates through all auth users
 * so it stays correct past the 50-user default page size.
 */
export async function resolveUserNames(admin: Admin, uids: string[]): Promise<Map<string, string>> {
  const wanted = new Set(uids)
  const result = new Map<string, string>()
  // Seed every requested uid with its pseudonym; overwrite when a real name exists.
  for (const uid of wanted) result.set(uid, pseudonym(uid))

  if (wanted.size === 0) return result

  try {
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !data?.users?.length) break
      for (const u of data.users) {
        if (!wanted.has(u.id)) continue
        const meta = u.user_metadata ?? {}
        // display_name (set by us) wins; fall back to Google's name/full_name
        const name = cleanName(meta.display_name) ?? cleanName(meta.name) ?? cleanName(meta.full_name)
        if (name) result.set(u.id, name)
      }
      if (data.users.length < 1000) break // last page
    }
  } catch {
    /* fall back to pseudonyms already seeded */
  }

  return result
}
