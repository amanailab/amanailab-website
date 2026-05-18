export const revalidate = 3600

import type { Metadata } from "next";
import NewsFeed from "@/components/news/NewsFeed";

export const metadata: Metadata = {
  title: "Daily AI News — LLMs, Agents, Models & Research Curated for Engineers | AmanAI Lab",
  description:
    "Stay up to date with the latest AI/ML developments. Curated daily news on LLMs, AI agents, new models, research papers, tools, and the AI ecosystem — handpicked for ML engineers.",
  alternates: { canonical: 'https://amanailab.com/news' },
  openGraph: {
    title: 'Daily AI News — Curated for ML Engineers',
    description: 'Latest updates on LLMs, AI agents, models, research papers and tools. Curated daily for AI/ML engineers.',
    images: [{ url: '/api/og/tool?name=AI+News&tagline=Daily+AI%2FML+updates+for+engineers&emoji=%F0%9F%93%B0&tool=news', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function NewsPage() {
  return (
    <div className="pt-20">
      <NewsFeed />
    </div>
  );
}
