import type { Metadata } from "next";
import InterviewHub from "@/components/interview/InterviewHub";

export const metadata: Metadata = {
  title: "AI Interview Prep Hub | AmanAI Lab",
  description:
    "Practice real AI/ML interview questions on LLMs, RAG, Agents, Fine-Tuning, MLOps and more. Free. No login needed.",
  alternates: { canonical: 'https://amanailab.com/interview' },
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
