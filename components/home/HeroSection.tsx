"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, ListChecks } from "lucide-react";
import { SITE_STATS } from "@/lib/site-stats";

const techPills = [
  "LLMs", "RAG", "AI Agents", "Fine-Tuning", "LangGraph",
  "MCP", "GRPO", "vLLM", "MLOps", "System Design",
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[82vh] flex items-center justify-center overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Orange radial glow + accent halo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="w-[760px] h-[540px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, #f97316 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>
      <motion.div
        aria-hidden
        animate={{ y: [0, -14, 0] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
        className="absolute top-24 left-[12%] w-40 h-40 rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #c026d3 0%, transparent 60%)", filter: "blur(50px)" }}
      />
      <motion.div
        aria-hidden
        animate={{ y: [0, 14, 0] }}
        transition={{ repeat: Infinity, duration: 11, ease: "easeInOut" }}
        className="absolute bottom-32 right-[10%] w-48 h-48 rounded-full opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 60%)", filter: "blur(60px)" }}
      />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-zinc-950 to-transparent" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-sm font-medium px-4 py-2 rounded-full mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {SITE_STATS.tools} free AI tools · {SITE_STATS.questions} questions · A‑to‑Z Interview Sheet
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.15] mb-6"
        >
          Land Your Dream{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              // Fallback for browsers that don't support background-clip:text
              color: "#f97316",
            }}
          >
            AI/ML Job
          </span>
          <br />
          <span className="text-zinc-300">with AI-Powered Tools</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          The complete free platform for AI/ML engineers — mock interviews, code practice, resume scoring, skill-gap analysis and more, all in one place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <Link
            href="/interview?tab=simulator"
            className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            Start Interview Prep
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/sheet"
            className="inline-flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-orange-500/40 text-zinc-100 font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <ListChecks className="w-4 h-4 text-orange-400" />
            A‑to‑Z Interview Sheet
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-4 text-xs text-zinc-600"
        >
          No account required · 100% free · No credit card
        </motion.p>

        {/* Tech pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-wrap justify-center gap-2.5 mt-16"
        >
          {techPills.map((tech) => (
            <span
              key={tech}
              className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs px-3 py-1.5 rounded-full select-none cursor-default"
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="w-5 h-8 border-2 border-zinc-700 rounded-full flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 bg-orange-500 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
