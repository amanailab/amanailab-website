import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApi = pathname.startsWith('/api/admin')

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next()
  }

  // The /admin login page itself stays public; everything else under /admin
  // and every /api/admin route requires the session cookie.
  const requiresAuth = isAdminApi || (isAdminPage && pathname !== '/admin')

  if (requiresAuth) {
    const session = request.cookies.get('admin_session')
    if (!session || session.value !== 'true') {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  if (!isAdminPage) {
    return NextResponse.next()
  }

  // Admin pages: pass the x-is-admin header so the layout hides the
  // public chrome (Navbar / Footer / Analytics).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-is-admin', '1')
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
