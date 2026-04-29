import type { Metadata } from "next";
import InterviewHub from "@/components/interview/InterviewHub";

export const metadata: Metadata = {
  title: "AI Interview Prep Hub | AmanAI Lab",
  description:
    "Practice real AI/ML interview questions on LLMs, RAG, Agents, Fine-Tuning, MLOps and more. Free. No login needed.",
};

export default function InterviewPage() {
  return (
    <div className="pt-16">
      <InterviewHub />
    </div>
  );
}
