import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { YoutubeIcon, GithubIcon, TwitterIcon } from "@/components/icons/SocialIcons";

const footerLinks = {
  Pages: [
    { href: "/", label: "Home" },
    { href: "/series", label: "Series" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  Topics: [
    { href: "/series", label: "Large Language Models" },
    { href: "/series", label: "AI Agents" },
    { href: "/series", label: "RAG Systems" },
    { href: "/series", label: "Generative AI" },
    { href: "/series", label: "Prompt Engineering" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-zinc-900/60 border-t border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <Image
                src="/logo.jpg"
                alt="AmanAI Lab"
                width={40}
                height={40}
                className="rounded-xl object-cover ring-1 ring-zinc-700"
              />
              <span className="font-bold text-[15px]">
                Aman<span className="text-orange-500">AI</span> Lab
              </span>
            </Link>
            <p className="text-zinc-400 text-sm max-w-sm leading-relaxed mb-6">
              Teaching Generative AI, Large Language Models, and AI Agents — from fundamentals to production.
              New videos every week.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://youtube.com/@AmanAI_lab"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 bg-zinc-800 hover:bg-orange-500/20 border border-zinc-700 hover:border-orange-500/40 rounded-lg flex items-center justify-center text-zinc-500 hover:text-orange-400 transition-all"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 bg-zinc-800 hover:bg-orange-500/20 border border-zinc-700 hover:border-orange-500/40 rounded-lg flex items-center justify-center text-zinc-500 hover:text-orange-400 transition-all"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter/X"
                className="w-9 h-9 bg-zinc-800 hover:bg-orange-500/20 border border-zinc-700 hover:border-orange-500/40 rounded-lg flex items-center justify-center text-zinc-500 hover:text-orange-400 transition-all"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@amanailab.com"
                aria-label="Email"
                className="w-9 h-9 bg-zinc-800 hover:bg-orange-500/20 border border-zinc-700 hover:border-orange-500/40 rounded-lg flex items-center justify-center text-zinc-500 hover:text-orange-400 transition-all"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-orange-400 transition-colors"
                    >
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
          <p className="text-zinc-600 text-xs">
            Built with passion for AI education
          </p>
        </div>
      </div>
    </footer>
  );
}
