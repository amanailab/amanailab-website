"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { SITE_STATS } from "@/lib/site-stats"
import {
  CheckCircle2, Code2, Zap, Crown, Globe, Layers, Cpu,
  BrainCircuit, FileText, MessageSquare, ArrowRight,
  Clock, Briefcase, Rocket, Shield, Phone, Star,
} from "lucide-react"

// ─── Replace with your real WhatsApp number (country code + number, no +) ───
const WA_NUMBER = "919997600372"
function waLink(pkg: string) {
  const msg = encodeURIComponent(`Hi Aman! I'm interested in the "${pkg}" from AmanAI Lab. Can you share more details?`)
  return `https://wa.me/${WA_NUMBER}?text=${msg}`
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeatureGroup { heading: string; items: string[] }
interface Package {
  id: string; name: string; emoji: string; price: string; usd: string
  tagline: string; badge: string | null; topBar: string; border: string
  accentText: string; accentBg: string; deliveryDays: string
  groups: FeatureGroup[]; bestFor: string; tech?: string[]
}

// ─── Career Packages ──────────────────────────────────────────────────────────
const CAREER: Package[] = [
  {
    id: "blueprint",
    name: "Blueprint",
    emoji: "🗺️",
    price: "₹999",
    usd: "~$12",
    tagline: "The plan to get you started",
    badge: null,
    topBar:     "from-blue-500 to-blue-600",
    border:     "border-blue-500/25",
    accentText: "text-blue-400",
    accentBg:   "bg-blue-500/10",
    deliveryDays: "2–3 days",
    bestFor: "Freshers & students planning their first AI project",
    groups: [
      {
        heading: "🎯 Project Planning",
        items: [
          "1 custom AI project idea — tailored to your background & target company",
          "Full project architecture document with tech stack choice",
          "Step-by-step build guide (works even without experience)",
        ],
      },
      {
        heading: "📄 Career Materials",
        items: [
          "GitHub starter code template (ready to clone & run)",
          "3 resume bullet points written specifically for this project",
        ],
      },
      {
        heading: "💬 Support",
        items: ["48-hour WhatsApp support for questions during the build"],
      },
    ],
  },
  {
    id: "launchpad",
    name: "Launchpad",
    emoji: "🚀",
    price: "₹2,499",
    usd: "~$30",
    tagline: "Build it. Practice it. Land the job.",
    badge: "Most Popular",
    topBar:     "from-orange-500 to-orange-600",
    border:     "border-orange-500/30",
    accentText: "text-orange-400",
    accentBg:   "bg-orange-500/10",
    deliveryDays: "5–7 days",
    bestFor: "Working professionals switching into AI/ML roles",
    groups: [
      {
        heading: "💻 What Gets Built",
        items: [
          "Complete production-ready project code — every file, fully working",
          "Video walkthrough (recorded by Aman) explaining every component",
          "Custom project idea + full architecture document + build guide",
          "GitHub starter code template",
        ],
      },
      {
        heading: "🎤 Interview Preparation",
        items: [
          "20 project-specific Q&As with model answers",
          "1 live mock interview session (45 min) with AI scoring & feedback",
        ],
      },
      {
        heading: "📄 Career Materials",
        items: [
          "LinkedIn post template to announce your project",
          "GitHub README template (looks professional to recruiters)",
          "3 tailored resume bullet points",
          "Full resume review with specific suggestions",
        ],
      },
      {
        heading: "💬 Support",
        items: ["7-day priority WhatsApp support"],
      },
    ],
  },
  {
    id: "placement",
    name: "Placement",
    emoji: "👑",
    price: "₹4,999",
    usd: "~$60",
    tagline: "We don't stop until you're hired",
    badge: "Best Investment",
    topBar:     "from-amber-400 to-yellow-500",
    border:     "border-amber-500/30",
    accentText: "text-amber-400",
    accentBg:   "bg-amber-500/10",
    deliveryDays: "7–10 days",
    bestFor: "Serious candidates who want guaranteed forward momentum",
    groups: [
      {
        heading: "💻 What Gets Built",
        items: [
          "2 fully working projects — one beginner, one advanced (both production-ready)",
          "Video walkthroughs for both projects by Aman",
          "Custom ideas + architecture + build guides for both",
          "GitHub starter templates for both",
        ],
      },
      {
        heading: "🎤 Interview Preparation",
        items: [
          "40+ project-specific Q&As with model answers (20 per project)",
          "3 live mock interview sessions with detailed written feedback",
        ],
      },
      {
        heading: "📄 Career Materials — Full Overhaul",
        items: [
          "Complete resume rewrite — ATS-optimized for AI/ML roles",
          "Full LinkedIn profile overhaul (headline, about, experience, skills)",
          "LinkedIn post + GitHub README templates for both projects",
          "Job application strategy + personalized company shortlist",
        ],
      },
      {
        heading: "🤝 Personal Mentorship",
        items: [
          "4 weekly 1-on-1 check-in calls with Aman",
          "Direct access to Aman's hiring network & referrals",
        ],
      },
      {
        heading: "⏱️ Until You're Placed",
        items: ["Support continues until you receive an offer — no expiry, no time limit"],
      },
    ],
  },
]

// ─── Website Packages ─────────────────────────────────────────────────────────
const WEBSITE: Package[] = [
  {
    id: "ai-landing",
    name: "AI Landing Page",
    emoji: "🌐",
    price: "₹3,999",
    usd: "~$48",
    tagline: "Your AI presence, live in a week",
    badge: null,
    topBar:     "from-cyan-500 to-blue-500",
    border:     "border-cyan-500/25",
    accentText: "text-cyan-400",
    accentBg:   "bg-cyan-500/10",
    deliveryDays: "5–7 days",
    bestFor: "Freelancers, students & indie makers who want a standout AI portfolio",
    tech: ["Next.js", "Tailwind CSS", "Groq API", "Vercel"],
    groups: [
      {
        heading: "🎨 Design & Build",
        items: [
          "Single-page custom website — no templates, built from scratch",
          "Modern dark design with smooth animations",
          "Mobile-first, fast-loading (Lighthouse 90+ score)",
        ],
      },
      {
        heading: "🤖 AI Features",
        items: [
          "1–2 AI-powered tools (choose from: chatbot, content analyzer, resume reviewer, or generator)",
          "Real AI integration via Groq or OpenAI API",
        ],
      },
      {
        heading: "🚀 Launch",
        items: [
          "Deployed live on Vercel",
          "Custom domain setup & configuration",
          "Full source code pushed to your GitHub — you own everything",
        ],
      },
      {
        heading: "💬 Support",
        items: ["7-day post-launch WhatsApp support"],
      },
    ],
  },
  {
    id: "ai-platform",
    name: "AI Platform",
    emoji: "⚡",
    price: "₹7,999",
    usd: "~$96",
    tagline: "A full product — not just a website",
    badge: "Most Popular",
    topBar:     "from-orange-500 to-orange-600",
    border:     "border-orange-500/30",
    accentText: "text-orange-400",
    accentBg:   "bg-orange-500/10",
    deliveryDays: "10–14 days",
    bestFor: "Startups & professionals who want a full platform like AmanAI Lab",
    tech: ["Next.js 16", "Supabase", "Tailwind CSS 4", "Groq / OpenAI", "Vercel"],
    groups: [
      {
        heading: "🎨 Design & Build",
        items: [
          "5–8 fully custom pages (Home, Tools, Blog, About, Dashboard, Contact)",
          "Modern dark UI with Framer Motion animations",
          "Mobile-first, SEO-optimized, Lighthouse 90+",
        ],
      },
      {
        heading: "🤖 AI Features",
        items: [
          "3–5 custom AI-powered tools built from scratch",
          "Real API integrations (Groq, OpenAI, or both)",
          "Command palette (Cmd+K search across your whole site)",
        ],
      },
      {
        heading: "👤 User System",
        items: [
          "Full authentication — signup, login, email verification, password reset",
          "User dashboard with activity & progress tracking",
          "User profile page",
        ],
      },
      {
        heading: "📝 Content & SEO",
        items: [
          "Blog / content section with admin CMS panel",
          "Meta tags, Open Graph, sitemap.xml, schema markup — fully SEO-configured",
          "Google Analytics + Microsoft Clarity integrated",
        ],
      },
      {
        heading: "🚀 Launch",
        items: [
          "Deployed on Vercel with custom domain",
          "Full source code on your GitHub — 100% yours",
        ],
      },
      {
        heading: "💬 Support",
        items: ["14-day priority WhatsApp support"],
      },
    ],
  },
  {
    id: "ai-saas",
    name: "Custom AI SaaS",
    emoji: "💎",
    price: "₹14,999",
    usd: "~$180",
    tagline: "Your revenue-generating AI product, end to end",
    badge: "Enterprise",
    topBar:     "from-violet-500 to-purple-600",
    border:     "border-violet-500/30",
    accentText: "text-violet-400",
    accentBg:   "bg-violet-500/10",
    deliveryDays: "21–30 days",
    bestFor: "Founders & businesses building a monetisable AI SaaS",
    tech: ["Next.js 16", "TypeScript", "Supabase", "Groq / OpenAI", "Razorpay", "Vercel"],
    groups: [
      {
        heading: "🎨 Design & Build",
        items: [
          "10+ fully custom pages with your brand identity",
          "Pixel-perfect dark UI, animations, micro-interactions",
          "PWA support — installable on iOS & Android like a native app",
        ],
      },
      {
        heading: "🤖 AI Features",
        items: [
          "10+ custom AI tools/features — you define the exact scope",
          "Multi-model AI integrations (Groq, OpenAI, Anthropic Claude)",
          "Rate limiting, error handling, usage monitoring on all AI endpoints",
        ],
      },
      {
        heading: "👤 User & Admin System",
        items: [
          "Full user authentication + profile + dashboard",
          "Admin panel — manage users, content, and view analytics",
          "Role-based access control (admin vs. user)",
        ],
      },
      {
        heading: "💳 Payments & Monetisation",
        items: [
          "Razorpay or Stripe payment integration (one-time or subscription)",
          "Webhook handling, payment success/failure flows",
        ],
      },
      {
        heading: "📝 Content & SEO",
        items: [
          "Blog + CMS, full SEO setup, sitemap, schema, OG images",
          "Google Analytics + Microsoft Clarity + Vercel Analytics",
        ],
      },
      {
        heading: "🚀 Launch & Ownership",
        items: [
          "Deployed on Vercel with custom domain",
          "Full source code — you own 100%, no lock-in ever",
        ],
      },
      {
        heading: "💬 Support",
        items: [
          "30-day dedicated support",
          "1 free revision round after delivery",
        ],
      },
    ],
  },
]

// ─── Process Steps ────────────────────────────────────────────────────────────
const CAREER_STEPS = [
  { n: "01", icon: MessageSquare, title: "Tell us about yourself",  desc: "WhatsApp Aman — your background, target role, and current level." },
  { n: "02", icon: BrainCircuit,  title: "We craft your roadmap",  desc: "Within 24h: a tailored project idea, plan, and realistic timeline." },
  { n: "03", icon: Code2,         title: "We build together",      desc: "Working code, video walkthroughs, mock interviews — step by step." },
  { n: "04", icon: Rocket,        title: "You land the offer",     desc: "Apply with confidence: standout project + polished profile." },
]
const WEBSITE_STEPS = [
  { n: "01", icon: Phone,      title: "Discovery call",          desc: "Tell us your idea, audience & must-have features over WhatsApp." },
  { n: "02", icon: Layers,     title: "Design & architecture",   desc: "Wireframe + tech plan delivered within 48h for your approval." },
  { n: "03", icon: Cpu,        title: "We build & update daily", desc: "Daily progress updates on WhatsApp — you always know the status." },
  { n: "04", icon: Globe,      title: "Launch & hand-off",       desc: "Site goes live. Full code on your GitHub. Docs included." },
]

// ─── Comparison tables (derived from the package data above) ────────────────────
interface CompareTable { cols: string[]; popularIndex: number; rows: { label: string; vals: string[] }[] }
const CAREER_COMPARE: CompareTable = {
  cols: ["Blueprint", "Launchpad", "Placement"],
  popularIndex: 1,
  rows: [
    { label: "Custom AI project",          vals: ["Idea + plan", "Full build", "2 full builds"] },
    { label: "Production-ready code",       vals: ["—", "✓", "✓"] },
    { label: "Video walkthrough by Aman",   vals: ["—", "✓", "✓ (both)"] },
    { label: "Live mock interviews",        vals: ["—", "1 session", "3 sessions"] },
    { label: "Project Q&As with answers",   vals: ["—", "20", "40+"] },
    { label: "Resume help",                 vals: ["3 bullets", "Full review", "Full rewrite"] },
    { label: "LinkedIn profile overhaul",   vals: ["—", "—", "✓"] },
    { label: "1-on-1 mentor calls",         vals: ["—", "—", "4 weekly"] },
    { label: "Support",                     vals: ["48 hours", "7 days", "Until placed"] },
  ],
}
const WEBSITE_COMPARE: CompareTable = {
  cols: ["AI Landing Page", "AI Platform", "Custom AI SaaS"],
  popularIndex: 1,
  rows: [
    { label: "Custom pages",                vals: ["1", "5–8", "10+"] },
    { label: "AI-powered tools",            vals: ["1–2", "3–5", "10+"] },
    { label: "User auth & dashboard",       vals: ["—", "✓", "✓"] },
    { label: "Admin panel",                 vals: ["—", "—", "✓"] },
    { label: "Payments integration",        vals: ["—", "—", "✓"] },
    { label: "Blog / CMS",                  vals: ["—", "✓", "✓"] },
    { label: "SEO + analytics",             vals: ["Basic", "Full", "Full"] },
    { label: "Source code ownership",       vals: ["✓", "✓", "✓"] },
    { label: "Support",                     vals: ["7 days", "14 days", "30 days"] },
  ],
}

function CompareCell({ value, accent }: { value: string; accent: boolean }) {
  if (value === "—") return <span className="text-zinc-700">—</span>
  if (value === "✓") return <CheckCircle2 className={`w-4 h-4 mx-auto ${accent ? "text-orange-400" : "text-zinc-400"}`} />
  return <span className={`text-xs font-medium ${accent ? "text-orange-300" : "text-zinc-300"}`}>{value}</span>
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "Do I need coding experience for the career packages?", a: "No. We explain every line of code step by step. By the end you'll understand your own project — that's how you ace the interview." },
  { q: "What tech stack do you use for websites?", a: "Next.js 16, TypeScript 5, Tailwind CSS 4, Supabase, and Groq (Llama 3.3) or OpenAI — the exact stack powering AmanAI Lab." },
  { q: "Can I request something custom or not on this list?", a: "Yes. WhatsApp Aman with your exact requirements and we'll scope it out. Most custom projects fit between the listed tiers." },
  { q: "How do payments work?", a: "50% upfront via Razorpay, 50% on delivery. For the ₹999 Blueprint, it's 100% upfront. Scope is fully agreed before any payment." },
  { q: "What if I'm not happy with the result?", a: "We iterate until you're satisfied. For career packages, support continues until you receive an offer — or we refund accordingly." },
  { q: "How quickly do you respond on WhatsApp?", a: "Usually within 2–4 hours during IST business hours. Weekends may be slightly slower." },
]

// ─── Card Component ───────────────────────────────────────────────────────────
function PkgCard({ pkg, i }: { pkg: Package; i: number }) {
  const [expanded, setExpanded] = useState(false)
  // Show first 2 groups collapsed, rest on expand
  const visible = expanded ? pkg.groups : pkg.groups.slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: i * 0.08 }}
      className={`relative flex flex-col bg-zinc-900 border rounded-2xl overflow-hidden ${pkg.border}`}
    >
      {/* Coloured top bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${pkg.topBar}`} />

      {/* Badge */}
      {pkg.badge && (
        <div className={`absolute top-4 right-4 text-[10px] font-extrabold px-2.5 py-1 rounded-full z-10 ${pkg.accentBg} ${pkg.accentText} border border-current/20`}>
          {pkg.badge}
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl leading-none">{pkg.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-extrabold uppercase tracking-widest mb-0.5 ${pkg.accentText}`}>{pkg.name}</p>
            <p className="text-xs text-zinc-500 leading-snug">{pkg.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-extrabold text-zinc-100">{pkg.price}</span>
          <span className="text-sm text-zinc-600">{pkg.usd}</span>
        </div>
        <div className="flex items-center gap-1.5 mb-5">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-xs text-zinc-600">Delivered in {pkg.deliveryDays}</span>
        </div>

        <div className={`h-px w-full mb-5 bg-gradient-to-r ${pkg.topBar} opacity-20`} />

        {/* Feature groups */}
        <div className="flex flex-col gap-4 flex-1 mb-4">
          {visible.map((group) => (
            <div key={group.heading}>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{group.heading}</p>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${pkg.accentText}`} />
                    <span className="text-xs text-zinc-300 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Expand toggle */}
        {pkg.groups.length > 2 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className={`text-xs font-semibold mb-5 text-left transition-colors ${pkg.accentText} hover:opacity-80`}
          >
            {expanded ? "▲ Show less" : `▼ Show all features (+${pkg.groups.slice(2).reduce((a, g) => a + g.items.length, 0)} more)`}
          </button>
        )}

        {/* Tech stack */}
        {pkg.tech && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {pkg.tech.map(t => (
              <span key={t} className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 rounded-full font-mono">
                {t}
              </span>
            ))}
          </div>
        )}

        <p className="text-[10px] text-zinc-600 italic mb-5">✦ Best for: {pkg.bestFor}</p>

        {/* CTA — all orange, all equal */}
        <a
          href={waLink(`${pkg.name} (${pkg.price})`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white transition-all hover:shadow-lg hover:shadow-orange-500/25 mt-auto"
        >
          Get Started on WhatsApp <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServicesContent() {
  const [tab, setTab]         = useState<"career" | "website">("career")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const packages = tab === "career" ? CAREER : WEBSITE
  const steps    = tab === "career" ? CAREER_STEPS : WEBSITE_STEPS
  const compare  = tab === "career" ? CAREER_COMPARE : WEBSITE_COMPARE

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 text-center pt-14 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold px-4 py-2 rounded-full mb-6"
        >
          <Zap className="w-3.5 h-3.5" /> Built by the creator of AmanAI Lab
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-4xl sm:text-5xl font-extrabold text-zinc-100 leading-tight mb-4"
        >
          Real AI Skills.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            Real Products.
          </span>
          <br className="hidden sm:block" />Real Results.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Whether you need an AI project to crack your dream job, or a full AI-powered website
          built from scratch — Aman builds it with you, personally. No agencies. No templates.
        </motion.p>

        {/* Trust row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 max-w-3xl mx-auto">
          {[
            { icon: Shield,  label: "You own the code",       sub: "No vendor lock-in, ever" },
            { icon: Clock,   label: "Fixed delivery dates",   sub: "Agreed before you pay" },
            { icon: Star,    label: "Direct with Aman",       sub: "No juniors, no agency" },
            { icon: Code2,   label: "Battle-tested stack",    sub: "Same tech as AmanAI Lab" },
          ].map(t => (
            <div key={t.label} className="flex flex-col items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <t.icon className="w-4 h-4 text-orange-400" />
              <p className="text-[11px] font-bold text-zinc-200 text-center leading-tight">{t.label}</p>
              <p className="text-[10px] text-zinc-600 text-center">{t.sub}</p>
            </div>
          ))}
        </div>

        {/* Tab toggle */}
        <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
          {(["career", "website"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === t ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "career" ? <><Briefcase className="w-4 h-4" />AI Career</> : <><Globe className="w-4 h-4" />AI Website</>}
            </button>
          ))}
        </div>
      </section>

      {/* ── Packages ── */}
      <section className="max-w-6xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.map((pkg, i) => <PkgCard key={pkg.id} pkg={pkg} i={i} />)}
        </div>

        {/* Custom quote */}
        <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zinc-200 mb-0.5">Need something custom?</p>
            <p className="text-xs text-zinc-500">Different budget, specific tech, or tight deadline — just ask. Same-day quote.</p>
          </div>
          <a href={waLink("Custom Enquiry")} target="_blank" rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-sm font-bold px-5 py-2.5 rounded-xl transition-all">
            <MessageSquare className="w-4 h-4" /> Discuss Custom →
          </a>
        </div>
      </section>

      {/* ── Compare tiers ── */}
      <section className="max-w-5xl mx-auto px-4 mt-16 mb-4">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Compare</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">What&apos;s included in each tier</h2>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[560px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider pb-3 pr-3 align-bottom">Feature</th>
                {compare.cols.map((col, ci) => (
                  <th key={col} className={`text-center text-xs font-extrabold pb-3 px-3 align-bottom ${ci === compare.popularIndex ? "text-orange-400" : "text-zinc-200"}`}>
                    {col}
                    {ci === compare.popularIndex && (
                      <span className="block text-[9px] font-bold text-orange-400/80 uppercase tracking-wider mt-0.5">Most Popular</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.rows.map((row, ri) => (
                <tr key={row.label}>
                  <td className={`text-xs text-zinc-300 py-2.5 pr-3 ${ri !== 0 ? "border-t border-zinc-800" : ""}`}>{row.label}</td>
                  {row.vals.map((val, ci) => (
                    <td key={ci} className={`text-center py-2.5 px-3 ${ri !== 0 ? "border-t border-zinc-800" : ""} ${ci === compare.popularIndex ? "bg-orange-500/[0.04]" : ""}`}>
                      <CompareCell value={val} accent={ci === compare.popularIndex} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Why work with me ── */}
      <section className="max-w-5xl mx-auto px-4 mt-16 mb-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Why work with me</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">You&apos;re already looking at my work</h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto mt-3 leading-relaxed">
            This entire platform — every tool, the Code Lab, the interview sheet, the AI mock interviews —
            was designed and built by Aman, solo. That&apos;s real proof of skill, not just a promise.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Code2,
              title: "Proof you can verify now",
              desc: `Browse this site: the Code Lab (${SITE_STATS.codeProblems}+ problems), the ${SITE_STATS.sheetTopics}-topic interview sheet, and ${SITE_STATS.tools} AI tools — all built on the exact stack I'll use for your project.`,
            },
            {
              icon: Star,
              title: "Work directly with Aman",
              desc: "No agency, no juniors, no hand-offs. You message Aman and Aman builds it — with daily updates so you always know exactly where things stand.",
            },
            {
              icon: Shield,
              title: "Risk-free payment",
              desc: "50% upfront, 50% only once you're happy with delivery. Career clients: support continues until you land the offer — no time limit.",
            },
          ].map((c, i) => (
            <motion.div key={c.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.08 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-sm font-bold text-zinc-100 mb-2">{c.title}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Guarantee banner */}
        <div className="mt-5 flex items-start gap-3 bg-gradient-to-br from-orange-500/8 via-zinc-900 to-zinc-900 border border-orange-500/20 rounded-2xl p-5">
          <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-300 leading-relaxed">
            <span className="font-bold text-zinc-100">My promise:</span> scope and price are agreed in writing before you pay a rupee.
            If something isn&apos;t right, I keep working until it is — and you own 100% of the code, forever.
          </p>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="max-w-4xl mx-auto px-4 mt-16 mb-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">How It Works</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">Simple. Fast. Zero fluff.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.08 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-bold text-zinc-700 mb-3 block font-mono">{s.n}</span>
              <s.icon className="w-5 h-5 text-orange-400 mb-3" />
              <p className="text-sm font-bold text-zinc-200 mb-1.5">{s.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Website stack callout ── */}
      {tab === "website" && (
        <section className="max-w-4xl mx-auto px-4 mb-16">
          <div className="bg-gradient-to-br from-orange-500/8 via-zinc-900 to-violet-500/8 border border-orange-500/20 rounded-2xl p-8 text-center">
            <Code2 className="w-8 h-8 text-orange-400 mx-auto mb-4" />
            <h3 className="text-xl font-extrabold text-zinc-100 mb-2">Same stack as AmanAI Lab — built from scratch for you</h3>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-6 leading-relaxed">
              No Wix. No WordPress. No drag-and-drop. Every component is hand-coded in the same
              battle-tested stack that powers AmanAI Lab — fast, secure, and completely yours.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Next.js 16","TypeScript 5","Tailwind CSS 4","Supabase","Groq / OpenAI","Framer Motion","Vercel","Razorpay / Stripe"].map(t => (
                <span key={t} className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/15 px-3 py-1 rounded-full font-mono">{t}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Verified stats only ── */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { value: SITE_STATS.tools, label: "Free AI Tools Built", sub: "On AmanAI Lab" },
            { value: SITE_STATS.questions,  label: "Interview Questions",       sub: "Curated & tested" },
            { value: "100%",  label: "Code Ownership",            sub: "No lock-in, ever" },
            { value: "1-on-1", label: "Direct Access to Aman",   sub: "No juniors, no agency" },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-3xl font-extrabold text-orange-400 mb-1">{s.value}</p>
              <p className="text-xs text-zinc-200 font-semibold">{s.label}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-2xl mx-auto px-4 mb-16">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">FAQ</p>
          <h2 className="text-2xl font-extrabold text-zinc-100">Common questions, honest answers</h2>
        </div>
        <div className="flex flex-col gap-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/40 transition-colors gap-4">
                <span className="text-sm font-semibold text-zinc-200">{faq.q}</span>
                <span className={`text-zinc-500 shrink-0 text-xs transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}>▾</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 pt-3 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-2xl mx-auto px-4">
        <div className="relative bg-zinc-900 border border-orange-500/20 rounded-2xl p-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-violet-500/5 pointer-events-none" />
          <Crown className="w-10 h-10 text-orange-400 mx-auto mb-4 relative z-10" />
          <h2 className="text-2xl font-extrabold text-zinc-100 mb-2 relative z-10">Ready to build something real?</h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed relative z-10">
            No forms. No waiting rooms. No sales calls. WhatsApp Aman directly —
            describe what you need and get a response within a few hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
            <a href={waLink("Services Enquiry")} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 text-sm">
              <MessageSquare className="w-4 h-4" /> WhatsApp Aman Now
            </a>
            <a href="mailto:aman.chauhan.ai71@gmail.com"
              className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold px-6 py-3.5 rounded-xl transition-colors text-sm">
              <FileText className="w-4 h-4" /> Send an Email
            </a>
          </div>
          <p className="text-xs text-zinc-700 mt-5 relative z-10">Responds within 2–4 hours · Scope agreed before any payment</p>
        </div>
      </section>

    </div>
  )
}
