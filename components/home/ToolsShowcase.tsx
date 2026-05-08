"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText, BrainCircuit, Map, Sparkles,
  BookOpen, BarChart2, Wand2, CalendarDays,
  Building2, GraduationCap, Mail, ArrowRight,
  Briefcase, Library, MessageSquare, Layers, Code2,
} from "lucide-react";

const tools = [
  { icon: <Code2 className="w-5 h-5" />,        label: "Code Playground",          description: "Monaco editor + AI for RAG, Agents, LoRA & more", href: "/playground",         color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { icon: <BrainCircuit className="w-5 h-5" />, label: "AI Interview Simulator",  description: "Voice-enabled mock interviews with instant scoring",    href: "/interview",          color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { icon: <Building2 className="w-5 h-5" />,   label: "Company Prep",             description: "Google, Meta, OpenAI & 6 more — real questions",       href: "/companies",          color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20"   },
  { icon: <Library className="w-5 h-5" />,     label: "Question Bank",            description: "Browse & filter 500+ AI/ML interview questions",       href: "/questions",          color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20"},
  { icon: <Briefcase className="w-5 h-5" />,   label: "Job Prep",                 description: "Paste a JD → get 6 tailored questions instantly",      href: "/job-prep",           color: "text-teal-400",   bg: "bg-teal-500/10 border-teal-500/20"   },
  { icon: <BookOpen className="w-5 h-5" />,    label: "Flashcards",               description: "Key concepts for daily 5-minute practice",             href: "/flashcards",         color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20"},
  { icon: <Layers className="w-5 h-5" />,      label: "Topic Guides",             description: "Deep-dive prep guides for every AI/ML topic",          href: "/topics",             color: "text-rose-400",   bg: "bg-rose-500/10 border-rose-500/20"   },
  { icon: <MessageSquare className="w-5 h-5" />,label: "Community",               description: "Real interview experiences from engineers",             href: "/community",          color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
  { icon: <FileText className="w-5 h-5" />,    label: "Resume Analyzer",          description: "ATS score, missing keywords & rewritten summary",      href: "/resume",             color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20"},
  { icon: <BarChart2 className="w-5 h-5" />,   label: "LinkedIn Optimizer",       description: "AI-rewritten profile with recruiter keywords",         href: "/linkedin-optimizer", color: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/20"     },
  { icon: <Mail className="w-5 h-5" />,        label: "Cover Letter Reviewer",    description: "Score vs JD + complete AI rewrite",                    href: "/cover-letter-review",color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/20"   },
  { icon: <Map className="w-5 h-5" />,         label: "Career Roadmap",           description: "Personalized week-by-week AI/ML learning path",        href: "/career",             color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20"},
  { icon: <CalendarDays className="w-5 h-5" />,label: "Study Plan",               description: "Day-by-day prep schedule for your interview date",     href: "/career",             color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: <Wand2 className="w-5 h-5" />,       label: "Prompt Generator",         description: "Perfect AI prompts for any task or model",             href: "/prompt",             color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20"   },
  { icon: <Sparkles className="w-5 h-5" />,    label: "Skill Quiz",               description: "AI-generated MCQ quiz with explanations",              href: "/quiz",               color: "text-lime-400",   bg: "bg-lime-500/10 border-lime-500/20"   },
  { icon: <BookOpen className="w-5 h-5" />,    label: "Paper Explainer",          description: "Any arXiv paper explained in plain English",           href: "/paper-explainer",    color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20"},
  { icon: <GraduationCap className="w-5 h-5" />,label: "LinkedIn Posts",          description: "Viral AI/ML posts for 5 different styles",             href: "/linkedin",           color: "text-fuchsia-400",bg: "bg-fuchsia-500/10 border-fuchsia-500/20"},
];

export default function ToolsShowcase() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            20+ Free AI Tools
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
            Everything You Need to Land an AI/ML Job
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            From resume to offer letter — AI-powered tools that cover your entire job search journey. All free.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Link
                href={tool.href}
                className="group flex flex-col gap-3 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200 h-full"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${tool.bg} ${tool.color}`}>
                  {tool.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors mb-1">
                    {tool.label}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                    {tool.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 text-sm"
          >
            Start with AI Interview Prep
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
