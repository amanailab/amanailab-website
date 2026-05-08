"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Target, TrendingUp, Trophy, ArrowRight } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Target,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    title: "Assess where you stand",
    description: "Complete a mock interview to get your AI readiness score (0–100). See exactly which topics need work — LLM, RAG, MLOps, or System Design.",
    href: "/interview?tab=simulator",
    cta: "Take Mock Interview",
  },
  {
    number: "02",
    icon: TrendingUp,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "Target your weak spots",
    description: "Use the Skill Gap Analyzer to paste any job description and see exactly what's missing. Practice with flashcards, Code Lab problems, and topic deep-dives.",
    href: "/skill-gap",
    cta: "Analyze My Gaps",
  },
  {
    number: "03",
    icon: Trophy,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    title: "Get interview-ready",
    description: "Practice company-specific questions for Google, Meta, OpenAI. Track your readiness score climb from 40% → 80%+ and walk into interviews with confidence.",
    href: "/companies",
    cta: "Practice by Company",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-zinc-900/30">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-orange-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
            From zero to job offer in 3 steps
          </h2>
          <p className="text-zinc-400 text-base max-w-xl mx-auto">
            A structured path for every AI/ML candidate — whether you&apos;re starting from scratch or preparing for a FAANG interview.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-zinc-700 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${step.bg} shrink-0`}>
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <span className={`text-3xl font-extrabold ${step.color} opacity-30 tabular-nums`}>
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100 mb-2">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
                </div>
                <Link href={step.href}
                  className={`flex items-center gap-1.5 text-xs font-semibold mt-auto ${step.color} hover:underline group-hover:gap-2 transition-all`}>
                  {step.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
