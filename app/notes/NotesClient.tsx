'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Crown, CreditCard, X, CheckCircle,
  FileText, Loader2, Lock, Sparkles, Eye,
  BookOpen, ChevronRight,
} from 'lucide-react'
import type { Note } from '@/lib/notes-data'
import PdfPreview from '@/components/notes/PdfPreview'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void
      on(event: string, handler: () => void): void
    }
  }
}

type ModalState =
  | { type: 'none' }
  | { type: 'preview'; note: Note }
  | { type: 'code';    note: Note }
  | { type: 'pay';     note: Note }
  | { type: 'download'; note: Note; url: string }

export default function NotesClient({ notes }: { notes: Note[] }) {
  const [filter, setFilter]       = useState('All')
  const [modal, setModal]         = useState<ModalState>({ type: 'none' })
  const [codeInput, setCodeInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')
  const [rzpReady, setRzpReady]   = useState(false)

  const topicCounts = notes.reduce<Record<string, number>>((acc, n) => {
    acc[n.topic] = (acc[n.topic] ?? 0) + 1
    return acc
  }, {})
  const topics = ['All', ...Object.keys(topicCounts)]

  const showLatest = filter === 'All' && notes.length >= 3
  const latestNotes = notes.slice(0, 3)
  const filtered = filter === 'All' ? notes : notes.filter((n) => n.topic === filter)

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay"]')) { setRzpReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true; s.onload = () => setRzpReady(true)
    document.body.appendChild(s)
  }, [])

  function close() { setModal({ type: 'none' }); setCodeInput(''); setError(''); setIsLoading(false) }

  function openPreview(note: Note) { setModal({ type: 'preview', note }); setError('') }
  function openCode(note: Note)    { setModal({ type: 'code',    note }); setCodeInput(''); setError('') }
  function openPay(note: Note)     { setModal({ type: 'pay',     note }); setError('') }

  async function verifyCode(note: Note) {
    if (!codeInput.trim()) { setError('Please enter your member code.'); return }
    setIsLoading(true); setError('')
    try {
      const res  = await fetch('/api/notes/verify-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput.trim(), noteId: note.id }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Invalid code.')
      else         setModal({ type: 'download', note, url: data.url })
    } catch { setError('Something went wrong. Please try again.') }
    finally   { setIsLoading(false) }
  }

  async function buy(note: Note) {
    if (!rzpReady) { setError('Payment is loading, try again.'); return }
    setIsLoading(true); setError('')
    try {
      const orderRes = await fetch('/api/notes/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error ?? 'Could not create order')

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount, currency: order.currency,
        name: 'AmanAI Lab', description: note.title,
        order_id: order.id, image: '/logo.jpg',
        theme: { color: '#f97316' },
        handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const vRes  = await fetch('/api/notes/verify-payment', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ noteId: note.id, paymentId: r.razorpay_payment_id, orderId: r.razorpay_order_id, signature: r.razorpay_signature }),
          })
          const vData = await vRes.json()
          if (!vRes.ok) setError('Payment verified but download failed. Contact support: ' + r.razorpay_payment_id)
          else          setModal({ type: 'download', note, url: vData.url })
          setIsLoading(false)
        },
        modal: { ondismiss: () => setIsLoading(false) },
      })
      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  if (notes.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">📚</div>
          <p className="text-zinc-300 text-xl font-bold">Notes coming soon</p>
          <p className="text-zinc-600 text-sm mt-1">We&apos;re preparing premium notes — check back shortly!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">

      {/* ════════════════ COMPACT HERO ════════════════ */}
      <section className="relative pt-10 pb-8 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-orange-500/6 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> Premium Study Notes
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-100 leading-tight">
                AmanAI{' '}
                <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">Notes</span>
              </h1>
              <p className="text-zinc-500 text-sm mt-2 max-w-xs">
                Handcrafted PDFs from every AmanAI Lab video.{' '}
                <span className="text-zinc-400">{notes.length} notes · {topics.length - 1} topics</span>
              </p>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0 sm:w-72">
              <div className="flex items-center gap-3 bg-orange-500/8 border border-orange-500/25 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-orange-500/15 rounded-lg flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-200">YouTube Member</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Enter monthly code → download free</p>
                </div>
                <span className="text-[10px] font-black text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/20 shrink-0">FREE</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-300">Non-Member</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Pay once · instant download · no login</p>
                </div>
                <span className="text-[10px] font-black text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700 shrink-0">₹99</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ LATEST NOTES ════════════════ */}
      {showLatest && (
        <section className="px-4 pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-zinc-800" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Latest Notes</span>
              </div>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {latestNotes.map((note, i) => (
                <motion.div key={note.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  onClick={() => openPreview(note)}
                  className="group relative flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 rounded-2xl p-3.5 transition-all cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${note.gradient} flex items-center justify-center text-2xl shrink-0`}>
                    {note.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/15 px-1.5 py-0.5 rounded-full uppercase tracking-wide">{note.topic}</span>
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded-full uppercase">New</span>
                    </div>
                    <p className="text-xs font-bold text-zinc-200 leading-snug truncate">{note.title}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{note.pages} pages</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-400 transition-colors shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ FILTER TABS ════════════════ */}
      <div className="sticky top-0 z-20 bg-[#09090b]/90 backdrop-blur-lg border-b border-zinc-900">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {topics.map((t) => {
            const count  = t === 'All' ? notes.length : topicCounts[t]
            const active = filter === t
            return (
              <button key={t} onClick={() => setFilter(t)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}>
                {t}
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  active ? 'bg-white/20' : 'bg-zinc-800 text-zinc-500'
                }`}>{count}</span>
              </button>
            )
          })}
          {filter !== 'All' && (
            <button onClick={() => setFilter('All')}
              className="ml-auto shrink-0 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ════════════════ NOTES GRID ════════════════ */}
      <section className="px-4 py-6 pb-24">
        <div className="max-w-5xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              <p className="text-zinc-400 font-bold">No {filter} notes yet</p>
              <p className="text-zinc-600 text-sm mt-1">More coming soon!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  {filter === 'All' ? 'All Notes' : filter} · {filtered.length} note{filtered.length !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-zinc-700 flex items-center gap-1"><Eye className="w-3 h-3" /> Click any card to preview</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((note, i) => (
                    <NoteCard key={note.id} note={note} index={i}
                      onPreview={() => openPreview(note)}
                      onCode   ={() => openCode(note)}
                      onBuy    ={() => openPay(note)} />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ════════════════ MODALS ════════════════ */}
      <AnimatePresence>
        {modal.type !== 'none' && (
          <>
            <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={close} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />

            {/* ── Preview modal ── */}
            {modal.type === 'preview' && (
              <motion.div key="preview"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.18 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                  {/* Compact header */}
                  <div className={`relative h-20 bg-gradient-to-br ${modal.note.gradient} shrink-0`}>
                    <div className="absolute inset-0 bg-black/35" />
                    <div className="absolute inset-0 opacity-[0.07]"
                      style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                    <div className="relative z-10 px-5 flex flex-col h-full justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-white/60 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full uppercase tracking-wide">{modal.note.topic}</span>
                        {modal.note.is_new && (
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/20 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase">New</span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-white leading-snug pr-10">{modal.note.title}</p>
                    </div>
                    <button onClick={close}
                      className="absolute top-3 right-3 z-20 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-lg flex items-center justify-center transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable body */}
                  <div className="overflow-y-auto flex-1 p-5 space-y-5">

                    {/* Stats row */}
                    <div className="flex items-center gap-3">
                      {[
                        { icon: FileText, label: `${modal.note.pages} pages`  },
                        { icon: BookOpen, label: modal.note.topic              },
                        { icon: Lock,     label: 'Instant download'            },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/50 px-2.5 py-1.5 rounded-lg">
                          <s.icon className="w-3 h-3 text-orange-400" />
                          <span className="text-[11px] font-semibold text-zinc-300">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    {modal.note.description && (
                      <p className="text-sm text-zinc-400 leading-relaxed">{modal.note.description}</p>
                    )}

                    {/* What's inside */}
                    {modal.note.preview_points.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">What&apos;s inside</p>
                        <ul className="space-y-2.5">
                          {modal.note.preview_points.map((pt, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">✓</span>
                              <span className="text-sm text-zinc-300 leading-relaxed">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Live PDF preview */}
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Sample Page</p>
                      <PdfPreview noteId={modal.note.id} fade={true} pages={1} />
                    </div>

                    {/* Price + CTA */}
                    <div className="border-t border-zinc-800 pt-4 space-y-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-zinc-500">Price</span>
                        <span className="text-2xl font-extrabold text-orange-400">₹{modal.note.price}</span>
                      </div>
                      <button onClick={() => openCode(modal.note)}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-400 text-sm font-bold py-3 rounded-xl transition-all">
                        <Crown className="w-4 h-4" /> YouTube Member? Get it Free
                      </button>
                      <button onClick={() => openPay(modal.note)}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20">
                        <CreditCard className="w-4 h-4" /> Buy for ₹{modal.note.price} — Instant Download
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Code / Pay / Download modals ── */}
            {(modal.type === 'code' || modal.type === 'pay' || modal.type === 'download') && (
              <motion.div key="md"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.18 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

                  <div className="flex items-center justify-between px-5 pt-5 pb-4">
                    <h2 className="font-extrabold text-zinc-100">
                      {modal.type === 'code'     && '👑 Member Free Access'}
                      {modal.type === 'pay'      && '💳 Buy This Note'}
                      {modal.type === 'download' && '🎉 Ready to Download!'}
                    </h2>
                    <button onClick={close}
                      className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 rounded-lg flex items-center justify-center transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-5 pb-5 space-y-4">
                    {(modal.type === 'code' || modal.type === 'pay') && (
                      <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${modal.note.gradient} flex items-center justify-center text-xl shrink-0`}>
                          {modal.note.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-100 truncate">{modal.note.title}</p>
                          <p className="text-xs text-zinc-500">{modal.note.pages} pages · {modal.note.topic}</p>
                        </div>
                        <span className="font-extrabold text-orange-400 shrink-0">₹{modal.note.price}</span>
                      </div>
                    )}

                    {modal.type === 'code' && (
                      <div className="space-y-3">
                        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">How to get your code</p>
                          {[['1', 'Join our YouTube channel (click Join)'],
                            ['2', 'Open the Members-only Community post'],
                            ['3', 'Copy the monthly code and paste below']].map(([n, t]) => (
                            <div key={n} className="flex items-start gap-2">
                              <span className="w-4 h-4 text-[10px] font-black rounded-full bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                              <span className="text-xs text-zinc-500 leading-relaxed">{t}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5">Your Code</label>
                          <input type="text" value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && verifyCode(modal.note)}
                            placeholder="e.g. AMAN-AUG2026" autoFocus
                            className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest outline-none transition-colors" />
                        </div>
                        {error && <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>}
                        <button onClick={() => verifyCode(modal.note)} disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all">
                          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><Crown className="w-4 h-4" /> Get Free Download</>}
                        </button>
                        <p className="text-center text-xs text-zinc-600">Not a member?{' '}
                          <button onClick={() => openPay(modal.note)} className="text-orange-400 hover:underline">Buy for ₹{modal.note.price}</button>
                        </p>
                      </div>
                    )}

                    {modal.type === 'pay' && (
                      <div className="space-y-3">
                        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 text-sm">
                          {[['Price', `₹${modal.note.price}`, 'text-zinc-200'],
                            ['Type', 'One-time · no subscription', 'text-emerald-400'],
                            ['Delivery', 'Instant download', 'text-emerald-400']].map(([k, v, c]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-zinc-600">{k}</span>
                              <span className={c}>{v}</span>
                            </div>
                          ))}
                          <div className="border-t border-zinc-800 pt-2.5 flex justify-between items-center">
                            <span className="font-bold text-zinc-200">Total</span>
                            <span className="font-extrabold text-orange-400 text-2xl">₹{modal.note.price}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-800/40 rounded-xl px-3 py-2.5">
                          <Lock className="w-3.5 h-3.5 shrink-0" /> UPI · PhonePe · GPay · Cards · Netbanking
                        </div>
                        {error && <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>}
                        <button onClick={() => buy(modal.note)} disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all">
                          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</> : <><CreditCard className="w-4 h-4" /> Pay ₹{modal.note.price}</>}
                        </button>
                        <p className="text-center text-xs text-zinc-600">YouTube member?{' '}
                          <button onClick={() => openCode(modal.note)} className="text-orange-400 hover:underline">Get it free</button>
                        </p>
                      </div>
                    )}

                    {modal.type === 'download' && (
                      <div className="space-y-4 text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                          className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/25 rounded-2xl flex items-center justify-center mx-auto">
                          <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </motion.div>
                        <div>
                          <p className="font-extrabold text-zinc-100 text-lg">You&apos;re all set!</p>
                          <p className="text-xs text-zinc-500 mt-1">{modal.note.title}</p>
                        </div>
                        <a href={modal.url} download target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/15">
                          <Download className="w-5 h-5" /> Download PDF
                        </a>
                        <p className="text-xs text-zinc-700">Link valid for 1 hour — save your file now.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Note Card ── */
function NoteCard({ note, index, onPreview, onCode, onBuy }: {
  note: Note; index: number; onPreview(): void; onCode(): void; onBuy(): void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.article layout
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.04, duration: 0.25 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="bg-zinc-900 border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 h-full"
      style={{
        borderColor: hovered ? 'rgb(249 115 22 / 0.4)' : 'rgb(39 39 42)',
        transform:   hovered ? 'translateY(-3px)' : 'none',
        boxShadow:   hovered ? '0 16px 32px -8px rgb(0 0 0 / 0.6)' : 'none',
      }}
    >
      {/* Gradient header — clicking opens preview */}
      <button
        onClick={onPreview}
        className="w-full text-left"
        aria-label={`Preview ${note.title}`}
      >
        <div className={`h-28 bg-gradient-to-br ${note.gradient} relative overflow-hidden flex items-end px-4 pb-3`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          <span className="text-4xl relative z-10 drop-shadow">{note.emoji}</span>
          <div className="ml-auto relative z-10 flex flex-col items-end gap-1">
            {note.is_new && (
              <span className="text-[9px] font-black text-white bg-white/20 backdrop-blur-sm border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">New</span>
            )}
            <span className="text-[10px] font-bold text-white/70 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">{note.pages}p</span>
          </div>

          {/* Preview indicator */}
          <div className={`absolute top-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <Eye className="w-2.5 h-2.5 text-white/80" />
            <span className="text-[9px] font-bold text-white/80">Preview</span>
          </div>
        </div>
      </button>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <span className="self-start text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 text-zinc-500 mb-2">{note.topic}</span>
        <h3 className="text-sm font-extrabold text-zinc-100 leading-snug mb-1.5 line-clamp-2">{note.title}</h3>
        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2 mb-3">{note.description}</p>

        {/* Preview bullets */}
        {note.preview_points.length > 0 && (
          <ul className="space-y-1 mb-4 flex-1">
            {note.preview_points.slice(0, 3).map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-500">
                <span className="text-emerald-500 shrink-0 mt-0.5 text-[10px]">✓</span>
                <span className="line-clamp-1">{pt}</span>
              </li>
            ))}
            {note.preview_points.length > 3 && (
              <li className="text-[11px] text-orange-400/80 pl-4">
                +{note.preview_points.length - 3} more topics →
              </li>
            )}
          </ul>
        )}

        {/* Price + CTA */}
        <div className="mt-auto border-t border-zinc-800 pt-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] text-zinc-600 flex items-center gap-1"><FileText className="w-3 h-3" /> {note.pages} pages</span>
            <span className="text-sm font-extrabold text-orange-400">₹{note.price}</span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={onPreview}
              className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 text-[11px] font-bold py-2 rounded-lg transition-all">
              <Eye className="w-3 h-3" /> Preview
            </button>
            <button onClick={onCode}
              className="flex items-center justify-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-[11px] font-bold py-2 px-2.5 rounded-lg transition-all" title="Free for YouTube members">
              <Crown className="w-3 h-3" />
            </button>
            <button onClick={onBuy}
              className="flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-bold py-2 px-2.5 rounded-lg transition-all" title={`Buy ₹${note.price}`}>
              <CreditCard className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
