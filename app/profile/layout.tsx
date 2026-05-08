import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Profile | AmanAI Lab',
  description: 'Manage your AmanAI Lab account — view interview stats, update your profile, and track your AI/ML preparation journey.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
