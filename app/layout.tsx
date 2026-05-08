import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/ui/PageTransition";
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
  metadataBase: new URL('https://amanailab.com'),
  title: {
    default: "AmanAI Lab | AI/ML Career Platform — Tools, Interview Prep & Learning",
    template: "%s | AmanAI Lab",
  },
  description:
    "The most complete AI/ML career platform. Free tools: Resume Analyzer, Interview Simulator, LinkedIn Optimizer, Career Roadmap, Paper Explainer, Skill Quiz and more. Learn Generative AI, LLMs, and AI Agents.",
  keywords: [
    "AI/ML interview prep", "machine learning career", "resume analyzer AI",
    "generative AI tutorial", "LLM engineer", "AI job tools", "career roadmap AI",
    "research paper explainer", "LinkedIn optimizer", "AI mock interview",
    "RAG tutorial", "LangChain", "AI agents", "fine-tuning LLM",
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
    images: [{ url: "/logo.jpg", width: 512, height: 512, alt: "AmanAI Lab" }],
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
  alternates: { canonical: "https://amanailab.com" },
  verification: {
    google: 'D-yK2df-NULwHLyUwJDjyO_V1MuoDR91fpURUUekgA8',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://amanailab.com/#website",
      "url": "https://amanailab.com",
      "name": "AmanAI Lab",
      "description": "AI/ML career platform with free tools for job seekers",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://amanailab.com/search?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://amanailab.com/#organization",
      "name": "AmanAI Lab",
      "url": "https://amanailab.com",
      "logo": { "@type": "ImageObject", "url": "https://amanailab.com/logo.jpg" },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "wmuvds88dj");
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 antialiased" suppressHydrationWarning={true}>
        {!isAdmin && <Navbar />}
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && <GoogleAnalytics gaId="G-1H3YS42SXP" />}
        {!isAdmin && <MicrosoftClarity />}
      </body>
    </html>
  );
}
