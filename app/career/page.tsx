import type { Metadata } from 'next'
import CareerTools from '@/components/career/CareerTools'

export const metadata: Metadata = {
  title: 'Career Tools | AmanAI Lab',
  description: 'AI-powered career tools for AI/ML job seekers — roadmap generator, study plan, offer letter analyzer, and company research. Free.',
}

export default function CareerPage() {
  return (
    <div className="pt-20">
      <CareerTools />
    </div>
  )
}
