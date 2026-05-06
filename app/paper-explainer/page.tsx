import type { Metadata } from 'next'
import PaperExplainer from '@/components/paper/PaperExplainer'

export const metadata: Metadata = {
  title: 'AI Research Paper Explainer | AmanAI Lab',
  description: 'Paste any arXiv URL or paper abstract and get a clear, jargon-free explanation. Understand AI/ML research papers without a PhD.',
  keywords: ['AI paper explainer', 'arXiv explainer', 'research paper summary', 'ML paper explained'],
}

export default function PaperExplainerPage() {
  return (
    <div className="pt-16">
      <PaperExplainer />
    </div>
  )
}
