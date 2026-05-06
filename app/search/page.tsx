import type { Metadata } from 'next'
import { Suspense } from 'react'
import GlobalSearch from '@/components/search/GlobalSearch'

export const metadata: Metadata = {
  title: 'Search | AmanAI Lab',
  description: 'Search blog posts and interview questions on AmanAI Lab.',
}

export default function SearchPage() {
  return (
    <Suspense>
      <GlobalSearch />
    </Suspense>
  )
}
