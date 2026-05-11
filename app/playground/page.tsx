import type { Metadata } from 'next'
import PlaygroundClient from './PlaygroundClient'

export const metadata: Metadata = {
  title: 'AI/ML Code Playground | AmanAI Lab',
  description: 'Interactive Python code editor for AI/ML. 10 templates: RAG, Agents, LoRA, Transformers, Vector Search and more. AI explains, debugs, and generates code.',
  alternates: { canonical: 'https://amanailab.com/playground' },
  openGraph: {
    title: 'AI/ML Code Playground | AmanAI Lab',
    description: 'Monaco editor + AI assistant for AI/ML code. RAG pipelines, LangChain agents, fine-tuning, attention mechanisms and more.',
  },
}

export default function PlaygroundPage() {
  return <PlaygroundClient />
}
