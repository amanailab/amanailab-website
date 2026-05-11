import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Interview History | AmanAI Lab',
  description: 'Review all your past AI/ML mock interview sessions — scores, grades, topics, and full Q&A replay.',
  alternates: { canonical: 'https://amanailab.com/sessions' },
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
