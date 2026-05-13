import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI/ML Interview Leaderboard | AmanAI Lab',
  description: 'See the top performers ranked by average AI/ML interview score. Compete globally on AmanAI Lab.',
  alternates: { canonical: 'https://amanailab.com/leaderboard' },
  openGraph: {
    title: 'AI/ML Interview Leaderboard | AmanAI Lab',
    description: 'Top performers ranked by interview score.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI/ML Interview Leaderboard | AmanAI Lab',
    description: 'Top performers ranked by average AI/ML interview score. Compete globally.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
