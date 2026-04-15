import type { Metadata } from "next";
import AboutContent from "@/components/about/AboutContent";

export const metadata: Metadata = {
  title: "About | AmanAI Lab",
  description:
    "Learn about AmanAI Lab — teaching Generative AI, LLMs, and AI Agents to developers worldwide.",
};

export default function AboutPage() {
  return (
    <div className="pt-16">
      <AboutContent />
    </div>
  );
}
