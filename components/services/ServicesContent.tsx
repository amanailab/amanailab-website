"use client";

import { useState } from "react";
import {
  ClipboardList, Terminal, Trophy,
  User, Clock, Briefcase, MessageCircle,
  ChevronDown, ChevronUp, ArrowRight, Rocket,
  CheckCircle2, CreditCard,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = "919997600372";

function waLink(msg: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ─── Animations (injected once) ───────────────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      @keyframes pulse-node {
        0%, 100% { opacity: 1; r: 100%; }
        50%       { opacity: 0.45; r: 80%; }
      }
      @keyframes pulse-node-sm {
        0%, 100% { opacity: 0.75; }
        50%       { opacity: 0.3; }
      }
      @keyframes float-particle {
        0%, 100% { transform: translateY(0px);   opacity: 0.6; }
        50%       { transform: translateY(-6px);  opacity: 1; }
      }
      @keyframes glow-border {
        0%, 100% { box-shadow: 0 0 0px 0px rgba(249,115,22,0); }
        50%       { box-shadow: 0 0 24px 4px rgba(249,115,22,0.35); }
      }
      .node-pulse-1 { animation: pulse-node    2.8s ease-in-out infinite; }
      .node-pulse-2 { animation: pulse-node-sm 3.2s ease-in-out 0.4s infinite; }
      .node-pulse-3 { animation: pulse-node-sm 2.6s ease-in-out 0.8s infinite; }
      .node-pulse-4 { animation: pulse-node-sm 3.5s ease-in-out 1.2s infinite; }
      .node-pulse-5 { animation: pulse-node-sm 2.9s ease-in-out 0.6s infinite; }
      .node-pulse-6 { animation: pulse-node-sm 3.1s ease-in-out 1.0s infinite; }
      .node-pulse-7 { animation: pulse-node-sm 2.7s ease-in-out 1.4s infinite; }
      .node-pulse-8 { animation: pulse-node-sm 3.3s ease-in-out 0.2s infinite; }
      .particle-1   { animation: float-particle 3.0s ease-in-out infinite; }
      .particle-2   { animation: float-particle 3.6s ease-in-out 0.5s infinite; }
      .particle-3   { animation: float-particle 2.8s ease-in-out 1.0s infinite; }
      .particle-4   { animation: float-particle 3.4s ease-in-out 1.5s infinite; }
      .popular-glow { animation: glow-border 2.5s ease-in-out infinite; }
    `}</style>
  );
}

// ─── Hero Illustration ────────────────────────────────────────────────────────

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm mx-auto lg:max-w-none"
      aria-hidden="true"
    >

      {/* ── Connecting lines (ring 1 → center) ── */}
      <line x1="200" y1="200" x2="200" y2="90"  stroke="#FF6B35" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="200" y1="200" x2="310" y2="200" stroke="#c084fc" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="200" y1="200" x2="200" y2="310" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="200" y1="200" x2="90"  y2="200" stroke="#c084fc" strokeWidth="1.5" strokeOpacity="0.35" />

      {/* ── Connecting lines (ring 2 → ring 1) ── */}
      <line x1="200" y1="90"  x2="310" y2="200" stroke="#60a5fa" strokeWidth="1"   strokeOpacity="0.2" />
      <line x1="310" y1="200" x2="200" y2="310" stroke="#c084fc" strokeWidth="1"   strokeOpacity="0.2" />
      <line x1="200" y1="310" x2="90"  y2="200" stroke="#60a5fa" strokeWidth="1"   strokeOpacity="0.2" />
      <line x1="90"  y1="200" x2="200" y2="90"  stroke="#c084fc" strokeWidth="1"   strokeOpacity="0.2" />

      {/* ── Ring 2 → diagonal outer nodes ── */}
      <line x1="200" y1="90"  x2="305" y2="95"  stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="310" y1="200" x2="305" y2="95"  stroke="#c084fc" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="310" y1="200" x2="305" y2="305" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="200" y1="310" x2="305" y2="305" stroke="#c084fc" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="200" y1="310" x2="95"  y2="305" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="90"  y1="200" x2="95"  y2="305" stroke="#c084fc" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="90"  y1="200" x2="95"  y2="95"  stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="200" y1="90"  x2="95"  y2="95"  stroke="#c084fc" strokeWidth="0.8" strokeOpacity="0.2" />

      {/* ── Central node ── */}
      <circle cx="200" cy="200" r="28" fill="#FF6B35" fillOpacity="0.15" />
      <circle cx="200" cy="200" r="20" fill="#FF6B35" fillOpacity="0.3" />
      <circle cx="200" cy="200" r="13" fill="#FF6B35" className="node-pulse-1" />
      {/* brain symbol */}
      <text x="200" y="206" textAnchor="middle" fill="white" fontSize="13" fontWeight="800" fontFamily="monospace">AI</text>

      {/* ── Ring 1 nodes ── */}
      {/* Top */}
      <circle cx="200" cy="90" r="10" fill="#60a5fa" fillOpacity="0.2" />
      <circle cx="200" cy="90" r="7"  fill="#60a5fa" className="node-pulse-2" />
      {/* Right */}
      <circle cx="310" cy="200" r="10" fill="#c084fc" fillOpacity="0.2" />
      <circle cx="310" cy="200" r="7"  fill="#c084fc" className="node-pulse-3" />
      {/* Bottom */}
      <circle cx="200" cy="310" r="10" fill="#60a5fa" fillOpacity="0.2" />
      <circle cx="200" cy="310" r="7"  fill="#60a5fa" className="node-pulse-4" />
      {/* Left */}
      <circle cx="90"  cy="200" r="10" fill="#c084fc" fillOpacity="0.2" />
      <circle cx="90"  cy="200" r="7"  fill="#c084fc" className="node-pulse-5" />

      {/* ── Ring 2 outer nodes ── */}
      <circle cx="305" cy="95"  r="5" fill="#60a5fa" className="node-pulse-6" />
      <circle cx="305" cy="305" r="5" fill="#c084fc" className="node-pulse-7" />
      <circle cx="95"  cy="305" r="5" fill="#60a5fa" className="node-pulse-8" />
      <circle cx="95"  cy="95"  r="5" fill="#c084fc" className="node-pulse-2" />

      {/* ── Floating particles ── */}
      <circle cx="160" cy="50"  r="3" fill="#FF6B35" fillOpacity="0.6" className="particle-1" />
      <circle cx="350" cy="130" r="2" fill="#60a5fa" fillOpacity="0.7" className="particle-2" />
      <circle cx="340" cy="310" r="3" fill="#c084fc" fillOpacity="0.6" className="particle-3" />
      <circle cx="55"  cy="290" r="2" fill="#FF6B35" fillOpacity="0.5" className="particle-4" />
      <circle cx="60"  cy="110" r="2" fill="#60a5fa" fillOpacity="0.5" className="particle-1" />
      <circle cx="250" cy="35"  r="2" fill="#c084fc" fillOpacity="0.6" className="particle-3" />
      <circle cx="370" cy="220" r="2" fill="#FF6B35" fillOpacity="0.4" className="particle-2" />
      <circle cx="30"  cy="200" r="2" fill="#60a5fa" fillOpacity="0.4" className="particle-4" />

      {/* ── Floating labels ── */}
      <rect x="316" y="52"  width="52" height="22" rx="6" fill="#18181b" stroke="#FF6B35" strokeWidth="1" strokeOpacity="0.5" />
      <text x="342" y="67"  textAnchor="middle" fill="#FF6B35" fontSize="10" fontWeight="700" fontFamily="monospace">LLM</text>

      <rect x="28"  y="52"  width="52" height="22" rx="6" fill="#18181b" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.5" />
      <text x="54"  y="67"  textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="700" fontFamily="monospace">RAG</text>

      <rect x="316" y="326" width="62" height="22" rx="6" fill="#18181b" stroke="#c084fc" strokeWidth="1" strokeOpacity="0.5" />
      <text x="347" y="341" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="700" fontFamily="monospace">Agent</text>

      <rect x="22"  y="326" width="60" height="22" rx="6" fill="#18181b" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.5" />
      <text x="52"  y="341" textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="700" fontFamily="monospace">API</text>
    </svg>
  );
}

// ─── How It Works mini-SVGs ───────────────────────────────────────────────────

function ClipboardSVG() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 mb-4" aria-hidden="true">
      <rect x="10" y="8" width="36" height="42" rx="5" fill="#FF6B35" fillOpacity="0.12" stroke="#FF6B35" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="20" y="4" width="16" height="8" rx="4" fill="#FF6B35" fillOpacity="0.3" stroke="#FF6B35" strokeOpacity="0.5" strokeWidth="1.5" />
      <line x1="18" y1="22" x2="38" y2="22" stroke="#FF6B35" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="30" x2="38" y2="30" stroke="#FF6B35" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="38" x2="30" y2="38" stroke="#FF6B35" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CodeSVG() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 mb-4" aria-hidden="true">
      <rect x="4" y="8" width="48" height="40" rx="6" fill="#60a5fa" fillOpacity="0.08" stroke="#60a5fa" strokeOpacity="0.3" strokeWidth="1.5" />
      <circle cx="13" cy="17" r="2.5" fill="#60a5fa" fillOpacity="0.5" />
      <circle cx="21" cy="17" r="2.5" fill="#60a5fa" fillOpacity="0.35" />
      <circle cx="29" cy="17" r="2.5" fill="#60a5fa" fillOpacity="0.25" />
      <line x1="4" y1="24" x2="52" y2="24" stroke="#60a5fa" strokeOpacity="0.2" strokeWidth="1" />
      <text x="14" y="39" fill="#60a5fa" fontSize="13" fontWeight="700" fontFamily="monospace" fillOpacity="0.9">&lt;AI/&gt;</text>
    </svg>
  );
}

function TrophySVG() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 mb-4" aria-hidden="true">
      <path d="M18 10 H38 V30 A10 10 0 0 1 28 40 A10 10 0 0 1 18 30 Z" fill="#4ade80" fillOpacity="0.12" stroke="#4ade80" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M10 14 H18 V26 Q10 26 10 18 Z" fill="#4ade80" fillOpacity="0.1" stroke="#4ade80" strokeOpacity="0.3" strokeWidth="1.2" />
      <path d="M46 14 H38 V26 Q46 26 46 18 Z" fill="#4ade80" fillOpacity="0.1" stroke="#4ade80" strokeOpacity="0.3" strokeWidth="1.2" />
      <line x1="28" y1="40" x2="28" y2="47" stroke="#4ade80" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <rect x="18" y="47" width="20" height="4" rx="2" fill="#4ade80" fillOpacity="0.25" stroke="#4ade80" strokeOpacity="0.4" strokeWidth="1.2" />
      <path d="M24 24 L28 18 L32 24 L38 25 L33 30 L35 36 L28 32 L21 36 L23 30 L18 25 Z" fill="#4ade80" fillOpacity="0.6" />
    </svg>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100 mb-3">{title}</h2>
      {subtitle && <p className="text-zinc-400 text-base max-w-xl mx-auto">{subtitle}</p>}
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
    Illustration: ClipboardSVG,
    icon: ClipboardList,
    title: "Tell Us Your Background",
    desc: "Fill a quick form about your current role, experience and your target AI job.",
    accent: "text-orange-400",
    glow: "bg-orange-500/10 border-orange-500/20",
  },
  {
    num: "02",
    Illustration: CodeSVG,
    icon: Terminal,
    title: "We Build Your Project",
    desc: "We create a custom AI project perfectly matched to your background. Java dev gets Java+AI. Python dev gets Python+AI.",
    accent: "text-blue-400",
    glow: "bg-blue-500/10 border-blue-500/20",
  },
  {
    num: "03",
    Illustration: TrophySVG,
    icon: Trophy,
    title: "Get Placed",
    desc: "We prep you for interviews, review your resume and stay with you till you land your AI job.",
    accent: "text-green-400",
    glow: "bg-green-500/10 border-green-500/20",
  },
];

const HOW_TO_BUY = [
  {
    icon: MessageCircle,
    title: "WhatsApp Us",
    desc: "Click Get Started and send us a WhatsApp message with your background.",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    icon: CreditCard,
    title: "Make Payment",
    desc: "We send you a secure Razorpay payment link. Pay safely online.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Rocket,
    title: "We Start Working",
    desc: "Within 24 hours we begin building your custom AI project.",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
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

// ─── WhatsApp SVG icon ────────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-400 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ServicesContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-zinc-950 text-zinc-50">
      <GlobalStyles />

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right,#27272a 1px,transparent 1px),linear-gradient(to bottom,#27272a 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-start pointer-events-none">
          <div
            className="w-[600px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse,#f97316 0%,transparent 70%)", filter: "blur(80px)" }}
          />
        </div>
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-zinc-950 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 tracking-wide uppercase">
                <Rocket className="w-3.5 h-3.5" />
                AI Career Services
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
                We Build Your{" "}
                <span style={{ backgroundImage: "linear-gradient(135deg,#fb923c 0%,#f97316 50%,#ea580c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
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
                  href={waLink("Hi Aman, I want to switch to AI and need your help.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-100 font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 text-[15px]"
                >
                  <WhatsAppIcon />
                  WhatsApp Us
                </a>
              </div>
            </div>

            {/* Illustration */}
            <div className="flex-1 w-full max-w-xs sm:max-w-sm lg:max-w-none">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="How It Works" subtitle="Simple 3 step process" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              const Illustration = step.Illustration;
              return (
                <div
                  key={step.num}
                  className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all duration-200"
                >
                  <div className="absolute top-6 right-6 text-5xl font-extrabold text-zinc-800 tabular-nums select-none">
                    {step.num}
                  </div>
                  <Illustration />
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

      {/* ── SECTION 3 — HOW TO BUY ───────────────────────────────────────── */}
      <section className="py-20 px-4 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="How to Buy" subtitle="Simple 3 step process. No complexity." />
          <div className="flex flex-col md:flex-row items-center gap-4">
            {HOW_TO_BUY.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full">
                  <div className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex flex-col items-center text-center hover:border-zinc-700 transition-all">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${step.bg}`}>
                      <Icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    <div className="text-xs font-bold text-zinc-600 mb-1 tracking-widest">STEP {i + 1}</div>
                    <h3 className="text-zinc-100 font-bold text-base mb-2">{step.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                  {i < HOW_TO_BUY.length - 1 && (
                    <ArrowRight className="w-6 h-6 text-zinc-600 shrink-0 hidden md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — BACKGROUND SELECTOR ─────────────────────────────── */}
      <section className="py-24 px-4">
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

      {/* ── SECTION 5 — PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="Simple Pricing" subtitle="One payment. Till you get placed." />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* Starter */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 flex flex-col gap-5">
              <div>
                <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Starter</span>
                <div className="mt-3">
                  <span className="text-4xl font-extrabold text-zinc-100">₹999</span>
                </div>
                <p className="text-zinc-500 text-sm mt-1.5">Get your AI project done</p>
              </div>
              <ul className="flex flex-col gap-3 flex-1">
                {[
                  "1 custom AI project idea",
                  "Complete project document",
                  "Step by step build guide",
                  "GitHub starter code template",
                  "Resume bullet points for the project",
                  "WhatsApp support till placed",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink("Hi Aman, I am interested in the Starter Pack ₹999. My background is...")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-semibold text-sm px-5 py-3 rounded-xl transition-all"
              >
                Get Started
              </a>
            </div>

            {/* Popular */}
            <div className="popular-glow bg-zinc-900 border-2 border-orange-500 rounded-2xl p-8 flex flex-col gap-5 scale-[1.03] relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                  Popular
                </span>
              </div>
              <div>
                <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">Popular</span>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-zinc-100">₹2,499</span>
                </div>
                <p className="text-zinc-400 text-sm mt-1.5">Project + Interview ready</p>
              </div>
              <ul className="flex flex-col gap-3 flex-1">
                {[
                  "Everything in Starter PLUS:",
                  "Complete working project with code",
                  "Full GitHub repository",
                  "Project explanation document",
                  "Project specific interview Q&A",
                  "Mock interview session (1 session)",
                  "LinkedIn post template",
                  "Resume review and suggestions",
                  "Priority WhatsApp support till placed",
                ].map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${f.endsWith(":") ? "text-zinc-400 font-semibold" : "text-zinc-200"}`}>
                    {f.endsWith(":") ? (
                      <span className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    )}
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink("Hi Aman, I am interested in the Popular Pack ₹2,499. My background is...")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                Get Started
              </a>
            </div>

            {/* Complete */}
            <div className="bg-zinc-900 border border-purple-500/50 rounded-2xl p-8 flex flex-col gap-5">
              <div>
                <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">Complete</span>
                <div className="mt-3">
                  <span className="text-4xl font-extrabold text-zinc-100">₹4,999</span>
                </div>
                <p className="text-zinc-500 text-sm mt-1.5">We stay till you get placed</p>
              </div>
              <ul className="flex flex-col gap-3 flex-1">
                {[
                  "Everything in Popular PLUS:",
                  "2 custom AI projects (basic + advanced)",
                  "Mock interview sessions (3 sessions)",
                  "Full resume rewrite",
                  "LinkedIn profile complete optimization",
                  "Weekly check-in calls (4 sessions)",
                  "Job application strategy guide",
                  "Direct WhatsApp group with Aman",
                  "Referral to Aman network",
                  "Till placed — we never stop supporting",
                ].map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${f.endsWith(":") ? "text-zinc-400 font-semibold" : "text-zinc-300"}`}>
                    {f.endsWith(":") ? (
                      <span className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    )}
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink("Hi Aman, I am interested in the Complete Pack ₹4,999. My background is...")}
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

      {/* ── SECTION 6 — WHY CHOOSE US ────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="Why AmanAI Lab?" />
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

      {/* ── SECTION 7 — FAQ ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-3xl mx-auto">
          <SectionHeader title="Frequently Asked Questions" />
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

      {/* ── SECTION 8 — CTA BOTTOM ───────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl px-8 py-16 text-center overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(249,115,22,0.12) 0%,transparent 70%)" }}
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
                href={waLink("Hi Aman, I want to switch to AI and need your help.")}
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
