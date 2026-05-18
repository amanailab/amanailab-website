import type { Metadata } from 'next'
import JobTrackerClient from './JobTrackerClient'

export const metadata: Metadata = {
  title: 'AI/ML Job Application Tracker — Kanban Board for Your Job Search | AmanAI Lab',
  description: 'Track every AI/ML job application from wishlist to offer. Kanban-style board with stages: Wishlist, Applied, Interview, Offer, Rejected. Never lose track of your job search.',
  alternates: { canonical: 'https://amanailab.com/job-tracker' },
  openGraph: {
    title: 'AI/ML Job Application Tracker — Kanban Board',
    description: 'Track every AI/ML job application from wishlist to offer. Kanban stages, notes, and status tracking. Free.',
    images: [{ url: '/api/og/tool?name=Job+Tracker&tagline=Track+every+application+from+wishlist+to+offer&emoji=%F0%9F%93%8B&tool=job-tracker', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function JobTrackerPage() {
  return <JobTrackerClient />
}
