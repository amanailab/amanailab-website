import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://amanailab.com'

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE,                            priority: 1.0, changeFrequency: 'daily'   },
  { url: `${BASE}/interview`,             priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/resume`,               priority: 0.9, changeFrequency: 'monthly' },
  { url: `${BASE}/career`,               priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/blog`,                 priority: 0.9, changeFrequency: 'daily'   },
  { url: `${BASE}/series`,               priority: 0.8, changeFrequency: 'weekly'  },
  { url: `${BASE}/paper-explainer`,      priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/linkedin-optimizer`,   priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/cover-letter-review`,  priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/quiz`,                 priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/linkedin`,             priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE}/prompt`,               priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE}/news`,                 priority: 0.7, changeFrequency: 'daily'   },
  { url: `${BASE}/resources`,            priority: 0.7, changeFrequency: 'weekly'  },
  { url: `${BASE}/courses`,              priority: 0.7, changeFrequency: 'weekly'  },
  { url: `${BASE}/services`,             priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE}/about`,               priority: 0.5, changeFrequency: 'monthly' },
  { url: `${BASE}/contact`,             priority: 0.5, changeFrequency: 'monthly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, created_at')
      .eq('published', true)

    const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.created_at),
      priority: 0.8,
      changeFrequency: 'monthly',
    }))

    return [...staticPages, ...blogPages]
  } catch {
    return staticPages
  }
}
