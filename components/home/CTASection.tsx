"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Zap, Crown } from "lucide-react";
import { SITE_STATS } from "@/lib/site-stats";

const FREE_FEATURES = [
  `AI mock interviews — ${SITE_STATS.questions} questions, voice + text`,
  `Code Lab — ${SITE_STATS.codeProblems}+ algorithm problems in browser`,
  `A-to-Z Prep Sheet — ${SITE_STATS.sheetTopics} topics, 8 tracks`,
  `Skill Gap Analyzer, Daily Challenge, Flashcards`,
  `Dashboard with readiness score, streaks & achievements`,
];

const PRO_EXTRAS = [
  "Unlimited System Design AI reviews",
  "Full AI Resume Analyzer & cover letter",
  "LinkedIn optimizer + mock interviews daily",
  "15 AI reviews/day — never run out mid-prep",
];

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-5xl mx-auto"
      >
        {/* Main CTA card */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          <div className="absolute inset-0 opacity-5"
            style={{ background: "radial-gradient(ellipse at 50% 0%, #f97316 0%, transparent 60%)" }} />

          <div className="relative z-10 grid md:grid-cols-2 gap-10 px-8 sm:px-12 py-14 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Start Free Today
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight text-zinc-100">
                Your{" "}
                <span style={{ backgroundImage: "linear-gradient(135deg, #fb923c, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  AI/ML career
                </span>{" "}
                starts here
              </h2>
              <p className="text-zinc-400 text-base mb-8 leading-relaxed">
                Everything you need to land an offer at Google, Meta, OpenAI or any AI company. Free forever — no credit card, no catch.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25">
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/skill-gap"
                  className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold px-7 py-3.5 rounded-xl transition-all">
                  Analyze My Skill Gaps
                </Link>
              </div>
            </div>

            {/* Right: free vs pro */}
            <div className="space-y-4">
              {/* Free tier */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-sm font-bold text-zinc-100">Free — always</span>
                </div>
                <ul className="space-y-2">
                  {FREE_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-zinc-500 mt-2 shrink-0" />
                      <span className="text-xs text-zinc-400 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro tier */}
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="text-sm font-bold text-zinc-100">Pro — from ₹799/mo</span>
                  </div>
                  <Link href="/upgrade" className="flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors">
                    <Crown className="w-3 h-3" /> See plans
                  </Link>
                </div>
                <ul className="space-y-2">
                  {PRO_EXTRAS.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Zap className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-zinc-300 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
