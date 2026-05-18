import { getChannelStats, getLatestVideos, getPlaylists, formatStats } from "@/lib/youtube";
import HeroSection    from "@/components/home/HeroSection";
import SocialProofBar from "@/components/home/SocialProofBar";
import FeaturedTools  from "@/components/home/FeaturedTools";
import SheetPromo     from "@/components/home/SheetPromo";
import HowItWorks     from "@/components/home/HowItWorks";
import MoreTools      from "@/components/home/MoreTools";
import FeaturedSeries from "@/components/home/FeaturedSeries";
import LatestVideos   from "@/components/home/LatestVideos";
import CTASection     from "@/components/home/CTASection";

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AmanAI Lab — Free AI/ML Interview Prep Platform | Mock Interviews, Code Lab & More',
  description: 'The most complete free platform for AI/ML engineers. AI mock interviews, 45+ coding problems, A-to-Z Interview Sheet (230+ topics), flashcards, system design practice, and 19 AI-powered tools. Trusted by engineers at Google, Meta, OpenAI.',
  alternates: { canonical: 'https://amanailab.com' },
  openGraph: {
    title: 'AmanAI Lab — Free AI/ML Interview Prep Platform',
    description: 'AI mock interviews, 45+ coding problems, Interview Prep Sheet with 230+ topics, and 19 free tools. Everything you need to land an AI/ML job.',
    url: 'https://amanailab.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AmanAI Lab — Free AI/ML Interview Prep',
    description: 'AI mock interviews, Code Lab, Interview Sheet & 19 free tools. 100% free.',
  },
  keywords: [
    'AI interview prep', 'ML interview questions', 'LLM interview', 'RAG interview',
    'machine learning interview', 'deep learning interview', 'MLOps interview',
    'AI mock interview', 'code lab', 'system design AI', 'interview prep sheet',
  ],
}

export const revalidate = 300;

export default async function HomePage() {
  let stats = null
  let playlists: unknown[] = []
  let videos:   unknown[] = []

  try {
    ;[stats, playlists, videos] = await Promise.all([
      getChannelStats(),
      getPlaylists(20),
      getLatestVideos(6),
    ])
  } catch {
    // YouTube API failed — pages still render with fallbacks
  }

  const formattedStats = stats ? formatStats(stats) : null
  const featured       = (playlists as { id: string }[]).slice(0, 3)
  const latestVideos   = videos as Parameters<typeof LatestVideos>[0]['videos']

  return (
    <>
      {/* 1. Hook — strong value prop */}
      <HeroSection />

      {/* 2. Credibility */}
      <SocialProofBar
        subscriberCount={formattedStats ? `${formattedStats.subs.value}${formattedStats.subs.suffix}` : undefined}
        videoCount={formattedStats ? `${formattedStats.videos.value}${formattedStats.videos.suffix}` : undefined}
      />

      {/* 3. Core 4 tools — spotlight */}
      <FeaturedTools />

      {/* 4. Interview prep sheet — key differentiator */}
      <SheetPromo />

      {/* 5. How it works — 3-step journey */}
      <HowItWorks />

      {/* 6. All remaining tools — compact grid */}
      <MoreTools />

      {/* 7. YouTube playlists (with static fallback) */}
      <FeaturedSeries playlists={featured as Parameters<typeof FeaturedSeries>[0]['playlists']} />

      {/* 8. Latest videos (Shorts filtered, conditional) */}
      {latestVideos.length > 0 && <LatestVideos videos={latestVideos} />}

      {/* 9. Final CTA */}
      <CTASection />
    </>
  );
}
