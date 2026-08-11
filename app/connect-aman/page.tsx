import type { Metadata } from 'next'
import ConnectAmanContent from './ConnectAmanContent'

export const metadata: Metadata = {
  title: 'Book a Session with Aman | AmanAI Lab',
  description:
    'Book a 1-on-1 session with Aman — a quick career chat (₹299), a full AI/ML mock interview (₹999), or a mock interview with detailed written feedback (₹1,499). Pay securely, pick your slot on WhatsApp.',
  alternates: { canonical: 'https://amanailab.com/connect-aman' },
  openGraph: {
    title: 'Book a Session with Aman | AmanAI Lab',
    description:
      'Quick Chat ₹299 · Mock Interview ₹999 · Mock + Feedback Report ₹1,499. Live 1-on-1 with Aman. Pay securely via Razorpay, book your slot on WhatsApp.',
    url: 'https://amanailab.com/connect-aman',
    images: [{
      url: '/api/og/tool?name=Book+a+Session&tagline=1-on-1+mock+interviews+%26+career+coaching&emoji=%F0%9F%93%85&tool=connect-aman',
      width: 1200, height: 630,
    }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function ConnectAmanPage() {
  return (
    <div className="pt-20">
      <ConnectAmanContent />
    </div>
  )
}
