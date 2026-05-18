import type { Metadata } from "next";
import PromptGenerator from "@/components/prompt/PromptGenerator";

export const metadata: Metadata = {
  title: "Free AI Prompt Generator — ChatGPT, Claude, Gemini & More | AmanAI Lab",
  description:
    "Generate optimised prompts for any AI model — ChatGPT, Claude, Gemini, Midjourney, DALL-E, and data tools. Choose tone, output format, and use case. Instant results, free, no login required.",
  alternates: { canonical: 'https://amanailab.com/prompt' },
  openGraph: {
    title: 'Free AI Prompt Generator — ChatGPT, Claude, Gemini & More',
    description: 'Generate perfect prompts for ChatGPT, Claude, Gemini, Midjourney and more. Choose tone, format and use case. Free, instant.',
    images: [{ url: '/api/og/tool?name=Prompt+Generator&tagline=Perfect+prompts+for+any+AI+model&emoji=%F0%9F%AA%84&tool=prompt', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function PromptPage() {
  return (
    <div className="pt-20">
      <PromptGenerator />
    </div>
  );
}
