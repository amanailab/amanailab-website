"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Zap, Crown, BrainCircuit, Code2, Target, FileText } from "lucide-react";
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

const TOOLS_PREVIEW = [
  { icon: BrainCircuit, label: "Mock Interview", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Code2,        label: "Code Lab",       color: "text-green-400",  bg: "bg-green-500/10"  },
  { icon: Target,       label: "Skill Gap",      color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: FileText,     label: "Resume AI",      color: "text-yellow-400", bg: "bg-yellow-500/10" },
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
        <div className="relative overflow-hidden rounded-3xl border border-zinc-700/60 bg-zinc-900">
          {/* Top orange line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          {/* Radial glow */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% -20%, #f97316 0%, transparent 55%)" }} />

          <div className="relative z-10 grid md:grid-cols-2 gap-10 px-7 sm:px-12 py-12 sm:py-16 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Start Free Today
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-[1.1] text-zinc-100">
                Your{" "}
                <span style={{ backgroundImage: "linear-gradient(135deg, #fb923c, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  AI/ML career
                </span>{" "}
                starts here
              </h2>
              <p className="text-zinc-400 text-base mb-8 leading-relaxed">
                Everything you need to land an offer at Google, Meta, OpenAI or any AI company. Free forever — no credit card, no catch.
              </p>

              {/* Tool mini-preview */}
              <div className="flex gap-2 flex-wrap mb-8">
                {TOOLS_PREVIEW.map(t => {
                  const Icon = t.icon
                  return (
                    <div key={t.label} className={`flex items-center gap-1.5 ${t.bg} border border-zinc-700/60 rounded-xl px-3 py-2`}>
                      <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                      <span className="text-[11px] font-semibold text-zinc-300">{t.label}</span>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 text-[15px]">
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/skill-gap"
                  className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold px-7 py-3.5 rounded-xl transition-all text-[15px]">
                  Analyze My Skill Gaps
                </Link>
              </div>
              <p className="mt-4 text-xs text-zinc-600">Free forever · No credit card required</p>
            </div>

            {/* Right: free vs pro */}
            <div className="space-y-3">
              {/* Free tier */}
              <div className="bg-zinc-800/40 border border-zinc-700/60 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
              <div className="bg-gradient-to-br from-orange-500/8 to-transparent border border-orange-500/25 rounded-2xl p-5">
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
