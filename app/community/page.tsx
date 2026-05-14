'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Plus, X, Loader2, Users, Lightbulb, HelpCircle, Building2, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string; author_name: string; title: string; body: string
  type: string; company_slug: string | null; created_at: string
  approved?: boolean
}

interface User { email: string }

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  experience: { label: 'Interview Experience', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',   icon: Building2  },
  question:   { label: 'Question',             color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: HelpCircle },
  tip:        { label: 'Tip',                  color: 'bg-green-500/20 text-green-300 border-green-500/30',  icon: Lightbulb  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── Post card ────────────────────────────────────────────────────────────────

const REACTIONS = [
  { emoji: '👍', label: 'helpful' },
  { emoji: '🔥', label: 'fire' },
  { emoji: '💡', label: 'insightful' },
]
const REACTIONS_KEY = 'community_reactions'

function useReactions(postId: string) {
  const key = `${REACTIONS_KEY}_${postId}`
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [mine, setMine]     = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? '{}')
      setCounts(stored.counts ?? {})
      setMine(stored.mine ?? null)
    } catch { /* ignore */ }
  }, [key])

  const react = useCallback((label: string) => {
    setCounts(prev => {
      const next = { ...prev }
      if (mine) next[mine] = Math.max(0, (next[mine] ?? 1) - 1)
      const newMine = mine === label ? null : label
      if (newMine) next[newMine] = (next[newMine] ?? 0) + 1
      setMine(newMine)
      try { localStorage.setItem(key, JSON.stringify({ counts: next, mine: newMine })) } catch { /* ignore */ }
      return next
    })
  }, [mine, key])

  return { counts, mine, react }
}

function PostCard({ post, pending = false }: { post: Post; pending?: boolean }) {
  const cfg    = TYPE_CONFIG[post.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.experience
  const Icon   = cfg.icon
  const { counts, mine, react } = useReactions(post.id)

  return (
    <div className={`bg-zinc-900 border rounded-2xl p-5 transition-colors ${pending ? 'border-zinc-700/50 opacity-70' : 'border-zinc-800 hover:border-zinc-700'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
          {post.author_name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
              <Icon className="w-2.5 h-2.5" /> {cfg.label}
            </span>
            {post.company_slug && (
              <Link href={`/companies/${post.company_slug}`} className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full hover:bg-orange-500/20 transition-colors">
                {post.company_slug}
              </Link>
            )}
            {pending && (
              <span className="inline-flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                <Clock className="w-2.5 h-2.5" /> Pending review
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">{post.author_name} · {timeAgo(post.created_at)}</p>
        </div>
      </div>
      <h3 className="text-sm font-bold text-zinc-100 mb-2">{post.title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4">{post.body}</p>

      {/* Reactions */}
      {!pending && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/50">
          {REACTIONS.map(r => (
            <button key={r.label} onClick={() => react(r.label)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${mine === r.label ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'}`}>
              <span>{r.emoji}</span>
              {(counts[r.label] ?? 0) > 0 && <span className="font-semibold">{counts[r.label]}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── New post modal ───────────────────────────────────────────────────────────

function NewPostModal({
  onClose, onSuccess, companies, user,
}: {
  onClose: () => void
  onSuccess: (post: Post) => void
  companies: { slug: string; name: string }[]
  user: User | null
}) {
  const defaultName  = user ? (user.email.split('@')[0]) : ''
  const defaultEmail = user ? user.email : ''

  const [form, setForm] = useState({
    author_name: defaultName, author_email: defaultEmail,
    title: '', body: '', type: 'experience', company_slug: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
      onSuccess({
        id: Math.random().toString(),
        author_name: form.author_name,
        title: form.title,
        body: form.body,
        type: form.type,
        company_slug: form.company_slug || null,
        created_at: new Date().toISOString(),
        approved: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-100">Share with the Community</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-zinc-300" /></button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-zinc-100 font-bold mb-2">Post submitted!</p>
            <p className="text-sm text-zinc-400 mb-4">It will appear after admin review — usually within 24 hours. You can see it in &quot;My Posts&quot; below.</p>
            <button onClick={onClose} className="text-sm text-orange-400 hover:text-orange-300 font-semibold">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

            {/* Logged-in banner */}
            {user ? (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-xs text-green-300">
                  Posting as <span className="font-semibold">{user.email}</span>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Your Name *</label>
                  <input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} required placeholder="Aman" className="bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Email (optional)</label>
                  <input value={form.author_email} onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))} type="email" placeholder="not shown publicly" className="bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Post Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none">
                  <option value="experience">Interview Experience</option>
                  <option value="question">Question</option>
                  <option value="tip">Tip / Resource</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Company (optional)</label>
                <select value={form.company_slug} onChange={e => setForm(f => ({ ...f, company_slug: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none">
                  <option value="">No specific company</option>
                  {companies.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="What questions did Google ask me…" className="bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Your Post *</label>
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required rows={5} placeholder="Share your experience, question, or tip in detail…" className="bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none resize-none transition-colors" />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              Submit Post
            </button>

            {!user && (
              <p className="text-xs text-zinc-600 text-center">
                <Link href="/login" className="text-orange-400 hover:text-orange-300">Sign in</Link> to post with your account — no name/email needed.
              </p>
            )}
            <p className="text-xs text-zinc-600 text-center">Posts are reviewed before publishing — usually within 24 hours.</p>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [posts, setPosts]         = useState<Post[]>([])
  const [myPosts, setMyPosts]     = useState<Post[]>([])
  const [companies, setCompanies] = useState<{ slug: string; name: string }[]>([])
  const [user, setUser]           = useState<User | null>(null)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)

  // Check auth
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ email: u.email ?? '' })
    })
  }, [])

  // Fetch posts + companies
  useEffect(() => {
    setVisibleCount(10) // reset pagination on filter change
    const url = filter !== 'all' ? `/api/community/posts?type=${filter}` : '/api/community/posts'
    Promise.all([
      fetch(url).then(r => r.json()),
      fetch('/api/admin/companies-list').then(r => r.json()),
    ]).then(([postsData, companiesData]) => {
      setPosts(postsData.posts ?? [])
      setCompanies((companiesData.companies ?? []).map((c: { slug: string; name: string }) => ({ slug: c.slug, name: c.name })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [filter])

  function handleNewPost(post: Post) {
    setMyPosts(prev => [post, ...prev])
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      {showModal && (
        <NewPostModal
          onClose={() => setShowModal(false)}
          onSuccess={(post) => { handleNewPost(post); setShowModal(false) }}
          companies={companies}
          user={user}
        />
      )}

      <div className="max-w-3xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-3">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Community</span>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-100 mb-1">AI/ML Interview Community</h1>
            <p className="text-zinc-500 text-sm">Share interview experiences, ask questions, and help each other get hired.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Share
          </button>
        </div>

        {/* ── Logged-in user banner ── */}
        {user && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 font-semibold truncate">{user.email}</p>
              <p className="text-xs text-zinc-500">Your posts will show your email prefix as author name</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              + Post
            </button>
          </div>
        )}

        {/* ── My pending posts (logged in only) ── */}
        {user && myPosts.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">My Submissions</p>
            <div className="flex flex-col gap-2.5">
              {myPosts.map(p => <PostCard key={p.id} post={p} pending />)}
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: 'all',        label: 'All Posts',    icon: MessageSquare },
            { value: 'experience', label: 'Experiences',  icon: Building2 },
            { value: 'question',   label: 'Questions',    icon: HelpCircle },
            { value: 'tip',        label: 'Tips',         icon: Lightbulb },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setFilter(value); setLoading(true) }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
                filter === value
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* ── Posts feed ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-zinc-200 font-bold text-lg mb-2">Be the first to share!</p>
            <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              Share your AI/ML interview experience — help others know what to expect at Google, Meta, OpenAI and more.
            </p>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
              <Plus className="w-4 h-4" /> Share Your Experience
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {posts.slice(0, visibleCount).map(p => <PostCard key={p.id} post={p} />)}
            </div>
            {posts.length > visibleCount && (
              <div className="text-center mt-5">
                <button
                  onClick={() => setVisibleCount(c => c + 10)}
                  className="flex items-center gap-2 mx-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-semibold px-6 py-2.5 rounded-xl transition-all"
                >
                  Load More ({posts.length - visibleCount} remaining)
                </button>
              </div>
            )}
            {posts.length > 0 && posts.length <= visibleCount && (
              <p className="text-xs text-zinc-700 text-center mt-4">{posts.length} posts total</p>
            )}
          </>
        )}

        {/* ── Not logged in CTA ── */}
        {!user && (
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-zinc-100">Sign in for a better experience</p>
              <p className="text-xs text-zinc-500 mt-0.5">Post with your account — no manual name/email entry. See your submissions in one place.</p>
            </div>
            <Link href="/login" className="text-xs bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors shrink-0">
              Sign in
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
