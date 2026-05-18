import type { Metadata } from "next";
import AboutContent from "@/components/about/AboutContent";
import { getChannelStats, formatStats } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "About AmanAI Lab — Free AI/ML Interview Prep Platform | Aman Chauhan",
  description:
    "AmanAI Lab is built by Aman Chauhan to help AI/ML engineers land their dream jobs. Free mock interviews, Code Lab, Interview Prep Sheet, and 19+ AI-powered tools — trusted by engineers at Google, Meta, OpenAI and more.",
  alternates: { canonical: 'https://amanailab.com/about' },
  openGraph: {
    title: 'About AmanAI Lab — Free AI/ML Interview Prep by Aman Chauhan',
    description: 'The most complete free platform for AI/ML engineers. Mock interviews, Code Lab, Interview Sheet, and 19+ tools. Built by Aman Chauhan.',
    images: [{ url: '/api/og/tool?name=About+AmanAI+Lab&tagline=Free+AI%2FML+interview+prep+platform&emoji=%F0%9F%A7%A0&tool=about', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default async function AboutPage() {
  const stats = await getChannelStats();
  const fmt = formatStats(stats);

  const videoCount = `${fmt.videos.value}${fmt.videos.suffix}`;
  const subscriberCount = `${fmt.subs.value}${fmt.subs.suffix}`;
  const viewCount = `${fmt.views.value}${fmt.views.suffix}`;

  return (
    <div className="pt-20">
      <AboutContent
        videoCount={videoCount}
        subscriberCount={subscriberCount}
        viewCount={viewCount}
      />
    </div>
  );
}
