import type { Metadata } from "next";
import ResumeAnalyzer from "@/components/resume/ResumeAnalyzer";

export const metadata: Metadata = {
  title: "AI Resume Analyzer | AmanAI Lab",
  description:
    "Upload your resume and get instant AI-powered feedback tailored to AI/ML roles. ATS score, missing keywords, section analysis. Free. No login needed.",
  alternates: { canonical: 'https://amanailab.com/resume' },
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

export default function ResumePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="pt-20">
        <ResumeAnalyzer />
      </div>
    </>
  );
}
