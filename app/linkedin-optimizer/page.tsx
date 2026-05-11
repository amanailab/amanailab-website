import type { Metadata } from 'next'
import LinkedInOptimizer from '@/components/linkedin/LinkedInOptimizer'

export const metadata: Metadata = {
  title: 'LinkedIn Profile Optimizer | AmanAI Lab',
  description: 'AI-powered LinkedIn profile optimizer for AI/ML professionals. Rewrite your headline and About section with the right keywords to attract recruiters.',
  alternates: { canonical: 'https://amanailab.com/linkedin-optimizer' },
}

export default function LinkedInOptimizerPage() {
  return (
    <div className="pt-20">
      <LinkedInOptimizer />
    </div>
  )
}
