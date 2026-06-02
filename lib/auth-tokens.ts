// HMAC-signed tokens for admin sessions and one-click email-action links.
//
// The admin gate used to be a cookie whose value was the constant string
// "true" — anyone could set `admin_session=true` in their browser and become
// admin. These tokens fix that: the cookie value is now an unforgeable
// HMAC-SHA256 signature that only the server (which knows the secret) can mint.
//
// Implemented with Web Crypto (`crypto.subtle`) so it runs in BOTH the Node
// runtime (server actions / route handlers) and the Edge runtime (proxy.ts).
//
// Secret precedence: ADMIN_SESSION_SECRET if set, otherwise derived from
// ADMIN_PASSWORD so no new env var is strictly required. If neither is set,
// verification always fails (fail-closed).

const ADMIN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days — matches the cookie maxAge

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Constant-time comparison to avoid leaking the signature via timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ── Admin session cookie ──────────────────────────────────────────────────
/** Mint a signed admin-session value of the form `<issuedAt>.<hmac>`. */
export async function createAdminSession(): Promise<string> {
  const issuedAt = Date.now().toString()
  return `${issuedAt}.${await hmacHex(`admin:${issuedAt}`)}`
}

/** True only for a token this server minted that hasn't expired. */
export async function verifyAdminSession(value: string | undefined | null): Promise<boolean> {
  if (!value || !secret()) return false
  const dot = value.indexOf('.')
  if (dot <= 0) return false
  const issuedAt = value.slice(0, dot)
  const sig = value.slice(dot + 1)
  const ts = Number(issuedAt)
  if (!Number.isFinite(ts) || Date.now() - ts > ADMIN_MAX_AGE_MS) return false
  return timingSafeEqual(sig, await hmacHex(`admin:${issuedAt}`))
}

// ── Email action tokens (e.g. one-click unsubscribe) ──────────────────────
/** Deterministic token bound to an email address — safe to embed in a link. */
export async function signEmailToken(email: string): Promise<string> {
  return hmacHex(`email:${email.toLowerCase()}`)
}

export async function verifyEmailToken(
  email: string,
  token: string | undefined | null,
): Promise<boolean> {
  if (!token || !secret()) return false
  return timingSafeEqual(token, await signEmailToken(email))
}
