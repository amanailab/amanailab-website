import type { Metadata } from "next";
import { getPlaylists } from "@/lib/youtube";
import SeriesGrid from "@/components/series/SeriesGrid";

export const revalidate = 1800; // 30 minutes

export const metadata: Metadata = {
  title: "Series | AmanAI Lab",
  description:
    "Browse all AI learning series — LLMs, AI Agents, RAG, Prompt Engineering, Fine-tuning, and more.",
};

export default async function SeriesPage() {
  const playlists = await getPlaylists(20);

  return (
    <div className="pt-16">
      <SeriesGrid playlists={playlists} />
    </div>
  );
}
