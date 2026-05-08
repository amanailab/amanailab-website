import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AmanAI Lab — AI/ML Career Platform',
    short_name: 'AmanAI Lab',
    description: 'AI/ML interview prep, tools, Code Lab and daily challenges. Free.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#f97316',
    orientation: 'portrait',
    icons: [
      { src: '/logo.jpg', sizes: '192x192', type: 'image/jpeg' },
      { src: '/logo.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
    categories: ['education', 'productivity'],
    shortcuts: [
      { name: 'AI Interview', url: '/interview?tab=simulator', description: 'Start mock interview' },
      { name: 'Daily Challenge', url: '/daily', description: "Today's question" },
      { name: 'Code Lab', url: '/code-lab', description: 'Solve coding problems' },
      { name: 'Dashboard', url: '/dashboard', description: 'My progress' },
    ],
  }
}
