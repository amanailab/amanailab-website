import type { Metadata } from "next";
import PromptGenerator from "@/components/prompt/PromptGenerator";

export const metadata: Metadata = {
  title: "AI Prompt Generator | AmanAI Lab",
  description:
    "Generate perfect prompts for ChatGPT, Midjourney, Claude, and data tools. Free. Instant. No login.",
};

export default function PromptPage() {
  return (
    <div className="pt-16">
      <PromptGenerator />
    </div>
  );
}
