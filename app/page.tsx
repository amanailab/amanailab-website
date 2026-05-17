import { getChannelStats, getLatestVideos, getPlaylists, formatStats } from "@/lib/youtube";
import HeroSection from "@/components/home/HeroSection";
import SocialProofBar from "@/components/home/SocialProofBar";
import HowItWorks from "@/components/home/HowItWorks";
import ToolsShowcase from "@/components/home/ToolsShowcase";
import FeaturedSeries from "@/components/home/FeaturedSeries";
import LatestVideos from "@/components/home/LatestVideos";
import CTASection from "@/components/home/CTASection"
import SheetPromo from "@/components/home/SheetPromo";

import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: 'https://amanailab.com' },
}

export const revalidate = 300;

export default async function HomePage() {
  // Fetch YouTube data — graceful fallback on API failure
  let stats = null, videos: unknown[] = [], playlists: unknown[] = []
  try {
    ;[stats, videos, playlists] = await Promise.all([
      getChannelStats(),
      getLatestVideos(7),
      getPlaylists(20),
    ])
  } catch {
    // YouTube API failed silently — pages still render with defaults
  }

  const formattedStats = stats ? formatStats(stats) : null
  const featured = (playlists as { id: string }[]).slice(0, 3)

  return (
    <>
      {/* 1. Hook — immediate value prop */}
      <HeroSection />

      {/* 2. Credibility — show scale */}
      <SocialProofBar
        subscriberCount={formattedStats ? `${formattedStats.subs.value}${formattedStats.subs.suffix}` : undefined}
        videoCount={formattedStats ? `${formattedStats.videos.value}${formattedStats.videos.suffix}` : undefined}
      />

      {/* 3. What we offer — all tools */}
      <ToolsShowcase />

      {/* 4. Sheet promo — interview prep roadmap */}
      <SheetPromo />

      {/* 5. How it works — user journey */}
      <HowItWorks />

      {/* 5. Learning content */}
      {featured.length > 0 && <FeaturedSeries playlists={featured as Parameters<typeof FeaturedSeries>[0]['playlists']} />}
      {(videos as unknown[]).length > 0 && <LatestVideos videos={videos as Parameters<typeof LatestVideos>[0]['videos']} />}

      {/* 6. Final CTA — free platform value */}
      <CTASection />
    </>
  );
}
