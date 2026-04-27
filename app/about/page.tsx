import type { Metadata } from "next";
import AboutContent from "@/components/about/AboutContent";
import { getChannelStats, formatStats } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "About | AmanAI Lab",
  description:
    "Learn about AmanAI Lab — teaching Generative AI, LLMs, and AI Agents to developers worldwide.",
};

export default async function AboutPage() {
  const stats = await getChannelStats();
  const fmt = formatStats(stats);

  const videoCount = `${fmt.videos.value}${fmt.videos.suffix}`;
  const subscriberCount = `${fmt.subs.value}${fmt.subs.suffix}`;
  const viewCount = `${fmt.views.value}${fmt.views.suffix}`;

  return (
    <div className="pt-16">
      <AboutContent
        videoCount={videoCount}
        subscriberCount={subscriberCount}
        viewCount={viewCount}
      />
    </div>
  );
}
