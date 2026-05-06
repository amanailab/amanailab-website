import { getChannelStats, getLatestVideos, getPlaylists, formatStats } from "@/lib/youtube";
import HeroSection from "@/components/home/HeroSection";
import SocialProofBar from "@/components/home/SocialProofBar";
import ToolsShowcase from "@/components/home/ToolsShowcase";
import StatsSection from "@/components/home/StatsSection";
import FeaturedSeries from "@/components/home/FeaturedSeries";
import LatestVideos from "@/components/home/LatestVideos";
import CTASection from "@/components/home/CTASection";

export const revalidate = 300;

export default async function HomePage() {
  const [stats, videos, playlists] = await Promise.all([
    getChannelStats(),
    getLatestVideos(6),
    getPlaylists(20),
  ]);

  const formattedStats = formatStats(stats);
  const featured = playlists.slice(0, 3);

  return (
    <>
      <HeroSection />
      <SocialProofBar />
      <ToolsShowcase />
      <StatsSection stats={formattedStats} />
      <FeaturedSeries playlists={featured} />
      {videos.length > 0 && <LatestVideos videos={videos} />}
      <CTASection />
    </>
  );
}
