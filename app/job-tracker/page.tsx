import type { Metadata } from 'next'
import JobTrackerClient from './JobTrackerClient'

export const metadata: Metadata = {
  title: 'Job Application Tracker | AmanAI Lab',
  description: 'Track your AI/ML job applications from wishlist to offer. Kanban board for every stage of your job search.',
}

export default function JobTrackerPage() {
  return <JobTrackerClient />
}
