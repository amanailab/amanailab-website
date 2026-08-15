"use client";

import { useState, useEffect, useRef } from "react";
import {
  Download, MessageSquare, Check, XCircle, Loader2,
  Flame, Zap, Users,
  Code2, Briefcase, GraduationCap, BookOpen, Star,
  Calendar, Rocket, Globe, Mic, Brain,
  Target, Clock, ArrowRight,
} from "lucide-react";

const WA_NUMBER = "919997600372";
const wa = (msg: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
const ENROLL_WA = wa("Hi Aman! I want to enroll in the GenAI & Agentic AI Bootcamp (Live Cohort 2026). Please share payment and enrollment details.");
const QUERY_WA  = wa("Hi Aman! I have a question about the GenAI & Agentic AI Bootcamp.");

const TARGET = new Date("2026-09-01T00:00:00+05:30");

function useCountdown() {
  const [ms, setMs] = useState(() => Math.max(0, TARGET.getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, TARGET.getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
}

function Tick({ v, label }: { v: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-16 h-16 flex items-center justify-center">
        <span className="text-2xl font-black text-white tabular-nums">{String(v).padStart(2, "0")}</span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  );
}

const PROJECTS = [
  {
    n: "01", icon: BookOpen, title: "Enterprise RAG Support Assistant",
    desc: "Multi-source document Q&A — policy docs, PDFs & FAQs, hybrid search + re-ranking, grounded citations.",
    tags: ["LangChain / LlamaIndex", "Pinecone / Weaviate", "Cross-Encoder Re-ranker", "FastAPI", "RAGAS"],
  },
  {
    n: "02", icon: Brain, title: "Multi-Agent Research & Report System",
    desc: "Supervisor agent decomposes tasks, delegates to specialist sub-agents (search, summarize, fact-check), compiles structured reports.",
    tags: ["LangGraph", "Multi-Agent Orchestration", "Web Search Tool", "Agent Memory"],
  },
  {
    n: "03", icon: Rocket, title: "Autonomous Business Workflow Agent",
    desc: "Automates business processes — support-ticket triage & CRM updates — via MCP with human-in-the-loop for risky actions.",
    tags: ["MCP Servers", "Function Calling", "Guardrails", "Human-in-the-Loop"],
  },
  {
    n: "04", icon: Mic, title: "Voice-Enabled Real-Time AI Agent",
    desc: "Listens (Whisper STT), reasons + calls tools, responds naturally (TTS) — end-to-end real-time voice assistant.",
    tags: ["Whisper STT", "TTS Integration", "Real-Time Pipelines", "Tool Calling"],
  },
  {
    n: "05", icon: Globe, title: "End-to-End Production GenAI App",
    desc: "Capstone: RAG + Agents + protocols deployed with monitoring, observability, guardrails and cost tracking. Your flagship interview project.",
    tags: ["RAG + Agents", "Azure / AWS", "LangSmith", "Semantic Caching", "Guardrails AI"],
    capstone: true,
  },
];


const INCLUDES = [
  { icon: Calendar,      t: "Full Live Curriculum — every module taught live via Zoom Pro" },
  { icon: Clock,         t: "Lifetime Recording Access — rewatch any class anytime" },
  { icon: Code2,         t: "5 Production-Grade Projects — portfolio-ready, GitHub-pushed, code-reviewed" },
  { icon: Rocket,        t: "Deployed Capstone Project — full RAG + Agents + Protocol system, live-reviewed" },
  { icon: Briefcase,     t: "Resume Review — tailored for GenAI / AI Engineer roles" },
  { icon: Target,        t: "LinkedIn Optimization — headline, About section & project showcase reviewed live" },
  { icon: Brain,         t: "Personal AI Career Roadmap — individualized next-skills & job-target plan" },
  { icon: MessageSquare, t: "Doubt Support & Community — direct mentor access throughout the cohort" },
  { icon: Star,          t: "Interview-Ready Portfolio — 5 real projects to defend in interviews, not theory" },
];

const WHY = [
  { icon: Code2,     title: "Production-First, Not Notebook-First",  desc: "Every topic ties directly into a deployed project — not an isolated Jupyter demo that never ships." },
  { icon: Briefcase, title: "Built by a Practicing Engineer",         desc: "Curriculum shaped by real enterprise pipelines (Fortune-500 scale), not repackaged textbook content." },
  { icon: Globe,     title: "Protocol-Level Depth (MCP/A2A)",        desc: "Most courses stop at LangChain basics. This goes into the protocols powering next-gen enterprise agent systems." },
  { icon: Target,    title: "Career Outcome Baked In",               desc: "Resume, LinkedIn and a personal roadmap are part of the curriculum — not an afterthought bolted on at the end." },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BootcampContent() {
  const { d, h, m, s } = useCountdown();
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);
  const [err,  setErr]    = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    if (busy || done) return;
    setErr("");
    if (!name.trim())                           { setErr("Please enter your name.");           return; }
    if (!EMAIL_RE.test(email.trim()))           { setErr("Please enter a valid email.");        return; }
    if (!phone.trim() || phone.trim().length < 7) { setErr("Please enter a valid phone number."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/bootcamp/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed.");
      setDone(true);
      const a = document.createElement("a");
      a.href = "/AmanAI_Lab_GenAI_Agentic_AI_Syllabus new.pdf";
      a.download = "AmanAILab-GenAI-Agentic-AI-Syllabus.pdf";
      a.click();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Something went wrong. Try WhatsApp instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">

      {/* ── Top urgency strip ── */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 py-2.5 px-4">
        <p className="text-center text-sm font-bold text-white flex items-center justify-center gap-2 flex-wrap">
          <Flame className="w-4 h-4 animate-pulse shrink-0" />
          🔥 Limited seats available — early-bird price of ₹24,999 · Cohort starts <strong>Sept 1, 2026</strong>
          <Flame className="w-4 h-4 animate-pulse shrink-0" />
        </p>
      </div>

      {/* ── Hero ── */}
      <div className="relative pt-16 pb-14 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(249,115,22,0.13)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">

          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/40 text-orange-400 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
              AmanAI Lab · Live Cohort 2026
            </span>
            <span className="inline-flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
              <Flame className="w-3 h-3" /> Starting Sept 1
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-4">
            GenAI &amp; Agentic AI<br />
            <span className="text-orange-400">Complete Bootcamp</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Industry-mapped curriculum. 5 production projects. MCP &amp; A2A protocols.<br className="hidden sm:block" />
            Built live — shipped to production. Not toy notebooks.
          </p>

          {/* Price */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex items-baseline gap-4">
              <span className="text-zinc-500 line-through text-2xl font-bold">₹34,999</span>
              <span className="text-6xl font-black text-orange-400">₹24,999</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="inline-flex items-center gap-1.5 bg-green-500/12 border border-green-500/30 text-green-400 text-xs font-black px-3 py-1.5 rounded-full">
                🎉 Save ₹10,000 — Early Bird
              </span>
            </div>
          </div>

          {/* Countdown */}
          <div className="mb-8">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">Cohort starts in</p>
            <div className="flex items-end justify-center gap-3">
              <Tick v={d} label="Days" />
              <span className="text-zinc-600 text-2xl font-black mb-8 leading-none">:</span>
              <Tick v={h} label="Hours" />
              <span className="text-zinc-600 text-2xl font-black mb-8 leading-none">:</span>
              <Tick v={m} label="Mins" />
              <span className="text-zinc-600 text-2xl font-black mb-8 leading-none">:</span>
              <Tick v={s} label="Secs" />
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/AmanAI_Lab_GenAI_Agentic_AI_Syllabus new.pdf"
              download="AmanAILab-GenAI-Bootcamp-Syllabus.pdf"
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-100 font-semibold px-6 py-3.5 rounded-xl transition-all text-sm w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" /> Download Syllabus PDF
            </a>
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black px-8 py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-orange-500/30 text-sm w-full sm:w-auto justify-center hover:-translate-y-0.5"
            >
              Register Now — ₹24,999 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            or{" "}
            <a href={ENROLL_WA} target="_blank" rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 underline font-semibold">
              chat on WhatsApp to enroll directly
            </a>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 space-y-20">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 -mt-4">
          {[
            { v: "5",      l: "Production Projects" },
            { v: "29+",    l: "Modules" },
            { v: "Sept 1", l: "Cohort Start" },
          ].map(({ v, l }) => (
            <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-orange-400">{v}</p>
              <p className="text-sm text-zinc-400 mt-1">{l}</p>
            </div>
          ))}
        </div>

        {/* What you get */}
        <div>
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-orange-400 tracking-[0.2em] uppercase mb-2">Everything Included</p>
            <h2 className="text-3xl font-extrabold">What you get when you enroll</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INCLUDES.map(({ icon: Icon, t }) => (
              <div key={t} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5 Projects */}
        <div>
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-orange-400 tracking-[0.2em] uppercase mb-2">Flagship Projects</p>
            <h2 className="text-3xl font-extrabold">Built Live. End-to-End. Portfolio-Ready.</h2>
            <p className="text-zinc-400 max-w-xl mx-auto mt-2 text-sm leading-relaxed">
              5 production-grade projects — each mirrors a real enterprise use case. Every project is code-reviewed and discussed for architecture tradeoffs.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {PROJECTS.map(({ n, icon: Icon, title, desc, tags, capstone }) => (
              <div
                key={n}
                className={`flex flex-col sm:flex-row gap-4 rounded-2xl p-6 border transition-all ${
                  capstone
                    ? "bg-gradient-to-br from-orange-500/10 to-zinc-900 border-orange-500/40"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start gap-3 shrink-0">
                  <span className="text-xs font-black text-zinc-600 font-mono mt-1 w-6">{n}</span>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${capstone ? "bg-orange-500/20 border border-orange-500/40" : "bg-zinc-800 border border-zinc-700"}`}>
                    <Icon className={`w-5 h-5 ${capstone ? "text-orange-400" : "text-zinc-400"}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-base font-bold text-zinc-100">{title}</h3>
                    {capstone && (
                      <span className="text-[10px] font-black uppercase tracking-wide text-orange-400 bg-orange-500/15 border border-orange-500/25 px-2 py-0.5 rounded-full">
                        Capstone
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-3">{desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="text-[11px] font-semibold px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why different */}
        <div>
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-orange-400 tracking-[0.2em] uppercase mb-2">Why Different</p>
            <h2 className="text-3xl font-extrabold">Built differently — and it shows</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 leading-snug">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who it's for + Prerequisites */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" /> Who this is for
            </h3>
            <ul className="flex flex-col gap-3">
              {[
                "Software engineers & data professionals moving into GenAI/AI Engineering roles",
                "ML/DL practitioners wanting production-grade RAG & Agentic AI depth",
                "Anyone targeting AI Engineer, GenAI Developer or Applied AI roles in 2026",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400 leading-relaxed">
                  <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-orange-400" /> Prerequisites
            </h3>
            <ul className="flex flex-col gap-3">
              {[
                "Basic understanding of ML concepts — helpful, not mandatory",
                "A laptop and willingness to build — everything else is taught live",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400 leading-relaxed">
                  <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Registration / Enrollment section ── */}
        <div ref={formRef} className="bg-gradient-to-br from-orange-500/10 via-zinc-900 to-zinc-900 border border-orange-500/30 rounded-3xl p-6 sm:p-10">

          {/* Inner urgency */}
          <div className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-black px-5 py-2.5 rounded-full w-fit mx-auto mb-8">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            Hurry! Limited seats available — early-bird price ends soon
            <Flame className="w-3.5 h-3.5 animate-pulse" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Secure Your Seat Now</h2>
            <div className="flex items-baseline justify-center gap-4 mb-2">
              <span className="text-zinc-500 line-through text-2xl font-bold">₹34,999</span>
              <span className="text-5xl font-black text-orange-400">₹24,999</span>
            </div>
            <p className="text-zinc-500 text-sm">Cohort starts Sept 1, 2026</p>
          </div>

          <div className="max-w-md mx-auto">
            {done ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">You&apos;re Registered! 🎉</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Your syllabus PDF is downloading. To complete enrollment, WhatsApp Aman — he&apos;ll send you the payment link and confirm your seat.
                </p>
                <a
                  href={ENROLL_WA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/25 text-sm"
                >
                  <MessageSquare className="w-5 h-5" /> WhatsApp Aman to Complete Enrollment
                </a>
                <p className="mt-4 text-xs text-zinc-600">
                  PDF download didn&apos;t start?{" "}
                  <a href="/AmanAI_Lab_GenAI_Agentic_AI_Syllabus new.pdf" download className="text-orange-400 hover:underline">
                    Click here
                  </a>
                </p>
              </div>
            ) : (
              <>
                <form onSubmit={register} className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="bg-zinc-900 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="bg-zinc-900 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your WhatsApp number"
                    required
                    className="bg-zinc-900 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-black px-6 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-orange-500/30 text-sm"
                  >
                    {busy
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
                      : <><Zap className="w-4 h-4" /> Register &amp; Download Syllabus</>}
                  </button>
                  {err && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-sm">{err}</p>
                    </div>
                  )}
                  <p className="text-center text-xs text-zinc-600">
                    After registering, WhatsApp Aman for payment &amp; seat confirmation.
                  </p>
                </form>

                <div className="mt-4 flex flex-col items-center gap-2">
                  <span className="text-zinc-600 text-xs">or enroll directly</span>
                  <a
                    href={ENROLL_WA}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-600/50 text-zinc-300 hover:text-green-300 font-semibold px-5 py-3.5 rounded-xl transition-all text-sm"
                  >
                    <MessageSquare className="w-4 h-4 text-green-400" /> Chat on WhatsApp to Enroll
                  </a>
                  <a
                    href={QUERY_WA}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Have a question? Ask on WhatsApp →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
