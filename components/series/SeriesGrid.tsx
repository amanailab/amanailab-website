"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, BookOpen } from "lucide-react";
import type { Playlist } from "@/lib/types";

const categories = [
  { id: "all",         label: "All Series"   },
  { id: "llm",         label: "LLMs"         },
  { id: "agents",      label: "AI Agents"    },
  { id: "rag",         label: "RAG"          },
  { id: "prompting",   label: "Prompting"    },
  { id: "development", label: "Development"  },
];

const levelConfig: Record<string, { text: string; bg: string }> = {
  Beginner:     { text: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  Intermediate: { text: "text-blue-400",  bg: "bg-blue-400/10 border-blue-400/20"  },
  Advanced:     { text: "text-red-400",   bg: "bg-red-400/10 border-red-400/20"    },
};

// ─── Card (needs its own state for image error) ───────────────────────────────

function PlaylistCard({ s, i }: { s: Playlist; i: number }) {
  const [imgError, setImgError] = useState(false);
  const level = levelConfig[s.level] ?? levelConfig["Intermediate"];
  const showImage = !!s.thumbnail && !imgError;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: i * 0.04 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden group flex flex-col cursor-pointer"
    >
      <Link href={`/series/${s.id}`} className="flex flex-col flex-1">

        {/* Thumbnail */}
        <div className="h-40 relative overflow-hidden">

          {/* Gradient base layer — always visible, image overlays it */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})` }}
          />

          {/* Actual thumbnail image */}
          {showImage && (
            <Image
              src={s.thumbnail}
              alt={s.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          )}

          {/* Dark overlay so play button and badges are readable */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Decorative gradient circles (shown when no image) */}
          {!showImage && (
            <>
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
                style={{ background: s.gradientFrom }}
              />
              <div
                className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-20"
                style={{ background: s.gradientTo }}
              />
            </>
          )}

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500/70 transition-all duration-300">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>

          {/* Title overlay at bottom when no image */}
          {!showImage && (
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
              <p className="text-white/80 text-xs font-semibold line-clamp-1">{s.title}</p>
            </div>
          )}

          {/* New badge */}
          {s.isNew && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              New
            </div>
          )}

          {/* Level badge */}
          <div className="absolute top-3 right-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${level.text} ${level.bg}`}>
              {s.level}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-base font-bold mb-2 group-hover:text-orange-400 transition-colors leading-snug">
            {s.title}
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4 flex-1">
            {s.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {s.tags.map((tag) => (
              <span key={tag} className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-zinc-800 text-zinc-500 text-xs">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {s.videoCount} videos
            </span>
          </div>
        </div>

      </Link>
    </motion.div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export default function SeriesGrid({ playlists }: { playlists: Playlist[] }) {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all" ? playlists : playlists.filter((s) => s.category === active);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <p className="text-orange-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
          Learning Paths
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">All Series</h1>
        <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
          Structured paths to take you from AI beginner to production-ready developer.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-10"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === cat.id
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((s, i) => (
            <PlaylistCard key={s.id} s={s} i={i} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          No series in this category yet.
        </div>
      )}
    </div>
  );
}
