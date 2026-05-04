"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import { YoutubeIcon } from "@/components/icons/SocialIcons";

type NavItem =
  | { kind: "link"; href: string; label: string }
  | { kind: "dropdown"; label: string; items: { href: string; label: string; description?: string }[] };

const navItems: NavItem[] = [
  { kind: "link", href: "/", label: "Home" },
  { kind: "link", href: "/series", label: "Series" },
  { kind: "link", href: "/resources", label: "Resources" },
  { kind: "link", href: "/interview", label: "Interview" },
  {
    kind: "dropdown",
    label: "Tools",
    items: [
      { href: "/resume", label: "Resume Analyzer", description: "AI-powered ATS feedback" },
      { href: "/prompt", label: "Prompt Generator", description: "Perfect prompts for any AI task" },
      { href: "/linkedin", label: "LinkedIn Post Generator", description: "Viral posts for AI/ML devs" },
      { href: "/interview", label: "AI Simulator", description: "Mock interview practice" },
    ],
  },
  { kind: "link", href: "/services", label: "Services" },
  { kind: "link", href: "/news", label: "News" },
  { kind: "link", href: "/blog", label: "Blog" },
  { kind: "link", href: "/about", label: "About" },
  { kind: "link", href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDropdownActive = (items: { href: string }[]) =>
    items.some((i) => i.href === pathname);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.jpg"
              alt="AmanAI Lab"
              width={40}
              height={40}
              className="rounded-xl object-cover ring-1 ring-zinc-700"
              priority
            />
            <span className="font-bold text-[15px] tracking-tight">
              Aman<span className="text-orange-500">AI</span> Lab
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1" ref={dropdownRef}>
            {navItems.map((item) => {
              if (item.kind === "link") {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pathname === item.href
                        ? "text-orange-400"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                    }`}
                  >
                    {item.label}
                    {pathname === item.href && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full"
                      />
                    )}
                  </Link>
                );
              }

              const isOpen = openDropdown === item.label;
              const active = isDropdownActive(item.items);
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
                    aria-haspopup="true"
                    className={`relative flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? "text-orange-400"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                    {active && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full"
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-2 min-w-[260px]"
                      >
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden p-1.5">
                          {item.items.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setOpenDropdown(null)}
                              className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-lg transition-colors ${
                                pathname === sub.href
                                  ? "bg-orange-500/10 text-orange-400"
                                  : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                              }`}
                            >
                              <span className="text-sm font-semibold">{sub.label}</span>
                              {sub.description && (
                                <span className="text-xs text-zinc-500">{sub.description}</span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <a
              href="https://youtube.com/@AmanAI_lab"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/25"
            >
              <YoutubeIcon className="w-4 h-4" />
              Subscribe
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-zinc-950 border-b border-zinc-800"
          >
            <div className="px-4 py-5 flex flex-col gap-1">
              {navItems.map((item) => {
                if (item.kind === "link") {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        pathname === item.href
                          ? "text-orange-400 bg-orange-500/10"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                const open = mobileDropdownOpen === item.label;
                const active = isDropdownActive(item.items);
                return (
                  <div key={item.label} className="flex flex-col">
                    <button
                      onClick={() => setMobileDropdownOpen(open ? null : item.label)}
                      aria-expanded={open}
                      className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        active
                          ? "text-orange-400 bg-orange-500/10"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {open && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pt-1 pb-1 flex flex-col gap-1">
                            {item.items.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => {
                                  setMobileOpen(false);
                                  setMobileDropdownOpen(null);
                                }}
                                className={`flex flex-col gap-0.5 px-4 py-2.5 rounded-lg transition-colors ${
                                  pathname === sub.href
                                    ? "text-orange-400 bg-orange-500/10"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                                }`}
                              >
                                <span className="text-sm font-medium">{sub.label}</span>
                                {sub.description && (
                                  <span className="text-xs text-zinc-500">{sub.description}</span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              <div className="pt-2 mt-1 border-t border-zinc-800">
                <a
                  href="https://youtube.com/@AmanAI_lab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-3 rounded-lg transition-colors w-full justify-center mt-2"
                >
                  <YoutubeIcon className="w-4 h-4" />
                  Subscribe on YouTube
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
