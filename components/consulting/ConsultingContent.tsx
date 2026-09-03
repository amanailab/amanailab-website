"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Zap, Rocket, Cpu, Wrench, Layers, MessageSquare, CheckCircle2,
  ArrowRight, Clock, Shield, Code2, ChevronDown, Sparkles, FileCheck,
  Handshake, Send,
} from "lucide-react"

// ── WhatsApp ────────────────────────────────────────────────────────────────
const WA_NUMBER = "919997600372"
function waLink(context: string) {
  const msg = encodeURIComponent(`Hi Aman! I have an idea/project I want to build. (${context}) Can we discuss?`)
  return `https://wa.me/${WA_NUMBER}?text=${msg}`
}

// ── What I build ────────────────────────────────────────────────────────────
const OFFERS = [
  { icon: Cpu,    title: "AI Features & Integrations", desc: "Add AI to your product — chatbots, RAG (chat with your docs), LLM automation, content generation.", accent: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/25" },
  { icon: Rocket, title: "POC / Prototype",            desc: "A working demo to validate your idea or pitch to investors — fast, focused, deployed live.",       accent: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25" },
  { icon: Layers, title: "Full MVP / Product",         desc: "End-to-end build: auth, database, payments and your core features — a real product people can use.", accent: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25" },
  { icon: Wrench, title: "Fix / Finish a Project",     desc: "Stuck on an existing codebase? I debug, complete or improve what you already have.",                accent: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/25" },
]

// ── Pricing tiers ───────────────────────────────────────────────────────────
interface Tier {
  id: string; emoji: string; name: string; price: string; usd: string; tagline: string
  delivery: string; badge: string | null; topBar: string; border: string; accentText: string; accentBg: string
  features: string[]; bestFor: string
}
const TIERS: Tier[] = [
  {
    id: "micro", emoji: "⚡", name: "Micro POC", price: "₹12,000", usd: "~$250",
    tagline: "One idea, proven fast", delivery: "2–4 days", badge: null,
    topBar: "from-cyan-500 to-blue-500", border: "border-cyan-500/25", accentText: "text-cyan-400", accentBg: "bg-cyan-500/10",
    bestFor: "Testing a single AI feature or a quick demo",
    features: [
      "One working feature, demo or automation script",
      "Real AI integration (Groq / OpenAI / Gemini) if needed",
      "Deployed live so you can share a link",
      "Clean, documented code — 100% yours",
      "1 revision round",
    ],
  },
  {
    id: "proto", emoji: "🚀", name: "POC / Prototype", price: "₹40,000", usd: "~$800",
    tagline: "A real, clickable product", delivery: "1–2 weeks", badge: "Most Popular",
    topBar: "from-orange-500 to-orange-600", border: "border-orange-500/30", accentText: "text-orange-400", accentBg: "bg-orange-500/10",
    bestFor: "Validating an idea or pitching to investors",
    features: [
      "Small working app with 1–2 core flows",
      "Custom UI — modern, mobile-first, no templates",
      "AI features + API integrations built in",
      "Auth or database if your idea needs it",
      "Deployed on Vercel with a shareable link",
      "Full source code on your GitHub",
      "2 revision rounds",
    ],
  },
  {
    id: "mvp", emoji: "💎", name: "Full MVP", price: "₹1,20,000+", usd: "~$2,000+",
    tagline: "Launch-ready product", delivery: "3–6 weeks", badge: "Complete",
    topBar: "from-violet-500 to-purple-600", border: "border-violet-500/30", accentText: "text-violet-400", accentBg: "bg-violet-500/10",
    bestFor: "Founders & businesses launching a real product",
    features: [
      "Multi-feature product built end-to-end",
      "Full authentication + user dashboard",
      "Database, admin panel & content management",
      "Payments integrated (Razorpay / Stripe)",
      "Multiple AI-powered features",
      "SEO, analytics & performance optimised",
      "Deployed with custom domain — you own everything",
      "Post-launch support included",
    ],
  },
]

const EXTRAS = [
  { label: "Discovery call", value: "₹999", note: "30–45 min — I scope your idea & give a fixed quote. Credited back if you book." },
  { label: "Hourly (extra changes)", value: "₹1,200/hr", note: "For work beyond the agreed scope." },
  { label: "Monthly retainer", value: "₹50,000/mo", note: "Ongoing development & maintenance." },
]

// ── Process ─────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", icon: MessageSquare, title: "Tell me your idea", desc: "Message me on WhatsApp with what you want to build, your goal, budget & timeline." },
  { n: "02", icon: FileCheck,     title: "Discovery & quote", desc: "A quick call to scope it — you get a clear plan and a fixed price, no surprises." },
  { n: "03", icon: Code2,         title: "I build it",        desc: "50% deposit to start. I build with regular updates, then 2 revision rounds." },
  { n: "04", icon: Handshake,     title: "Delivery & handover", desc: "Final 50% on delivery. You get the deployed product, full code & a walkthrough." },
]

const TECH = ["Next.js", "React", "TypeScript", "Supabase", "Tailwind CSS", "Groq / OpenAI / Gemini", "Razorpay / Stripe", "Vercel"]

// ── Proof ───────────────────────────────────────────────────────────────────
const PROOF = [
  { title: "AI Interview Simulator", desc: "Timed mock interviews with instant AI scoring", href: "/interview" },
  { title: "System Design Practice", desc: "Drag-drop architecture canvas + AI review", href: "/system-design" },
  { title: "Resume Analyzer",        desc: "ATS scoring, JD match & AI cover letters",     href: "/resume" },
  { title: "Code Lab",               desc: "Interactive coding with XP & live grading",      href: "/code-lab" },
]

// ── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ = [
  { q: "Do I own the code?", a: "Yes — 100%. On final payment everything is pushed to your GitHub and it's fully yours, with no lock-in." },
  { q: "How does payment work?", a: "50% upfront to start, 50% on delivery — securely via Razorpay. The discovery call fee (₹999) is credited toward your project if you book." },
  { q: "What if my idea isn't on the list?", a: "That's fine — most projects are custom. Message me on WhatsApp with your idea and I'll scope it and give you a fixed quote." },
  { q: "What if I need changes after delivery?", a: "Every package includes revision rounds. Beyond that, changes are ₹1,200/hr, or you can move to a monthly retainer for ongoing work." },
  { q: "How fast do you reply?", a: "Usually within 2–4 hours during IST business hours. You'll always get regular progress updates during the build." },
  { q: "Will you sign an NDA?", a: "Yes, happy to sign an NDA before you share any confidential details." },
  { q: "What do you need from me to start?", a: "Just your idea, the goal, your budget range and timeline. We refine the rest together on the discovery call." },
]

// ── Card ────────────────────────────────────────────────────────────────────
function TierCard({ t, i }: { t: Tier; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
      className={`relative flex flex-col bg-zinc-900 border rounded-2xl overflow-hidden ${t.border}`}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${t.topBar}`} />
      {t.badge && (
        <div className={`absolute top-4 right-4 text-[10px] font-extrabold px-2.5 py-1 rounded-full z-10 ${t.accentBg} ${t.accentText} border border-current/20`}>
          {t.badge}
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl leading-none">{t.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-extrabold uppercase tracking-widest mb-0.5 ${t.accentText}`}>{t.name}</p>
            <p className="text-xs text-zinc-500 leading-snug">{t.tagline}</p>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-extrabold text-zinc-100">{t.price}</span>
          <span className="text-sm text-zinc-600">{t.usd}</span>
        </div>
        <div className="flex items-center gap-1.5 mb-5">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-xs text-zinc-600">Delivered in {t.delivery}</span>
        </div>
        <div className={`h-px w-full mb-5 bg-gradient-to-r ${t.topBar} opacity-20`} />
        <ul className="flex flex-col gap-2 flex-1 mb-4">
          {t.features.map((f, ii) => (
            <li key={ii} className="flex items-start gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${t.accentText}`} />
              <span className="text-xs text-zinc-300 leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>
        <p className={`text-xs mb-5 px-3 py-2 rounded-lg ${t.accentBg} ${t.accentText}`}>
          <span className="font-bold">Best for:</span> <span className="text-zinc-300">{t.bestFor}</span>
        </p>
        <a href={waLink(`${t.name} — ${t.price}`)} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white transition-all hover:shadow-lg hover:shadow-orange-500/25 mt-auto">
          Discuss on WhatsApp <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function ConsultingContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 text-center pt-14 pb-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" /> Built by the creator of AmanAI Lab
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-4xl sm:text-5xl font-extrabold text-zinc-100 leading-tight mb-4">
          Have an idea?{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">I&apos;ll build it.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
          Consulting & development for your <span className="text-zinc-200 font-semibold">project, POC or MVP</span>.
          Bring an idea — I turn it into a working, deployed product. AI features, prototypes, full builds — shipped, not just designed.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href={waLink("From the top of the consulting page")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white transition-all hover:shadow-lg hover:shadow-orange-500/25">
            <MessageSquare className="w-4 h-4" /> Tell me your idea on WhatsApp
          </a>
          <a href="#pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 transition-all">
            See pricing <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </section>

      {/* What I build */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-extrabold text-zinc-100 text-center mb-2">What I build</h2>
        <p className="text-sm text-zinc-500 text-center mb-8">Pick what fits — or bring something custom.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {OFFERS.map((o, i) => (
            <motion.div key={o.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }}
              className={`flex items-start gap-4 p-5 rounded-2xl bg-zinc-900 border ${o.border}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${o.bg}`}>
                <o.icon className={`w-5 h-5 ${o.accent}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1">{o.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{o.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 mb-10 scroll-mt-24">
        <h2 className="text-2xl font-extrabold text-zinc-100 text-center mb-2">Simple, fixed pricing</h2>
        <p className="text-sm text-zinc-500 text-center mb-8">Starting prices — final quote after a quick discovery call. 50% upfront, 50% on delivery.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {TIERS.map((t, i) => <TierCard key={t.id} t={t} i={i} />)}
        </div>

        {/* Extras */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {EXTRAS.map(e => (
            <div key={e.label} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-zinc-300">{e.label}</span>
                <span className="text-sm font-extrabold text-orange-400">{e.value}</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{e.note}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-zinc-500">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          You own 100% of the code · NDA on request · Clear scope before any work starts
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-extrabold text-zinc-100 text-center mb-8">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }}
              className="relative p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="absolute top-4 right-4 text-2xl font-extrabold text-zinc-800">{s.n}</span>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3">
                <s.icon className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100 mb-1">{s.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech */}
      <section className="max-w-4xl mx-auto px-4 mb-16 text-center">
        <h2 className="text-lg font-bold text-zinc-200 mb-4">Tech I work with</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {TECH.map(t => (
            <span key={t} className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full font-mono">{t}</span>
          ))}
        </div>
      </section>

      {/* Proof */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-zinc-100 mb-2">Proof — what I&apos;ve built</h2>
          <p className="text-sm text-zinc-500">This whole platform is my portfolio. Every tool below is live and built by me.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROOF.map((p, i) => (
            <motion.a key={p.title} href={p.href}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }}
              className="group p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 transition-all">
              <Sparkles className="w-5 h-5 text-orange-400 mb-3" />
              <h3 className="text-sm font-bold text-zinc-100 mb-1 group-hover:text-orange-400 transition-colors">{p.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{p.desc}</p>
            </motion.a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-extrabold text-zinc-100 text-center mb-8">Questions</h2>
        <div className="flex flex-col gap-2">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                <span className="text-sm font-semibold text-zinc-200">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/40 border border-orange-500/20 p-8 sm:p-10 text-center overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 mb-3">Still have doubts? Just ask.</h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-7">
            Message me on WhatsApp with your idea — even if it&apos;s rough. I&apos;ll tell you honestly if I can build it, how long it&apos;ll take, and what it&apos;ll cost. No pressure.
          </p>
          <a href={waLink("Final CTA — have doubts")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white transition-all hover:shadow-lg hover:shadow-orange-500/25">
            <Send className="w-4 h-4" /> Message Aman on WhatsApp
          </a>
          <p className="text-[11px] text-zinc-600 mt-4">Typically replies within 2–4 hours · IST business hours</p>
        </div>
      </section>
    </div>
  )
}
