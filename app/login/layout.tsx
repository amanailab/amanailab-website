import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to AmanAI Lab — track your AI/ML interview readiness score, practice with the simulator, and access your progress dashboard.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
