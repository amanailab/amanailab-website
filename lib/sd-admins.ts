// Emails that get unlimited System Design AI reviews (owner / admin accounts).
// Add more addresses here as needed. Comparison is case-insensitive.
const SD_ADMIN_EMAILS = new Set(
  [
    'amanchauhan7172@gmail.com',
  ].map(e => e.toLowerCase()),
)

export function isSdAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return SD_ADMIN_EMAILS.has(email.trim().toLowerCase())
}
