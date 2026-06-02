import type { Metadata } from 'next'
import { Suspense } from 'react'
import GlobalSearch from '@/components/search/GlobalSearch'
import { SITE_STATS } from '@/lib/site-stats'

export const metadata: Metadata = {
  title: 'Search AI/ML Questions & Resources | AmanAI Lab',
  description: `Search ${SITE_STATS.questions} AI/ML interview questions, blog posts, company prep guides, and learning resources on AmanAI Lab.`,
  alternates: { canonical: 'https://amanailab.com/search' },
  // Search-result pages produce endless ?q= variants — keep them out of the index.
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Search | AmanAI Lab',
    description: 'Find AI/ML interview questions, blog posts, and prep resources.',
  },
}

export default function SearchPage() {
  return (
    <Suspense>
      <GlobalSearch />
    </Suspense>
  )
}
