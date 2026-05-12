import type { Metadata } from 'next'
import CareerTools from '@/components/career/CareerTools'

export const metadata: Metadata = {
  title: 'Career Tools',
  description: 'AI-powered career tools for AI/ML job seekers — roadmap generator, study plan, offer letter analyzer, and company research. Free.',
  alternates: { canonical: 'https://amanailab.com/career' },
}

export default function CareerPage() {
  return (
    <div className="pt-20">
      <CareerTools />
    </div>
  )
}
