'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  MessageSquare, Clock, CheckCircle2, ArrowRight,
  Zap, Star, Shield, ChevronRight, Sparkles,
  FileText, BrainCircuit, Loader2, Calendar,
  GraduationCap, Rocket, Crown, Users, BadgeCheck,
  PhoneCall, ClipboardList, Trophy,
} from 'lucide-react'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void
      on(event: string, handler: () => void): void
    }
  }
}

const WA_NUMBER = '919997600372'

function waBookingLink(sessionLabel: string, paymentId: string) {
  const msg = encodeURIComponent(
    `Hi Aman! I just booked a "${sessionLabel}" session.\n\nPayment ID: ${paymentId}\n\nCould you help me pick a slot?`
  )
  return `https://wa.me/${WA_NUMBER}?text=${msg}`
}

// ─── Session definitions ──────────────────────────────────────────────────────

interface Session {
  id:        'quick' | 'mock' | 'feedback'
  emoji:     string
  name:      string
  price:     string
  amount:    number
  duration:  string
  badge:     string | null
  topBar:    string
  border:    string
  accentText:string
  accentBg:  string
  tagline:   string
  bestFor:   string
  features:  string[]
  icon:      React.ElementType
}

const SESSIONS: Session[] = [
  {
    id:          'quick',
    emoji:       '💬',
    name:        'Quick Chat',
    price:       '₹299',
    amount:      299,
    duration:    '30 min',
    badge:       null,
    topBar:      'from-blue-500 to-blue-600',
    border:      'border-blue-500/25',
    accentText:  'text-blue-400',
    accentBg:    'bg-blue-500/10',
    tagline:     'Fast clarity on your AI career',
    bestFor:     'Students & freshers who want direction fast',
    icon:        PhoneCall,
    features: [
      'Ask Aman anything — career path, skill gaps, project ideas',
      'Live 1-on-1 over Google Meet',
      'Walk away with a clear next step',
      'Recorded & shared within 24h on request',
    ],
  },
  {
    id:          'mock',
    emoji:       '🎯',
    name:        'Mock Interview',
    price:       '₹999',
    amount:      999,
    duration:    '60 min',
    badge:       'Most Popular',
    topBar:      'from-orange-500 to-orange-600',
    border:      'border-orange-500/30',
    accentText:  'text-orange-400',
    accentBg:    'bg-orange-500/10',
    tagline:     'Real interview. Real pressure. Real feedback.',
    bestFor:     'Candidates actively applying for AI/ML roles',
    icon:        BrainCircuit,
    features: [
      'Full 60-min mock interview — AI, ML, GenAI, system design',
      'Company-specific simulation on request (Google, Meta, OpenAI…)',
      'Behavioural + technical rounds covered',
      'Live verbal feedback after each answer',
      'Overall performance rating at the end',
    ],
  },
  {
    id:          'feedback',
    emoji:       '📋',
    name:        'Mock + Feedback Report',
    price:       '₹1,499',
    amount:      1499,
    duration:    '60 min + report',
    badge:       'Premium',
    topBar:      'from-violet-500 to-purple-600',
    border:      'border-violet-500/30',
    accentText:  'text-violet-400',
    accentBg:    'bg-violet-500/10',
    tagline:     'The most complete interview prep session',
    bestFor:     'Serious candidates who want a written improvement plan',
    icon:        ClipboardList,
    features: [
      'Everything in Mock Interview (60 min)',
      'Detailed written feedback report delivered within 24h',
      'Topic-by-topic score breakdown',
      'Exact answers you should have given — model answers written by Aman',
      'Personalised 2-week improvement plan',
    ],
  },
]

// ─── Mini services for the services strip ────────────────────────────────────

const MINI_SERVICES = [
  { emoji: '🗺️', name: 'Blueprint',       price: '₹1,999',    color: 'text-blue-400',    bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  { emoji: '🚀', name: 'Launchpad',       price: '₹4,999',    color: 'text-orange-400',  bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { emoji: '👑', name: 'Placement',       price: '₹9,999',    color: 'text-amber-400',   bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  { emoji: '🎓', name: '1:1 Mastery',     price: '₹1,05,000', color: 'text-emerald-400', bg: 'bg-emerald-500/10',border: 'border-emerald-500/20'},
]

// ─── How it works steps ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { n: '01', icon: Trophy,      title: 'Pick your session',   desc: 'Choose the session type that fits your goal — Quick Chat, Mock Interview, or Mock + Report.' },
  { n: '02', icon: Shield,      title: 'Pay securely',        desc: 'One-click Razorpay payment. ₹299 to ₹1,499 — all online, all instant.' },
  { n: '03', icon: MessageSquare, title: 'WhatsApp Aman',     desc: 'After payment, WhatsApp Aman with your payment ID. He\'ll confirm a slot within a few hours.' },
  { n: '04', icon: Calendar,    title: 'Session confirmed',   desc: 'You get a Google Meet link for your chosen slot. Show up and get what you came for.' },
]

// ─── Payment state ────────────────────────────────────────────────────────────

type BookingState =
  | { type: 'idle' }
  | { type: 'paying'; session: Session }
  | { type: 'success'; session: Session; paymentId: string }

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({
  session, i, onBook, paying,
}: {
  session: Session
  i: number
  onBook: (s: Session) => void
  paying: boolean
}) {
  const Icon = session.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: i * 0.1 }}
      className={`flex flex-col bg-zinc-900 border rounded-2xl overflow-hidden ${session.border}`}
    >
      {/* Top bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${session.topBar}`} />

      <div className="p-6 flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${session.accentBg}`}>
            <Icon className={`w-5 h-5 ${session.accentText}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className={`text-xs font-extrabold uppercase tracking-widest ${session.accentText}`}>{session.name}</p>
              {session.badge && (
                <span className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${session.accentBg} ${session.accentText} border border-current/20`}>
                  {session.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 leading-snug">{session.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-extrabold text-zinc-100">{session.price}</span>
        </div>
        <div className="flex items-center gap-1.5 mb-5">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-xs text-zinc-600">{session.duration} · Live on Google Meet</span>
        </div>

        <div className={`h-px w-full mb-5 bg-gradient-to-r ${session.topBar} opacity-20`} />

        {/* Features */}
        <ul className="flex flex-col gap-2.5 flex-1 mb-5">
          {session.features.map((f, fi) => (
            <li key={fi} className="flex items-start gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${session.accentText}`} />
              <span className="text-xs text-zinc-300 leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>

        {/* Best for */}
        <p className={`text-xs mb-5 px-3 py-2 rounded-lg ${session.accentBg} ${session.accentText}`}>
          <span className="font-bold">Best for:</span>{' '}
          <span className="text-zinc-300">{session.bestFor}</span>
        </p>

        {/* CTA */}
        <button
          onClick={() => onBook(session)}
          disabled={paying}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all mt-auto
            ${paying
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-400 text-white hover:shadow-lg hover:shadow-orange-500/25'
            }`}
        >
          {paying
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening payment…</>
            : <>Book Now — {session.price} <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Success overlay ──────────────────────────────────────────────────────────

function SuccessOverlay({ state, onClose }: { state: { session: Session; paymentId: string }; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
      >
        {/* Check icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <BadgeCheck className="w-8 h-8 text-emerald-400" />
        </div>

        <h2 className="text-xl font-extrabold text-zinc-100 mb-1">Payment Confirmed!</h2>
        <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
          Your <span className="text-zinc-200 font-semibold">{state.session.name}</span> session is booked.
          WhatsApp Aman now to pick your slot.
        </p>

        {/* Payment ID */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mb-6 text-left">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-1">Payment ID</p>
          <p className="text-xs font-mono text-emerald-400 break-all">{state.paymentId}</p>
        </div>

        {/* What happens next */}
        <div className="flex flex-col gap-2 mb-6 text-left">
          {[
            'Tap the button below — it opens WhatsApp with your payment ID pre-filled',
            'Aman will confirm your slot within 2–4 hours',
            'You\'ll get a Google Meet link for your session',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <a
          href={waBookingLink(state.session.name, state.paymentId)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 mb-3"
        >
          <MessageSquare className="w-4 h-4" /> WhatsApp Aman to Book Slot
        </a>

        <button
          onClick={onClose}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConnectAmanContent() {
  const [booking, setBooking]   = useState<BookingState>({ type: 'idle' })
  const [rzpReady, setRzpReady] = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay"]')) { setRzpReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true; s.onload = () => setRzpReady(true)
    document.body.appendChild(s)
  }, [])

  async function handleBook(session: Session) {
    if (!rzpReady) { setError('Payment is loading, please try again.'); return }
    setError('')
    setBooking({ type: 'paying', session })

    try {
      const orderRes = await fetch('/api/booking/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionType: session.id }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error ?? 'Could not create order')

      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency,
        name:        'AmanAI Lab',
        description: order.label,
        order_id:    order.id,
        image:       '/logo.jpg',
        theme:       { color: '#f97316' },
        prefill:     { contact: '' },
        handler: async (r: {
          razorpay_payment_id: string
          razorpay_order_id:   string
          razorpay_signature:  string
        }) => {
          const vRes = await fetch('/api/booking/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId:   r.razorpay_payment_id,
              orderId:     r.razorpay_order_id,
              signature:   r.razorpay_signature,
              sessionType: session.id,
            }),
          })
          const vData = await vRes.json()
          if (!vRes.ok) {
            setError('Payment received but verification failed. Contact Aman with ID: ' + r.razorpay_payment_id)
            setBooking({ type: 'idle' })
          } else {
            setBooking({ type: 'success', session, paymentId: vData.paymentId })
          }
        },
        modal: { ondismiss: () => setBooking({ type: 'idle' }) },
      })
      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setBooking({ type: 'idle' })
    }
  }

  const isPaying = booking.type === 'paying'

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">

      {/* ── Success overlay ── */}
      <AnimatePresence>
        {booking.type === 'success' && (
          <SuccessOverlay
            state={booking}
            onClose={() => setBooking({ type: 'idle' })}
          />
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 text-center pt-14 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold px-4 py-2 rounded-full mb-6"
        >
          <Zap className="w-3.5 h-3.5" /> Direct 1:1 with Aman · No agencies, no middlemen
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="text-4xl sm:text-5xl font-extrabold text-zinc-100 leading-tight mb-4"
        >
          Book a Session{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            with Aman
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed"
        >
          A quick career chat, a full mock interview, or a mock with a detailed written report —
          pick what you need, pay once, and pick your slot on WhatsApp.
        </motion.p>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: Star,     text: 'Live on Google Meet' },
            { icon: Shield,   text: 'Razorpay secure payment' },
            { icon: Users,    text: 'Strictly 1-on-1 with Aman' },
            { icon: Clock,    text: 'Slot within 48h' },
          ].map(t => (
            <div key={t.text} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
              <t.icon className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-zinc-400 font-medium">{t.text}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto px-4 mb-4"
          >
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium px-4 py-3 rounded-xl flex items-center justify-between gap-4">
              <span>{error}</span>
              <button onClick={() => setError('')} className="shrink-0 text-red-500 hover:text-red-300">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session cards ── */}
      <section className="max-w-5xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SESSIONS.map((s, i) => (
            <SessionCard
              key={s.id}
              session={s}
              i={i}
              onBook={handleBook}
              paying={isPaying}
            />
          ))}
        </div>

        {/* custom note */}
        <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zinc-200 mb-0.5">Not sure which to pick?</p>
            <p className="text-xs text-zinc-500">WhatsApp Aman — he&apos;ll tell you which session makes sense for where you are.</p>
          </div>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi Aman! I want to book a session but I\'m not sure which one fits me. Can you help?')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
          >
            <MessageSquare className="w-4 h-4" /> Ask Aman →
          </a>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-4xl mx-auto px-4 mt-16 mb-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">How It Works</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">4 steps. Zero friction.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.08 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <span className="text-xs font-bold text-zinc-700 mb-3 block font-mono">{s.n}</span>
              <s.icon className="w-5 h-5 text-orange-400 mb-3" />
              <p className="text-sm font-bold text-zinc-200 mb-1.5">{s.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── What to expect ── */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon:  BrainCircuit,
              title: 'Real questions, real pressure',
              desc:  'Aman runs you through the actual questions that AI/ML interviewers at top companies ask — not watered-down examples.',
            },
            {
              icon:  Sparkles,
              title: 'Honest, direct feedback',
              desc:  'No sugar-coating. You\'ll know exactly where you stand, what to fix, and what to say next time.',
            },
            {
              icon:  Rocket,
              title: 'Leave with a plan',
              desc:  'Every session ends with a clear set of next steps — not just "good luck." Aman gives you something actionable.',
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.08 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-sm font-bold text-zinc-100 mb-2">{c.title}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Mini services strip ── */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="text-center mb-6">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Also Available</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100">Need deeper mentorship?</h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-lg mx-auto">
            These sessions are great for a quick boost. For a full career transformation — resume, projects, mock interviews, job placement — check the mentorship programs below.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {MINI_SERVICES.map((svc, i) => (
            <motion.div
              key={svc.name}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.07 }}
            >
              <Link
                href="/services"
                className={`flex flex-col items-center gap-2 bg-zinc-900 border rounded-2xl p-4 text-center transition-all hover:scale-[1.02] hover:shadow-md group ${svc.border}`}
              >
                <span className="text-2xl">{svc.emoji}</span>
                <p className={`text-xs font-extrabold uppercase tracking-wider ${svc.color}`}>{svc.name}</p>
                <p className="text-sm font-bold text-zinc-100">{svc.price}</p>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${svc.bg} ${svc.color} flex items-center gap-1`}>
                  View details <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors"
          >
            See all mentorship programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Guarantee ── */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <div className="flex items-start gap-4 bg-gradient-to-br from-orange-500/8 via-zinc-900 to-zinc-900 border border-orange-500/20 rounded-2xl p-6">
          <CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-zinc-100 mb-1">Aman&apos;s guarantee</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If you feel the session wasn&apos;t worth it, message Aman on WhatsApp. He&apos;ll either fix it with a follow-up
              or refund you — no questions asked. Your time and money are respected, always.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-2xl mx-auto px-4">
        <div className="relative bg-zinc-900 border border-orange-500/20 rounded-2xl p-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-violet-500/5 pointer-events-none" />
          <GraduationCap className="w-10 h-10 text-orange-400 mx-auto mb-4 relative z-10" />
          <h2 className="text-2xl font-extrabold text-zinc-100 mb-2 relative z-10">Ready to stop guessing?</h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed relative z-10">
            Pick a session above, pay in 30 seconds, and WhatsApp Aman for your slot.
            Or just reach out if you have a question first.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
            <button
              onClick={() => document.getElementById('sessions')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 text-sm"
            >
              <Calendar className="w-4 h-4" /> Book a Session Now
            </button>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi Aman! I have a question about booking a session.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold px-6 py-3.5 rounded-xl transition-colors text-sm"
            >
              <MessageSquare className="w-4 h-4" /> Ask a Question First
            </a>
          </div>
          <p className="text-xs text-zinc-700 mt-5 relative z-10">Responds within 2–4 hours · Slots confirmed same day</p>
        </div>
      </section>

    </div>
  )
}
