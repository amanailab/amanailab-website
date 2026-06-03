"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { YoutubeIcon, GithubIcon, TwitterIcon } from "@/components/icons/SocialIcons";
import { SITE_STATS } from "@/lib/site-stats";

function FooterNewsletter() {
  const [email, setEmail]   = useState("")
  const [status, setStatus] = useState<"idle"|"loading"|"done"|"error">("idle")

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || status === "loading" || status === "done") return
    setStatus("loading")
    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? "done" : "error")
    } catch { setStatus("error") }
  }

  return (
    <div className="mt-5">
      <p className="text-xs font-semibold text-zinc-400 mb-2">
        Weekly AI/ML tips + new tool alerts
      </p>
      {status === "done" ? (
        <div className="flex items-center gap-2 text-xs text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> Subscribed! Check your inbox.
        </div>
      ) : (
        <form onSubmit={subscribe} className="flex gap-1.5">
          <label htmlFor="footer-email" className="sr-only">Email address</label>
          <input
            id="footer-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-500 outline-none transition-colors min-w-0"
          />
          <button type="submit" disabled={status === "loading"}
            className="flex items-center justify-center w-8 h-8 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
      {status === "error" && <p className="text-[10px] text-red-400 mt-1">Something went wrong. Try again.</p>}
    </div>
  )
}

const footerLinks = {
  Tools: [
    { href: "/resume",              label: "Resume Analyzer"       },
    { href: "/interview",           label: "AI Interview Simulator" },
    { href: "/code-lab",            label: "Code Lab"              },
    { href: "/linkedin-optimizer",  label: "LinkedIn Optimizer"    },
    { href: "/paper-explainer",     label: "Paper Explainer"       },
    { href: "/quiz",                label: "Skill Quiz"            },
    { href: "/prompt",              label: "Prompt Generator"      },
  ],
  Career: [
    { href: "/career?tab=roadmap",    label: "Career Roadmap"    },
    { href: "/career?tab=study-plan", label: "Study Plan"         },
    { href: "/career?tab=offer",      label: "Offer Analyzer"     },
    { href: "/career?tab=company",    label: "Company Research"   },
    { href: "/skill-gap",             label: "Skill Gap Analyzer" },
  ],
  Learn: [
    { href: "/series",    label: "YouTube Series"  },
    { href: "/blog",      label: "Blog"            },
    { href: "/news",      label: "AI News"         },
    { href: "/resources", label: "Free Resources"  },
    { href: "/courses",   label: "Courses"         },
  ],
  Company: [
    { href: "/about",    label: "About"    },
    { href: "/services", label: "Services" },
    { href: "/contact",  label: "Contact"  },
    { href: "/search",   label: "Search"   },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-zinc-900/60 border-t border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">

          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <Image
                src="/logo.jpg"
                alt="AmanAI Lab"
                width={38}
                height={38}
                className="rounded-xl object-cover ring-1 ring-zinc-700"
              />
              <span className="font-bold text-[15px]">
                Aman<span className="text-orange-500">AI</span> Lab
              </span>
            </Link>
            <p className="text-zinc-400 text-sm max-w-xs leading-relaxed mb-5">
              The most complete AI/ML career platform. {SITE_STATS.tools} free tools for interview prep, job search, and learning.
            </p>
            <div className="flex items-center gap-2.5">
              <a href="https://youtube.com/@AmanAI_lab" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="w-9 h-9 bg-zinc-800 hover:bg-orange-500/20 border border-zinc-700 hover:border-orange-500/50 rounded-lg flex items-center justify-center text-zinc-400 hover:text-orange-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-500/20 transition-all">
                <YoutubeIcon className="w-4 h-4" />
              </a>
              <a href="https://github.com/amanailab" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                className="w-9 h-9 bg-zinc-800 hover:bg-orange-500/20 border border-zinc-700 hover:border-orange-500/50 rounded-lg flex items-center justify-center text-zinc-400 hover:text-orange-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-500/20 transition-all">
                <GithubIcon className="w-4 h-4" />
              </a>
              <a href="https://x.com/AmanAI_lab" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"
                className="w-9 h-9 bg-zinc-800 hover:bg-orange-500/20 border border-zinc-700 hover:border-orange-500/50 rounded-lg flex items-center justify-center text-zinc-400 hover:text-orange-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-500/20 transition-all">
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a href="mailto:aman.chauhan.ai71@gmail.com" aria-label="Email"
                className="w-9 h-9 bg-zinc-800 hover:bg-orange-500/20 border border-zinc-700 hover:border-orange-500/50 rounded-lg flex items-center justify-center text-zinc-400 hover:text-orange-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-500/20 transition-all">
                <Mail className="w-4 h-4" />
              </a>
            </div>
            <FooterNewsletter />
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href}
                      className="text-sm text-zinc-500 hover:text-orange-400 hover:translate-x-0.5 transition-all inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-zinc-600 text-xs">
            © {year} AmanAI Lab. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Privacy</Link>
            <Link href="/terms" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Terms</Link>
            <p className="text-zinc-700 text-xs">Built for AI/ML professionals</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
