import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''

  // ── www → non-www canonical redirect ────────────────────────────────────
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.host = host.slice(4)
    url.protocol = 'https:'
    return NextResponse.redirect(url, { status: 301 })
  }

  // ── Admin auth ────────────────────────────────────────────────────────────
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApi  = pathname.startsWith('/api/admin')

  if (isAdminPage || isAdminApi) {
    const requiresAuth = isAdminApi || (isAdminPage && pathname !== '/admin')
    if (requiresAuth) {
      const session = request.cookies.get('admin_session')
      if (!session || session.value !== 'true') {
        if (isAdminApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
    if (isAdminPage) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-is-admin', '1')
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
    return NextResponse.next()
  }

  // ── Supabase session refresh ──────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
