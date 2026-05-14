import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI/ML Flashcards — Daily 5-Minute Practice | AmanAI Lab',
  description: 'Free AI/ML flashcards for daily practice. Master key concepts in LLM, RAG, Agents, MLOps and more in just 5 minutes a day.',
  alternates: { canonical: 'https://amanailab.com/flashcards' },
  openGraph: {
    title: 'AI/ML Flashcards | AmanAI Lab',
    description: 'Free AI/ML flashcards to master LLM, RAG, Agents, MLOps and more. 5 minutes a day.',
    images: [{ url: '/logo.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI/ML Flashcards | AmanAI Lab',
    description: 'Free AI/ML flashcards. Master key concepts in 5 minutes a day.',
  },
}

export default function FlashcardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
