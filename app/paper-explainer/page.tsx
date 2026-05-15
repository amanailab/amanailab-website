import type { Metadata } from 'next'
import PaperExplainer from '@/components/paper/PaperExplainer'

export const metadata: Metadata = {
  title: 'Free AI Research Paper Explainer — Understand Any ML Paper Instantly',
  description: 'Upload a PDF or paste an arXiv URL. Get a plain-English explanation, interview Q&A, Python code sketch, and follow-up chat. Supports arXiv, HuggingFace, Semantic Scholar, Papers With Code. Free.',
  keywords: ['AI paper explainer', 'arXiv explainer', 'research paper summary', 'ML paper explained'],
  alternates: { canonical: 'https://amanailab.com/paper-explainer' },
  openGraph: {
    title: 'Free AI Research Paper Explainer — PDF Upload + arXiv',
    description: 'Paste any arXiv URL or upload a PDF. Get 3 explanation levels, interview prep Q&A, Python code sketch, and chat to ask follow-up questions.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the paper explainer free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free.' } },
    { '@type': 'Question', name: 'What paper sources does it support?', acceptedAnswer: { '@type': 'Answer', text: 'arXiv URLs and IDs, HuggingFace Papers, Semantic Scholar, Papers With Code, and direct PDF uploads.' } },
    { '@type': 'Question', name: 'What explanation levels are available?', acceptedAnswer: { '@type': 'Answer', text: 'Three levels: ELI5 (simple analogies, no jargon), Practitioner (for ML engineers), and Expert (full technical depth with math intuition).' } },
    { '@type': 'Question', name: 'Does it generate interview questions for the paper?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The Interview tab generates 5-6 questions that top AI labs might ask about the paper, with strong model answers.' } },
    { '@type': 'Question', name: 'Can I ask follow-up questions about the paper?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. After the analysis, the Q&A chat section lets you ask anything — "How does this compare to BERT?", "Show a Python implementation", etc.' } },
  ],
}

export default function PaperExplainerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="pt-20">
        <PaperExplainer />
      </div>
    </>
  )
}
