"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen, Layers, Library, Building2, Briefcase,
  BarChart2, Map, Code2,
  Wand2, ScrollText, Sparkles,
  ArrowRight, Search, X,
} from "lucide-react";
import { SITE_STATS } from "@/lib/site-stats";

type Cat = "learn" | "practice" | "job" | "bonus";

const CATEGORIES: { id: Cat; label: string; hint: string }[] = [
  { id: "learn",    label: "Learn the concepts",     hint: "Build understanding" },
  { id: "practice", label: "Practice & test yourself", hint: "Prove you know it" },
  { id: "job",      label: "Land the job",           hint: "Target a real role" },
  { id: "bonus",    label: "Bonus AI tools",         hint: "Handy extras" },
];

const TOOLS: { href: string; cat: Cat; label: string; desc: string; icon: typeof BookOpen; color: string; bg: string }[] = [
  // Mock Interview, Code Lab, Sheet & Resume are spotlighted in FeaturedTools.
  // ── Learn ──
  { href: "/flashcards",         cat: "learn",    label: "Flashcards",         desc: "5-min daily concept revision",        icon: BookOpen,    color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20"   },
  { href: "/topics",             cat: "learn",    label: "Topic Guides",       desc: "Deep-dive prep by topic",             icon: Layers,      color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20"       },
  { href: "/paper-explainer",    cat: "learn",    label: "Paper Explainer",    desc: "Any arXiv paper in plain English",    icon: ScrollText,  color: "text-indigo-400",  bg: "bg-indigo-500/10 border-indigo-500/20"   },
  // ── Practice ──
  { href: "/quiz",               cat: "practice", label: "Skill Quiz",         desc: "AI-generated MCQ on 14 topics",       icon: Sparkles,    color: "text-lime-400",    bg: "bg-lime-500/10 border-lime-500/20"       },
  { href: "/questions",          cat: "practice", label: "Question Bank",      desc: `${SITE_STATS.questions} real interview questions`, icon: Library, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  // ── Land the job ──
  { href: "/companies",          cat: "job",      label: "Company Prep",       desc: "Google, Meta, OpenAI & more",         icon: Building2,   color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20"       },
  { href: "/job-prep",           cat: "job",      label: "Job Prep",           desc: "Paste a JD → tailored questions",     icon: Briefcase,   color: "text-teal-400",    bg: "bg-teal-500/10 border-teal-500/20"       },
  { href: "/linkedin-optimizer", cat: "job",      label: "LinkedIn Optimizer", desc: "AI-rewritten profile sections",       icon: BarChart2,   color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20"         },
  { href: "/career",             cat: "job",      label: "Career Roadmap",     desc: "Week-by-week AI/ML path",             icon: Map,         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  // ── Bonus ──
  { href: "/playground",         cat: "bonus",    label: "Code Playground",    desc: "Monaco editor + AI for ML code",      icon: Code2,       color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20"     },
  { href: "/prompt",             cat: "bonus",    label: "Prompt Generator",   desc: "Perfect prompts for any AI",          icon: Wand2,       color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20"       },
];

function ToolCard({ tool, i }: { tool: (typeof TOOLS)[number]; i: number }) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.03 }}
    >
      <Link
        href={tool.href}
        aria-label={`${tool.label} — ${tool.desc}`}
        className="group flex flex-col gap-2.5 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-200 h-full focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950"
      >
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${tool.bg} flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${tool.color}`} />
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors leading-tight mb-0.5">
            {tool.label}
          </p>
          <p className="text-[11px] text-zinc-500 leading-snug group-hover:text-zinc-400 transition-colors">
            {tool.desc}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function MoreTools() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? TOOLS.filter(t => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)) : TOOLS),
    [q],
  );

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-4 gap-4 flex-wrap"
        >
          <div>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-[0.2em] mb-1">More Free Tools</p>
            <h2 className="text-2xl font-bold text-zinc-100">Explore by what you need</h2>
            <p className="text-sm text-zinc-400 mt-0.5">All free, no sign-up required</p>
          </div>
          <Link href="/resources" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-400 transition-colors font-medium">
            View resources <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        {/* Tool search */}
        <div className="relative mb-6 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tools…"
            aria-label="Search tools"
            className="w-full pl-10 pr-9 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
        </div>

        {q ? (
          // Searching → flat results
          filtered.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 text-sm">
              No tools match &ldquo;{query}&rdquo;.{' '}
              <button onClick={() => setQuery('')} className="text-orange-400 hover:text-orange-300">Clear</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filtered.map((tool, i) => <ToolCard key={tool.label} tool={tool} i={i} />)}
            </div>
          )
        ) : (
          // Default → grouped by category
          <div className="flex flex-col gap-7">
            {CATEGORIES.map(cat => {
              const tools = TOOLS.filter(t => t.cat === cat.id);
              if (tools.length === 0) return null;
              return (
                <div key={cat.id}>
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <h3 className="text-sm font-bold text-zinc-200">{cat.label}</h3>
                    <span className="text-[11px] text-zinc-600">{cat.hint}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {tools.map((tool, i) => <ToolCard key={tool.label} tool={tool} i={i} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
