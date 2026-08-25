'use client'

import { useState, useEffect } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { Loader2, RefreshCw, Package, FileText, IndianRupee, Mail, Phone } from 'lucide-react'

interface Order {
  id: string
  type: 'note' | 'package'
  item_id: string
  item_title: string
  amount: number
  razorpay_payment_id: string
  razorpay_order_id: string
  customer_email: string | null
  customer_name: string | null
  customer_contact: string | null
  status: string
  created_at: string
}

function fmt(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/orders?limit=200')
    if (res.ok) {
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const totalRevenue = orders.reduce((s, o) => s + o.amount, 0)
  const noteCount    = orders.filter(o => o.type === 'note').length
  const pkgCount     = orders.filter(o => o.type === 'package').length

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8 flex flex-col gap-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Orders</h1>
              <p className="text-zinc-600 text-sm mt-1">{total} total purchases</p>
            </div>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 text-sm font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Revenue', value: fmt(totalRevenue), icon: IndianRupee, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
              { label: 'Note Sales',    value: noteCount,         icon: FileText,    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
              { label: 'Bundle Sales',  value: pkgCount,          icon: Package,     color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
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

          {/* Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-300">All Orders</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <IndianRupee className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-bold">No orders yet</p>
                <p className="text-zinc-600 text-sm">Purchases will appear here after payment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['Date', 'Type', 'Item', 'Amount', 'Customer', 'Contact', 'Payment ID'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{fmtDate(order.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${
                            order.type === 'package'
                              ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                              : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                          }`}>
                            {order.type === 'package' ? <Package className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                            {order.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="text-xs font-semibold text-zinc-200 truncate">{order.item_title}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-extrabold text-orange-400 whitespace-nowrap">
                          {fmt(order.amount)}
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          {order.customer_email ? (
                            <div>
                              {order.customer_name && (
                                <p className="text-xs font-semibold text-zinc-200 truncate">{order.customer_name}</p>
                              )}
                              <a href={`mailto:${order.customer_email}`}
                                className="text-[11px] text-zinc-500 hover:text-orange-400 transition-colors flex items-center gap-1 truncate">
                                <Mail className="w-2.5 h-2.5 shrink-0" /> {order.customer_email}
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {order.customer_contact ? (
                            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                              <Phone className="w-2.5 h-2.5 shrink-0" /> {order.customer_contact}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-mono text-zinc-600 select-all">
                            {order.razorpay_payment_id}
                          </span>
                        </td>
                      </tr>
                    ))}
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
