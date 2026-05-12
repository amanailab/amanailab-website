import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily AI/ML Challenge',
  description: 'One AI/ML interview question every day. Build your streak, track your answers, and stay sharp for your next interview. Free.',
  alternates: { canonical: 'https://amanailab.com/daily' },
}

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children
}
