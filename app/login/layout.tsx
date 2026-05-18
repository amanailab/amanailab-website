import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — AmanAI Lab',
  description: 'Sign in to AmanAI Lab to sync your interview prep sheet, track your AI readiness score, and access your progress dashboard across all devices.',
  alternates: { canonical: 'https://amanailab.com/login' },
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
