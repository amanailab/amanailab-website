import type { Metadata } from 'next'
import { Suspense } from 'react'
import VerifyEmailClient from './VerifyEmailClient'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email to activate your AmanAI Lab subscription.',
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailClient />
    </Suspense>
  )
}
