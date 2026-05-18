import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Profile — AmanAI Lab',
  description: 'Manage your AmanAI Lab account, update your profile, and view your AI/ML preparation stats.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
