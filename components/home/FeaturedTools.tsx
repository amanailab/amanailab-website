"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BrainCircuit, Code2, Target, FileText, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { SITE_STATS } from "@/lib/site-stats";

const FEATURED = [
  {
    badge: "Most Popular",
    badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/25",
    icon: BrainCircuit,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/25",
    accent: "from-violet-500/8 to-transparent",
    borderBase: "border-zinc-800",
    borderHover: "hover:border-violet-500/40",
    title: "AI Mock Interview",
    description: "Voice-enabled mock interviews with instant AI scoring. 14 topics: LLM, RAG, Agents, MLOps, System Design and more. Get scored 0–10 with line-by-line feedback on every answer.",
    features: ["Instant 0–10 scoring with feedback", "Voice input supported", "Model answers for every question"],
    cta: "Start Interview",
    href: "/interview?tab=simulator",
    heroStats: [
      { value: "14", label: "Topics" },
      { value: SITE_STATS.questions, label: "Questions" },
      { value: "0–10", label: "AI Score" },
    ],
  },
  {
    badge: `${SITE_STATS.codeProblems} Problems`,
    badgeColor: "text-green-400 bg-green-500/10 border-green-500/25",
    icon: Code2,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/10 border-green-500/25",
    accent: "from-green-500/8 to-transparent",
    borderBase: "border-zinc-800",
    borderHover: "hover:border-green-500/40",
    title: "AI/ML Code Lab",
    description: "Implement AI/ML algorithms from scratch in the browser — softmax, attention, backprop, RAG. Earn XP and unlock 6 levels.",
    features: [`${SITE_STATS.codeProblems} hand-crafted problems`, "Python runs in your browser", "Earn XP · unlock AI Master"],
    cta: "Start Coding",
    href: "/code-lab",
  },
  {
    badge: "JD Matched",
    badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/25",
    icon: Target,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10 border-orange-500/25",
    accent: "from-orange-500/8 to-transparent",
    borderBase: "border-zinc-800",
    borderHover: "hover:border-orange-500/40",
    title: "Skill Gap Analyzer",
    description: "Paste any job description and see exactly which skills you're missing — mapped to your scores.",
    features: ["Paste a JD → instant gap report", "Mapped to your practice scores", "A focused study list, not guesswork"],
    cta: "Analyze My Gaps",
    href: "/skill-gap",
  },
  {
    badge: "ATS Optimized",
    badgeColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
    icon: FileText,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/10 border-yellow-500/25",
    accent: "from-yellow-500/8 to-transparent",
    borderBase: "border-zinc-800",
    borderHover: "hover:border-yellow-500/40",
    title: "AI Resume Analyzer",
    description: "Upload your resume and get an instant ATS score, missing keywords, JD match analysis, and section-by-section feedback.",
    features: ["ATS score + missing keywords", "JD match — paste any job description", "Cover letter generator included"],
    cta: "Analyze Resume",
    href: "/resume",
  },
]

export default function FeaturedTools() {
  const [hero, ...rest] = FEATURED
  const HeroIcon = hero.icon

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Core Tools
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
            Everything You Need to Land an AI/ML Job
          </h2>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto">
            Four tools that cover every stage — from resume to interview. All free.
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">

          {/* ── Hero card (full-width horizontal) ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href={hero.href}
              className={`group relative flex flex-col sm:flex-row gap-6 bg-zinc-900/80 border ${hero.borderBase} ${hero.borderHover} rounded-2xl p-6 sm:p-8 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`}
            >
              {/* Hover gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${hero.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

              {/* Left: main content */}
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${hero.iconBg} group-hover:scale-105 transition-transform duration-300`}>
                    <HeroIcon className={`w-7 h-7 ${hero.iconColor}`} />
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${hero.badgeColor}`}>
                      {hero.badge}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-100 mt-1.5 leading-tight">{hero.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-5 max-w-xl">{hero.description}</p>
                <ul className="flex flex-col sm:flex-row gap-3 sm:gap-5 mb-6">
                  {hero.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${hero.iconColor} opacity-70`} />
                      <span className="text-xs text-zinc-400 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                <span className={`inline-flex items-center gap-2 text-sm font-semibold ${hero.iconColor} group-hover:gap-3 transition-all`}>
                  {hero.cta} <ArrowRight className="w-4 h-4" />
                </span>
              </div>

              {/* Right: stats panel */}
              <div className="relative z-10 flex sm:flex-col justify-start sm:justify-center gap-3 sm:w-40 shrink-0">
                {hero.heroStats!.map(stat => (
                  <div key={stat.label} className="bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-3 flex-1 sm:flex-none">
                    <p className={`text-2xl font-extrabold tabular-nums ${hero.iconColor}`}>{stat.value}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Link>
          </motion.div>

          {/* ── 3 smaller cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {rest.map((tool, i) => {
              const Icon = tool.icon
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                >
                  <Link
                    href={tool.href}
                    className={`group relative flex flex-col h-full bg-zinc-900/70 border ${tool.borderBase} ${tool.borderHover} rounded-2xl p-5 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${tool.iconBg} group-hover:scale-105 transition-transform duration-300`}>
                          <Icon className={`w-5 h-5 ${tool.iconColor}`} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${tool.badgeColor}`}>
                          {tool.badge}
                        </span>
                      </div>

                      <h3 className="text-[15px] font-bold text-zinc-100 mb-1.5 leading-tight">{tool.title}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed mb-4 flex-1">{tool.description}</p>

                      <ul className="space-y-1.5 mb-5">
                        {tool.features.map(f => (
                          <li key={f} className="flex items-start gap-2">
                            <CheckCircle2 className={`w-3 h-3 mt-0.5 flex-shrink-0 ${tool.iconColor} opacity-70`} />
                            <span className="text-[11px] text-zinc-400 leading-snug">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tool.iconColor} group-hover:gap-2.5 transition-all mt-auto`}>
                        {tool.cta} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
