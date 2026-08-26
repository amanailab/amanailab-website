import type { Metadata } from "next";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ResumeAnalyzer from "@/components/resume/ResumeAnalyzer";

export const metadata: Metadata = {
  title: 'AI Resume Analyzer for ML Engineers — ATS Score & JD Match | AmanAI Lab',
  description: 'Upload your resume and get an instant ATS score, missing keywords, section-by-section feedback, and AI-rewritten summary — tailored for AI/ML roles. Free account required.',
  alternates: { canonical: 'https://amanailab.com/resume' },
  openGraph: {
    title: 'AI Resume Analyzer for AI/ML Roles',
    description: 'ATS score, keyword gap analysis, JD match score, and AI-powered resume rewriting — tailored for AI/ML engineers.',
    url: 'https://amanailab.com/resume',
    images: [{ url: '/api/og/tool?name=AI+Resume+Analyzer&tagline=ATS+score%2C+JD+match+%26+AI+rewrite&emoji=%F0%9F%93%84&tool=resume', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Resume Analyzer for AI/ML Roles',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Resume Analyzer',
  applicationCategory: 'BusinessApplication',
  description: 'Upload your resume and get instant AI-powered feedback for AI/ML roles. ATS score, missing keywords, and rewritten summary.',
  url: 'https://amanailab.com/resume',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the AI resume analyzer free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, free with a free account — no credit card required. Sign up in 30 seconds.' } },
    { '@type': 'Question', name: 'What is an ATS score?', acceptedAnswer: { '@type': 'Answer', text: 'An ATS (Applicant Tracking System) score shows how well your resume will pass automated screening filters used by recruiters. A score above 75% is recommended for most roles.' } },
    { '@type': 'Question', name: 'Does the resume analyzer support PDF uploads?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Upload a PDF (max 5MB) or paste your resume text directly.' } },
    { '@type': 'Question', name: 'What does the JD Matcher feature do?', acceptedAnswer: { '@type': 'Answer', text: 'JD Matcher compares your resume against a specific job description, gives a match score, lists missing keywords, and recommends which sections to improve.' } },
    { '@type': 'Question', name: 'Can I use this for non-AI/ML roles?', acceptedAnswer: { '@type': 'Answer', text: 'The tool is optimised for AI/ML roles but works for any software engineering or data role.' } },
  ],
}

export default async function ResumePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="pt-20">
        {!user && (
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <div className="flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <LogIn size={15} className="text-orange-400 shrink-0" />
                <p className="text-sm text-zinc-400 truncate">
                  <span className="text-zinc-200 font-semibold">Free account required</span> — sign up in 30 seconds to analyze your resume, match JDs, and build cover letters.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/login?next=/resume" className="text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors">Sign in</Link>
                <Link href="/signup?next=/resume" className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Sign up free</Link>
              </div>
            </div>
          </div>
        )}
        <ResumeAnalyzer />
      </div>
    </>
  );
}
