import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free AI/ML Daily Interview Challenge — Build Your Streak',
  description: 'One AI/ML interview question every day. Answer it, get instant AI feedback with a 0-10 score and model answer. Build a daily practice streak. Choose from 14 topics. Free.',
  alternates: { canonical: 'https://amanailab.com/daily' },
  openGraph: {
    title: 'AI/ML Daily Interview Challenge — Free',
    description: 'One question per day. AI feedback, model answer, and streak tracking. 14 topics to choose from.',
    url: 'https://amanailab.com/daily',
  },
  twitter: { card: 'summary_large_image', title: 'AI/ML Daily Interview Challenge' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI/ML Daily Challenge',
  applicationCategory: 'EducationalApplication',
  description: 'Daily AI/ML interview practice with AI scoring, model answers, and streak tracking.',
  url: 'https://amanailab.com/daily',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is the AI/ML daily challenge?', acceptedAnswer: { '@type': 'Answer', text: 'One AI/ML interview question per day. Write your answer, get AI feedback with a score out of 10, and see the model answer. Build a streak by practicing every day.' } },
    { '@type': 'Question', name: 'Is the daily challenge free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free for everyone.' } },
    { '@type': 'Question', name: 'Can I choose the topic for the daily question?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Choose from 14 AI/ML topics (LLM, RAG, Agents, MLOps, etc.) or leave it on Random for a surprise question each day.' } },
    { '@type': 'Question', name: 'How does the streak system work?', acceptedAnswer: { '@type': 'Answer', text: 'Answering at least one question per day maintains your streak. Missing a day resets the streak counter to zero.' } },
    { '@type': 'Question', name: 'How is my answer scored?', acceptedAnswer: { '@type': 'Answer', text: 'The AI scores your answer from 0-10 with a verdict (Excellent/Good/Needs Work/Poor), specific feedback, key points you covered, and points you missed.' } },
  ],
}

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  )
}
