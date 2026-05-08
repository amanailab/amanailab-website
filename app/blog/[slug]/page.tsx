import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import type { BlogPost } from '@/lib/admin'
import { Clock, ArrowLeft, Tag, Share2 } from 'lucide-react'
import EmailCaptureCard from '@/components/shared/EmailCaptureCard'
import ReadingProgress from '@/components/blog/ReadingProgress'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} | AmanAI Lab`,
    description: post.description ?? undefined,
    openGraph: post.cover_image ? { images: [post.cover_image] } : undefined,
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  return (
    <>
    <ReadingProgress />
    <article className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
            {post.category}
          </span>
          <span className="text-xs text-zinc-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.read_time}
          </span>
          <span className="text-xs text-zinc-600">{formatDate(post.created_at)}</span>
          {/* Share buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://amanailab.com/blog/${post.slug}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-sky-400 bg-zinc-800 hover:bg-sky-500/10 border border-zinc-700 hover:border-sky-500/30 px-2 py-1 rounded-lg transition-all" title="Share on X">
              <Share2 className="w-3 h-3" /> X
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://amanailab.com/blog/${post.slug}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-blue-400 bg-zinc-800 hover:bg-blue-500/10 border border-zinc-700 hover:border-blue-500/30 px-2 py-1 rounded-lg transition-all" title="Share on LinkedIn">
              <Share2 className="w-3 h-3" /> in
            </a>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 leading-tight mb-4">
          {post.title}
        </h1>

        {post.description && (
          <p className="text-lg text-zinc-400 leading-relaxed">{post.description}</p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-10">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Newsletter capture */}
      <div className="mt-12 border-l-4 border-orange-500 pl-1 rounded-l">
        <EmailCaptureCard
          source="blog"
          title="Enjoyed this article?"
          subtitle="Join 500+ AI developers getting weekly tips, news and resources from AmanAI Lab."
          buttonLabel="Subscribe Free"
          successMessage="You are subscribed! Welcome to AmanAI Lab newsletter."
          smallText="No spam. Unsubscribe anytime."
        />
      </div>
    </article>
    </>
  )
}
