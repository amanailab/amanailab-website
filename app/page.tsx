import { getChannelStats, getLatestVideos, getPlaylists, formatStats } from "@/lib/youtube";
import HeroSection    from "@/components/home/HeroSection";
import SocialProofBar from "@/components/home/SocialProofBar";
import FeaturedTools  from "@/components/home/FeaturedTools";
import DailyChallengeWidget from "@/components/home/DailyChallengeWidget";
import HowItWorks     from "@/components/home/HowItWorks";
import MoreTools      from "@/components/home/MoreTools";
import FeaturedSeries from "@/components/home/FeaturedSeries";
import LatestVideos   from "@/components/home/LatestVideos";
import CTASection     from "@/components/home/CTASection";
import LearningPath   from "@/components/home/LearningPath";
import HomeFAQ        from "@/components/home/HomeFAQ";
import { SITE_STATS } from "@/lib/site-stats";

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AmanAI Lab — Free AI/ML Interview Prep Platform | Mock Interviews, Code Lab & More',
  description: `The most complete free platform for AI/ML engineers. AI mock interviews, ${SITE_STATS.codeProblems}+ coding problems, flashcards, system design practice, and ${SITE_STATS.tools} AI-powered tools. Prepare for interviews at Google, Meta, OpenAI and more.`,
  alternates: { canonical: 'https://amanailab.com' },
  openGraph: {
    title: 'AmanAI Lab — Free AI/ML Interview Prep Platform',
    description: `AI mock interviews, ${SITE_STATS.codeProblems}+ coding problems, system design practice, and ${SITE_STATS.tools} free tools. Everything you need to land an AI/ML job.`,
    url: 'https://amanailab.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AmanAI Lab — Free AI/ML Interview Prep',
    description: `AI mock interviews, Code Lab & ${SITE_STATS.tools} free tools. 100% free.`,
  },
  keywords: [
    'AI interview prep', 'ML interview questions', 'LLM interview', 'RAG interview',
    'machine learning interview', 'deep learning interview', 'MLOps interview',
    'AI mock interview', 'code lab', 'system design AI',
  ],
}

export const revalidate = 300;

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is AmanAI Lab completely free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — the platform is free. All core tools work with a free account. No credit card ever required. Optional paid plans (₹799–₹999/month) unlock higher daily limits on AI-heavy tools.' } },
    { '@type': 'Question', name: 'How should I prepare for an AI/ML engineer interview?', acceptedAnswer: { '@type': 'Answer', text: 'Start with the Skill Gap Analyzer — paste a job description and see exactly what you\'re missing. Then use the A-to-Z Interview Prep Sheet to fill gaps. Practice with the AI Mock Interview, run code problems in the Code Lab, and polish your resume before applying.' } },
    { '@type': 'Question', name: 'What AI/ML interview topics are covered?', acceptedAnswer: { '@type': 'Answer', text: '14 core topics: LLMs, RAG systems, AI Agents, LangGraph, Fine-Tuning, MLOps, Transformers, Embeddings, Vector Databases, Evaluation, Computer Vision, NLP, System Design, and Behavioral.' } },
    { '@type': 'Question', name: 'How does the AI mock interview work?', acceptedAnswer: { '@type': 'Answer', text: 'Select a topic and difficulty, then answer questions by typing or using voice. The AI scores your answer 0–10 with specific feedback on what you covered and what was missing. Each session is saved to your dashboard.' } },
    { '@type': 'Question', name: 'Can I prepare for Google, Meta, or OpenAI interviews here?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The Company filter on the question bank shows questions tagged to specific companies. System Design problems include real ML problems asked at FAANG. The platform is built specifically for AI/ML roles at top-tier companies.' } },
    { '@type': 'Question', name: 'How is AmanAI Lab different from LeetCode?', acceptedAnswer: { '@type': 'Answer', text: 'AmanAI Lab is built exclusively for AI/ML roles, not general software engineering. It combines interview simulation, resume analysis, system design practice, skill-gap analysis, and a 279-topic prep sheet in one place.' } },
  ],
};

export default async function HomePage() {
  let stats = null
  let playlists: unknown[] = []
  let videos:   unknown[] = []

  try {
    ;[stats, playlists, videos] = await Promise.all([
      getChannelStats(),
      getPlaylists(20),
      getLatestVideos(6),
    ])
  } catch {
    // YouTube API failed — pages still render with fallbacks
  }

  const formattedStats = stats ? formatStats(stats) : null
  const featured       = (playlists as { id: string }[]).slice(0, 3)
  const latestVideos   = videos as Parameters<typeof LatestVideos>[0]['videos']

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* 1. Hook — strong value prop */}
      <HeroSection />

      {/* 2. Credibility */}
      <SocialProofBar
        subscriberCount={formattedStats ? `${formattedStats.subs.value}${formattedStats.subs.suffix}` : undefined}
        videoCount={formattedStats ? `${formattedStats.videos.value}${formattedStats.videos.suffix}` : undefined}
      />

      {/* 3. Daily challenge — habit hook (self-hides until loaded) */}
      <DailyChallengeWidget />

      {/* 4. Start Here — 4-step guided path */}
      <HowItWorks />

      {/* 5. Core 4 tools — spotlight */}
      <FeaturedTools />

      {/* 6. All remaining tools — grouped grid */}
      <MoreTools />

      {/* 7. Structured learning path — engagement loop */}
      <LearningPath />

      {/* 8. YouTube playlists */}
      <FeaturedSeries playlists={featured as Parameters<typeof FeaturedSeries>[0]['playlists']} />

      {/* 9. Latest videos (Shorts filtered, conditional) */}
      {latestVideos.length > 0 && <LatestVideos videos={latestVideos} />}

      {/* 10. FAQ — SEO + user trust */}
      <HomeFAQ />

      {/* 11. Final CTA */}
      <CTASection />
    </>
  );
}
