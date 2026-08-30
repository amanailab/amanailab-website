"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Is AmanAI Lab completely free?",
    a: "Yes — the platform is free. All core tools (AI mock interview, 500+ questions, flashcards, code lab, skill-gap analyzer, daily challenge) work with a free account. No credit card ever required. Optional paid plans (₹999–₹1499, one-time for 30 days) unlock higher daily limits on AI-heavy tools like System Design review and Resume analysis.",
  },
  {
    q: "How should I prepare for an AI/ML engineer interview?",
    a: "Start with the Skill Gap Analyzer — paste a job description and see exactly what you're missing. Then use the A-to-Z Interview Prep Sheet (279 topics across 8 tracks) to fill gaps systematically. Practice each topic with the AI Mock Interview simulator, run code problems in the Code Lab, and polish your resume with the AI Resume Analyzer before applying.",
  },
  {
    q: "What topics are covered in the interview preparation?",
    a: "14 core topics: LLMs, RAG systems, AI Agents, LangGraph, Fine-Tuning, MLOps, Transformers, Embeddings, Vector Databases, Evaluation, Computer Vision, NLP, System Design, and Behavioral. Each topic has questions, model answers, flashcards, quizzes, and mock interview sessions.",
  },
  {
    q: "How does the AI mock interview work?",
    a: "Select a topic and difficulty, then answer questions by typing or using voice input. The AI scores your answer 0–10 with specific feedback on what you got right, what was missing, and what a strong answer looks like. Each session is saved to your dashboard so you can track your progress and spot weak areas.",
  },
  {
    q: "Can I use this to prepare for Google, Meta, or OpenAI interviews?",
    a: "Yes. The Company filter on the question bank lets you browse questions tagged to specific companies. The Skill Gap Analyzer maps any JD to your current scores. System Design problems include real ML problems asked at FAANG companies. The platform is built specifically for AI/ML roles at top-tier companies.",
  },
  {
    q: "How is AmanAI Lab different from LeetCode or other platforms?",
    a: "AmanAI Lab is built exclusively for AI/ML roles — not general software engineering. It combines interview simulation, resume analysis, system design practice, skill-gap analysis, and a 279-topic prep sheet in one place. LeetCode focuses on DSA; AmanAI Lab focuses on the AI/ML-specific knowledge that companies actually test.",
  },
  {
    q: "How long does it take to be interview-ready?",
    a: "Most users see measurable improvement in 2–3 weeks of consistent daily practice (30–45 min/day). The dashboard shows your Interview Readiness Score (0–100%) across all 14 topics so you always know where you stand. The Daily Challenge builds a habit loop — 7-day streaks are a strong predictor of readiness.",
  },
  {
    q: "Is the AI mock interview better than practicing alone?",
    a: "Significantly. Solo practice has no feedback loop — you don't know if your answer was good or what was missing. The AI mock interview gives immediate, specific feedback on every answer: what concepts you covered, what gaps exist, and what a hiring-bar answer looks like. It's closer to a real technical screening than any other free tool.",
  },
];

export default function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Common Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-400 text-base max-w-xl mx-auto">
            Everything you need to know before you start preparing.
          </p>
        </motion.div>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={open === i}
              >
                <span className="text-sm font-semibold text-zinc-200 leading-snug">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180 text-orange-400" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                  >
                    <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
