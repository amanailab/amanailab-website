import type { Metadata } from "next";
import ResumeAnalyzer from "@/components/resume/ResumeAnalyzer";

export const metadata: Metadata = {
  title: 'Free AI Resume Analyzer for ML Engineers — ATS Score & JD Match',
  description: 'Upload your resume and get an instant ATS score, missing keywords, section-by-section feedback, and AI-rewritten summary — tailored for AI/ML roles. Free, no login.',
  alternates: { canonical: 'https://amanailab.com/resume' },
  openGraph: {
    title: 'Free AI Resume Analyzer for AI/ML Roles',
    description: 'ATS score, keyword gap analysis, JD match score, and AI-powered resume rewriting. Free for AI/ML engineers.',
    url: 'https://amanailab.com/resume',
    images: [{ url: '/api/og/tool?name=AI+Resume+Analyzer&tagline=ATS+score%2C+JD+match+%26+AI+rewrite&emoji=%F0%9F%93%84&tool=resume', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Resume Analyzer for AI/ML Roles',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Resume Analyzer',
  applicationCategory: 'BusinessApplication',
  description: 'Upload your resume and get instant AI-powered feedback for AI/ML roles. ATS score, missing keywords, and rewritten summary. Free.',
  url: 'https://amanailab.com/resume',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the AI resume analyzer free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free — no login or credit card required.' } },
    { '@type': 'Question', name: 'What is an ATS score?', acceptedAnswer: { '@type': 'Answer', text: 'An ATS (Applicant Tracking System) score shows how well your resume will pass automated screening filters used by recruiters. A score above 75% is recommended for most roles.' } },
    { '@type': 'Question', name: 'Does the resume analyzer support PDF uploads?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Upload a PDF (max 5MB) or paste your resume text directly.' } },
    { '@type': 'Question', name: 'What does the JD Matcher feature do?', acceptedAnswer: { '@type': 'Answer', text: 'JD Matcher compares your resume against a specific job description, gives a match score, lists missing keywords, and recommends which sections to improve.' } },
    { '@type': 'Question', name: 'Can I use this for non-AI/ML roles?', acceptedAnswer: { '@type': 'Answer', text: 'The tool is optimised for AI/ML roles but works for any software engineering or data role.' } },
  ],
}

export default function ResumePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="pt-20">
        <ResumeAnalyzer />
      </div>
    </>
  );
}
