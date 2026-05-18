import type { Metadata } from "next";
import { getPlaylists } from "@/lib/youtube";
import SeriesGrid from "@/components/series/SeriesGrid";

export const revalidate = 1800; // 30 minutes

export const metadata: Metadata = {
  title: "AI/ML Learning Series — LLMs, RAG, Agents, Fine-Tuning & More | AmanAI Lab",
  description:
    "Browse structured AI/ML learning series from AmanAI Lab. Deep-dive playlists on LLMs, AI Agents, RAG Systems, Prompt Engineering, Fine-tuning, and production AI development. Free on YouTube.",
  alternates: { canonical: 'https://amanailab.com/series' },
  openGraph: {
    title: 'AI/ML Learning Series — Structured Playlists on LLMs, RAG, Agents & More',
    description: 'Structured AI/ML learning playlists covering LLMs, RAG, Agents, Fine-tuning and production AI. Free on YouTube.',
    images: [{ url: '/api/og/tool?name=AI+Learning+Series&tagline=Structured+playlists+on+LLMs%2C+RAG+%26+Agents&emoji=%F0%9F%8E%AC&tool=series', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default async function SeriesPage() {
  const playlists = await getPlaylists(20);

  return (
    <div className="pt-20">
      <SeriesGrid playlists={playlists} />
    </div>
  );
}
