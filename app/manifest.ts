import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AmanAI Lab — AI/ML Interview Prep',
    short_name: 'AmanAI Lab',
    description: 'Free AI/ML interview prep: mock interviews, Code Lab, Interview Sheet, flashcards, and 18 AI tools.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#f97316',
    orientation: 'portrait-primary',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/favicon.ico', sizes: 'any',     type: 'image/x-icon' },
      { src: '/logo.jpg',    sizes: '192x192', type: 'image/jpeg', purpose: 'any' },
      { src: '/logo.jpg',    sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
    ],
  }
}
