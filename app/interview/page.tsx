import type { Metadata } from "next";
import InterviewHub from "@/components/interview/InterviewHub";

export const metadata: Metadata = {
  title: 'Free AI Mock Interview Simulator for ML Engineers — LLM, RAG, Agents',
  description: 'Practice AI/ML interview questions with an AI interviewer. Voice-enabled, instant scoring (0-10), model answers. 13 topics including LLM, RAG, Agents, MLOps, System Design, Computer Vision, NLP and more. Free.',
  alternates: { canonical: 'https://amanailab.com/interview' },
  openGraph: {
    title: 'AI Mock Interview Simulator — LLM, RAG, Agents, MLOps',
    description: 'Voice-enabled AI interview practice. 13 AI/ML topics, instant 0-10 scoring, model answers. Free for all engineers.',
    images: [{ url: '/api/og/tool?name=AI+Mock+Interview&tagline=Voice-enabled+scoring+on+13+topics&emoji=%F0%9F%A7%A0&tool=interview', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Mock Interview Simulator — LLM, RAG, Agents, MLOps',
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

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the AI interview simulator free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely free for everyone — no credit card required.' } },
    { '@type': 'Question', name: 'What AI/ML topics does the simulator cover?', acceptedAnswer: { '@type': 'Answer', text: '13 topics: LLM, RAG, Agents, Fine-Tuning, MLOps, Transformers, System Design, Python, Vector DB, Computer Vision, NLP, Statistics, and Behavioral.' } },
    { '@type': 'Question', name: 'Can I use voice input for my answers?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The simulator supports voice input (speech-to-text) and text-to-speech so the AI reads questions aloud. Works best on Chrome and Edge.' } },
    { '@type': 'Question', name: 'How does the AI score my answers?', acceptedAnswer: { '@type': 'Answer', text: 'The AI evaluates accuracy, depth, and completeness — giving a 0-10 score, grade (A-F), and specific feedback listing what you got right and what was missing.' } },
    { '@type': 'Question', name: 'How many questions per session?', acceptedAnswer: { '@type': 'Answer', text: 'Choose 3, 5, or 7 questions per session at Fresher, Mid, or Senior difficulty.' } },
  ],
}

export default function InterviewPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="pt-20">
        <InterviewHub />
      </div>
    </>
  );
}
