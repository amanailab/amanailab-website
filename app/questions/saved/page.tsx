import type { Metadata } from 'next'
import SavedQuestionsClient from './SavedQuestionsClient'

export const metadata: Metadata = {
  title: 'Saved Questions',
  description: 'Your bookmarked AI/ML interview questions.',
  alternates: { canonical: 'https://amanailab.com/questions/saved' },
  // User-specific page — not useful in search and a duplicate-content signal.
  robots: { index: false, follow: true },
}

export default function SavedQuestionsPage() {
  return <SavedQuestionsClient />
}
