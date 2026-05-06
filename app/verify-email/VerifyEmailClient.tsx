'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react'

type Status = 'success' | 'already' | 'expired' | 'invalid' | 'error'

const CONFIG: Record<Status, {
  icon: React.ReactNode
  title: string
  message: string
  cta: string
  ctaHref: string
  accent: string
}> = {
  success: {
    icon: <CheckCircle2 className="w-12 h-12 text-green-400" />,
    title: 'Email Verified! 🎉',
    message: 'Your email is confirmed. You now have full access to all AmanAI Lab tools — AI Simulator, Resume Analyzer, LinkedIn Optimizer, and more.',
    cta: 'Start Using Tools',
    ctaHref: '/interview',
    accent: 'border-green-500/20 bg-green-500/5',
  },
  already: {
    icon: <CheckCircle2 className="w-12 h-12 text-blue-400" />,
    title: 'Already Verified',
    message: 'Your email was already verified. You have full access to all tools.',
    cta: 'Go to Tools',
    ctaHref: '/interview',
    accent: 'border-blue-500/20 bg-blue-500/5',
  },
  expired: {
    icon: <Clock className="w-12 h-12 text-yellow-400" />,
    title: 'Link Expired',
    message: 'This verification link has expired (links are valid for 48 hours). Please enter your email again on any tool to get a fresh link.',
    cta: 'Go to AI Simulator',
    ctaHref: '/interview',
    accent: 'border-yellow-500/20 bg-yellow-500/5',
  },
  invalid: {
    icon: <XCircle className="w-12 h-12 text-red-400" />,
    title: 'Invalid Link',
    message: 'This verification link is not valid. It may have already been used or the link was modified. Please enter your email again on any tool.',
    cta: 'Try Again',
    ctaHref: '/interview',
    accent: 'border-red-500/20 bg-red-500/5',
  },
  error: {
    icon: <AlertCircle className="w-12 h-12 text-orange-400" />,
    title: 'Something Went Wrong',
    message: 'We could not verify your email right now. Please try again in a moment or contact us.',
    cta: 'Go Home',
    ctaHref: '/',
    accent: 'border-orange-500/20 bg-orange-500/5',
  },
}

export default function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const status = (searchParams.get('status') ?? 'invalid') as Status
  const config = CONFIG[status] ?? CONFIG.invalid

  // On success: mark email as captured in localStorage so all tools unlock
  useEffect(() => {
    if (status === 'success' || status === 'already') {
      try {
        localStorage.setItem('email_captured', '1')
      } catch {
        // ignore
      }
    }
  }, [status])

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-xl font-bold">Aman<span className="text-orange-500">AI</span> Lab</span>
        </div>

        <div className={`border rounded-2xl p-8 text-center ${config.accent}`}>
          <div className="flex justify-center mb-5">{config.icon}</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-3">{config.title}</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-7">{config.message}</p>

          <Link
            href={config.ctaHref}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            {config.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Questions? <Link href="/contact" className="text-orange-400 hover:underline">Contact us</Link>
        </p>
      </div>
    </section>
  )
}
