import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/ui/PageTransition";
import CommandPalette from "@/components/ui/CommandPalette";
import BackToTop from "@/components/ui/BackToTop";
import { ToastProvider } from "@/components/ui/Toast";
import NavigationProgress from "@/components/ui/NavigationProgress";
import { GoogleAnalytics } from '@next/third-parties/google'
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import { headers } from 'next/headers'
import Script from 'next/script'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'),
  title: {
    default: "AmanAI Lab | AI/ML Career Platform — Tools, Interview Prep & Learning",
    template: "%s | AmanAI Lab",
  },
  description:
    "The most complete AI/ML career platform. Free tools: Resume Analyzer, Interview Simulator, LinkedIn Optimizer, Career Roadmap, Paper Explainer, Skill Quiz and more. Learn Generative AI, LLMs, and AI Agents.",
  keywords: [
    "AI/ML interview prep", "machine learning career", "resume analyzer AI",
    "AI mock interview", "LLM engineer", "career roadmap AI",
  ],
  authors: [{ name: "Aman Chauhan", url: "https://amanailab.com" }],
  creator: "AmanAI Lab",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://amanailab.com",
    siteName: "AmanAI Lab",
    title: "AmanAI Lab — AI/ML Career Platform",
    description: "Free AI-powered tools for AI/ML job seekers. Resume analyzer, interview simulator, LinkedIn optimizer, career roadmap & more.",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: "AmanAI Lab — AI/ML Career Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AmanAI Lab — AI/ML Career Platform",
    description: "Free AI-powered tools for AI/ML job seekers.",
    creator: "@AmanAI_lab",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  verification: {
    google: 'D-yK2df-NULwHLyUwJDjyO_V1MuoDR91fpURUUekgA8',
  },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": "AmanAI Lab",
      "description": "AI/ML career platform with free tools for job seekers",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": `${SITE_URL}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "AmanAI Lab",
      "url": SITE_URL,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.jpg` },
      "sameAs": [
        "https://youtube.com/@AmanAI_lab",
        "https://linkedin.com/in/amanailab",
      ],
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers()
  const isAdmin = headersList.get('x-is-admin') === '1'

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#09090b" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Clarity loaded via MicrosoftClarity component below — no duplicate here */}
      </head>
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 antialiased">
        {/* Skip link for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-orange-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-sm"
        >
          Skip to main content
        </a>
        {!isAdmin && <Navbar />}
        <NavigationProgress />
        <ToastProvider>
          <main id="main-content" className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          {!isAdmin && <Footer />}
          {!isAdmin && <CommandPalette />}
          {!isAdmin && <BackToTop />}
        </ToastProvider>
        {!isAdmin && <GoogleAnalytics gaId="G-1H3YS42SXP" />}
        {!isAdmin && <MicrosoftClarity />}
      </body>
    </html>
  );
}
