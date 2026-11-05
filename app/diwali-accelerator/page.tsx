import type { Metadata } from 'next'
import DiwaliContent from '@/components/diwali/DiwaliContent'
import { getSeatsLeft } from '@/lib/diwali'
import { applicationsClosed } from '@/lib/diwali-config'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Diwali AI Accelerator 2026 | 1:1 GenAI & Agentic AI Mentorship | AmanAI Lab',
  description:
    'Limited Diwali cohort of 3 learners: 8 weeks of personalized 1:1 mentoring in Generative AI, RAG, Agentic AI, MCP, A2A, fine-tuning and GenAI system design, with 2 real projects.',
  alternates: { canonical: 'https://amanailab.com/diwali-accelerator' },
  openGraph: {
    title: 'Diwali AI Accelerator 2026: Only 3 Seats',
    description: '8 weeks of personalized 1:1 mentoring. GenAI, Agentic AI, MCP, A2A and 2 real projects.',
    url: 'https://amanailab.com/diwali-accelerator',
    type: 'website',
  },
}

export default async function DiwaliAcceleratorPage() {
  const seatsLeft = await getSeatsLeft()
  return <DiwaliContent seatsLeft={seatsLeft} closed={applicationsClosed()} />
}
