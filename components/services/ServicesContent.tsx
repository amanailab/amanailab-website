"use client";

import { useState } from "react";
import {
  ClipboardList, Terminal, Trophy,
  User, Clock, Briefcase, MessageCircle,
  ChevronDown, ChevronUp, ArrowRight, Rocket,
  CheckCircle2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = "91XXXXXXXXXX";

function waLink(msg: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ─── Hero Illustration ────────────────────────────────────────────────────────

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 480 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-lg mx-auto"
      aria-hidden="true"
    >
      {/* Glow */}
      <ellipse cx="240" cy="200" rx="180" ry="130" fill="#f97316" fillOpacity="0.07" />

      {/* Desk */}
      <rect x="60" y="290" width="360" height="12" rx="6" fill="#27272a" />

      {/* Laptop base */}
      <rect x="110" y="270" width="260" height="24" rx="8" fill="#3f3f46" />
      <rect x="130" y="272" width="220" height="4" rx="2" fill="#52525b" />

      {/* Laptop screen body */}
      <rect x="100" y="100" width="280" height="178" rx="12" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />

      {/* Screen */}
      <rect x="114" y="114" width="252" height="150" rx="6" fill="#09090b" />

      {/* Code lines on screen */}
      <rect x="130" y="130" width="80" height="6" rx="3" fill="#f97316" fillOpacity="0.9" />
      <rect x="130" y="146" width="140" height="5" rx="2.5" fill="#52525b" />
      <rect x="148" y="158" width="100" height="5" rx="2.5" fill="#52525b" />
      <rect x="148" y="170" width="120" height="5" rx="2.5" fill="#22d3ee" fillOpacity="0.6" />
      <rect x="130" y="182" width="60"  height="5" rx="2.5" fill="#a78bfa" fillOpacity="0.7" />
      <rect x="148" y="194" width="90"  height="5" rx="2.5" fill="#52525b" />
      <rect x="148" y="206" width="70"  height="5" rx="2.5" fill="#f97316" fillOpacity="0.6" />
      <rect x="130" y="218" width="110" height="5" rx="2.5" fill="#52525b" />
      <rect x="130" y="230" width="50"  height="5" rx="2.5" fill="#22d3ee" fillOpacity="0.5" />
      <rect x="148" y="242" width="130" height="5" rx="2.5" fill="#52525b" />

      {/* Cursor blink */}
      <rect x="282" y="242" width="8" height="5" rx="1" fill="#f97316" />

      {/* Camera dot */}
      <circle cx="240" cy="108" r="3" fill="#3f3f46" />

      {/* ── Neural network nodes ── */}

      {/* Left cluster */}
      <line x1="38" y1="80"  x2="80" y2="130" stroke="#f97316" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="38" y1="80"  x2="60" y2="200" stroke="#f97316" strokeWidth="1" strokeOpacity="0.2" />
      <line x1="60" y1="200" x2="80" y2="130" stroke="#f97316" strokeWidth="1" strokeOpacity="0.2" />

      <circle cx="38"  cy="80"  r="7" fill="#f97316" fillOpacity="0.9" />
      <circle cx="80"  cy="130" r="5" fill="#f97316" fillOpacity="0.6" />
      <circle cx="60"  cy="200" r="5" fill="#f97316" fillOpacity="0.5" />

      {/* Right cluster */}
      <line x1="442" y1="70"  x2="400" y2="130" stroke="#f97316" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="442" y1="70"  x2="430" y2="190" stroke="#f97316" strokeWidth="1" strokeOpacity="0.2" />
      <line x1="400" y1="130" x2="430" y2="190" stroke="#f97316" strokeWidth="1" strokeOpacity="0.2" />
      <line x1="400" y1="130" x2="420" y2="240" stroke="#f97316" strokeWidth="1" strokeOpacity="0.15" />

      <circle cx="442" cy="70"  r="7" fill="#f97316" fillOpacity="0.85" />
      <circle cx="400" cy="130" r="5" fill="#f97316" fillOpacity="0.6" />
      <circle cx="430" cy="190" r="5" fill="#f97316" fillOpacity="0.5" />
      <circle cx="420" cy="240" r="4" fill="#f97316" fillOpacity="0.35" />

      {/* Top floating node */}
      <line x1="240" y1="30" x2="200" y2="60" stroke="#f97316" strokeWidth="1" strokeOpacity="0.2" />
      <line x1="240" y1="30" x2="280" y2="60" stroke="#f97316" strokeWidth="1" strokeOpacity="0.2" />
      <circle cx="240" cy="30" r="6" fill="#f97316" fillOpacity="0.7" />
      <circle cx="200" cy="60" r="4" fill="#f97316" fillOpacity="0.4" />
      <circle cx="280" cy="60" r="4" fill="#f97316" fillOpacity="0.4" />

      {/* Floating badge — "AI" */}
      <rect x="360" y="50" width="52" height="26" rx="8" fill="#1c1c1e" stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.6" />
      <text x="386" y="68" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="700" fontFamily="monospace">AI</text>

      {/* Floating badge — "</>" */}
      <rect x="60" y="230" width="56" height="26" rx="8" fill="#1c1c1e" stroke="#3f3f46" strokeWidth="1.5" />
      <text x="88" y="248" textAnchor="middle" fill="#71717a" fontSize="11" fontWeight="600" fontFamily="monospace">&lt;/&gt;</text>

      {/* Floating badge — "LLM" */}
      <rect x="370" y="220" width="58" height="26" rx="8" fill="#1c1c1e" stroke="#3f3f46" strokeWidth="1.5" />
      <text x="399" y="238" textAnchor="middle" fill="#71717a" fontSize="11" fontWeight="600" fontFamily="monospace">LLM</text>
    </svg>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100 mb-3">
        {title}
      </h2>
      <p className="text-zinc-400 text-base max-w-xl mx-auto">{subtitle}</p>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-zinc-900/50 transition-colors"
      >
        <span className="text-zinc-100 font-semibold text-sm sm:text-base">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-zinc-400 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    num: "01",
    icon: ClipboardList,
    title: "Tell Us Your Background",
    desc: "Fill a quick form about your current role, experience and your target AI job.",
    accent: "text-orange-400",
    glow: "bg-orange-500/10 border-orange-500/20",
  },
  {
    num: "02",
    icon: Terminal,
    title: "We Build Your Project",
    desc: "We create a custom AI project perfectly matched to your background. Java dev gets Java+AI. Python dev gets Python+AI.",
    accent: "text-blue-400",
    glow: "bg-blue-500/10 border-blue-500/20",
  },
  {
    num: "03",
    icon: Trophy,
    title: "Get Placed",
    desc: "We prep you for interviews, review your resume and stay with you till you land your AI job.",
    accent: "text-green-400",
    glow: "bg-green-500/10 border-green-500/20",
  },
];

const BACKGROUNDS = [
  { emoji: "☕", title: "Java Developer",      project: "Build a Document AI System with Spring Boot + LangChain" },
  { emoji: "🐍", title: "Python Developer",    project: "Build a Production RAG API with FastAPI + Claude" },
  { emoji: "📊", title: "Data Analyst",        project: "Build an AI Analytics Dashboard with LLM Insights" },
  { emoji: "🔧", title: "Data Engineer",       project: "Build a Real-time AI Data Pipeline" },
  { emoji: "🎨", title: "Frontend Developer",  project: "Build an AI-Powered Web App with Next.js + Claude API" },
  { emoji: "⚙️", title: "Backend Developer",   project: "Build AI Microservices with FastAPI + Agents" },
  { emoji: "🗄️", title: "SQL / Database Dev",  project: "Build a Natural Language to SQL System" },
  { emoji: "🚀", title: "DevOps Engineer",     project: "Build an LLMOps Pipeline with MLflow + vLLM" },
];

const WHY_US = [
  {
    icon: User,
    title: "Built For You",
    desc: "Not generic projects. Custom built for your exact background and target role.",
  },
  {
    icon: Clock,
    title: "Till You Get Placed",
    desc: "No time limits. No monthly fees. We support you until you land your dream AI job.",
  },
  {
    icon: Briefcase,
    title: "Real Industry Experience",
    desc: "Projects designed by someone who built AI systems for Fortune 500 companies and global organizations.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Support",
    desc: "Direct access on WhatsApp. Ask questions anytime. Get answers fast.",
  },
];

const FAQS = [
  {
    q: "What if I am a complete beginner?",
    a: "No problem. We assess your current skills and build a project that stretches you just enough to grow without overwhelming you.",
  },
  {
    q: "How long does it take to get placed?",
    a: "It depends on your effort. Most clients who actively apply get interviews within 4–8 weeks of completing their project.",
  },
  {
    q: "What is included in WhatsApp support?",
    a: "You get direct access to ask questions about your project, interview prep, resume and job applications. We reply within 24 hours.",
  },
  {
    q: "Can I upgrade my package later?",
    a: "Yes. You can upgrade anytime by paying the difference between packages.",
  },
  {
    q: "What technologies will my project use?",
    a: "Depends on your background. We use Python, FastAPI, LangChain, Claude API, RAG, vector databases and deployment on cloud platforms.",
  },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ServicesContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-zinc-950 text-zinc-50">

      {/* ── SECTION 1 — HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Orange glow */}
        <div className="absolute inset-0 flex items-center justify-start pointer-events-none">
          <div
            className="w-[600px] h-[400px] rounded-full opacity-10"
            style={{
              background: "radial-gradient(ellipse, #f97316 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
        </div>
        {/* Top / bottom fades */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-zinc-950 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left — text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 tracking-wide uppercase">
                <Rocket className="w-3.5 h-3.5" />
                AI Career Services
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
                We Build Your{" "}
                <span
                  style={{
                    backgroundImage: "linear-gradient(135deg,#fb923c 0%,#f97316 50%,#ea580c 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  AI Project.
                </span>
                <br />
                We Prep You For{" "}
                <span className="text-zinc-300">Interviews.</span>
                <br />
                We Stay Till You{" "}
                <span className="text-zinc-300">Get Placed.</span>
              </h1>

              <p className="text-zinc-400 text-lg max-w-xl mb-10 leading-relaxed lg:mx-0 mx-auto">
                Custom AI projects built for your background. One payment. No timelines. Just results.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 text-[15px]"
                >
                  View Packages
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={waLink("Hi Aman, I want to know more about your AI career services")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-100 font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 text-[15px]"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-400" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                  WhatsApp Us
                </a>
              </div>
            </div>

            {/* Right — illustration */}
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="How It Works"
            subtitle="Simple 3 step process"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all duration-200"
                >
                  <div className="absolute top-6 right-6 text-5xl font-extrabold text-zinc-800 tabular-nums select-none">
                    {step.num}
                  </div>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border mb-5 ${step.glow}`}>
                    <Icon className={`w-5 h-5 ${step.accent}`} />
                  </div>
                  <h3 className="text-zinc-100 font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — BACKGROUND SELECTOR ────────────────────────────── */}
      <section className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Built For YOUR Background"
            subtitle="Whatever your current stack, we create the perfect AI transition project"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BACKGROUNDS.map((bg) => (
              <div
                key={bg.title}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/50 hover:bg-zinc-900/80 transition-all duration-200 cursor-default"
              >
                <div className="text-3xl mb-4">{bg.emoji}</div>
                <h3 className="text-zinc-100 font-bold text-sm mb-2 group-hover:text-orange-400 transition-colors">
                  {bg.title}
                </h3>
                <p className="text-zinc-500 text-xs leading-relaxed group-hover:text-zinc-400 transition-colors">
                  {bg.project}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — PRICING ─────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Simple Pricing"
            subtitle="One payment. Till you get placed."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* Card 1 — Starter */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 flex flex-col gap-5">
              <div>
                <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Starter</span>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold text-zinc-100">₹999</span>
                </div>
                <p className="text-zinc-500 text-sm mt-1.5">Get your AI project done</p>
              </div>
              <ul className="flex flex-col gap-3 flex-1">
                {[
                  "1 custom AI project",
                  "Complete project document",
                  "GitHub code included",
                  "Resume bullet points",
                  "WhatsApp support till placed",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink("Hi Aman, I am interested in the Project Pack package")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-semibold text-sm px-5 py-3 rounded-xl transition-all"
              >
                Get Started
              </a>
            </div>

            {/* Card 2 — Popular (featured) */}
            <div className="bg-zinc-900 border-2 border-orange-500 rounded-2xl p-8 flex flex-col gap-5 scale-[1.03] shadow-2xl shadow-orange-500/10 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                  Popular
                </span>
              </div>
              <div>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold text-zinc-100">₹2,499</span>
                </div>
                <p className="text-zinc-400 text-sm mt-1.5">Project + Interview ready</p>
              </div>
              <ul className="flex flex-col gap-3 flex-1">
                {[
                  "Everything in Starter",
                  "Project-specific interview Q&A",
                  "Mock interview session",
                  "LinkedIn post template",
                  "Priority WhatsApp support till placed",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink("Hi Aman, I am interested in the Project + Interview Pack package")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                Get Started
              </a>
            </div>

            {/* Card 3 — Complete */}
            <div className="bg-zinc-900 border border-purple-500/50 rounded-2xl p-8 flex flex-col gap-5">
              <div>
                <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">Complete</span>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold text-zinc-100">₹4,999</span>
                </div>
                <p className="text-zinc-500 text-sm mt-1.5">We stay till you get placed</p>
              </div>
              <ul className="flex flex-col gap-3 flex-1">
                {[
                  "Everything in Popular",
                  "2 custom AI projects",
                  "Resume complete rewrite",
                  "LinkedIn profile optimization",
                  "Weekly check-in calls",
                  "Job application strategy",
                  "WhatsApp group access",
                  "Till placed — we never stop",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink("Hi Aman, I am interested in the Complete Career Switch package")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-purple-500 text-purple-400 hover:bg-purple-500/10 font-semibold text-sm px-5 py-3 rounded-xl transition-all"
              >
                Get Started
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 5 — WHY CHOOSE US ───────────────────────────────────── */}
      <section className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            title="Why AmanAI Lab?"
            subtitle=""
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHY_US.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex gap-5 hover:border-zinc-700 transition-all"
                >
                  <div className="w-11 h-11 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-zinc-100 font-bold mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — FAQ ─────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle=""
          />
          <div className="flex flex-col gap-3">
            {FAQS.map((item, i) => (
              <FAQItem
                key={i}
                q={item.q}
                a={item.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7 — CTA BOTTOM ──────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl px-8 py-16 text-center overflow-hidden">
            {/* Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-6">
                <Rocket className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Ready to Switch to AI?
              </h2>
              <p className="text-zinc-400 text-lg max-w-md mx-auto mb-8 leading-relaxed">
                Join developers who are already building their AI career with AmanAI Lab.
              </p>
              <a
                href={waLink("Hi Aman, I am ready to switch to AI. Can you help me get started?")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 text-[15px]"
              >
                Start Today
                <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-zinc-600 text-xs mt-5">Limited spots available each month</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
