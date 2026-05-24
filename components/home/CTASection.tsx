"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const FREE_FEATURES = [
  "19+ AI-powered tools — completely free, no credit card needed",
  "AI interview simulator with voice + instant scoring (0–10)",
  "A-to-Z Interview Sheet — 231 topics across 7 tracks",
  "AI/ML Code Lab — 45 problems to implement from scratch, earn XP",
  "AI Resume Analyzer — ATS score, JD match & cover letter generator",
  "System Design Workspace — 15 problems with AI review",
  "🔥 Daily Challenge — one question every day to build your streak",
  "500+ real questions from Google, Meta, OpenAI & more",
]

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
        <div className="absolute inset-0 opacity-5"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #6366f1 0%, transparent 60%)" }} />

        <div className="relative z-10 grid md:grid-cols-2 gap-10 px-8 sm:px-12 py-14 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              100% Free — Always
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight text-zinc-100">
              Start your{" "}
              <span style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                AI/ML career
              </span>{" "}
              journey today
            </h2>
            <p className="text-zinc-400 text-base mb-8 leading-relaxed">
              Everything you need to land a job at Google, Meta, OpenAI or any AI company — free forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/interview?tab=simulator"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25">
                Start Practicing Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/skill-gap"
                className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold px-7 py-3.5 rounded-xl transition-all">
                Analyze My Skill Gaps
              </Link>
            </div>
          </div>

          {/* Right: feature list */}
          <div className="flex flex-col gap-3.5">
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-300 leading-relaxed">{f}</p>
              </div>
            ))}
            <p className="text-xs text-zinc-600 mt-1 pl-7">No sign-up required to start. Create a free account to track progress.</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
