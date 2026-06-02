import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Free Account',
  description: 'Create your free AmanAI Lab account — get your AI/ML interview readiness score, track your progress, and prepare for top AI company interviews.',
  alternates: { canonical: 'https://amanailab.com/signup' },
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
