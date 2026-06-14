import { MetadataRoute } from 'next'
import { getAdminSupabase } from '@/lib/admin'
import { TOPICS } from '@/lib/topic-data'
import { getPlaylists } from '@/lib/youtube'
import { SYSTEM_DESIGN_PROBLEMS } from '@/lib/system-design-problems'
import { STATIC_PROBLEMS } from '@/lib/code-problems-static'
import { buildQuestionSlug } from '@/lib/question-slug'

const BASE = 'https://amanailab.com'

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE,                             priority: 1.0, changeFrequency: 'daily'   },
  { url: `${BASE}/code-lab`,               priority: 0.95, changeFrequency: 'weekly' },
  { url: `${BASE}/system-design`,          priority: 0.85, changeFrequency: 'monthly'},
  { url: `${BASE}/daily`,                  priority: 0.85, changeFrequency: 'daily'  },
  { url: `${BASE}/skill-gap`,              priority: 0.85, changeFrequency: 'monthly'},
  { url: `${BASE}/job-tracker`,            priority: 0.75, changeFrequency: 'monthly'},
  { url: `${BASE}/playground`,             priority: 0.75, changeFrequency: 'monthly'},
  { url: `${BASE}/interview`,              priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/companies`,              priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/questions`,              priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/topics`,               priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/flashcards`,           priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/resume`,                priority: 0.9, changeFrequency: 'monthly' },
  { url: `${BASE}/career`,                priority: 0.9, changeFrequency: 'weekly'  },
  { url: `${BASE}/blog`,                  priority: 0.9, changeFrequency: 'daily'   },
  { url: `${BASE}/series`,                priority: 0.8, changeFrequency: 'weekly'  },
  { url: `${BASE}/paper-explainer`,       priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/linkedin-optimizer`,    priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/cover-letter-review`,   priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/quiz`,                  priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE}/news`,                  priority: 0.7, changeFrequency: 'daily'   },
  { url: `${BASE}/resources`,             priority: 0.7, changeFrequency: 'weekly'  },
  { url: `${BASE}/services`,              priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE}/about`,                 priority: 0.5, changeFrequency: 'monthly' },
  { url: `${BASE}/contact`,               priority: 0.5, changeFrequency: 'monthly' },
  { url: `${BASE}/privacy`,               priority: 0.3, changeFrequency: 'yearly'  },
  { url: `${BASE}/terms`,                 priority: 0.3, changeFrequency: 'yearly'  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = getAdminSupabase()

    const [
      { data: posts },
      { data: companies },
      { data: codeProblems },
      { data: generalQuestions },
      { data: companyQuestions },
    ] = await Promise.all([
      supabase.from('blog_posts').select('slug, updated_at, created_at').eq('published', true),
      supabase.from('companies').select('slug, created_at'),
      supabase.from('code_problems').select('slug, created_at').order('order_index', { ascending: true }),
      supabase.from('interview_questions').select('id, question'),
      supabase.from('company_questions').select('id, question'),
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

    // Series detail pages from YouTube playlists
    let seriesPages: MetadataRoute.Sitemap = []
    try {
      const playlists = await getPlaylists(50)
      seriesPages = playlists.map(p => ({
        url: `${BASE}/series/${p.id}`,
        priority: 0.75,
        changeFrequency: 'weekly' as const,
      }))
    } catch { /* YouTube API failure — skip series pages */ }

    // Individual question pages — the long-tail SEO surface
    const questionPages: MetadataRoute.Sitemap = [
      ...(generalQuestions ?? []).map(q => ({
        url: `${BASE}/questions/${buildQuestionSlug('general', q.id, q.question)}`,
        priority: 0.7,
        changeFrequency: 'monthly' as const,
      })),
      ...(companyQuestions ?? []).map(q => ({
        url: `${BASE}/questions/${buildQuestionSlug('company', q.id, q.question)}`,
        priority: 0.7,
        changeFrequency: 'monthly' as const,
      })),
    ]

    // System design problem pages
    const systemDesignPages: MetadataRoute.Sitemap = SYSTEM_DESIGN_PROBLEMS.map(p => ({
      url: `${BASE}/system-design/${p.slug}`,
      lastModified: new Date(),
      priority: 0.85,
      changeFrequency: 'monthly' as const,
    }))

    // Static code lab problems (fallback when DB is empty)
    const staticCodeLabPages: MetadataRoute.Sitemap = codeProblems && codeProblems.length > 0 ? [] :
      STATIC_PROBLEMS.map(p => ({
        url: `${BASE}/code-lab/${p.slug}`,
        priority: 0.85,
        changeFrequency: 'monthly' as const,
      }))

    return [...staticPages, ...companyPages, ...topicPages, ...flashcardPages, ...blogPages, ...codeLabPages, ...staticCodeLabPages, ...systemDesignPages, ...seriesPages, ...questionPages]
  } catch {
    const topicPages: MetadataRoute.Sitemap = TOPICS.map(t => ({ url: `${BASE}/topics/${t.slug}`, priority: 0.9, changeFrequency: 'monthly' as const }))
    const flashcardPages: MetadataRoute.Sitemap = TOPICS.map(t => ({ url: `${BASE}/flashcards/${t.slug}`, priority: 0.7, changeFrequency: 'monthly' as const }))
    return [...staticPages, ...topicPages, ...flashcardPages]
  }
}
