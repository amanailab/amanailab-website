import type { Metadata } from 'next'
import SkillQuiz from '@/components/quiz/SkillQuiz'

export const metadata: Metadata = {
  title: 'Free AI/ML Skill Quiz — MCQ Assessment on LLM, RAG, Agents & More',
  description: 'Test your AI and ML knowledge with AI-generated multiple choice questions. 13 topics, 3 difficulty levels, instant explanations. Track your mastery and identify weak areas. Free.',
  alternates: { canonical: 'https://amanailab.com/quiz' },
  openGraph: {
    title: 'Free AI/ML Skill Quiz — MCQ Assessment',
    description: 'AI-generated MCQ quiz on LLM, RAG, Agents, Transformers, MLOps and 9 more topics. Instant explanations and mastery tracking.',
    images: [{ url: '/api/og/tool?name=AI%2FML+Skill+Quiz&tagline=MCQ+assessment+on+14+topics&emoji=%F0%9F%8E%AF&tool=quiz', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI/ML Skill Quiz',
  applicationCategory: 'EducationalApplication',
  description: 'AI-generated multiple-choice quiz for AI/ML engineers.',
  url: 'https://amanailab.com/quiz',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the AI/ML skill quiz free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free.' } },
    { '@type': 'Question', name: 'What topics does the quiz cover?', acceptedAnswer: { '@type': 'Answer', text: '13 topics: LLM, RAG, Agents, Fine-Tuning, MLOps, Transformers, System Design, Python, Vector DB, NLP, Statistics, Behavioral, and Computer Vision.' } },
    { '@type': 'Question', name: 'How many questions per quiz?', acceptedAnswer: { '@type': 'Answer', text: 'Choose 5, 7, 10, or 15 multiple-choice questions per session.' } },
    { '@type': 'Question', name: 'Do I get explanations for wrong answers?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Every question shows the correct answer with a detailed explanation immediately after you answer.' } },
    { '@type': 'Question', name: 'Does the quiz track my progress over time?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Your last score and number of attempts for each topic and difficulty level are saved and shown on the setup screen.' } },
  ],
}

export default function QuizPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="pt-20">
        <SkillQuiz />
      </div>
    </>
  )
}
