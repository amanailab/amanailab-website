import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { BlogPost } from '@/lib/admin'
import BlogList from '@/components/blog/BlogList'

export const metadata: Metadata = {
  title: 'Blog | AmanAI Lab',
  description: 'In-depth articles on Generative AI, LLMs, RAG, AI Agents, and more.',
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

    if (search) query = query.ilike('title', `%${search}%`)
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
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-zinc-100 mb-3">Blog</h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          In-depth articles on Generative AI, LLMs, RAG, AI Agents, fine-tuning, and more.
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
