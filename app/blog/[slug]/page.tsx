import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import type { BlogPost } from '@/lib/admin'
import { Clock, ArrowLeft, Tag, Share2 } from 'lucide-react'
import EmailCaptureCard from '@/components/shared/EmailCaptureCard'
import ReadingProgress from '@/components/blog/ReadingProgress'
import BlogComments from '@/components/blog/BlogComments'
import TableOfContents from '@/components/blog/TableOfContents'
import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = [
  ...sanitizeHtml.defaults.allowedTags,
  'img','h1','h2','h3','h4','pre','code','figure','figcaption','mark','del','ins',
]
const ALLOWED_ATTRS: sanitizeHtml.IOptions['allowedAttributes'] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  '*':   ['class','id','style'],
  'a':   ['href','target','rel','title'],
  'img': ['src','alt','width','height','loading'],
}

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

async function getRelatedPosts(category: string, currentSlug: string): Promise<Pick<BlogPost,'slug'|'title'|'category'|'read_time'|'cover_image'>[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, category, read_time, cover_image')
    .eq('published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .limit(3)
  return data ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  const ogImage = post.cover_image ?? `https://amanailab.com/api/og/blog?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category ?? '')}&rt=${post.read_time ?? 5}`
  return {
    title: `${post.title} | AmanAI Lab`,
    description: post.description ?? undefined,
    alternates: { canonical: `https://amanailab.com/blog/${slug}` },
    openGraph: {
      type: 'article',
      url: `https://amanailab.com/blog/${slug}`,
      title: post.title,
      description: post.description ?? undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description ?? undefined,
      images: [ogImage],
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = []
  const regex = /<h([2-3])[^>]*>(.*?)<\/h[2-3]>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1])
    const text  = match[2].replace(/<[^>]+>/g, '').trim()
    const id    = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (text) headings.push({ id, text, level })
  }
  return headings
}

function injectHeadingIds(html: string): string {
  return html.replace(/<h([2-3])([^>]*)>(.*?)<\/h[2-3]>/gi, (_, level, attrs, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim()
    const id   = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  const related  = await getRelatedPosts(post.category, slug)
  const headings = extractHeadings(post.content ?? '')
  const contentWithIds = injectHeadingIds(post.content ?? '')

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description ?? '',
    url: `https://amanailab.com/blog/${slug}`,
    datePublished: post.created_at,
    dateModified: post.updated_at ?? post.created_at,
    author: { '@type': 'Person', name: 'Aman Chauhan', url: 'https://amanailab.com/about' },
    publisher: {
      '@type': 'Organization',
      name: 'AmanAI Lab',
      logo: { '@type': 'ImageObject', url: 'https://amanailab.com/logo.jpg' },
    },
    image: post.cover_image ? [post.cover_image] : ['https://amanailab.com/logo.jpg'],
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://amanailab.com/blog/${slug}` },
  }

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
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

      {/* Table of Contents — auto-generated from headings */}
      <TableOfContents headings={headings} />

      {/* Content — sanitized to prevent XSS, headings get id attrs */}
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(contentWithIds, {
            allowedTags: ALLOWED_TAGS,
            allowedAttributes: { ...(ALLOWED_ATTRS as Record<string, string[]>), '*': [...((ALLOWED_ATTRS as Record<string, string[]>)['*'] ?? []), 'id'] },
          }),
        }}
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

      {/* Related articles */}
      {related.length > 0 && (
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-5">
            More in {post.category}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map(r => (
              <Link key={r.slug} href={`/blog/${r.slug}`}
                className="group flex flex-col gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all hover:-translate-y-0.5">
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white leading-snug line-clamp-2 transition-colors">
                  {r.title}
                </p>
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                    {r.category}
                  </span>
                  {r.read_time && <span className="text-[10px] text-zinc-600">{r.read_time}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <BlogComments slug={post.slug} />
    </article>
    </>
  )
}
