import type { Metadata } from "next";
import BootcampContent from "@/components/bootcamp/BootcampContent";

export const metadata: Metadata = {
  title: "GenAI & Agentic AI Bootcamp — Live Cohort 2026 | AmanAI Lab",
  description:
    "Complete GenAI & Agentic AI bootcamp — 29+ modules, 5 production projects, MCP/A2A protocols. Live cohort starting Sept 1, 2026. Early-bird ₹24,999.",
  alternates: { canonical: "https://amanailab.com/bootcamp" },
  openGraph: {
    title: "GenAI & Agentic AI Bootcamp — Live Cohort 2026 | AmanAI Lab",
    description:
      "5 production projects. RAG, Agentic AI, MCP/A2A protocols, LLMOps. Live cohort starting Sept 1, 2026. Early-bird ₹24,999.",
    url: "https://amanailab.com/bootcamp",
    images: [{ url: "/api/og/tool?name=GenAI+%26+Agentic+AI+Bootcamp&tagline=Live+Cohort+2026+%C2%B7+Sept+1+%C2%B7+%E2%82%B924%2C999+Early+Bird&emoji=%F0%9F%9A%80&tool=bootcamp", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function BootcampPage() {
  return (
    <div className="pt-20">
      <BootcampContent />
    </div>
  );
}
