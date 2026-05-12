import type { Metadata } from 'next'
import SavedQuestionsClient from './SavedQuestionsClient'

export const metadata: Metadata = {
  title: 'Saved Questions',
  description: 'Your bookmarked AI/ML interview questions.',
}

export default function SavedQuestionsPage() {
  return <SavedQuestionsClient />
}
