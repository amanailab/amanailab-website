"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BrainCircuit, Code2, ListChecks, FileText, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
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
    description: "Voice-enabled mock interviews with instant AI scoring. 14 topics: LLM, RAG, Agents, MLOps, System Design and more.",
    features: ["Instant 0–10 scoring with feedback", "Voice input supported", "Model answers for every question"],
    cta: "Start Interview",
    href: "/interview?tab=simulator",
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
    badge: "2026 Edition",
    badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/25",
    icon: ListChecks,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10 border-orange-500/25",
    accent: "from-orange-500/8 to-transparent",
    borderBase: "border-zinc-800",
    borderHover: "hover:border-orange-500/40",
    title: "Interview Prep Sheet",
    description: `A structured A-to-Z roadmap across 7 tracks — ${SITE_STATS.sheetTopics} topics with inline theory, code problems, flashcards, and system design workspace.`,
    features: [`${SITE_STATS.sheetTopics} topics · 7 complete tracks`, "Inline theory for every concept", "System Design Workspace + AI review"],
    cta: "Start Sheet",
    href: "/sheet",
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
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Core Tools
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
            Everything You Need to Land an AI/ML Job
          </h2>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto">
            Four tools that cover every stage — from resume to interview. All free, no account required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURED.map((tool, i) => {
            const Icon = tool.icon
            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  href={tool.href}
                  className={`group relative flex flex-col h-full bg-zinc-900/70 backdrop-blur-sm border ${tool.borderBase} ${tool.borderHover} rounded-2xl p-6 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`}
                >
                  {/* Hover gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                  {/* Top accent line — appears on hover */}
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-60 ${tool.iconColor} transition-opacity duration-300 pointer-events-none`} />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${tool.iconBg} group-hover:scale-105 transition-transform duration-300`}>
                        <Icon className={`w-5 h-5 ${tool.iconColor}`} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${tool.badgeColor}`}>
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="text-[15px] font-bold text-zinc-100 mb-2 leading-tight">{tool.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed mb-5 flex-1">{tool.description}</p>

                    <ul className="space-y-2 mb-6">
                      {tool.features.map(f => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${tool.iconColor} opacity-70`} />
                          <span className="text-xs text-zinc-400 leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${tool.iconColor} group-hover:gap-2.5 transition-all`}>
                      {tool.cta} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
