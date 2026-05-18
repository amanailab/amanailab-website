import type { Metadata } from "next";
import AboutContent from "@/components/about/AboutContent";
import { getChannelStats, formatStats } from "@/lib/youtube";

export const revalidate = 3600

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
  let videoCount = '100+'
  let subscriberCount = '10K+'
  let viewCount = '500K+'
  try {
    const stats = await getChannelStats()
    const fmt = formatStats(stats)
    videoCount = `${fmt.videos.value}${fmt.videos.suffix}`
    subscriberCount = `${fmt.subs.value}${fmt.subs.suffix}`
    viewCount = `${fmt.views.value}${fmt.views.suffix}`
  } catch {
    // Fallback to defaults if YouTube API is unavailable
  }

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
