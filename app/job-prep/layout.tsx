import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI/ML Job Prep — Interview Questions from Any JD',
  description: 'Paste any AI/ML job description and instantly get 6 tailored interview questions. Free job prep tool for machine learning engineers.',
  alternates: { canonical: 'https://amanailab.com/job-prep' },
  keywords: ['AI job interview prep', 'ML job description questions', 'job prep AI', 'tailored interview questions'],
  openGraph: {
    title: 'AI Job Prep — Get Interview Questions from Any JD',
    description: 'Paste a job description → get 6 AI-generated questions tailored to that exact role.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
