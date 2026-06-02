import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Interview History | AmanAI Lab',
  description: 'Review all your past AI/ML mock interview sessions, track your score trends, and identify areas for improvement.',
  alternates: { canonical: 'https://amanailab.com/sessions' },
  // Per-user history — keep out of the index (was indexable with no real content for crawlers).
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Interview History | AmanAI Lab',
    description: 'Your complete AI/ML mock interview history with scores and detailed feedback.',
    url: 'https://amanailab.com/sessions',
  },
}
export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
