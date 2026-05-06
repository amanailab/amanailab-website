'use client'

import { useState } from 'react'
import { Mail, Users, MessageSquare, Download, X, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import type {
  NewsletterRow,
  WaitlistRow,
  ContactRow,
} from '@/app/admin/emails/page'

type Tab = 'newsletter' | 'waitlist' | 'contacts' | 'send'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [
    headers.join(','),
    ...rows.map((r) => r.map(csvEscape).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function EmailsManager({
  newsletter,
  waitlist,
  contacts,
}: {
  newsletter: NewsletterRow[]
  waitlist: WaitlistRow[]
  contacts: ContactRow[]
}) {
  const [tab, setTab] = useState<Tab>('newsletter')
  const [openContact, setOpenContact] = useState<ContactRow | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard Icon={Mail} label="Total Subscribers" value={newsletter.length} />
        <StatCard Icon={CheckCircle2} label="Verified" value={newsletter.filter(r => r.verified).length} accent="green" />
        <StatCard Icon={Users} label="Course Waitlist" value={waitlist.length} />
        <StatCard Icon={MessageSquare} label="Contact Messages" value={contacts.length} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        {(['newsletter', 'waitlist', 'contacts', 'send'] as Tab[]).map((t) => {
          const active = tab === t
          const labels: Record<Tab, string> = { newsletter: 'Subscribers', waitlist: 'Waitlist', contacts: 'Contacts', send: '📨 Send Newsletter' }
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? 'text-orange-400 border-b-2 border-orange-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {labels[t]}
            </button>
          )
        })}
      </div>

      {tab === 'newsletter' && (
        <SimpleTable
          rows={newsletter}
          empty="No newsletter subscribers yet."
          exportFilename="newsletter_subscribers.csv"
          showVerified
        />
      )}

      {tab === 'waitlist' && (
        <SimpleTable
          rows={waitlist}
          empty="No course waitlist signups yet."
          exportFilename="course_waitlist.csv"
        />
      )}

      {tab === 'contacts' && (
        <ContactsTable
          rows={contacts}
          onOpen={(row) => setOpenContact(row)}
          empty="No contact messages stored yet. (They are still emailed via Resend.)"
        />
      )}

      {tab === 'send' && (
        <NewsletterComposer recipientCount={newsletter.length} />
      )}

      {/* Contact message modal */}
      {openContact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpenContact(null)}
        >
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setOpenContact(null)}
              className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">From</p>
                <p className="text-zinc-100 font-semibold">
                  {openContact.name}{' '}
                  <span className="text-zinc-500 font-normal text-sm">
                    &lt;{openContact.email}&gt;
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Subject</p>
                <p className="text-zinc-100">{openContact.subject ?? '(none)'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Message</p>
                <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {openContact.message}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">
                  Received {new Date(openContact.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  Icon,
  label,
  value,
  accent = 'orange',
}: {
  Icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  accent?: 'orange' | 'green'
}) {
  const bg = accent === 'green' ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'
  const iconColor = accent === 'green' ? 'text-green-400' : 'text-orange-400'
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-zinc-100 tabular-nums">{value}</p>
    </div>
  )
}

function SimpleTable({
  rows,
  empty,
  exportFilename,
  showVerified = false,
}: {
  rows: { id: string | number; email: string; verified?: boolean; created_at: string }[]
  empty: string
  exportFilename: string
  showVerified?: boolean
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <p className="text-sm text-zinc-300">{rows.length} entries{showVerified && ` · ${rows.filter(r => r.verified).length} verified`}</p>
        <button
          onClick={() =>
            downloadCsv(
              exportFilename,
              showVerified ? ['email', 'verified', 'date_joined'] : ['email', 'date_joined'],
              rows.map((r) => showVerified
                ? [r.email, r.verified ? 'yes' : 'no', new Date(r.created_at).toISOString()]
                : [r.email, new Date(r.created_at).toISOString()])
            )
          }
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 text-zinc-100 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-950/40 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Email</th>
              {showVerified && <th className="px-4 py-3 font-semibold">Status</th>}
              <th className="px-4 py-3 font-semibold">Date joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-zinc-500">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3 text-zinc-100">{r.email}</td>
                  {showVerified && (
                    <td className="px-4 py-3">
                      {r.verified
                        ? <span className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Verified</span>
                        : <span className="text-xs font-semibold text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">Pending</span>
                      }
                    </td>
                  )}
                  <td className="px-4 py-3 text-zinc-400 tabular-nums">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ContactsTable({
  rows,
  onOpen,
  empty,
}: {
  rows: ContactRow[]
  onOpen: (row: ContactRow) => void
  empty: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <p className="text-sm text-zinc-300">{rows.length} messages</p>
        <button
          onClick={() =>
            downloadCsv(
              'contact_messages.csv',
              ['name', 'email', 'subject', 'message', 'date'],
              rows.map((r) => [
                r.name,
                r.email,
                r.subject ?? '',
                r.message,
                new Date(r.created_at).toISOString(),
              ])
            )
          }
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 text-zinc-100 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-950/40 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Subject</th>
              <th className="px-4 py-3 font-semibold">Message</th>
              <th className="px-4 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onOpen(r)}
                  className="border-t border-zinc-800 cursor-pointer hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-100">{r.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{r.email}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.subject ?? '-'}</td>
                  <td className="px-4 py-3 text-zinc-400 line-clamp-1 max-w-md">
                    {r.message}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 tabular-nums">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NewsletterComposer({ recipientCount }: { recipientCount: number }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  async function send() {
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required.'); return }
    if (!confirmed) { setError('Please confirm you want to send to all subscribers.'); return }
    setError('')
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, previewText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send.')
      setResult(data)
      setConfirmed(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-5 max-w-2xl">
      <div>
        <h2 className="text-base font-bold text-zinc-100 mb-1">Compose Newsletter</h2>
        <p className="text-xs text-zinc-500">Will be sent to <span className="text-zinc-200 font-semibold">{recipientCount} subscribers</span></p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Subject Line</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. 🔥 This week in AI/ML — 5 things you missed"
          className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Preview Text <span className="normal-case font-normal text-zinc-600">(shown in inbox preview)</span></label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Short teaser shown under subject line..."
          className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Body <span className="normal-case font-normal text-zinc-600">(plain text — each line becomes a paragraph)</span></label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your newsletter content here..."
          rows={12}
          className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none font-mono"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border border-zinc-600 bg-zinc-800 accent-orange-500"
        />
        <span className="text-sm text-zinc-400">I confirm I want to send this email to all <strong className="text-zinc-200">{recipientCount}</strong> newsletter subscribers.</span>
      </label>

      {error && (
        <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {result && (
        <div className="flex items-start gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          Sent to {result.sent} of {result.total} subscribers.{result.failed > 0 ? ` (${result.failed} failed)` : ''}
        </div>
      )}

      <button
        onClick={send}
        disabled={sending || !subject.trim() || !body.trim() || !confirmed}
        className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3 rounded-xl transition-all"
      >
        {sending
          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
          : <><Send className="w-4 h-4" /> Send Newsletter</>
        }
      </button>
    </div>
  )
}
