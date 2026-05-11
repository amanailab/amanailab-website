import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI/ML Interview Community | AmanAI Lab',
  description: 'Share your AI/ML interview experiences, ask questions, and get tips from engineers who have been through interviews at Google, Meta, OpenAI, Anthropic and more.',
  alternates: { canonical: 'https://amanailab.com/community' },
  openGraph: {
    title: 'AI/ML Interview Community | AmanAI Lab',
    description: 'Real interview experiences from engineers at top AI companies. Join the community.',
  },
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
