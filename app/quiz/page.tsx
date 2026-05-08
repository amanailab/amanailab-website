import type { Metadata } from 'next'
import SkillQuiz from '@/components/quiz/SkillQuiz'

export const metadata: Metadata = {
  title: 'AI/ML Skill Assessment Quiz | AmanAI Lab',
  description: 'Test your AI and ML knowledge with AI-generated multiple choice questions. Get instant explanations and track your progress.',
}

export default function QuizPage() {
  return (
    <div className="pt-20">
      <SkillQuiz />
    </div>
  )
}
