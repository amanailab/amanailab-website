import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Job Prep Tool — Paste Any JD, Get Tailored Interview Questions',
  description: 'Paste any AI/ML job description and get 6 tailored interview questions with model answers, required skills analysis, and a personalized study plan. Free.',
  alternates: { canonical: 'https://amanailab.com/job-prep' },
  openGraph: {
    title: 'Job Prep Tool — Tailored Interview Questions from Any JD',
    description: 'Paste a JD, get 6 role-specific interview questions with model answers, required skills, and study tips. Free for AI/ML engineers.',
    url: 'https://amanailab.com/job-prep',
  },
  twitter: { card: 'summary_large_image', title: 'Job Prep Tool — Interview Questions from Any JD' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Job Prep Tool',
  applicationCategory: 'EducationalApplication',
  description: 'Generate tailored interview questions from any AI/ML job description.',
  url: 'https://amanailab.com/job-prep',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the Job Prep tool free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free.' } },
    { '@type': 'Question', name: 'How does the Job Prep tool work?', acceptedAnswer: { '@type': 'Answer', text: 'Paste any AI/ML job description. The tool detects the role and level, extracts required skills, and generates 6 tailored interview questions with model answers specific to that JD.' } },
    { '@type': 'Question', name: 'Can I practice the generated questions?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. After generating questions, click "Practice These Topics in Mock Interview" to launch the AI simulator with those topics pre-selected.' } },
    { '@type': 'Question', name: 'Does it work for any AI/ML role?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — ML Engineer, Data Scientist, AI Research Scientist, NLP Engineer, MLOps Engineer, and more.' } },
    { '@type': 'Question', name: 'Can I export the questions?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Download as a .txt file or copy all questions and answers to your clipboard in one click.' } },
  ],
}

export default function JobPrepLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  )
}
