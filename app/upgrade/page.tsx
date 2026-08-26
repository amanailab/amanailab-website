'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Crown, Star, Zap, ShieldCheck, RefreshCw, Sparkles,
  FileText, Briefcase, Loader2, CheckCircle, ArrowLeft,
  CalendarDays, Lock, LogIn,
} from 'lucide-react'
import type { Metadata } from 'next'

// ── Types ──────────────────────────────────────────────────────────────────────

interface SubStatus {
  authenticated:   boolean
  isSubscribed?:   boolean
  plan?:           'free' | 'sd_pro' | 'full_bundle'
  subscribedUntil?: string
  dailyUsed?:      number
  dailyLimit?:     number
  freeUsed?:       number
  freeLimit?:      number
}

// ── Razorpay loader ────────────────────────────────────────────────────────────

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve(false)
    if ((window as Record<string, unknown>).Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// ── Plan data ──────────────────────────────────────────────────────────────────

const SD_PRO_FEATURES = [
  { icon: <Zap size={12} className="text-orange-400" />,         text: '15 System Design AI Reviews / day' },
  { icon: <ShieldCheck size={12} className="text-emerald-400" />, text: 'Section scores — requirements, architecture, scalability' },
  { icon: <RefreshCw size={12} className="text-blue-400" />,      text: 'Re-run review after fixing your answer' },
  { icon: <Sparkles size={12} className="text-violet-400" />,     text: 'Detailed interviewer perspective note' },
  { icon: <Crown size={12} className="text-orange-400" />,        text: 'All 10+ design problems + canvas + code editor' },
]

const BUNDLE_FEATURES = [
  { icon: <Zap size={12} className="text-orange-400" />,          text: 'Everything in System Design Pro' },
  { icon: <FileText size={12} className="text-sky-400" />,         text: 'Resume Analyzer — unlimited per day' },
  { icon: <Sparkles size={12} className="text-violet-400" />,      text: 'Cover Letter Generator — unlimited' },
  { icon: <Briefcase size={12} className="text-emerald-400" />,    text: 'LinkedIn Profile Optimizer — unlimited' },
  { icon: <Star size={12} className="text-yellow-400" />,          text: 'Mock Interview Sessions — unlimited' },
  { icon: <CheckCircle size={12} className="text-teal-400" />,     text: 'Career Tools (Roadmap, Study Plan, Offer Analyzer…) — unlimited' },
]

const ACTIVE_PLAN_FEATURES: Record<string, string[]> = {
  sd_pro: [
    'System Design AI Reviews (15/day)',
    'Section scores & interviewer notes',
    'Re-run reviews after edits',
    'All design problems + canvas',
  ],
  full_bundle: [
    'Everything in System Design Pro',
    'Resume Analyzer — unlimited',
    'Cover Letter Generator — unlimited',
    'LinkedIn Optimizer — unlimited',
    'Mock Interview Sessions — unlimited',
    'All Career Tools — unlimited',
  ],
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const [status, setStatus]         = useState<SubStatus | null>(null)
  const [loading, setLoading]       = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'sd_pro' | 'full_bundle'>('full_bundle')
  const [success, setSuccess]       = useState(false)

  useEffect(() => {
    fetch('/api/sd-pro/status')
      .then(r => r.json())
      .then((d: SubStatus) => { setStatus(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handlePurchase = useCallback(async (plan: 'sd_pro' | 'full_bundle') => {
    if (!status?.authenticated) {
      window.location.href = '/login?next=/upgrade'
      return
    }
    setSelectedPlan(plan)
    setPurchasing(true)
    try {
      const ok = await loadRazorpay()
      if (!ok) { alert('Payment system failed to load. Please refresh and try again.'); return }

      const endpoint = plan === 'full_bundle' ? '/api/sd-pro/create-bundle-order' : '/api/sd-pro/create-order'
      const res      = await fetch(endpoint, { method: 'POST' })
      const od       = await res.json()

      if (!res.ok) {
        if (res.status === 401) { window.location.href = '/login?next=/upgrade'; return }
        alert(od.error ?? 'Could not create order.')
        return
      }

      const description = plan === 'full_bundle' ? 'Interview Prep Kit — 30 Days' : 'System Design Pro — 30 Days'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key:      od.key,
        amount:   od.amount,
        currency: od.currency,
        order_id: od.id,
        name:     'AmanAI Lab',
        description,
        theme:    { color: '#f97316' },
        handler:  async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const vr = await fetch('/api/sd-pro/verify-payment', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              paymentId: resp.razorpay_payment_id,
              orderId:   resp.razorpay_order_id,
              signature: resp.razorpay_signature,
              plan,
            }),
          })
          const vd = await vr.json()
          if (vr.ok) {
            setSuccess(true)
            setStatus(prev => prev ? { ...prev, isSubscribed: true, plan, subscribedUntil: vd.subscribedUntil } : prev)
          } else {
            alert(vd.error ?? 'Payment verification failed. Contact support.')
          }
        },
        modal: { ondismiss: () => setPurchasing(false) },
      })
      rzp.open()
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }, [status?.authenticated])

  const planLabel  = status?.plan === 'full_bundle' ? 'Interview Prep Kit'
    : status?.plan === 'sd_pro' ? 'System Design Pro'
    : 'Free'
  const expiryDate = status?.subscribedUntil
    ? new Date(status.subscribedUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold mb-4">
            <Crown size={12} /> AI-Powered Interview Prep
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 mb-3">
            Get ahead in your<br />AI/ML interview prep
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
            One-time payment. 30 days of unlimited AI feedback. No subscriptions, no auto-renewals.
          </p>
        </div>

        {/* ── Guest auth gate — shown BEFORE plans ─────────────────────── */}
        {!loading && !status?.authenticated && (
          <div className="mb-10 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0">
                <LogIn size={20} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-zinc-100 mb-1">Sign in to purchase a plan</p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  A free account is required to buy — so your subscription is linked to you and activates instantly after payment. Takes 30 seconds.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-emerald-400" /> Payment linked to your account</span>
                  <span className="flex items-center gap-1"><CheckCircle size={11} className="text-emerald-400" /> Activates instantly after payment</span>
                  <span className="flex items-center gap-1"><Lock size={11} className="text-zinc-600" /> No card stored — handled by Razorpay</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                <Link href="/signup?next=/upgrade"
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25">
                  Create free account
                </Link>
                <Link href="/login?next=/upgrade"
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Active subscription banner */}
        {!loading && status?.isSubscribed && (
          <div className="mb-10 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Crown size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-300">You&apos;re on {planLabel}</p>
              {expiryDate && (
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <CalendarDays size={11} /> Active until {expiryDate}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(ACTIVE_PLAN_FEATURES[status.plan ?? 'sd_pro'] ?? []).map(f => (
                  <span key={f} className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle size={9} /> {f}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/system-design"
              className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-colors">
              Start Practicing →
            </Link>
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div className="mb-8 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
            <CheckCircle size={20} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-300">Payment successful! Your plan is now active.</p>
            <p className="text-xs text-zinc-500 mt-1">
              Start with <Link href="/system-design" className="text-emerald-400 hover:underline">System Design Practice</Link>
              {status?.plan === 'full_bundle' && <> or <Link href="/resume" className="text-emerald-400 hover:underline">Resume Analyzer</Link></>}
            </p>
          </div>
        )}

        {/* Plans */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[0,1].map(i => (
              <div key={i} className="h-96 rounded-2xl bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">

            {/* SD Pro */}
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Zap size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-zinc-100">System Design Pro</p>
                  <p className="text-[10px] text-zinc-500">For serious SD practice</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-zinc-100">₹799</span>
                <span className="text-zinc-500 text-sm">/ 30 days</span>
              </div>
              <p className="text-[11px] text-zinc-600 mb-5">One-time · No auto-renewal · No subscription trap</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {SD_PRO_FEATURES.map(({ icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-[12.5px] text-zinc-300">
                    <span className="mt-0.5 shrink-0">{icon}</span>
                    <span className="leading-snug">{text}</span>
                  </li>
                ))}
              </ul>
              {status?.isSubscribed && status.plan === 'sd_pro' ? (
                <div className="flex items-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 justify-center text-xs text-emerald-400 font-semibold">
                  <CheckCircle size={13} /> Current plan
                </div>
              ) : (
                <button
                  onClick={() => handlePurchase('sd_pro')}
                  disabled={purchasing}
                  className="w-full py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-zinc-100 font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {purchasing && selectedPlan === 'sd_pro'
                    ? <><Loader2 size={15} className="animate-spin" /> Opening payment…</>
                    : !status?.authenticated
                    ? <><Lock size={14} /> Sign in to purchase</>
                    : <><Crown size={14} /> Get System Design Pro — ₹799</>}
                </button>
              )}
            </div>

            {/* Interview Prep Kit */}
            <div className="relative rounded-2xl border border-orange-500/60 bg-orange-500/5 p-6 flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-orange-500 text-white text-[10px] font-extrabold px-4 py-1 rounded-full tracking-widest shadow-lg shadow-orange-500/30">
                  BEST VALUE
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4 mt-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <Star size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-zinc-100">Interview Prep Kit</p>
                  <p className="text-[10px] text-zinc-500">Complete AI-powered bundle</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-orange-400">₹999</span>
                <span className="text-zinc-500 text-sm">/ 30 days</span>
              </div>
              <p className="text-[11px] text-zinc-600 mb-5">One-time · No auto-renewal · No subscription trap</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {BUNDLE_FEATURES.map(({ icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-[12.5px] text-zinc-200">
                    <span className="mt-0.5 shrink-0">{icon}</span>
                    <span className="leading-snug">{text}</span>
                  </li>
                ))}
              </ul>
              {status?.isSubscribed && status.plan === 'full_bundle' ? (
                <div className="flex items-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 justify-center text-xs text-emerald-400 font-semibold">
                  <CheckCircle size={13} /> Current plan
                </div>
              ) : (
                <button
                  onClick={() => handlePurchase('full_bundle')}
                  disabled={purchasing}
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  {purchasing && selectedPlan === 'full_bundle'
                    ? <><Loader2 size={15} className="animate-spin" /> Opening payment…</>
                    : !status?.authenticated
                    ? <><Lock size={14} /> Sign in to purchase</>
                    : <><Star size={14} /> Get Interview Prep Kit — ₹999</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Trust line */}
        <div className="flex items-center justify-center gap-2 mt-8 text-[11px] text-zinc-600">
          <ShieldCheck size={12} className="text-zinc-700" />
          <span>Secure payment via Razorpay · Instant activation · No hidden charges</span>
        </div>


        {/* FAQ */}
        <div className="mt-16 border-t border-zinc-800 pt-12">
          <h2 className="text-lg font-bold text-zinc-100 text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { q: 'Is this a subscription?', a: 'No. You pay once and get 30 days of access. It never auto-renews. When the 30 days expire, you stay on the free plan.' },
              { q: 'What happens after 30 days?', a: 'Your account reverts to the free tier. All your saved designs, progress, and notes remain. You can purchase again any time.' },
              { q: 'Can I upgrade from SD Pro to the Bundle?', a: 'Yes. Purchasing the Interview Prep Kit gives you a fresh 30 days from the purchase date, replacing the SD Pro plan.' },
              { q: 'What AI models power the reviews?', a: 'We use Groq (gpt-oss-120b) with Google Gemini as a fallback — fast, high-quality responses even during peak load.' },
              { q: 'Is my payment info safe?', a: 'Yes. All payments are processed by Razorpay. We never store your card details on our servers.' },
              { q: 'What if I have an issue with my purchase?', a: 'Email amanchauhan7172@gmail.com with your payment ID and we\'ll resolve it within 24 hours.' },
            ].map(({ q, a }) => (
              <div key={q} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <p className="text-sm font-bold text-zinc-200 mb-1.5">{q}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
