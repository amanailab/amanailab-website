"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BrainCircuit, Code2, ListChecks, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const FEATURED = [
  {
    badge: "Most Popular",
    badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/25",
    icon: BrainCircuit,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/25",
    accent: "from-violet-500/8 to-transparent",
    borderActive: "border-violet-500/30 hover:border-violet-500/50",
    title: "AI Mock Interview Simulator",
    description: "Practice real AI/ML interview questions with an AI interviewer. Voice-enabled, instant 0–10 scoring, and model answers with full feedback.",
    features: ["14 topics: LLM, RAG, Agents, MLOps…", "Voice input + instant AI scoring", "Model answers + missed points"],
    cta: "Start Interview",
    href: "/interview?tab=simulator",
  },
  {
    badge: "45 Problems",
    badgeColor: "text-green-400 bg-green-500/10 border-green-500/25",
    icon: Code2,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/10 border-green-500/25",
    accent: "from-green-500/8 to-transparent",
    borderActive: "border-green-500/30 hover:border-green-500/50",
    title: "AI/ML Code Lab",
    description: "Implement AI/ML algorithms from scratch in the browser — softmax, attention, backprop, RAG pipelines. Earn XP, unlock 6 levels.",
    features: ["45 hand-crafted coding problems", "Python runs in your browser", "Earn XP & unlock AI Master"],
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
    borderActive: "border-orange-500/30 hover:border-orange-500/50",
    title: "A‑to‑Z Interview Prep Sheet",
    description: "A structured roadmap across 6 tracks — Generative AI, Agentic AI, Deep Learning, ML, MLOps, System Design. Theory + code + mock interviews linked per item.",
    features: ["218 topics with inline theory", "Code Lab problems linked per item", "System Design Workspace with AI review"],
    cta: "Start Sheet",
    href: "/sheet",
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
            Three tools that cover every stage of your interview prep — from daily practice to the final interview.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURED.map((tool, i) => {
            const Icon = tool.icon
            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link
                  href={tool.href}
                  className={`group relative flex flex-col h-full bg-zinc-900 border rounded-2xl p-6 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${tool.borderActive}`}
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${tool.iconBg}`}>
                        <Icon className={`w-5 h-5 ${tool.iconColor}`} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${tool.badgeColor}`}>
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-100 mb-2 leading-tight">{tool.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed mb-5 flex-1">{tool.description}</p>

                    <ul className="space-y-2 mb-6">
                      {tool.features.map(f => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${tool.iconColor} opacity-80`} />
                          <span className="text-xs text-zinc-400 leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${tool.iconColor} group-hover:gap-2.5 transition-all`}>
                      {tool.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
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
