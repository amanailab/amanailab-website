import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/verify-email', '/courses', '/dashboard', '/profile', '/sessions', '/job-tracker'],
      },
    ],
    sitemap: 'https://amanailab.com/sitemap.xml',
    host: 'https://amanailab.com',
  }
}
