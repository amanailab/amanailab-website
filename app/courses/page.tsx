import type { Metadata } from "next";
import CoursesContent from "@/components/courses/CoursesContent";

export const metadata: Metadata = {
  title: "AI Courses — Coming Soon",
  description:
    "Production-grade AI courses built from real industry experience. RAG, Agents, Fine-tuning and GenAI Interview Prep — coming soon.",
  alternates: { canonical: 'https://amanailab.com/courses' },
};

export default function CoursesPage() {
  return (
    <div className="pt-20">
      <CoursesContent />
    </div>
  );
}
