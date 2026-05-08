import type { Metadata } from 'next'
import SkillGapClient from './SkillGapClient'

export const metadata: Metadata = {
  title: 'Skill Gap Analyzer | AmanAI Lab',
  description: 'Paste any AI/ML job description and get a personalized gap analysis based on your interview performance. Find exactly what to study.',
}

export default function SkillGapPage() {
  return <SkillGapClient />
}
