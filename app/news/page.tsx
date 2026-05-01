import type { Metadata } from "next";
import NewsFeed from "@/components/news/NewsFeed";

export const metadata: Metadata = {
  title: "AI News Feed | AmanAI Lab",
  description:
    "Latest AI updates curated for developers. Models, research, tools, agents, and India AI — updated daily.",
};

export default function NewsPage() {
  return (
    <div className="pt-16">
      <NewsFeed />
    </div>
  );
}
