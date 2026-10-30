'use client'

import { usePathname } from 'next/navigation'

/** Hides site chrome (navbar, footer…) on full-screen routes such as the classroom. */
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/learn/')) return null
  return <>{children}</>
}
