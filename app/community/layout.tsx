import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'AI/ML Interview Experiences | AmanAI Lab Community',
  description: 'Read real AI/ML interview experiences from engineers at Google, Meta, OpenAI, and more. Share your own experience to help others.',
  alternates: { canonical: 'https://amanailab.com/community' },
  openGraph: {
    title: 'AI/ML Interview Experiences | AmanAI Lab',
    description: 'Real interview experiences from top AI/ML companies. Read and share to help the community.',
    url: 'https://amanailab.com/community',
  },
}
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
