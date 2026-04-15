"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { YoutubeIcon } from "@/components/icons/SocialIcons";

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-4xl mx-auto overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, #f97316 0%, transparent 60%)",
          }}
        />

        {/* Corner decorations */}
        <div className="absolute top-6 left-6 w-16 h-16 border border-zinc-700/50 rounded-full opacity-40" />
        <div className="absolute bottom-6 right-6 w-24 h-24 border border-zinc-700/50 rounded-full opacity-30" />
        <div className="absolute bottom-10 right-10 w-10 h-10 border border-orange-500/20 rounded-full" />

        <div className="relative z-10 px-8 sm:px-16 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            New content weekly
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Ready to build with{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #fb923c, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI?
            </span>
          </h2>

          <p className="text-zinc-400 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Join thousands of developers learning Generative AI, LLMs, and AI Agents
            with hands-on, production-focused tutorials.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://youtube.com/@AmanAI_lab"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 text-[15px]"
            >
              <YoutubeIcon className="w-5 h-5" />
              Subscribe on YouTube
            </a>
            <Link
              href="/series"
              className="inline-flex items-center justify-center gap-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 text-[15px]"
            >
              Browse All Series
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
