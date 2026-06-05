import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'AI/ML Interview Leaderboard | AmanAI Lab',
  description: 'See the top-ranked AI/ML interview performers on AmanAI Lab. Compete weekly, track your rank, and climb the global leaderboard.',
  alternates: { canonical: 'https://amanailab.com/leaderboard' },
  // Hidden from nav/sitemap until there are real users — keep it out of the index too.
  robots: { index: false, follow: true },
  openGraph: {
    title: 'AI/ML Interview Leaderboard | AmanAI Lab',
    description: 'Compete with top AI/ML interview performers. Weekly and all-time rankings.',
    url: 'https://amanailab.com/leaderboard',
  },
}
export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
