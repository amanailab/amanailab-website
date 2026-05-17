"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ChevronDown, Search,
  BookOpen, Newspaper, FileText,
  BarChart2, Mail, Wand2,
  BrainCircuit, Map, CalendarDays, Building2, Target, Trophy,
  User, LogOut, LayoutDashboard, Briefcase, MessageSquare, Layers, Library, Flame, Code2, ListChecks,
} from "lucide-react";
import Image from "next/image";
import { YoutubeIcon } from "@/components/icons/SocialIcons";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";

// ─── Nav structure ────────────────────────────────────────────────────────────

interface DropdownItem {
  href: string
  label: string
  description: string
  icon: React.ReactNode
}

interface NavDropdown {
  kind: "dropdown"
  label: string
  items: DropdownItem[]
  columns?: 1 | 2
}

interface NavLink {
  kind: "link"
  href: string
  label: string
}

type NavItem = NavLink | NavDropdown

const navItems: NavItem[] = [
  {
    kind: "dropdown",
    label: "Learn",
    columns: 1,
    items: [
      { href: "/series",    label: "Series",      description: "Structured AI/ML YouTube series",      icon: <YoutubeIcon className="w-4 h-4" /> },
      { href: "/news",      label: "AI News",     description: "Daily curated AI & ML news",           icon: <Newspaper className="w-4 h-4" /> },
      { href: "/resources", label: "Resources",   description: "Free cheat sheets & PDFs",             icon: <BookOpen className="w-4 h-4" /> },
    ],
  },
  {
    kind: "dropdown",
    label: "Tools",
    columns: 2,
    items: [
      { href: "/code-lab",    label: "Code Lab ✨",       description: "Code AI/ML algorithms, earn XP levels",  icon: <Code2 className="w-4 h-4" /> },
      { href: "/playground", label: "Code Playground ✨", description: "Monaco editor + AI for ML code",    icon: <Code2 className="w-4 h-4" /> },
      { href: "/resume",             label: "Resume Analyzer",      description: "ATS score & improvements",          icon: <FileText className="w-4 h-4" /> },
      { href: "/linkedin-optimizer", label: "LinkedIn Optimizer",   description: "AI-rewritten profile",              icon: <BarChart2 className="w-4 h-4" /> },
      { href: "/cover-letter-review",label: "Cover Letter Review",  description: "Score & rewrite your cover letter", icon: <Mail className="w-4 h-4" /> },
      { href: "/linkedin",           label: "LinkedIn Posts",       description: "Viral post generator",              icon: <BarChart2 className="w-4 h-4" /> },
      { href: "/prompt",             label: "Prompt Generator",     description: "Perfect prompts for any AI",        icon: <Wand2 className="w-4 h-4" /> },
      { href: "/quiz",               label: "Skill Quiz",           description: "MCQ assessment on AI/ML",           icon: <BrainCircuit className="w-4 h-4" /> },
      { href: "/paper-explainer",    label: "Paper Explainer",      description: "Understand any AI research paper",   icon: <BookOpen className="w-4 h-4" /> },
      { href: "/job-prep",           label: "Job Prep",             description: "Paste a JD, get tailored questions",  icon: <Briefcase className="w-4 h-4" /> },
    ],
  },
  { kind: "link", href: "/courses", label: "Courses" },
  {
    kind: "dropdown",
    label: "Interview",
    columns: 1,
    items: [
      { href: "/sheet",      label: "AmanAI Lab Sheet ✨", description: "218+ topics — complete roadmap to interview ready", icon: <ListChecks className="w-4 h-4" /> },
      { href: "/daily",      label: "Daily Challenge",  description: "One question a day — build your streak",  icon: <Flame className="w-4 h-4" /> },
      { href: "/interview",  label: "AI Simulator",    description: "Timed interview with AI scoring",         icon: <BrainCircuit className="w-4 h-4" /> },
      { href: "/job-prep",   label: "Job Prep",        description: "Paste a JD, get tailored questions",      icon: <Briefcase className="w-4 h-4" /> },
      { href: "/companies",  label: "Companies",       description: "Google, Meta, OpenAI & more",             icon: <Building2 className="w-4 h-4" /> },
      { href: "/questions",  label: "Question Bank",   description: "Browse 500+ AI/ML questions",             icon: <BookOpen className="w-4 h-4" /> },
      { href: "/topics",     label: "Topic Guides",    description: "Deep-dive guides by topic",               icon: <Layers className="w-4 h-4" /> },
      { href: "/flashcards", label: "Flashcards",      description: "5-min daily concept practice",            icon: <Library className="w-4 h-4" /> },
      { href: "/community",  label: "Community",       description: "Share interview experiences",             icon: <MessageSquare className="w-4 h-4" /> },
      { href: "/leaderboard",label: "Leaderboard",     description: "Top performers ranked by score",           icon: <Trophy className="w-4 h-4" /> },
    ],
  },
  {
    kind: "dropdown",
    label: "Career",
    columns: 1,
    items: [
      { href: "/skill-gap",   label: "Skill Gap Analyzer ✨", description: "Paste JD → see exact gaps vs your scores", icon: <Target className="w-4 h-4" /> },
      { href: "/job-tracker", label: "Job Tracker",           description: "Track every application from wishlist to offer", icon: <Briefcase className="w-4 h-4" /> },
      { href: "/career?tab=roadmap",    label: "Career Roadmap",   description: "Week-by-week AI/ML learning path", icon: <Map className="w-4 h-4" /> },
      { href: "/career?tab=study-plan", label: "Study Plan",        description: "Day-by-day interview prep",        icon: <CalendarDays className="w-4 h-4" /> },
      { href: "/career?tab=offer",      label: "Offer Analyzer",    description: "Salary & negotiation insights",    icon: <FileText className="w-4 h-4" /> },
      { href: "/career?tab=company",    label: "Company Research",  description: "Interview intel on any company",   icon: <Building2 className="w-4 h-4" /> },
    ],
  },
  { kind: "link", href: "/blog",     label: "Blog"     },
  { kind: "link", href: "/services", label: "Services" },
  { kind: "link", href: "/about",    label: "About"    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isActive(pathname: string, items: { href: string }[]) {
  return items.some((i) => {
    const base = i.href.split('?')[0]
    return pathname === base || (base.length > 1 && pathname.startsWith(base))
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Navbar() {
  const [scrolled, setScrolled]             = useState(false);
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [openDropdown, setOpenDropdown]     = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [userEmail, setUserEmail]           = useState<string | null>(null);
  const [authLoading, setAuthLoading]       = useState(true);
  const [userMenuOpen, setUserMenuOpen]     = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      setUserMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChange is the single source of truth.
    // INITIAL_SESSION fires immediately on mount with the current session from
    // cookies — no network call, so no flash. Works correctly after server-side
    // redirects because @supabase/ssr stores the session in cookies that the
    // browser client can read synchronously.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setUserEmail(sess?.user?.email ?? null);
      // Stop showing skeleton as soon as we have a definitive answer
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setMobileExpanded(null); }, [pathname]);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-zinc-800/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={navRef}>
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative">
              <Image
                src="/logo.jpg"
                alt="AmanAI Lab"
                width={36}
                height={36}
                className="rounded-xl object-cover ring-1 ring-zinc-700 group-hover:ring-orange-500/50 transition-all duration-200"
                priority
              />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-zinc-100 group-hover:text-white transition-colors">
              Aman<span className="text-orange-500">AI</span>
              <span className="text-zinc-400 font-normal"> Lab</span>
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => {
              if (item.kind === "link") {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                      active
                        ? "text-orange-400 bg-orange-500/8"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                    }`}
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full"
                      />
                    )}
                  </Link>
                );
              }

              // Dropdown
              const isOpen  = openDropdown === item.label;
              const active  = isActive(pathname, item.items);
              const cols    = item.columns ?? 1;

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-label={`${item.label} menu`}
                    className={`relative flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                      active
                        ? "text-orange-400 bg-orange-500/8"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                    {active && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full"
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-2"
                        style={{ minWidth: cols === 2 ? 440 : 260 }}
                      >
                        <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
                          {/* Dropdown header accent */}
                          <div className="h-0.5 w-full bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0" />
                          <div role="menu" className={`p-2 ${cols === 2 ? "grid grid-cols-2 gap-0.5" : "flex flex-col gap-0.5"}`}>
                            {item.items.map((sub) => {
                              const subActive = pathname === sub.href;
                              return (
                                <Link
                                  key={`${sub.href}-${sub.label}`}
                                  href={sub.href}
                                  role="menuitem"
                                  aria-current={subActive ? "page" : undefined}
                                  onClick={() => setOpenDropdown(null)}
                                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                                    subActive
                                      ? "bg-orange-500/10 text-orange-400"
                                      : "text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100"
                                  }`}
                                >
                                  <div className={`mt-0.5 shrink-0 transition-colors ${subActive ? "text-orange-400" : "text-zinc-500 group-hover:text-orange-400"}`}>
                                    {sub.icon}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold leading-tight">{sub.label}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5 leading-tight group-hover:text-zinc-400 transition-colors">
                                      {sub.description}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* ── Right side actions ── */}
          <div className="flex items-center gap-2">
            {/* Cmd+K search trigger */}
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
                document.dispatchEvent(event)
              }}
              aria-label="Open command palette"
              className="hidden lg:flex items-center gap-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-500 hover:text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="ml-1 flex items-center gap-0.5 text-[9px] text-zinc-600 font-mono">
                <span>⌘</span><span>K</span>
              </kbd>
            </button>

            {/* Divider */}
            <div className="hidden lg:block w-px h-5 bg-zinc-800" />

            {/* User auth button — authLoading prevents flash of wrong content */}
            {authLoading ? (
              <div className="hidden lg:block w-8 h-8 bg-zinc-800 rounded-lg animate-pulse" />
            ) : userEmail ? (
              <div className="hidden lg:block relative">
                {userMenuOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                )}
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all relative z-50"
                >
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{userEmail[0].toUpperCase()}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                    >
                      <div className="px-3 py-2 border-b border-zinc-800">
                        <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                      </div>
                      <div className="p-1.5 flex flex-col gap-0.5">
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 rounded-xl transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-zinc-500" /> My Progress
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4 text-zinc-500" /> Profile
                        </Link>
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await logout();
                            window.location.href = '/';
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 rounded-xl transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4 text-zinc-500" /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden lg:flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-3.5 py-2 rounded-lg transition-all"
              >
                <User className="w-3.5 h-3.5" /> Login
              </Link>
            )}

            {/* YouTube Subscribe */}
            <a
              href="https://youtube.com/@AmanAI_lab"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/25 whitespace-nowrap"
            >
              <YoutubeIcon className="w-4 h-4" />
              Subscribe
            </a>

            {/* Mobile search icon */}
            <Link href="/search"
              className="lg:hidden flex items-center justify-center w-9 h-9 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Search">
              <Search className="w-4 h-4" />
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="lg:hidden flex items-center justify-center w-9 h-9 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="lg:hidden overflow-y-auto bg-zinc-950 border-b border-zinc-800"
          >
            <div className="px-4 pt-3 pb-5 flex flex-col gap-1 max-h-[80vh] overflow-y-auto">

              {navItems.map((item) => {
                if (item.kind === "link") {
                  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                        active
                          ? "text-orange-400 bg-orange-500/10"
                          : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                const isExp = mobileExpanded === item.label;
                const active = isActive(pathname, item.items);

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => setMobileExpanded(isExp ? null : item.label)}
                      aria-expanded={isExp}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                        active
                          ? "text-orange-400 bg-orange-500/10"
                          : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isExp ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isExp && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-3 mt-1 mb-1 border-l border-zinc-800 pl-3 flex flex-col gap-0.5">
                            {item.items.map((sub) => (
                              <Link
                                key={`${sub.href}-${sub.label}`}
                                href={sub.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                                  pathname === sub.href
                                    ? "text-orange-400 bg-orange-500/10"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                                }`}
                              >
                                <span className="text-zinc-500 group-hover:text-orange-400 transition-colors shrink-0">{sub.icon}</span>
                                <div>
                                  <p className="text-sm font-medium">{sub.label}</p>
                                  <p className="text-xs text-zinc-500">{sub.description}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Mobile secondary links */}
              <div className="flex gap-2 flex-wrap pt-2 border-t border-zinc-800 mt-1">
                {[
                  { href: '/about', label: 'About' },
                  { href: '/services', label: 'Services' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/search', label: 'Search' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
                  >{l.label}</Link>
                ))}
              </div>

              {userEmail ? (
                <div className="flex flex-col gap-1">
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition-colors">
                    <LayoutDashboard className="w-4 h-4 text-zinc-500" /> My Progress
                  </Link>
                  <button
                    onClick={async () => { await logout(); window.location.href = '/'; }}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4 text-zinc-500" /> Sign out
                  </button>
                </div>
              ) : (
                <Link href="/login" className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors">
                  <User className="w-4 h-4" /> Login / Sign up
                </Link>
              )}

              <a
                href="https://youtube.com/@AmanAI_lab"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors mt-1"
              >
                <YoutubeIcon className="w-4 h-4" />
                Subscribe on YouTube
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
