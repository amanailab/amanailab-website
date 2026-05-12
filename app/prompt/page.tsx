import type { Metadata } from "next";
import PromptGenerator from "@/components/prompt/PromptGenerator";

export const metadata: Metadata = {
  title: "AI Prompt Generator",
  description:
    "Generate perfect prompts for ChatGPT, Midjourney, Claude, and data tools. Free. Instant. No login.",
  alternates: { canonical: 'https://amanailab.com/prompt' },
};

export default function PromptPage() {
  return (
    <div className="pt-20">
      <PromptGenerator />
    </div>
  );
}
