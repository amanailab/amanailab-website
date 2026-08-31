'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, Package as PackageIcon, ArrowRight, Loader2, ShoppingBag, Sparkles } from 'lucide-react'

interface PurchaseItem { title: string; url: string }
interface Purchase {
  kind: 'note' | 'package'
  title: string
  emoji: string
  purchasedAt: string
  items: PurchaseItem[]
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

// Upsell shown below the library (and on its own when nothing is owned yet).
function UnlockMore({ compact }: { compact?: boolean }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-orange-400" />
        <p className="text-sm font-bold text-zinc-100">{compact ? 'Notes & Bundles' : 'Unlock more'}</p>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        {compact
          ? 'Handcrafted AI/ML notes and bundles — buy once, download forever.'
          : 'Add more study guides to your library.'}
      </p>
      <div className="flex gap-2">
        <Link href="/notes"
          className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2.5 rounded-xl transition-all">
          <ShoppingBag className="w-3.5 h-3.5" /> Browse Notes
        </Link>
        <Link href="/upgrade"
          className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-bold py-2.5 rounded-xl transition-all">
          Go Pro <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default function MyPurchases() {
  const [purchases, setPurchases] = useState<Purchase[] | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/notes/my-purchases')
      .then(r => (r.ok ? r.json() : { purchases: [] }))
      .then(d => { if (alive) setPurchases(d.purchases ?? []) })
      .catch(() => { if (alive) setPurchases([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-2 text-zinc-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading your library…</span>
      </div>
    )
  }

  // Nothing owned → just show the upsell
  if (!purchases || purchases.length === 0) {
    return <UnlockMore compact />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-bold text-zinc-100">My Purchases</p>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
            {purchases.length} item{purchases.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {purchases.map((p, i) => (
            <div key={i} className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-3.5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-lg leading-none shrink-0">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{p.title}</p>
                  <p className="text-[10px] text-zinc-600">
                    {p.kind === 'package' ? `${p.items.length} PDFs · ` : ''}Bought {fmtDate(p.purchasedAt)}
                  </p>
                </div>
                {p.kind === 'package' && <PackageIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
              </div>

              {p.kind === 'note' ? (
                <a href={p.items[0].url} download target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-xs font-bold py-2 rounded-lg transition-all">
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </a>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {p.items.map((it, j) => (
                    <a key={j} href={it.url} download target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full bg-zinc-800/60 hover:bg-emerald-500/10 border border-zinc-700/50 hover:border-emerald-500/25 text-zinc-300 hover:text-emerald-300 text-[11px] font-semibold py-1.5 px-2.5 rounded-lg transition-all group">
                      <Download className="w-3 h-3 shrink-0 text-emerald-400" />
                      <span className="truncate flex-1">{it.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-[10px] text-zinc-600 mt-3 text-center">Download links refresh each visit — grab them anytime.</p>
      </div>

      <UnlockMore />
    </div>
  )
}
