import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'

const WA_URL = `https://wa.me/919997600372?text=${encodeURIComponent('Hi Aman! I had a payment issue and need help completing my purchase.')}`

export default function StripeSuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-20">
      <div className="flex flex-col items-center gap-5 max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-100 mb-2">Need help with your payment?</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            If you were charged, your purchase is safe. WhatsApp Aman with your payment ID or screenshot and he&apos;ll activate your plan within a few hours.
          </p>
        </div>
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 w-full justify-center py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-colors"
        >
          <MessageSquare size={16} /> WhatsApp Aman for Support
        </a>
        <p className="text-xs text-zinc-600">
          Email: <span className="text-orange-400">amanchauhan7172@gmail.com</span>
        </p>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
    </div>
  )
}
