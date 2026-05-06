'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, X, Loader2, CheckCircle2, Lock } from 'lucide-react'
import { saveEmail, markCaptured, isCaptured, type EmailSource } from '@/lib/email-capture'

interface Props {
  open: boolean
  onClose?: () => void       // optional — if omitted modal is not dismissible
  onSuccess: () => void
  source: EmailSource
  title: string
  subtitle: string
  benefit?: string           // e.g. "Unlock full analysis"
  emoji?: string
}

export default function EmailGateModal({
  open,
  onClose,
  onSuccess,
  source,
  title,
  subtitle,
  benefit = 'Unlock Full Access',
  emoji = '🔓',
}: Props) {
  const [email, setEmail] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email.'); return }
    setError('')
    setWorking(true)
    const ok = await saveEmail(email.trim(), source)
    setWorking(false)
    if (!ok) { setError('Could not save email. Please try again.'); return }
    markCaptured()
    onSuccess()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600" />

            <div className="p-7">
              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5 text-2xl">
                {emoji}
              </div>

              <h2 className="text-xl font-bold text-zinc-100 mb-2">{title}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-5">{subtitle}</p>

              {/* Benefit pill */}
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 mb-6">
                <Lock className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-sm font-semibold text-orange-300">{benefit}</span>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={working}
                  className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
                >
                  {working
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Unlocking…</>
                    : <><Mail className="w-4 h-4" /> Continue Free</>
                  }
                </button>
              </form>

              <p className="text-xs text-zinc-600 text-center mt-4">
                No spam. Unsubscribe anytime. Used only by AmanAI Lab.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Inline variant — rendered inside page flow (not a floating modal) */
export function EmailGateInline({
  onSuccess,
  source,
  title,
  subtitle,
  benefit,
  emoji = '🔓',
}: Omit<Props, 'open' | 'onClose'>) {
  const [email, setEmail] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-4">
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        <p className="text-sm font-semibold text-zinc-100">Unlocked! Access granted.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email.'); return }
    setError('')
    setWorking(true)
    const ok = await saveEmail(email.trim(), source)
    setWorking(false)
    if (!ok) { setError('Could not save email. Please try again.'); return }
    markCaptured()
    setDone(true)
    onSuccess()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-orange-500/30 rounded-2xl p-6 shadow-lg shadow-orange-500/5"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-lg">
          {emoji}
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-100">{title}</h3>
          <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {benefit && (
        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 mb-4">
          <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="text-xs font-semibold text-orange-300">{benefit}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={working}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all whitespace-nowrap"
        >
          {working ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Unlocking…</> : <><Mail className="w-3.5 h-3.5" /> Unlock Free</>}
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      <p className="text-xs text-zinc-600 mt-3">No spam. Unsubscribe anytime.</p>
    </motion.div>
  )
}

export { isCaptured }
