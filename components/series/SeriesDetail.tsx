"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, BookOpen, ArrowLeft, ExternalLink } from "lucide-react";
import type { Playlist, Video } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const levelConfig: Record<string, { text: string; bg: string }> = {
  Beginner:     { text: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  Intermediate: { text: "text-blue-400",  bg: "bg-blue-400/10 border-blue-400/20"  },
  Advanced:     { text: "text-red-400",   bg: "bg-red-400/10 border-red-400/20"    },
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)   return "Today";
  if (days < 7)   return `${days}d ago`;
  if (days < 30)  return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function cleanDescription(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")           // remove URLs
    .replace(/#\S+/g, "")                      // remove hashtags
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, "") // remove emojis
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Expandable description ───────────────────────────────────────────────────

function ExpandableDescription({ raw }: { raw: string }) {
  const [expanded, setExpanded] = useState(false);
  const text = cleanDescription(raw);
  const needsTruncation = text.length > 200;
  const displayed = expanded || !needsTruncation ? text : text.slice(0, 200).trimEnd() + "…";

  if (!text) return null;

  return (
    <div>
      <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">{displayed}</p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-orange-400 text-xs mt-1.5 hover:underline focus:outline-none"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SeriesDetailProps {
  playlist: Playlist;
  videos: Video[];
}

export default function SeriesDetail({ playlist, videos }: SeriesDetailProps) {
  const level = levelConfig[playlist.level] ?? levelConfig["Intermediate"];

  // Best thumbnail: first video's maxresdefault, then API thumbnail, then null
  const thumbnailSrc: string | null =
    videos[0]?.id
      ? `https://img.youtube.com/vi/${videos[0].id}/maxresdefault.jpg`
      : playlist.thumbnail || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Link
          href="/series"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Series
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div
          className="relative rounded-2xl overflow-hidden p-6 sm:p-10 mb-8"
          style={{
            background: `linear-gradient(135deg, ${playlist.gradientFrom}18 0%, ${playlist.gradientTo}18 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ background: `linear-gradient(135deg, ${playlist.gradientFrom}, ${playlist.gradientTo})` }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-start gap-6">

            {/* Thumbnail */}
            <div className="relative w-44 h-28 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
              {thumbnailSrc ? (
                <Image
                  src={thumbnailSrc}
                  alt={playlist.title}
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${playlist.gradientFrom}, ${playlist.gradientTo})` }}
                />
              )}
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {playlist.isNew && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    New
                  </span>
                )}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${level.text} ${level.bg}`}>
                  {playlist.level}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800/60 px-2.5 py-1 rounded-full">
                  <BookOpen className="w-3.5 h-3.5" />
                  {playlist.videoCount} videos
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">{playlist.title}</h1>

              {playlist.description && (
                <ExpandableDescription raw={playlist.description} />
              )}

              {playlist.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {playlist.tags.map((tag) => (
                    <span key={tag} className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <a
              href={playlist.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-xl transition-colors shrink-0 self-start"
            >
              Open Playlist
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Videos list */}
      {videos.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">No videos found in this series.</div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-6">
            Videos
            <span className="text-zinc-500 font-normal text-base ml-2">({videos.length})</span>
          </h2>
          <div className="flex flex-col gap-3">
            {videos.map((video, i) => (
              <motion.a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                className="group flex gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden p-3 items-center"
              >
                {/* Episode number */}
                <div className="w-8 text-center text-xs text-zinc-600 font-mono shrink-0 select-none">
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Thumbnail */}
                <div className="relative w-36 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="144px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-700" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-black/50 group-hover:bg-orange-500/80 rounded-full flex items-center justify-center transition-colors">
                      <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info — title + time only, no description */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold group-hover:text-orange-400 transition-colors line-clamp-1 leading-snug">
                    {video.title}
                  </h3>
                  <p className="text-zinc-600 text-xs mt-1">{timeAgo(video.publishedAt)}</p>
                </div>

                <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors shrink-0 mr-1" />
              </motion.a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
