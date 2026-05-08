import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'
export const revalidate = 3600

const BASE = 'https://amanailab.com'

export async function GET() {
  const supabase = getAdminSupabase()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('title, slug, description, category, created_at, updated_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(50)

  const items = (posts ?? []).map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${BASE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${BASE}/blog/${p.slug}</guid>
      <description><![CDATA[${p.description ?? ''}]]></description>
      <category>${p.category}</category>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AmanAI Lab Blog — AI/ML Insights</title>
    <link>${BASE}/blog</link>
    <description>In-depth articles on Generative AI, LLMs, RAG, AI Agents, Fine-Tuning and more.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE}/logo.jpg</url>
      <title>AmanAI Lab</title>
      <link>${BASE}</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
