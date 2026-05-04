"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  ArrowRight,
  Loader2,
  Check,
  XCircle,
  Briefcase,
  Code2,
  Users,
  Award,
  Mail,
  GraduationCap,
} from "lucide-react";

interface Course {
  title: string;
  description: string;
  level: string;
  duration: string;
  topics: string[];
}

const COURSES: Course[] = [
  {
    title: "Production RAG Systems End to End",
    description:
      "Build a complete RAG pipeline from scratch. Chunking, embeddings, retrieval, reranking, evaluation and deployment.",
    level: "Intermediate",
    duration: "6 hours",
    topics: ["LangChain", "Qdrant", "FastAPI", "Claude API", "Evaluation"],
  },
  {
    title: "Agentic AI Pipelines in Production",
    description:
      "Build real AI agents that work. ReAct, multi-agent systems, tool use and deployment at scale.",
    level: "Advanced",
    duration: "8 hours",
    topics: ["LangGraph", "CrewAI", "Tools", "Memory", "Deployment"],
  },
  {
    title: "LLM Fine-Tuning Masterclass",
    description:
      "Fine-tune Llama 3 on your own data using LoRA and QLoRA. From dataset to deployment.",
    level: "Advanced",
    duration: "5 hours",
    topics: ["LoRA", "QLoRA", "Unsloth", "HuggingFace", "vLLM"],
  },
  {
    title: "GenAI Interview Preparation Complete Guide",
    description:
      "Everything you need to crack AI/ML interviews. Theory, coding, system design and mock interviews.",
    level: "All Levels",
    duration: "10 hours",
    topics: ["LLM", "RAG", "Agents", "System Design", "Mock Interview"],
  },
];

const REASONS = [
  {
    Icon: Briefcase,
    title: "Real Industry Experience",
    description:
      "Built by someone who created AI systems for Fortune 500 companies. Not just theory.",
  },
  {
    Icon: Code2,
    title: "Production Ready",
    description:
      "Every concept taught with production code. Deploy on day one.",
  },
  {
    Icon: Users,
    title: "Community Support",
    description:
      "WhatsApp group access with all course purchases. Get help when stuck.",
  },
  {
    Icon: Award,
    title: "Certificate Included",
    description: "Get a certificate of completion to add to your LinkedIn.",
  },
];

function levelColor(level: string) {
  const lower = level.toLowerCase();
  if (lower.includes("advanced")) return "bg-red-500/15 text-red-300 border-red-500/30";
  if (lower.includes("intermediate"))
    return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  if (lower.includes("all")) return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  return "bg-green-500/15 text-green-300 border-green-500/30";
}

export default function CoursesContent() {
  const [email, setEmail] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (working || joined) return;
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setWorking(true);
    try {
      const res = await fetch("/api/courses/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join waitlist.");
      setJoined(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative pt-20 pb-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <GraduationCap className="w-3.5 h-3.5" />
            Coming Soon
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            AI Courses
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Production-grade AI courses built from real industry experience.{" "}
            <span className="text-orange-400 font-semibold">Coming Soon.</span>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Course preview cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {COURSES.map((course) => (
            <div
              key={course.title}
              className="flex flex-col gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5 transition-all"
            >
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300">
                  Coming Soon
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-100 leading-snug">
                {course.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{course.description}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span
                  className={`font-semibold px-2.5 py-1 rounded-full border ${levelColor(course.level)}`}
                >
                  {course.level}
                </span>
                <span className="inline-flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5" />
                  {course.duration}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {course.topics.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-semibold px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Waitlist */}
        <div className="mt-16 bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-5 mx-auto">
            <Mail className="w-6 h-6 text-orange-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Get notified when courses launch
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Join the waitlist and get early bird discount of{" "}
            <span className="text-orange-400 font-semibold">40%</span>.
          </p>

          {joined ? (
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-300 px-5 py-3 rounded-xl">
              <Check className="w-5 h-5" />
              <span className="text-sm font-semibold">
                You are on the list! We will notify you on launch.
              </span>
            </div>
          ) : (
            <form
              onSubmit={joinWaitlist}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={working}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                {working ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining…
                  </>
                ) : (
                  <>Join Waitlist</>
                )}
              </button>
            </form>
          )}

          {error && !joined && (
            <div className="mt-4 inline-flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-xl">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Why these courses */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-orange-400 tracking-[0.2em] uppercase mb-2">
              Why these courses
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Built differently — and it shows
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REASONS.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-base font-bold text-zinc-100">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-10 text-center">
          <Sparkles className="w-7 h-7 text-orange-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-zinc-100 mb-2">
            Can&apos;t wait for the courses?
          </h3>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Get personalised 1-on-1 guidance now.
          </p>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            View Services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
