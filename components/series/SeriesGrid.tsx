"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, BookOpen, Clock, Star } from "lucide-react";

const allSeries = [
  {
    id: 1,
    title: "LLM Mastery",
    description:
      "Complete guide to Large Language Models — architecture, capabilities, and building production systems.",
    episodes: 18,
    duration: "9 hrs",
    level: "Beginner",
    rating: 4.9,
    tags: ["GPT", "Transformers", "APIs"],
    category: "llm",
    gradientFrom: "#f97316",
    gradientTo: "#dc2626",
    isNew: false,
  },
  {
    id: 2,
    title: "AI Agents from Scratch",
    description:
      "Build autonomous AI agents using LangChain, tool use, memory, and multi-agent orchestration.",
    episodes: 24,
    duration: "13 hrs",
    level: "Intermediate",
    rating: 4.8,
    tags: ["LangChain", "Tools", "AutoGen"],
    category: "agents",
    gradientFrom: "#3b82f6",
    gradientTo: "#7c3aed",
    isNew: true,
  },
  {
    id: 3,
    title: "RAG Systems",
    description:
      "Master Retrieval-Augmented Generation — embeddings, vector databases, and production RAG pipelines.",
    episodes: 15,
    duration: "8 hrs",
    level: "Intermediate",
    rating: 4.9,
    tags: ["Embeddings", "Vector DBs", "Chroma"],
    category: "rag",
    gradientFrom: "#10b981",
    gradientTo: "#0891b2",
    isNew: false,
  },
  {
    id: 4,
    title: "Prompt Engineering Pro",
    description:
      "Advanced prompting techniques — chain-of-thought, few-shot, structured output, and prompt optimization.",
    episodes: 12,
    duration: "6 hrs",
    level: "Beginner",
    rating: 4.7,
    tags: ["CoT", "Few-shot", "Structured Output"],
    category: "prompting",
    gradientFrom: "#f59e0b",
    gradientTo: "#f97316",
    isNew: false,
  },
  {
    id: 5,
    title: "Fine-tuning Workshop",
    description:
      "Customize LLMs for your domain — LoRA, QLoRA, PEFT, instruction tuning, and DPO.",
    episodes: 20,
    duration: "12 hrs",
    level: "Advanced",
    rating: 4.8,
    tags: ["LoRA", "PEFT", "QLoRA"],
    category: "llm",
    gradientFrom: "#8b5cf6",
    gradientTo: "#ec4899",
    isNew: true,
  },
  {
    id: 6,
    title: "GenAI App Development",
    description:
      "Build and deploy production-grade Generative AI applications with Next.js, FastAPI, and LangChain.",
    episodes: 22,
    duration: "11 hrs",
    level: "Intermediate",
    rating: 4.9,
    tags: ["FastAPI", "Next.js", "Deployment"],
    category: "development",
    gradientFrom: "#06b6d4",
    gradientTo: "#3b82f6",
    isNew: false,
  },
  {
    id: 7,
    title: "Multi-Agent Systems",
    description:
      "Design and implement multi-agent workflows using CrewAI, AutoGen, and custom orchestration.",
    episodes: 16,
    duration: "9 hrs",
    level: "Advanced",
    rating: 4.8,
    tags: ["CrewAI", "AutoGen", "Orchestration"],
    category: "agents",
    gradientFrom: "#f97316",
    gradientTo: "#8b5cf6",
    isNew: true,
  },
  {
    id: 8,
    title: "LlamaIndex Deep Dive",
    description:
      "Master LlamaIndex for building knowledge assistants, document QA, and advanced RAG patterns.",
    episodes: 14,
    duration: "7 hrs",
    level: "Intermediate",
    rating: 4.7,
    tags: ["LlamaIndex", "Knowledge Graphs", "QA"],
    category: "rag",
    gradientFrom: "#10b981",
    gradientTo: "#6366f1",
    isNew: false,
  },
  {
    id: 9,
    title: "AI for Developers",
    description:
      "Practical AI integration for software developers — add LLM features to your existing stack.",
    episodes: 10,
    duration: "5 hrs",
    level: "Beginner",
    rating: 4.6,
    tags: ["OpenAI SDK", "Integration", "APIs"],
    category: "development",
    gradientFrom: "#0ea5e9",
    gradientTo: "#10b981",
    isNew: false,
  },
];

const categories = [
  { id: "all", label: "All Series" },
  { id: "llm", label: "LLMs" },
  { id: "agents", label: "AI Agents" },
  { id: "rag", label: "RAG" },
  { id: "prompting", label: "Prompting" },
  { id: "development", label: "Development" },
];

const levelConfig: Record<string, { text: string; bg: string }> = {
  Beginner: { text: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  Intermediate: { text: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  Advanced: { text: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

export default function SeriesGrid() {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all" ? allSeries : allSeries.filter((s) => s.category === active);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <p className="text-orange-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
          Learning Paths
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">All Series</h1>
        <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
          Structured paths to take you from AI beginner to production-ready developer.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-10"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === cat.id
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((s, i) => {
            const level = levelConfig[s.level];
            return (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden group flex flex-col cursor-pointer"
              >
                {/* Thumbnail */}
                <div
                  className="h-40 flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${s.gradientFrom}18 0%, ${s.gradientTo}18 100%)`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                      background: `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`,
                    }}
                  />

                  {/* Decorative circles */}
                  <div
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10"
                    style={{ background: s.gradientFrom }}
                  />
                  <div
                    className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
                    style={{ background: s.gradientTo }}
                  />

                  <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>

                  {s.isNew && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      New
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${level.text} ${level.bg}`}
                    >
                      {s.level}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold mb-2 group-hover:text-orange-400 transition-colors leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4 flex-1">
                    {s.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-zinc-800 text-zinc-500 text-xs">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {s.episodes} eps
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {s.duration}
                    </span>
                    <span className="flex items-center gap-1 ml-auto text-yellow-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {s.rating}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          No series in this category yet.
        </div>
      )}
    </div>
  );
}
