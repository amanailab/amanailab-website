import type { Metadata } from 'next'
import SheetClient from './SheetClient'

export const metadata: Metadata = {
  title: 'AI Interview Prep Sheet 2026 — Complete AI/ML Roadmap by AmanAI Lab',
  description:
    'The complete AI/ML interview prep sheet — Generative AI, Agentic AI, Deep Learning, Machine Learning, MLOps and System Design. Theory, code problems, flashcards and mock interviews all linked. Free.',
  alternates: { canonical: 'https://amanailab.com/sheet' },
  openGraph: {
    title: 'AI Interview Prep Sheet 2026 — Theory · Code · Flashcards · Interview',
    description:
      '218+ curated topics: Transformers, RAG, LoRA, LangGraph, MCP, MLOps and more. Complete this sheet and land your dream AI/ML job.',
    images: [
      {
        url: '/api/og/tool?name=AI+A2Z+Sheet&tagline=218%2B+topics+%E2%80%94+Interview+Ready&emoji=%E2%9C%A8&tool=sheet',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'AI A2Z Interview Sheet 2026',
  description:
    'Comprehensive AI/ML learning path covering Generative AI, Agentic AI, Deep Learning, Machine Learning, MLOps and System Design.',
  url: 'https://amanailab.com/sheet',
  provider: { '@type': 'Organization', name: 'AmanAI Lab', url: 'https://amanailab.com' },
  educationalLevel: 'Beginner to Advanced',
  teaches: ['Generative AI', 'LLMs', 'RAG', 'Fine-Tuning', 'Agentic AI', 'Deep Learning', 'MLOps', 'System Design'],
  isAccessibleForFree: true,
}

export default function SheetPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SheetClient />
    </>
  )
}
