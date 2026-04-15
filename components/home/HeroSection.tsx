"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { YoutubeIcon } from "@/components/icons/SocialIcons";

const techPills = [
  "LLMs", "AI Agents", "RAG", "LangChain", "OpenAI API",
  "Fine-tuning", "Prompt Engineering", "LlamaIndex", "Vector DBs",
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Orange radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[700px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(ellipse, #f97316 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

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
          Generative AI · LLMs · AI Agents
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          Master{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Generative AI
          </span>
          <br />
          <span className="text-zinc-300">Build Intelligent Agents</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          In-depth tutorials on LLMs, AI Agents, RAG systems, and Generative AI —
          from core concepts to production-ready applications.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/series"
            className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 text-[15px]"
          >
            Explore Series
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://youtube.com/@AmanAI_lab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-100 font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 text-[15px]"
          >
            <YoutubeIcon className="w-4 h-4 text-orange-500" />
            Watch on YouTube
          </a>
        </motion.div>

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
              className="bg-zinc-900/80 border border-zinc-800 text-zinc-500 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm"
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
