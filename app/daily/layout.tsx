import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily AI/ML Challenge | AmanAI Lab',
  description: 'Tackle a new AI/ML interview question every day. Build your streak and track your daily practice progress.',
  alternates: { canonical: 'https://amanailab.com/daily' },
  openGraph: {
    title: 'Daily AI/ML Challenge | AmanAI Lab',
    description: 'One AI/ML interview question every day. Build your streak.',
    images: [{ url: '/logo.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily AI/ML Challenge | AmanAI Lab',
    description: 'One AI/ML interview question every day.',
  },
}

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
