import type { Metadata } from 'next'
import PlaygroundClient from './PlaygroundClient'

export const metadata: Metadata = {
  title: 'Free AI/ML Code Playground — Python Editor with AI Assistant',
  description: 'Interactive Python code editor with AI-powered explain, debug, improve, and code generation. 10+ templates: RAG pipelines, LangChain agents, LoRA fine-tuning, attention mechanism. Free.',
  alternates: { canonical: 'https://amanailab.com/playground' },
  openGraph: {
    title: 'Free AI/ML Code Playground — Python + AI Assistant',
    description: 'Monaco editor with RAG, agents, fine-tuning templates and 6 AI actions: explain, debug, improve, complexity analysis, interview questions, generate.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the AI/ML code playground free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free.' } },
    { '@type': 'Question', name: 'What AI/ML templates are available?', acceptedAnswer: { '@type': 'Answer', text: '10+ templates including RAG pipeline, LangChain agents, LoRA fine-tuning, attention mechanism, FAISS vector search, word2vec, and more — all in Python.' } },
    { '@type': 'Question', name: 'What AI actions can I run on my code?', acceptedAnswer: { '@type': 'Answer', text: '6 actions: Explain (line-by-line breakdown), Debug & Fix (finds all bugs), Improve (refactors for clarity), Complexity analysis (time and space), Interview Questions (generates questions from your code), and Generate (writes code from a text description).' } },
    { '@type': 'Question', name: 'Does my code get saved between sessions?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Code auto-saves to your browser per template. You can also export as a .py file or generate a shareable link.' } },
    { '@type': 'Question', name: 'Do I need to install Python?', acceptedAnswer: { '@type': 'Answer', text: 'No. The playground runs Python in your browser using WebAssembly — nothing to install.' } },
  ],
}

export default function PlaygroundPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PlaygroundClient />
    </>
  )
}
