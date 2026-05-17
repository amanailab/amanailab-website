import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const url  = request.nextUrl

  // Redirect www → non-www with 301 (permanent)
  if (host.startsWith('www.')) {
    url.host = host.slice(4)       // strip 'www.'
    url.protocol = 'https:'
    return NextResponse.redirect(url, { status: 301 })
  }

  // Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    url.protocol === 'http:' &&
    !host.includes('localhost')
  ) {
    url.protocol = 'https:'
    return NextResponse.redirect(url, { status: 301 })
  }

  return NextResponse.next()
}

// Run on all routes except static files, API routes, and Next.js internals
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}
