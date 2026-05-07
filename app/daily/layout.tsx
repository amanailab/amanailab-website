import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily Challenge | AmanAI Lab',
  description: 'Answer one AI/ML interview question every day and build your streak. Free daily practice for AI engineers.',
}

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children
}
