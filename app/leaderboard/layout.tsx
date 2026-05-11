import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI/ML Interview Leaderboard | AmanAI Lab',
  description: 'Top performers ranked by average AI/ML mock interview score. Weekly and all-time leaderboards.',
  alternates: { canonical: 'https://amanailab.com/leaderboard' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
