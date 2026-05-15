import type { Metadata } from 'next'
import CareerTools from '@/components/career/CareerTools'

export const metadata: Metadata = {
  title: 'Free AI Career Tools for AI/ML Engineers — Roadmap, Study Plan, Offer Analyzer',
  description: "Four AI-powered career tools in one: generate a personalized AI/ML learning roadmap, create a study plan with calendar export, analyze offer letters, and research any company's interview process. Free.",
  alternates: { canonical: 'https://amanailab.com/career' },
  openGraph: {
    title: 'Free AI Career Tools — Roadmap, Study Plan, Offer Analyzer, Company Research',
    description: 'AI career toolkit for AI/ML job seekers: learning roadmap with PDF, day-by-day study plan, offer letter analysis, company interview research.',
    images: [{ url: '/api/og/tool?name=AI+Career+Tools&tagline=Roadmap%2C+Study+Plan%2C+Offer+Analyzer&emoji=%F0%9F%97%BA%EF%B8%8F&tool=career', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Career Tools',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered career toolkit: roadmap generator, study plan, offer analyzer, company research.',
  url: 'https://amanailab.com/career',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Are the career tools free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, all four tools are completely free.' } },
    { '@type': 'Question', name: 'How long does a typical AI/ML career roadmap take?', acceptedAnswer: { '@type': 'Answer', text: 'Ranges from 3 months (Intermediate, 10hrs/week) to 12 months (Beginner, 5hrs/week). The roadmap generator calculates this based on your current level and available time.' } },
    { '@type': 'Question', name: 'Can I download my roadmap?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Every roadmap has a "Download PDF" button that generates a formatted multi-page PDF you can save and reference offline.' } },
    { '@type': 'Question', name: 'How does the offer letter analyzer work?', acceptedAnswer: { '@type': 'Answer', text: 'Paste your offer letter, and the AI evaluates the compensation, equity, and benefits versus market rates — giving an Accept/Negotiate/Reject recommendation with a pre-written negotiation script.' } },
    { '@type': 'Question', name: 'Can the study plan export to Google Calendar?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Click "Add to Calendar" to download a .ics file with one event per study day that imports into Google Calendar, Apple Calendar, or Outlook.' } },
  ],
}

export default function CareerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="pt-20">
        <CareerTools />
      </div>
    </>
  )
}
