import type { Metadata } from 'next'
import { Suspense } from 'react'
import GlobalSearch from '@/components/search/GlobalSearch'

export const metadata: Metadata = {
  title: 'Search AI/ML Questions & Resources | AmanAI Lab',
  description: 'Search 500+ AI/ML interview questions, blog posts, company prep guides, and learning resources on AmanAI Lab.',
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
