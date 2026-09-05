'use client'

import { useState, useEffect, useRef } from 'react'
import { detectCountry } from '@/lib/geo'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Crown, CreditCard, X, CheckCircle,
  FileText, Loader2, Lock, Sparkles, Eye,
  BookOpen, Package as PackageIcon, LayoutGrid, LayoutList, MessageSquare, Flame,
} from 'lucide-react'
import type { Note, NotePackage } from '@/lib/notes-data'
import PdfPreview from '@/components/notes/PdfPreview'

function inrToUsd(inr: number): number {
  return Math.max(5, Math.round((inr / 85) * 2.5))
}

function fmt(inr: number, isIndia: boolean): string {
  return isIndia ? `₹${inr}` : `$${inrToUsd(inr)}`
}

interface RazorpayFailure {
  error?: { description?: string; reason?: string; code?: string }
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void
      on(event: string, handler: (response: RazorpayFailure) => void): void
    }
  }
}

type DownloadItem = { title: string; url: string }

type ModalState =
  | { type: 'none' }
  | { type: 'preview';      note: Note }
  | { type: 'code';         note: Note }
  | { type: 'pay';          note: Note }
  | { type: 'download';     note: Note; url: string }
  | { type: 'pay-pkg';      pkg: NotePackage }
  | { type: 'code-pkg';     pkg: NotePackage }
  | { type: 'download-pkg'; pkg: NotePackage; items: DownloadItem[] }

export default function NotesClient({
  notes, allNotes, packages, popularNoteIds,
}: {
  notes: Note[]
  allNotes: Note[]
  packages: NotePackage[]
  popularNoteIds: string[]
}) {
  const [filter, setFilter]       = useState('All')
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy]       = useState<'default' | 'price-asc' | 'price-desc' | 'newest'>('default')
  const [modal, setModal]         = useState<ModalState>({ type: 'none' })
  const [codeInput, setCodeInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')
  const [rzpReady, setRzpReady]   = useState(false)
  const [isIndia, setIsIndia]     = useState(true)
  const isBuying         = useRef(false)
  const paymentSucceeded = useRef(false)


  const topicCounts = notes.reduce<Record<string, number>>((acc, n) => {
    acc[n.topic] = (acc[n.topic] ?? 0) + 1
    return acc
  }, {})
  const topics   = ['All', ...Object.keys(topicCounts)]
  const filtered = filter === 'All' ? notes : notes.filter((n) => n.topic === filter)
  const sorted   = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc')  return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    if (sortBy === 'newest')     return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0)
    return 0
  })
  const minPrice = notes.length ? Math.min(...notes.map(n => n.price)) : 99

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay"]')) { setRzpReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true; s.onload = () => setRzpReady(true)
    document.body.appendChild(s)
  }, [])

  useEffect(() => {
    detectCountry().then(c => setIsIndia(c === 'IN'))
  }, [])

  function close() {
    if (isBuying.current) return
    setModal({ type: 'none' }); setCodeInput(''); setError(''); setIsLoading(false)
  }

  function openPreview(note: Note)           { setModal({ type: 'preview',  note }); setError('') }
  function openCode(note: Note)              { setModal({ type: 'code',     note }); setCodeInput(''); setError('') }
  function openPay(note: Note)               { setModal({ type: 'pay',      note }); setError('') }
  function openPackagePay(pkg: NotePackage)  { setModal({ type: 'pay-pkg',  pkg  }); setError('') }
  function openPackageCode(pkg: NotePackage) { setModal({ type: 'code-pkg', pkg  }); setCodeInput(''); setError('') }

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

  async function verifyPackageCode(pkg: NotePackage) {
    if (!codeInput.trim()) { setError('Please enter your member code.'); return }
    setIsLoading(true); setError('')
    try {
      const res  = await fetch('/api/packages/verify-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput.trim(), packageId: pkg.id }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Invalid code.')
      else         setModal({ type: 'download-pkg', pkg, items: data.items })
    } catch { setError('Something went wrong. Please try again.') }
    finally   { setIsLoading(false) }
  }

  async function buy(note: Note) {
    if (!rzpReady) { setError('Payment is loading, try again.'); return }
    setIsLoading(true); setError('')
    paymentSucceeded.current = false
    try {
      const orderRes = await fetch('/api/notes/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error ?? 'Could not create order')

      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!rzpKey) throw new Error('Payment not configured. Please contact us.')

      const rzp = new window.Razorpay({
        key: rzpKey, amount: order.amount, currency: order.currency,
        name: 'AmanAI Lab', description: note.title,
        order_id: order.id, image: '/logo.jpg',
        theme: { color: '#f97316' },
        handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const vRes  = await fetch('/api/notes/verify-payment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ noteId: note.id, paymentId: r.razorpay_payment_id, orderId: r.razorpay_order_id, signature: r.razorpay_signature }),
            })
            const vData = await vRes.json()
            if (!vRes.ok) setError('Payment received but download failed. Contact support with ID: ' + r.razorpay_payment_id)
            else { paymentSucceeded.current = true; setModal({ type: 'download', note, url: vData.url }) }
          } catch {
            setError('Network error. Your payment was received — contact support with ID: ' + r.razorpay_payment_id)
          } finally { isBuying.current = false; setIsLoading(false) }
        },
        modal: {
          ondismiss: () => {
            isBuying.current = false
            if (!paymentSucceeded.current) setIsLoading(false)
          },
        },
      })
      rzp.on('payment.failed', (resp: RazorpayFailure) => {
        isBuying.current = false; setIsLoading(false)
        setError(resp?.error?.description || 'Payment failed. Please try again.')
      })
      isBuying.current = true; rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      isBuying.current = false; setIsLoading(false)
    }
  }

  async function buyPackage(pkg: NotePackage) {
    if (!rzpReady) { setError('Payment is loading, try again.'); return }
    setIsLoading(true); setError('')
    paymentSucceeded.current = false
    try {
      const orderRes = await fetch('/api/packages/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error ?? 'Could not create order')

      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!rzpKey) throw new Error('Payment not configured. Please contact us.')

      const rzp = new window.Razorpay({
        key: rzpKey, amount: order.amount, currency: order.currency,
        name: 'AmanAI Lab', description: pkg.title,
        order_id: order.id, image: '/logo.jpg',
        theme: { color: '#f97316' },
        handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const vRes  = await fetch('/api/packages/verify-payment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ packageId: pkg.id, paymentId: r.razorpay_payment_id, orderId: r.razorpay_order_id, signature: r.razorpay_signature }),
            })
            const vData = await vRes.json()
            if (!vRes.ok) setError('Payment received but download failed. Contact support with ID: ' + r.razorpay_payment_id)
            else { paymentSucceeded.current = true; setModal({ type: 'download-pkg', pkg, items: vData.items }) }
          } catch {
            setError('Network error. Your payment was received — contact support with ID: ' + r.razorpay_payment_id)
          } finally { isBuying.current = false; setIsLoading(false) }
        },
        modal: {
          ondismiss: () => {
            isBuying.current = false
            if (!paymentSucceeded.current) setIsLoading(false)
          },
        },
      })
      rzp.on('payment.failed', (resp: RazorpayFailure) => {
        isBuying.current = false; setIsLoading(false)
        setError(resp?.error?.description || 'Payment failed. Please try again.')
      })
      isBuying.current = true; rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      isBuying.current = false; setIsLoading(false)
    }
  }

  if (notes.length === 0 && packages.length === 0) {
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

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative pt-10 pb-6 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-orange-500/6 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
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
                <span className="text-zinc-400">{notes.length} notes · {topics.length - 1} topic{topics.length - 1 !== 1 ? 's' : ''}</span>
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0 sm:w-68">
              <div className="flex items-center gap-3 bg-orange-500/8 border border-orange-500/25 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-orange-500/15 rounded-lg flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-200">YouTube Member</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Enter monthly code → all notes free</p>
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
                <span className="text-[10px] font-black text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700 shrink-0">from {fmt(minPrice, isIndia)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ BUNDLES ════════════════ */}
      {packages.length > 0 && (
        <section className="px-4 pb-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-zinc-800" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <PackageIcon className="w-3 h-3 text-orange-400" />
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">PDF Bundles — Best Value</span>
              </div>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  allNotes={allNotes}
                  isIndia={isIndia}
                  onBuy={() => openPackagePay(pkg)}
                  onCode={() => openPackageCode(pkg)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ FILTER TABS ════════════════ */}
      <div className="sticky top-0 z-20 bg-[#09090b]/90 backdrop-blur-lg border-b border-zinc-900">
        <div className="max-w-5xl mx-auto">
          {/* Topic filter row */}
          <div className="relative px-4 pt-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 pr-4">
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
                  className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[#09090b]/90 to-transparent" />
          </div>
          {/* Sort + view controls row */}
          <div className="flex items-center justify-between px-4 py-1.5 border-t border-zinc-900/60">
            <p className="text-[10px] text-zinc-700 tabular-nums">{sorted.length} note{sorted.length !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'default' | 'price-asc' | 'price-desc' | 'newest')}
                className="bg-zinc-900 border border-zinc-800 text-zinc-500 text-[11px] rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-zinc-700 transition-colors">
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="newest">Newest first</option>
              </select>
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button onClick={() => setViewMode('grid')} title="Grid view"
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'}`}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode('list')} title="List view"
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'}`}>
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ TRENDING / POPULAR ════════════════ */}
      {popularNoteIds.length > 0 && (() => {
        const trendingNotes = popularNoteIds
          .map(id => notes.find(n => n.id === id))
          .filter((n): n is Note => !!n)
          .slice(0, 5)
        if (trendingNotes.length === 0) return null
        return (
          <section className="px-4 pb-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Students also bought</h2>
                <div className="h-px flex-1 bg-zinc-800/60" />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {trendingNotes.map(note => (
                  <button key={note.id} onClick={() => openPreview(note)}
                    className="flex-shrink-0 w-44 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-xl overflow-hidden transition-all group text-left">
                    <div className={`h-16 bg-gradient-to-br ${note.gradient} flex items-center justify-center text-3xl relative`}>
                      <div className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                      <span className="relative z-10">{note.emoji}</span>
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-extrabold text-zinc-100 leading-snug line-clamp-2 mb-1 group-hover:text-white transition-colors">{note.title}</p>
                      <p className="text-[10px] text-zinc-600 mb-2">{note.pages}p · {note.topic}</p>
                      <span className="text-xs font-black text-orange-400">{fmt(note.price, isIndia)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* ════════════════ NOTES GRID / LIST ════════════════ */}
      <section className="px-4 py-6 pb-24">
        <div className="max-w-5xl mx-auto">
          {sorted.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              <p className="text-zinc-400 font-bold">No {filter} notes yet</p>
              <p className="text-zinc-600 text-sm mt-1">More coming soon!</p>
            </div>
          ) : viewMode === 'list' ? (
            /* ── List view ── */
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {sorted.map((note, i) => (
                  <NoteRow key={note.id} note={note} index={i}
                    onPreview={() => openPreview(note)}
                    onCode   ={() => openCode(note)}
                    onBuy    ={() => openPay(note)}
                    isIndia  ={isIndia} />
                ))}
              </AnimatePresence>
            </div>
          ) : filter !== 'All' ? (
            /* ── Single topic grid ── */
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  {filter} · {sorted.length} note{sorted.length !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-zinc-700 flex items-center gap-1"><Eye className="w-3 h-3" /> Click any card to preview</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {sorted.map((note, i) => (
                    <NoteCard key={note.id} note={note} index={i}
                      onPreview={() => openPreview(note)}
                      onCode   ={() => openCode(note)}
                      onBuy    ={() => openPay(note)}
                      isIndia  ={isIndia} />
                  ))}
                </AnimatePresence>
              </div>
            </>
          ) : (
            /* ── All topics grouped ── */
            <div className="space-y-10">
              {Object.keys(topicCounts).map(topic => {
                const topicNotes = sorted.filter(n => n.topic === topic)
                if (topicNotes.length === 0) return null
                return (
                  <div key={topic}>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">{topic}</h2>
                      <div className="h-px flex-1 bg-zinc-800/60" />
                      <span className="text-[10px] text-zinc-700 tabular-nums whitespace-nowrap">{topicNotes.length} note{topicNotes.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {topicNotes.map((note, i) => (
                        <NoteCard key={note.id} note={note} index={i}
                          onPreview={() => openPreview(note)}
                          onCode   ={() => openCode(note)}
                          onBuy    ={() => openPay(note)}
                          isIndia  ={isIndia} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════ MODALS ════════════════ */}
      <AnimatePresence>
        {modal.type !== 'none' && (
          <>
            <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (modal.type !== 'download' && modal.type !== 'download-pkg') close() }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />

            {/* ── Note preview modal ── */}
            {modal.type === 'preview' && (
              <motion.div key="preview"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.18 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
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

                  <div className="overflow-y-auto flex-1 p-5 space-y-5">
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

                    {modal.note.description && (
                      <p className="text-sm text-zinc-400 leading-relaxed">{modal.note.description}</p>
                    )}

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

                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Sample Page</p>
                      <PdfPreview noteId={modal.note.id} fade={true} pages={2} totalPages={modal.note.pages} />
                    </div>

                    <div className="border-t border-zinc-800 pt-4 space-y-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-zinc-500">Price</span>
                        <span className="text-2xl font-extrabold text-orange-400">{fmt(modal.note.price, isIndia)}</span>
                      </div>
                      <button onClick={() => openCode(modal.note)}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-400 text-sm font-bold py-3 rounded-xl transition-all">
                        <Crown className="w-4 h-4" /> YouTube Member? Get it Free
                      </button>
                      <button onClick={() => openPay(modal.note)}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20">
                        <CreditCard className="w-4 h-4" /> Buy for {fmt(modal.note.price, isIndia)} — Instant Download
                      </button>
                    </div>

                    {/* Students also bought */}
                    {(() => {
                      const related = notes
                        .filter(n => n.id !== modal.note.id && n.topic === modal.note.topic)
                        .sort((a, b) => {
                          const ai = popularNoteIds.indexOf(a.id)
                          const bi = popularNoteIds.indexOf(b.id)
                          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
                        })
                        .slice(0, 3)
                      if (related.length === 0) return null
                      return (
                        <div className="border-t border-zinc-800 pt-4">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Flame className="w-3 h-3 text-orange-400" /> Students also bought
                          </p>
                          <div className="space-y-2">
                            {related.map(n => (
                              <button key={n.id} onClick={() => openPreview(n)}
                                className="w-full flex items-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-orange-500/30 rounded-xl px-3 py-2.5 transition-all text-left group">
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${n.gradient} flex items-center justify-center text-lg shrink-0`}>
                                  {n.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{n.title}</p>
                                  <p className="text-[10px] text-zinc-600">{n.pages} pages · {n.topic}</p>
                                </div>
                                <span className="text-xs font-extrabold text-orange-400 shrink-0">{fmt(n.price, isIndia)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Note: code / pay / download modals ── */}
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
                        <span className="font-extrabold text-orange-400 shrink-0">{fmt(modal.note.price, isIndia)}</span>
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
                          <button onClick={() => openPay(modal.note)} className="text-orange-400 hover:underline">Buy for {fmt(modal.note.price, isIndia)}</button>
                        </p>
                      </div>
                    )}

                    {modal.type === 'pay' && (
                      <div className="space-y-3">
                        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 text-sm">
                          {[['Price', fmt(modal.note.price, isIndia), 'text-zinc-200'],
                            ['Type', 'One-time · no subscription', 'text-emerald-400'],
                            ['Delivery', 'Instant download', 'text-emerald-400']].map(([k, v, c]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-zinc-600">{k}</span>
                              <span className={c}>{v}</span>
                            </div>
                          ))}
                          <div className="border-t border-zinc-800 pt-2.5 flex justify-between items-center">
                            <span className="font-bold text-zinc-200">Total</span>
                            <span className="font-extrabold text-orange-400 text-2xl">{fmt(modal.note.price, isIndia)}</span>
                          </div>
                        </div>
<div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-800/40 rounded-xl px-3 py-2.5">
                          <Lock className="w-3.5 h-3.5 shrink-0" /> UPI · PhonePe · GPay · Cards · Netbanking
                        </div>
                        {error && (
                          <div className="space-y-2">
                            <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>
                            <a
                              href={`https://wa.me/919997600372?text=${encodeURIComponent(`Hi Aman! I'm trying to buy "${modal.note.title}" but payment failed. Can you help?`)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Pay via WhatsApp instead
                            </a>
                          </div>
                        )}
                        <button onClick={() => buy(modal.note)} disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all">
                          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</> : <><CreditCard className="w-4 h-4" /> Pay {fmt(modal.note.price, isIndia)}</>}
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

            {/* ── Package: pay modal ── */}
            {modal.type === 'pay-pkg' && (
              <motion.div key="pay-pkg"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.18 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${modal.pkg.gradient}`} />
                  <div className="flex items-center justify-between px-5 pt-5 pb-4">
                    <h2 className="font-extrabold text-zinc-100">💳 Buy Bundle</h2>
                    <button onClick={close}
                      className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 rounded-lg flex items-center justify-center transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-5 pb-5 space-y-4">
                    <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${modal.pkg.gradient} flex items-center justify-center text-xl shrink-0`}>
                        {modal.pkg.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-100 truncate">{modal.pkg.title}</p>
                        <p className="text-xs text-zinc-500">{modal.pkg.note_ids.length} PDFs included</p>
                      </div>
                      <span className="font-extrabold text-orange-400 shrink-0">{fmt(modal.pkg.price, isIndia)}</span>
                    </div>
                    <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 text-sm">
                      {[['Includes', `${modal.pkg.note_ids.length} PDF files`, 'text-zinc-200'],
                        ['Type', 'One-time · no subscription', 'text-emerald-400'],
                        ['Delivery', 'Instant download — all files', 'text-emerald-400']].map(([k, v, c]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-zinc-600">{k}</span>
                          <span className={c}>{v}</span>
                        </div>
                      ))}
                      <div className="border-t border-zinc-800 pt-2.5 flex justify-between items-center">
                        <span className="font-bold text-zinc-200">Total</span>
                        <span className="font-extrabold text-orange-400 text-2xl">{fmt(modal.pkg.price, isIndia)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-800/40 rounded-xl px-3 py-2.5">
                      <Lock className="w-3.5 h-3.5 shrink-0" /> UPI · PhonePe · GPay · Cards · Netbanking
                    </div>
                    {error && (
                      <div className="space-y-2">
                        <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>
                        <a
                          href={`https://wa.me/919997600372?text=${encodeURIComponent(`Hi Aman! I'm trying to buy the "${modal.pkg.title}" bundle but payment failed. Can you help?`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Pay via WhatsApp instead
                        </a>
                      </div>
                    )}
                    <button onClick={() => buyPackage(modal.pkg)} disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all">
                      {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</> : <><CreditCard className="w-4 h-4" /> Pay {fmt(modal.pkg.price, isIndia)}</>}
                    </button>
                    <p className="text-center text-xs text-zinc-600">YouTube member?{' '}
                      <button onClick={() => openPackageCode(modal.pkg)} className="text-orange-400 hover:underline">Get it free</button>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Package: member code modal ── */}
            {modal.type === 'code-pkg' && (
              <motion.div key="code-pkg"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.18 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${modal.pkg.gradient}`} />
                  <div className="flex items-center justify-between px-5 pt-5 pb-4">
                    <h2 className="font-extrabold text-zinc-100">👑 Member Free Bundle</h2>
                    <button onClick={close}
                      className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 rounded-lg flex items-center justify-center transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-5 pb-5 space-y-3">
                    <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${modal.pkg.gradient} flex items-center justify-center text-xl shrink-0`}>
                        {modal.pkg.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-100 truncate">{modal.pkg.title}</p>
                        <p className="text-xs text-zinc-500">{modal.pkg.note_ids.length} PDFs · {fmt(modal.pkg.price, isIndia)} value</p>
                      </div>
                    </div>
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
                        onKeyDown={(e) => e.key === 'Enter' && verifyPackageCode(modal.pkg)}
                        placeholder="e.g. AMAN-AUG2026" autoFocus
                        className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest outline-none transition-colors" />
                    </div>
                    {error && <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>}
                    <button onClick={() => verifyPackageCode(modal.pkg)} disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all">
                      {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><Crown className="w-4 h-4" /> Get All PDFs Free</>}
                    </button>
                    <p className="text-center text-xs text-zinc-600">Not a member?{' '}
                      <button onClick={() => openPackagePay(modal.pkg)} className="text-orange-400 hover:underline">Buy for {fmt(modal.pkg.price, isIndia)}</button>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Package: download modal ── */}
            {modal.type === 'download-pkg' && (
              <motion.div key="dl-pkg"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.18 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${modal.pkg.gradient}`} />
                  <div className="flex items-center justify-between px-5 pt-5 pb-4">
                    <h2 className="font-extrabold text-zinc-100">🎉 Bundle Ready!</h2>
                    <button onClick={close}
                      className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 rounded-lg flex items-center justify-center transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-5 pb-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                        className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/25 rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </motion.div>
                      <span className="font-bold">{modal.items.length} PDFs ready — download each below</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {modal.items.map((item, i) => (
                        <a key={i} href={item.url} download target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 w-full bg-emerald-500/8 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-semibold py-2.5 px-4 rounded-xl transition-all group">
                          <Download className="w-4 h-4 shrink-0 group-hover:translate-y-0.5 transition-transform" />
                          <span className="text-sm truncate">{item.title}</span>
                        </a>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-700 text-center pt-1">Links valid for 1 hour — save all files now.</p>
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

/* ── Package Card ── */
function PackageCard({ pkg, allNotes, onBuy, onCode, isIndia }: {
  pkg: NotePackage; allNotes: Note[]; onBuy(): void; onCode(): void; isIndia: boolean
}) {
  const pkgNotes        = allNotes.filter(n => pkg.note_ids.includes(n.id))
  const individualTotal = pkgNotes.reduce((s, n) => s + n.price, 0)
  const savings         = individualTotal - pkg.price
  const showCount       = Math.min(pkgNotes.length, 4)

  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 rounded-2xl overflow-hidden transition-all group">
      <div className={`h-1.5 bg-gradient-to-r ${pkg.gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center text-2xl shrink-0`}>
              {pkg.emoji}
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-100 text-sm leading-snug">{pkg.title}</h3>
              {pkg.description && <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{pkg.description}</p>}
            </div>
          </div>
          <div className="text-right shrink-0">
            {savings > 0 && (
              <div className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mb-1 whitespace-nowrap">
                SAVE {fmt(savings, isIndia)}
              </div>
            )}
            <div className="text-xl font-extrabold text-orange-400">{fmt(pkg.price, isIndia)}</div>
            {savings > 0 && (
              <div className="text-[10px] text-zinc-600 line-through">{fmt(individualTotal, isIndia)}</div>
            )}
          </div>
        </div>

        {pkgNotes.length > 0 && (
          <div className="grid grid-cols-1 gap-1 mb-4">
            {pkgNotes.slice(0, showCount).map(n => (
              <div key={n.id} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="text-orange-400 shrink-0 font-bold">✓</span>
                <span className="truncate">{n.title}</span>
                <span className="text-zinc-700 shrink-0 ml-auto">{n.pages}p</span>
              </div>
            ))}
            {pkgNotes.length > showCount && (
              <div className="text-[11px] text-zinc-600 pl-3.5">
                +{pkgNotes.length - showCount} more PDFs included
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-zinc-800">
          <button onClick={onCode}
            className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 text-orange-400 text-xs font-bold py-2.5 rounded-xl transition-all">
            <Crown className="w-3.5 h-3.5" /> Member? Free
          </button>
          <button onClick={onBuy}
            className="flex-[2] flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/20">
            <CreditCard className="w-3.5 h-3.5" /> Buy Bundle — {fmt(pkg.price, isIndia)}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Note Card ── */
function NoteCard({ note, index, onPreview, onCode, onBuy, isIndia }: {
  note: Note; index: number; onPreview(): void; onCode(): void; onBuy(): void; isIndia: boolean
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
      <button onClick={onPreview} className="w-full text-left" aria-label={`Preview ${note.title}`}>
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
          <div className={`absolute top-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <Eye className="w-2.5 h-2.5 text-white/80" />
            <span className="text-[9px] font-bold text-white/80">Preview</span>
          </div>
        </div>
      </button>

      <div className="p-4 flex flex-col flex-1">
        <span className="self-start text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 text-zinc-500 mb-2">{note.topic}</span>
        <h3 className="text-sm font-extrabold text-zinc-100 leading-snug mb-1.5 line-clamp-2">{note.title}</h3>
        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2 mb-3">{note.description}</p>

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

        <div className="mt-auto border-t border-zinc-800 pt-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] text-zinc-600 flex items-center gap-1"><FileText className="w-3 h-3" /> {note.pages} pages</span>
            <span className="text-sm font-extrabold text-orange-400">{fmt(note.price, isIndia)}</span>
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
              className="flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-bold py-2 px-2.5 rounded-lg transition-all" title={`Buy ${fmt(note.price, isIndia)}`}>
              <CreditCard className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

/* ── Note Row (list view) ── */
function NoteRow({ note, index, onPreview, onCode, onBuy, isIndia }: {
  note: Note; index: number; onPreview(): void; onCode(): void; onBuy(): void; isIndia: boolean
}) {
  return (
    <motion.div layout
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }} transition={{ delay: index * 0.02, duration: 0.2 }}
      className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500/25 rounded-xl px-4 py-3 group transition-all"
    >
      <button onClick={onPreview} className="shrink-0" aria-label={`Preview ${note.title}`}>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${note.gradient} flex items-center justify-center text-xl hover:scale-105 transition-transform`}>
          {note.emoji}
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-zinc-100 truncate">{note.title}</p>
          {note.is_new && <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase shrink-0">New</span>}
        </div>
        <p className="text-[11px] text-zinc-600 mt-0.5">{note.topic} · {note.pages} pages</p>
      </div>
      {note.description && (
        <p className="hidden md:block text-xs text-zinc-600 max-w-xs truncate flex-1">{note.description}</p>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-sm font-extrabold text-orange-400 tabular-nums w-14 text-right">{fmt(note.price, isIndia)}</span>
        <button onClick={onPreview} title="Preview"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-500 hover:text-zinc-200 transition-all">
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button onClick={onCode} title="Free for YouTube members"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 transition-all">
          <Crown className="w-3.5 h-3.5" />
        </button>
        <button onClick={onBuy}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-[11px] font-bold transition-all shadow-md shadow-orange-500/15">
          <CreditCard className="w-3 h-3" /> Buy
        </button>
      </div>
    </motion.div>
  )
}
