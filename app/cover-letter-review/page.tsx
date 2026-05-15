import type { Metadata } from 'next'
import CoverLetterReviewer from '@/components/cover-letter/CoverLetterReviewer'

export const metadata: Metadata = {
  title: 'Free AI Cover Letter Reviewer & Rewriter — ATS Keywords & Tone Analysis',
  description: 'Score your cover letter against any job description, find missing ATS keywords with placement guidance, and get an AI-rewritten version. Free for AI/ML job seekers.',
  alternates: { canonical: 'https://amanailab.com/cover-letter-review' },
  openGraph: {
    title: 'AI Cover Letter Reviewer & Rewriter — Free',
    description: 'ATS keyword analysis, score breakdown, tone selector, and full AI rewrite for AI/ML job seekers.',
    images: [{ url: '/api/og/tool?name=Cover+Letter+Reviewer&tagline=ATS+keywords+%2B+full+AI+rewrite&emoji=%F0%9F%93%84&tool=cover-letter', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cover Letter Reviewer',
  applicationCategory: 'BusinessApplication',
  description: 'AI scores and rewrites cover letters for AI/ML job applications.',
  url: 'https://amanailab.com/cover-letter-review',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the cover letter reviewer free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free.' } },
    { '@type': 'Question', name: 'How does the ATS keyword analysis work?', acceptedAnswer: { '@type': 'Answer', text: 'It compares your cover letter against the job description to identify missing keywords, then tells you which paragraph to add each keyword in for maximum impact.' } },
    { '@type': 'Question', name: 'Will the AI rewrite my entire cover letter?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The AI Rewrite tab generates a fully rewritten version with missing keywords highlighted in green so you can see exactly what changed.' } },
    { '@type': 'Question', name: 'What tone options can I choose for the rewrite?', acceptedAnswer: { '@type': 'Answer', text: 'Five tone options: Professional, Conversational, Confident, Enthusiastic, or Concise — selected before generating the rewrite.' } },
    { '@type': 'Question', name: 'What does the overall score measure?', acceptedAnswer: { '@type': 'Answer', text: 'The score (0-100, grade A-F) covers four dimensions: keyword match with the JD, tone and voice, length and format, and how well your strengths are demonstrated.' } },
  ],
}

export default function CoverLetterReviewPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="pt-20">
        <CoverLetterReviewer />
      </div>
    </>
  )
}
