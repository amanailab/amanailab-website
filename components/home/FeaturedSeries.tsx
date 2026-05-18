"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Play, BookOpen } from "lucide-react";
import type { Playlist } from "@/lib/types";

const STATIC_SERIES = [
  { title: 'LLM Mastery — From Basics to Production', tags: ['LLMs', 'GPT', 'Transformers'], episodes: 12, href: '/series' },
  { title: 'AI Agents & Multi-Agent Systems', tags: ['Agents', 'LangChain', 'Tools'], episodes: 8, href: '/series' },
  { title: 'RAG Systems — Build & Deploy', tags: ['RAG', 'Embeddings', 'Vector DBs'], episodes: 10, href: '/series' },
]

export default function FeaturedSeries({ playlists }: { playlists: Playlist[] }) {
  const hasPlaylists = playlists && playlists.length > 0

  return (
    <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-end justify-between mb-12"
      >
        <div>
          <p className="text-orange-500 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            Featured
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
            Top Series to Start With
          </h2>
        </div>
        <Link
          href="/series"
          className="hidden md:inline-flex items-center gap-1.5 text-zinc-400 hover:text-orange-400 transition-colors text-sm font-medium"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5">
        {hasPlaylists
          ? playlists.map((s, i) => <SeriesCard key={s.id} s={s} i={i} />)
          : STATIC_SERIES.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden flex flex-col group"
              >
                <div className="h-44 flex items-center justify-center relative bg-gradient-to-br from-orange-500/10 to-zinc-900">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold mb-2 group-hover:text-orange-400 transition-colors">{s.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                    {s.tags.map(tag => (
                      <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-zinc-500 text-xs">
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{s.episodes} episodes</span>
                    <Link href={s.href} className="text-orange-500 hover:text-orange-400 font-semibold flex items-center gap-1 text-xs transition-colors">
                      Watch <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
        }
      </div>
      <div className="text-center mt-8 md:hidden">
        <Link href="/series" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-orange-400 transition-colors text-sm font-medium">
          View all series <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function SeriesCard({ s, i }: { s: Playlist; i: number }) {
  const [imgError, setImgError] = useState(false);
  return (
    <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden group flex flex-col"
          >
            {/* Thumbnail */}
            <div
              className="h-44 flex items-center justify-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${s.gradientFrom}22 0%, ${s.gradientTo}22 100%)`,
              }}
            >
              {s.thumbnail && !imgError ? (
                <Image
                  src={s.thumbnail}
                  alt={s.title}
                  fill
                  onError={() => setImgError(true)}
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{ background: `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})` }}
                />
              )}
              <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300 z-10">
                <Play className="w-5 h-5 text-white ml-0.5" />
              </div>
              {s.isNew && (
                <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  New
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-base font-bold mb-2 group-hover:text-orange-400 transition-colors">
                {s.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                {s.description || "A structured learning series on AmanAI Lab."}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {s.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-zinc-500 text-xs">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {s.videoCount} episodes
                </span>
                <Link
                  href={`/series/${s.id}`}
                  className="text-orange-500 hover:text-orange-400 font-semibold flex items-center gap-1 text-xs transition-colors"
                >
                  Start
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
    </motion.div>
  );
}
