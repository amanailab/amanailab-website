import type { Metadata } from "next";
import ResourcesContent from "@/components/resources/ResourcesContent";

export const metadata: Metadata = {
  title: "Free Resources | AmanAI Lab",
  description:
    "Download free AI/ML cheat sheets and interview prep materials — LLMs, RAG, Agents, Fine-Tuning, Transformers, and more.",
};

export default function ResourcesPage() {
  return (
    <div className="pt-16">
      <ResourcesContent />
    </div>
  );
}
