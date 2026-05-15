import type { Metadata } from 'next'
import SkillGapClient from './SkillGapClient'

export const metadata: Metadata = {
  title: 'Free AI Skill Gap Analyzer for AI/ML Jobs — Know Exactly What to Study',
  description: 'Paste any AI/ML job description to get a personalized skill gap analysis based on your interview scores. See your readiness percentage, priority gaps, and what to study first. Free.',
  alternates: { canonical: 'https://amanailab.com/skill-gap' },
  openGraph: {
    title: 'AI Skill Gap Analyzer for ML Engineer Jobs',
    description: 'Instant skill gap analysis: paste a JD, see your readiness %, priority gaps, and study plan. Based on your real interview performance.',
    images: [{ url: '/api/og/tool?name=Skill+Gap+Analyzer&tagline=Know+exactly+what+to+study&emoji=%F0%9F%8E%AF&tool=skill-gap', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Skill Gap Analyzer',
  applicationCategory: 'EducationalApplication',
  description: 'Analyze your AI/ML skill gaps against any job description using your real interview performance.',
  url: 'https://amanailab.com/skill-gap',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the skill gap analyzer free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free.' } },
    { '@type': 'Question', name: 'What is a skill gap analysis for AI/ML jobs?', acceptedAnswer: { '@type': 'Answer', text: 'It compares the skills required in a job description against your actual interview and quiz performance to show exactly which topics you need to study before applying.' } },
    { '@type': 'Question', name: 'How does it know my current skill level?', acceptedAnswer: { '@type': 'Answer', text: 'For users who have practiced, it reads your actual interview session scores and quiz results. It also reads quiz mastery from your browser. For new users, it analyzes the JD independently.' } },
    { '@type': 'Question', name: 'What does the readiness percentage mean?', acceptedAnswer: { '@type': 'Answer', text: 'It estimates what percentage of the required skills you currently have, based on your practice scores versus the role requirements in the JD.' } },
    { '@type': 'Question', name: 'Can I create a study plan from the gap analysis?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Click "Create Study Plan from Gaps" to automatically pre-fill the Study Plan tool with your top weak topics and navigate directly to the planning page.' } },
  ],
}

export default function SkillGapPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SkillGapClient />
    </>
  )
}
