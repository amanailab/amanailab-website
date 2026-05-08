import { MetadataRoute } from 'next'
import { getAdminSupabase } from '@/lib/admin'
import { TOPICS } from '@/lib/topic-data'

const BASE = 'https://amanailab.com'

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE,                             priority: 1.0, changeFrequency: 'daily'   },
  { url: `${BASE}/code-lab`,               priority: 0.95, changeFrequency: 'weekly' },
  { url: `${BASE}/daily`,                  priority: 0.85, changeFrequency: 'daily'  },
  { url: `${BASE}/playground`,             priority: 0.75, changeFrequency: 'monthly'},
  { url: `${BASE}/interview`,              priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/companies`,              priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/questions`,              priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/job-prep`,              priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/topics`,               priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/flashcards`,           priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/resume`,                priority: 0.9, changeFrequency: 'monthly' },
  { url: `${BASE}/career`,                priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/blog`,                  priority: 0.9, changeFrequency: 'daily'   },
  { url: `${BASE}/community`,             priority: 0.8, changeFrequency: 'daily'   },
  { url: `${BASE}/series`,                priority: 0.8, changeFrequency: 'weekly'  },
  { url: `${BASE}/paper-explainer`,       priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/linkedin-optimizer`,    priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/cover-letter-review`,   priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/quiz`,                  priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/linkedin`,              priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE}/prompt`,                priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE}/news`,                  priority: 0.7, changeFrequency: 'daily'   },
  { url: `${BASE}/resources`,             priority: 0.7, changeFrequency: 'weekly'  },
  { url: `${BASE}/courses`,               priority: 0.7, changeFrequency: 'weekly'  },
  { url: `${BASE}/services`,              priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE}/about`,                 priority: 0.5, changeFrequency: 'monthly' },
  { url: `${BASE}/contact`,               priority: 0.5, changeFrequency: 'monthly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = getAdminSupabase()

    const [
      { data: posts },
      { data: companies },
      { data: codeProblems },
    ] = await Promise.all([
      supabase.from('blog_posts').select('slug, updated_at, created_at').eq('published', true),
      supabase.from('companies').select('slug, created_at'),
      supabase.from('code_problems').select('slug, created_at').order('order_index', { ascending: true }),
    ])

    const blogPages: MetadataRoute.Sitemap = (posts ?? []).map(p => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.created_at),
      priority: 0.8,
      changeFrequency: 'monthly',
    }))

    const companyPages: MetadataRoute.Sitemap = (companies ?? []).map(c => ({
      url: `${BASE}/companies/${c.slug}`,
      lastModified: new Date(c.created_at),
      priority: 0.9,
      changeFrequency: 'weekly',
    }))

    const topicPages: MetadataRoute.Sitemap = TOPICS.map(t => ({
      url: `${BASE}/topics/${t.slug}`,
      priority: 0.9,
      changeFrequency: 'monthly' as const,
    }))

    const flashcardPages: MetadataRoute.Sitemap = TOPICS.map(t => ({
      url: `${BASE}/flashcards/${t.slug}`,
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    }))

    const codeLabPages: MetadataRoute.Sitemap = (codeProblems ?? []).map(p => ({
      url: `${BASE}/code-lab/${p.slug}`,
      lastModified: new Date(p.created_at),
      priority: 0.85,
      changeFrequency: 'monthly' as const,
    }))

    return [...staticPages, ...companyPages, ...topicPages, ...flashcardPages, ...blogPages, ...codeLabPages]
  } catch {
    const topicPages: MetadataRoute.Sitemap = TOPICS.map(t => ({ url: `${BASE}/topics/${t.slug}`, priority: 0.9, changeFrequency: 'monthly' as const }))
    const flashcardPages: MetadataRoute.Sitemap = TOPICS.map(t => ({ url: `${BASE}/flashcards/${t.slug}`, priority: 0.7, changeFrequency: 'monthly' as const }))
    return [...staticPages, ...topicPages, ...flashcardPages]
  }
}
