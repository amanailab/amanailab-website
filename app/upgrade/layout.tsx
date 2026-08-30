import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upgrade — System Design Pro & Interview Prep Kit | AmanAI Lab',
  description:
    'Go unlimited. System Design Pro (₹999/30 days): 15 AI reviews daily with section scores and interviewer notes. Interview Prep Kit (₹1499/30 days): unlimited resume, cover letter, LinkedIn and mock interview tools.',
  alternates: { canonical: 'https://amanailab.com/upgrade' },
  openGraph: {
    title: 'Upgrade Your Interview Prep — AmanAI Lab',
    description:
      'System Design Pro ₹999 · Interview Prep Kit ₹1499. Unlimited AI-powered interview preparation for 30 days.',
    images: [{
      url: '/api/og/tool?name=Upgrade&tagline=Unlimited+AI+interview+prep+%E2%80%94+from+%E2%82%B9999&emoji=%F0%9F%91%91&tool=upgrade',
      width: 1200, height: 630,
    }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children
}
