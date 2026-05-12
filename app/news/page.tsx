export const revalidate = 3600

import type { Metadata } from "next";
import NewsFeed from "@/components/news/NewsFeed";

export const metadata: Metadata = {
  title: "AI News Feed",
  description:
    "Latest AI updates curated for developers. Models, research, tools, agents, and India AI — updated daily.",
  alternates: { canonical: 'https://amanailab.com/news' },
};

export default function NewsPage() {
  return (
    <div className="pt-20">
      <NewsFeed />
    </div>
  );
}
