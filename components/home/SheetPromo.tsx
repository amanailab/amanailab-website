"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Code2, Layers, PenLine,
  CheckCircle2, Sparkles, HelpCircle, MessageCircle,
} from "lucide-react";

const TRACKS = [
  { icon: "✨", label: "Generative AI",    color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { icon: "🤖", label: "Agentic AI",       color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { icon: "🧠", label: "Deep Learning",    color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20"   },
  { icon: "📊", label: "Machine Learning", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
  { icon: "⚙️", label: "MLOps",            color: "text-teal-400",   bg: "bg-teal-500/10 border-teal-500/20"   },
  { icon: "🏗️", label: "System Design",    color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20"     },
]

const FEATURES = [
  {
    icon: BookOpen,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    label: "Theory for every concept",
    desc: "Click any item to expand an inline explanation — no page navigation, no context switching.",
  },
  {
    icon: Code2,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    label: "45+ Code Lab problems",
    desc: "Code icons open the Code Lab editor with that exact algorithm pre-loaded and ready to solve.",
  },
  {
    icon: Layers,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "Flashcards & topic quizzes",
    desc: "Every topic links directly to focused flashcard decks and AI-generated MCQ quizzes.",
  },
  {
    icon: PenLine,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    label: "System Design Workspace",
    desc: "15 classic design problems with a structured editor, must-cover checklist, and AI review.",
  },
]

const CHECKLIST = [
  "Theory · Code · Projects · Mock Interviews — all in one place",
  "Progress saved automatically to localStorage, no account needed",
  "Covers Transformers, RAG, LangGraph, MCP, GRPO and 2026 hot topics",
  "Company tags show which problems Google, Meta, OpenAI actually ask",
  "System Design Workspace with AI feedback on your written answers",
]

export default function SheetPromo() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-zinc-900/30">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI Interview Prep Sheet · 2026 Edition
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
            The A‑to‑Z AI/ML Interview Roadmap
          </h2>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto">
            Inspired by Striver&apos;s A2Z DSA Sheet — but built for 2026 AI/ML interviews.
            One structured path from zero to interview-ready across 6 complete tracks.
          </p>
        </motion.div>

        {/* ── 6 Tracks ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-12">
          {TRACKS.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center ${t.bg}`}
            >
              <span className="text-2xl leading-none">{t.icon}</span>
              <span className={`text-[11px] font-semibold leading-snug ${t.color}`}>{t.label}</span>
            </motion.div>
          ))}
        </div>

        {/* ── 2-col: Features left, checklist right ──────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${f.bg}`}>
                    <Icon className={`w-4 h-4 ${f.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100 mb-1">{f.label}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Checklist CTA card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex flex-col justify-between overflow-hidden"
          >
            {/* Gradient accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

            <div>
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-[0.2em] mb-4">
                What&apos;s included
              </p>
              <div className="space-y-3 mb-8">
                {CHECKLIST.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Link
                href="/sheet"
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 text-sm"
              >
                Start the Interview Prep Sheet
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-zinc-600 text-center mt-2.5">
                Free · Auto-saves progress · No sign-up required
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Bottom resource legend ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-600"
        >
          <span className="font-medium text-zinc-500 mr-1">Each item is linked to:</span>
          {[
            { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Theory" },
            { icon: <Code2 className="w-3.5 h-3.5" />, label: "Code Lab" },
            { icon: <Layers className="w-3.5 h-3.5" />, label: "Flashcards" },
            { icon: <HelpCircle className="w-3.5 h-3.5" />, label: "Quiz" },
            { icon: <MessageCircle className="w-3.5 h-3.5" />, label: "Mock Interview" },
            { icon: <PenLine className="w-3.5 h-3.5" />, label: "Design Workspace" },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-zinc-500">
              {icon}
              <span>{label}</span>
            </span>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
