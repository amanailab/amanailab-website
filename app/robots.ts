import { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Only hard-block truly private areas and tracking-param duplicate URLs.
        // Pages we want OUT of the index (dashboard, profile, sessions, search,
        // signup, verify-email, saved questions) use a `noindex` meta tag instead
        // — they must stay crawlable so Google can actually see and honor it.
        // Blocking them here would trigger "Indexed, though blocked by robots.txt".
        disallow: [
          '/admin',
          '/api/',
          '/*?utm_',
          '/*?ref=',
          '/*?fbclid=',
          '/*?gclid=',
        ],
      },
      // Allow AI search assistants to index public content
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: 'amanailab.com',
  }
}
