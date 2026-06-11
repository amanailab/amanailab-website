export const revalidate = 600

import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { BlogPost } from '@/lib/admin'
import BlogList from '@/components/blog/BlogList'

export const metadata: Metadata = {
  title: 'Blog | AmanAI Lab',
  description: 'In-depth articles on Generative AI, LLMs, RAG, AI Agents, and more.',
  alternates: { canonical: 'https://amanailab.com/blog' },
  openGraph: {
    title: 'AmanAI Lab Blog — Generative AI, LLMs, RAG & Agents',
    description: 'In-depth articles on Generative AI, LLMs, RAG, AI Agents, and more.',
    url: 'https://amanailab.com/blog',
    images: [{ url: '/api/og/tool?name=AmanAI+Lab+Blog&tagline=In-depth+articles+on+GenAI%2C+LLMs%2C+RAG+%26+Agents&emoji=%E2%9C%8D%EF%B8%8F&tool=blog', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AmanAI Lab Blog',
    description: 'In-depth articles on Generative AI, LLMs, RAG, AI Agents, and more.',
  },
}

const PER_PAGE = 12

async function getPostsPage(
  page: number,
  search: string,
  category: string
): Promise<{ posts: BlogPost[]; total: number }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const start = (page - 1) * PER_PAGE
    const end = start + PER_PAGE - 1

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(start, end)

    if (search) {
      const safe = search.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    }
    if (category) query = query.eq('category', category)

    const { data, count, error } = await query

    if (error) {
      console.error('[blog/page] Supabase error:', error.message)
      return { posts: [], total: 0 }
    }

    return { posts: data ?? [], total: count ?? 0 }
  } catch (err) {
    console.error('[blog/page] Unexpected error:', err)
    return { posts: [], total: 0 }
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const search = typeof sp.q === 'string' ? sp.q : ''
  const cat = typeof sp.category === 'string' ? sp.category : ''

  const { posts, total } = await getPostsPage(page, search, cat)

  return (
    <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 uppercase tracking-wider">
          ✍️ AmanAI Lab Blog
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 mb-4 leading-tight">
          Learn AI/ML the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            right way
          </span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
          In-depth, hands-on guides on Generative AI, LLMs, RAG, AI Agents, fine-tuning, and more — written by a practitioner.
        </p>
      </div>

      <BlogList
        posts={posts}
        total={total}
        page={page}
        perPage={PER_PAGE}
        search={search}
        category={cat}
      />
    </div>
  )
}
