import type { Metadata } from 'next'
import { SITE_STATS } from '@/lib/site-stats'
import SheetClient from './SheetClient'

export const metadata: Metadata = {
  title: 'AI Interview Prep Sheet 2026 — Complete AI/ML Roadmap by AmanAI Lab',
  description:
    'The complete AI/ML interview prep system — Interview Strategy, Generative AI, Agentic AI, Deep Learning, ML, MLOps and System Design. Learn each topic, then prove it at checkpoint quizzes, mock interviews and design reviews. Free.',
  alternates: { canonical: 'https://amanailab.com/sheet' },
  openGraph: {
    title: 'AI Interview Prep Sheet 2026 — Theory · Code · Flashcards · Interview',
    description:
      `${SITE_STATS.sheetTopics}+ curated topics: Transformers, RAG, LoRA, LangGraph, MCP, MLOps and more. Complete this sheet and land your dream AI/ML job.`,
    images: [
      {
        url: `/api/og/tool?name=AI+A2Z+Sheet&tagline=${SITE_STATS.sheetTopics}%2B+topics+%E2%80%94+Interview+Ready&emoji=%E2%9C%A8&tool=sheet`,
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
  name: 'AI Interview Prep Sheet 2026',
  description: 'Comprehensive AI/ML interview prep system covering Interview Strategy, Generative AI, Agentic AI, Deep Learning, Machine Learning, MLOps and System Design with inline theory, code problems, flashcards, checkpoint assessments, and a system design workspace.',
  url: 'https://amanailab.com/sheet',
  provider: { '@type': 'Organization', name: 'AmanAI Lab', url: 'https://amanailab.com' },
  educationalLevel: 'Beginner to Advanced',
  teaches: ['Generative AI', 'LLMs', 'RAG', 'Fine-Tuning', 'Agentic AI', 'Deep Learning', 'MLOps', 'System Design', 'Interview Strategy', 'Behavioral Interviews'],
  isAccessibleForFree: true,
  hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', instructor: { '@type': 'Person', name: 'Aman Chauhan', url: 'https://amanailab.com/about' } },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is the AI Interview Prep Sheet?', acceptedAnswer: { '@type': 'Answer', text: `A structured roadmap of ${SITE_STATS.sheetTopics} topics across 8 tracks (Interview Strategy, Generative AI, Agentic AI, Deep Learning, ML, MLOps, System Design, 2026 Frontier) with inline theory, linked code problems, flashcards, quizzes, and a system design practice workspace. Every track ends with a Checkpoint section where you prove your knowledge with quizzes, mock interviews and design reviews before moving on. Inspired by Striver's A2Z DSA Sheet but built for 2026 AI/ML interviews.` } },
    { '@type': 'Question', name: 'Is the AI Interview Prep Sheet free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free. Your progress is saved automatically to your browser — no account required to start.' } },
    { '@type': 'Question', name: 'What tracks does the sheet cover?', acceptedAnswer: { '@type': 'Answer', text: '8 complete tracks: Interview Strategy & Behavioral, Generative AI, Agentic AI, Deep Learning, Machine Learning, MLOps, System Design, and 2026 Frontier (DeepSeek R1, Mamba/SSM, Computer Use agents, and more). Each track ends with a checkpoint — quiz scores, mock interview ratings, and design reviews you must pass to call the track done.' } },
    { '@type': 'Question', name: 'Does the sheet link to practice resources?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Each item links to: inline theory explanation, Code Lab problems (specific algorithm to implement), topic flashcard decks, AI-generated quizzes, mock interview, and a System Design Workspace for design problems.' } },
    { '@type': 'Question', name: 'What is the System Design Workspace?', acceptedAnswer: { '@type': 'Answer', text: `A dedicated practice environment for ${SITE_STATS.systemDesignProblems} system design problems (LLM Serving, RAG System, Recommendation System, etc.) with a structured editor, must-cover checklist, FAANG interview framework guide, architecture component snippets, 45-minute timer, and AI review of your written answer.` } },
  ],
}

export default function SheetPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SheetClient />
    </>
  )
}
