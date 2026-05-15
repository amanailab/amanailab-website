import type { Metadata } from 'next'
import LinkedInOptimizer from '@/components/linkedin/LinkedInOptimizer'

export const metadata: Metadata = {
  title: 'Free LinkedIn Profile Optimizer for AI/ML Engineers — AI-Powered Rewrite',
  description: 'Upload your LinkedIn PDF or paste your sections. AI rewrites your headline, About section, and experience bullets with the right keywords to get found by AI/ML recruiters. Free.',
  alternates: { canonical: 'https://amanailab.com/linkedin-optimizer' },
  openGraph: {
    title: 'Free LinkedIn Profile Optimizer for AI/ML Engineers',
    description: 'AI rewrites your LinkedIn headline, About section, and experience bullets for maximum recruiter visibility. PDF upload supported.',
    images: [{ url: '/api/og/tool?name=LinkedIn+Profile+Optimizer&tagline=AI-powered+headline+%26+About+rewriter&emoji=%F0%9F%92%BC&tool=linkedin', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LinkedIn Profile Optimizer',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered LinkedIn profile optimizer for AI/ML professionals.',
  url: 'https://amanailab.com/linkedin-optimizer',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the LinkedIn optimizer free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free.' } },
    { '@type': 'Question', name: 'Can I upload my LinkedIn PDF?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Export your LinkedIn PDF from LinkedIn → Me → View Profile → More → Save to PDF, then upload it for full-profile analysis including experience bullet rewrites.' } },
    { '@type': 'Question', name: 'What does the profile strength score mean?', acceptedAnswer: { '@type': 'Answer', text: 'It measures keyword density, completeness, and recruiter-readiness of your headline and About section on a 0-100 scale. Scores above 80 are considered strong.' } },
    { '@type': 'Question', name: 'Will it rewrite my experience bullet points?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, when you upload your LinkedIn PDF. The AI rewrites bullet points for your top 2-3 roles with stronger action verbs and quantified impact.' } },
    { '@type': 'Question', name: 'How does optimizing my LinkedIn help me get interviews?', acceptedAnswer: { '@type': 'Answer', text: 'Recruiters use LinkedIn keyword search. An optimized headline and About section with role-specific keywords (LLM, RAG, MLOps) significantly increases your profile visibility in search results.' } },
  ],
}

export default function LinkedInOptimizerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="pt-20">
        <LinkedInOptimizer />
      </div>
    </>
  )
}
