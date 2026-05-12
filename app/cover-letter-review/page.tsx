import type { Metadata } from 'next'
import CoverLetterReviewer from '@/components/cover-letter/CoverLetterReviewer'

export const metadata: Metadata = {
  title: 'Cover Letter Reviewer',
  description: 'AI scores your cover letter against the job description and rewrites it for maximum impact. Free tool for AI/ML job seekers.',
  alternates: { canonical: 'https://amanailab.com/cover-letter-review' },
}

export default function CoverLetterReviewPage() {
  return (
    <div className="pt-20">
      <CoverLetterReviewer />
    </div>
  )
}
