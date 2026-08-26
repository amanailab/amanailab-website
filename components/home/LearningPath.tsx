"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, BrainCircuit, Rocket, ArrowRight, CheckCircle2 } from "lucide-react";

const PHASES = [
  {
    phase: "Phase 1",
    label: "Know Your Gaps",
    weeks: "Week 1–2",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/25",
    glow: "from-blue-500/5",
    steps: [
      { text: "Run the Skill Gap Analyzer against a target JD", href: "/skill-gap" },
      { text: "Study weak topics on the A-to-Z Prep Sheet", href: "/sheet" },
      { text: "Read 500+ questions with model answers", href: "/questions" },
    ],
  },
  {
    phase: "Phase 2",
    label: "Build & Practice",
    weeks: "Week 3–5",
    icon: BrainCircuit,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/25",
    glow: "from-violet-500/5",
    steps: [
      { text: "Daily AI mock interviews — score yourself 0–10", href: "/interview?tab=simulator" },
      { text: "Implement ML algorithms in the Code Lab", href: "/code-lab" },
      { text: "Practice system design with AI review", href: "/system-design" },
    ],
  },
  {
    phase: "Phase 3",
    label: "Apply & Nail It",
    weeks: "Week 6+",
    icon: Rocket,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/25",
    glow: "from-orange-500/5",
    steps: [
      { text: "Polish your resume — ATS score + JD match", href: "/resume" },
      { text: "Generate a role-specific cover letter", href: "/resume" },
      { text: "Track applications in the Job Tracker", href: "/job-tracker" },
    ],
  },
];

export default function LearningPath() {
  return (
    <section className="py-20 px-4 sm:px-6 border-t border-zinc-800/60">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <Rocket className="w-3.5 h-3.5" />
            Your Roadmap
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
            From Zero to Offer — in 6 Weeks
          </h2>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto">
            A structured path that takes you from &ldquo;I don&apos;t know what to study&rdquo; to walking into interviews with confidence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[calc(33.3%+1rem)] right-[calc(33.3%+1rem)] h-px bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-orange-500/40" aria-hidden />

          {PHASES.map((phase, i) => {
            const Icon = phase.icon;
            return (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 overflow-hidden group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${phase.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                <div className="relative z-10">
                  {/* Phase header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${phase.bg}`}>
                      <Icon className={`w-5 h-5 ${phase.color}`} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${phase.color}`}>{phase.phase}</p>
                      <p className="text-sm font-bold text-zinc-100 leading-tight">{phase.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{phase.weeks}</p>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-3">
                    {phase.steps.map((step) => (
                      <Link
                        key={step.text}
                        href={step.href}
                        className="flex items-start gap-2.5 group/step"
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${phase.color} opacity-60 group-hover/step:opacity-100 transition-opacity`} />
                        <span className="text-xs text-zinc-400 group-hover/step:text-zinc-200 transition-colors leading-snug">
                          {step.text}
                        </span>
                      </Link>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href={phase.steps[0].href}
                    className={`mt-5 inline-flex items-center gap-1.5 text-xs font-semibold ${phase.color} hover:gap-2.5 transition-all`}
                  >
                    Start this phase <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom nudge */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-xs text-zinc-600 mt-8"
        >
          All three phases use free tools. Upgrade for unlimited daily AI reviews when you&apos;re actively interviewing.
        </motion.p>
      </div>
    </section>
  );
}
