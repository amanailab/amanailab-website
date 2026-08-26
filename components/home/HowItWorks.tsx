"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Target, Map, Dumbbell, Trophy, ArrowRight } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Target,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
    ring: "ring-orange-500/20",
    title: "Find your gaps",
    description: "Paste a job description into the Skill Gap Analyzer to see exactly what you're missing — no guesswork about where to start.",
    href: "/skill-gap",
    cta: "Analyze My Gaps",
  },
  {
    number: "02",
    icon: Map,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30",
    ring: "ring-violet-500/20",
    title: "Follow the path",
    description: "Work through the Career Roadmap — a week-by-week AI/ML learning path from foundations to modern AI, production & system design.",
    href: "/career?tab=roadmap",
    cta: "Open the Roadmap",
  },
  {
    number: "03",
    icon: Dumbbell,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    ring: "ring-blue-500/20",
    title: "Practice for real",
    description: "Run timed mock interviews with instant AI scoring and solve real coding problems in the Code Lab until it's second nature.",
    href: "/interview?tab=simulator",
    cta: "Start Practicing",
  },
  {
    number: "04",
    icon: Trophy,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    ring: "ring-green-500/20",
    title: "Target the job",
    description: "Prep company-specific questions for Google, Meta & OpenAI, then sharpen your resume against the JD — and walk in confident.",
    href: "/companies",
    cta: "Prep by Company",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-orange-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            Start Here
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
            Not sure where to begin? Follow these 4 steps.
          </h2>
          <p className="text-zinc-400 text-base max-w-xl mx-auto">
            One clear path from &ldquo;I don&apos;t know what to study&rdquo; to interview-ready — do them in order.
          </p>
        </motion.div>

        <div className="relative">
          {/* Desktop connector line */}
          <div className="hidden lg:block absolute top-[26px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-gradient-to-r from-orange-500/30 via-zinc-600/60 to-green-500/30 pointer-events-none" aria-hidden />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 group"
                >
                  {/* Step indicator */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border ring-4 ${step.ring} flex items-center justify-center shrink-0 ${step.bg} relative z-10 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-4.5 h-4.5 ${step.color}`} />
                    </div>
                    <span className={`text-4xl font-black tabular-nums ${step.color} opacity-15 group-hover:opacity-25 transition-opacity`}>
                      {step.number}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-100 mb-2">{step.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
                  </div>

                  <Link href={step.href}
                    className={`flex items-center gap-1.5 text-xs font-semibold mt-auto ${step.color} hover:underline group-hover:gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 rounded-sm`}>
                    {step.cta} <ArrowRight className="w-3.5 h-3.5" />
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
