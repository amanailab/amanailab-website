import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — AmanAI Lab',
  description: 'Sign in to AmanAI Lab to track your AI readiness score, save your progress, and access your dashboard across all devices.',
  alternates: { canonical: 'https://amanailab.com/login' },
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
