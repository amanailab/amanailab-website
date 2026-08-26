'use client'

import { useState, useEffect } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { Loader2, RefreshCw, Crown, Zap, CheckCircle2, XCircle, Calendar } from 'lucide-react'

interface Sub {
  user_id: string
  plan: 'sd_pro' | 'full_bundle'
  subscribed_until: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  created_at: string
  email?: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function isActive(until: string) {
  return new Date(until) > new Date()
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs]     = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]  = useState<'all' | 'active' | 'expired'>('all')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/subscriptions')
    if (res.ok) {
      const data = await res.json()
      setSubs(data.subscriptions ?? [])
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const now = new Date()
  const active  = subs.filter(s => new Date(s.subscribed_until) > now)
  const expired = subs.filter(s => new Date(s.subscribed_until) <= now)
  const sdPro   = subs.filter(s => s.plan === 'sd_pro')
  const prepKit = subs.filter(s => s.plan === 'full_bundle')

  const displayed = filter === 'active' ? active : filter === 'expired' ? expired : subs

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8 flex flex-col gap-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Subscriptions</h1>
              <p className="text-zinc-600 text-sm mt-1">{subs.length} total subscribers</p>
            </div>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 text-sm font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active Now',    value: active.length,  icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'   },
              { label: 'Expired',       value: expired.length, icon: XCircle,      color: 'text-zinc-500',   bg: 'bg-zinc-800 border-zinc-700'           },
              { label: 'SD Pro',        value: sdPro.length,   icon: Zap,          color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'     },
              { label: 'Prep Kit',      value: prepKit.length, icon: Crown,        color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-4 ${s.bg} border rounded-2xl p-5`}>
                <div className={`w-10 h-10 rounded-xl ${s.bg} border flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold">{s.label}</p>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'expired'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                  filter === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-100'
                }`}>
                {f === 'all' ? `All (${subs.length})` : f === 'active' ? `Active (${active.length})` : `Expired (${expired.length})`}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-300">Subscriber List</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-20">
                <Crown className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-bold">No subscriptions yet</p>
                <p className="text-zinc-600 text-sm">Paid subscribers will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['User', 'Plan', 'Status', 'Expires', 'Subscribed On', 'Payment ID'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {displayed.map(sub => {
                      const active = isActive(sub.subscribed_until)
                      return (
                        <tr key={sub.user_id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="text-xs font-mono text-zinc-400 truncate">
                              {sub.email ?? sub.user_id.slice(0, 8) + '…'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${
                              sub.plan === 'full_bundle'
                                ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                                : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                            }`}>
                              {sub.plan === 'full_bundle' ? <Crown className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                              {sub.plan === 'full_bundle' ? 'Prep Kit' : 'SD Pro'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${
                              active
                                ? 'text-green-400 bg-green-500/10 border-green-500/20'
                                : 'text-zinc-500 bg-zinc-800 border-zinc-700'
                            }`}>
                              {active ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                              {active ? 'Active' : 'Expired'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 shrink-0" />
                              {fmtDate(sub.subscribed_until)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                            {fmtDate(sub.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            {sub.razorpay_payment_id
                              ? <span className="text-[10px] font-mono text-zinc-600 select-all">{sub.razorpay_payment_id}</span>
                              : <span className="text-xs text-zinc-700">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
