export const revalidate = 3600

import type { Metadata } from "next";
import ResourcesContent from "@/components/resources/ResourcesContent";

export const metadata: Metadata = {
  title: "Free AI/ML Cheat Sheets & Interview Resources | AmanAI Lab",
  description:
    "Download free AI/ML cheat sheets, interview prep guides, and reference sheets — LLMs, RAG, Agents, Fine-Tuning, Transformers, MLOps, and more. Designed for AI/ML engineers preparing for interviews.",
  alternates: { canonical: 'https://amanailab.com/resources' },
  openGraph: {
    title: 'Free AI/ML Cheat Sheets & Interview Resources',
    description: 'Download free cheat sheets and interview prep guides for LLMs, RAG, Agents, Fine-Tuning, Transformers, MLOps and more.',
    images: [{ url: '/api/og/tool?name=Free+Resources&tagline=AI%2FML+cheat+sheets+%26+interview+guides&emoji=%F0%9F%93%9A&tool=resources', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function ResourcesPage() {
  return (
    <div className="pt-20">
      <ResourcesContent />
    </div>
  );
}
