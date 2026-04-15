"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Play, ExternalLink } from "lucide-react";
import type { Video } from "@/lib/types";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function LatestVideos({ videos }: { videos: Video[] }) {
  if (!videos.length) return null;

  const [featured, ...rest] = videos;

  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <p className="text-orange-500 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
          Fresh Content
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold">Latest Videos</h2>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Featured video — large */}
        <motion.a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="relative aspect-video overflow-hidden bg-zinc-800">
            {featured.thumbnail ? (
              <Image
                src={featured.thumbnail}
                alt={featured.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-zinc-800" />
            )}
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 bg-orange-500/90 group-hover:bg-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/30 group-hover:scale-110 transition-all">
                <Play className="w-7 h-7 text-white ml-1" />
              </div>
            </div>
            {/* Latest badge */}
            <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Latest
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-base group-hover:text-orange-400 transition-colors leading-snug mb-2 line-clamp-2">
              {featured.title}
            </h3>
            {featured.description && (
              <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed mb-3">
                {featured.description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{timeAgo(featured.publishedAt)}</span>
              <span className="flex items-center gap-1 text-orange-500">
                Watch now <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </motion.a>

        {/* Rest — small list */}
        <div className="flex flex-col gap-3">
          {rest.slice(0, 5).map((video, i) => (
            <motion.a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              whileHover={{ x: 4, transition: { duration: 0.15 } }}
              className="group flex gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden p-3 items-center"
            >
              {/* Thumbnail */}
              <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                {video.thumbnail ? (
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 bg-zinc-700" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-7 h-7 bg-black/50 group-hover:bg-orange-500/80 rounded-full flex items-center justify-center transition-colors">
                    <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                  </div>
                </div>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                  {video.title}
                </h4>
                <p className="text-zinc-600 text-xs mt-1">{timeAgo(video.publishedAt)}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
