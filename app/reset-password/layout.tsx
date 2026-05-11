import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password | AmanAI Lab',
  description: 'Set a new password for your AmanAI Lab account.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
