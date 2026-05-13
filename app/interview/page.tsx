import type { Metadata } from "next";
import InterviewHub from "@/components/interview/InterviewHub";

export const metadata: Metadata = {
  title: "AI Interview Prep Hub | AmanAI Lab",
  description:
    "Practice real AI/ML interview questions on LLMs, RAG, Agents, Fine-Tuning, MLOps and more. Free. No login needed.",
  alternates: { canonical: 'https://amanailab.com/interview' },
  openGraph: {
    title: 'AI Interview Prep Hub | AmanAI Lab',
    description: 'Practice real AI/ML interview questions with instant AI scoring. Free mock interviews on LLMs, RAG, Agents, Fine-Tuning, MLOps and more.',
    images: [{ url: '/og-interview.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Interview Prep Hub | AmanAI Lab',
    description: 'Practice real AI/ML interview questions with instant AI scoring. Free.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Interview Simulator',
  applicationCategory: 'EducationalApplication',
  description: 'Practice real AI/ML interview questions with instant AI scoring. Free mock interviews on LLMs, RAG, Agents, Fine-Tuning, MLOps and more.',
  url: 'https://amanailab.com/interview',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
  creator: { '@type': 'Person', name: 'Aman Chauhan', url: 'https://amanailab.com/about' },
}

export default function InterviewPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="pt-20">
        <InterviewHub />
      </div>
    </>
  );
}
