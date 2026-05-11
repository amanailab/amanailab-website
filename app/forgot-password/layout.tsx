import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password | AmanAI Lab',
  description: 'Reset your AmanAI Lab password — enter your email and we will send you a reset link.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
