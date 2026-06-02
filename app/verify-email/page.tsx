import type { Metadata } from 'next'
import { Suspense } from 'react'
import VerifyEmailClient from './VerifyEmailClient'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email to activate your AmanAI Lab subscription.',
  alternates: { canonical: 'https://amanailab.com/verify-email' },
  robots: { index: false, follow: false },
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailClient />
    </Suspense>
  )
}
