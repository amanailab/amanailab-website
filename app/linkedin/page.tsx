import type { Metadata } from "next";
import LinkedInGenerator from "@/components/linkedin/LinkedInGenerator";

export const metadata: Metadata = {
  title: "Free LinkedIn Post Generator for AI/ML Engineers — 5 Viral Styles | AmanAI Lab",
  description:
    "Generate high-engagement LinkedIn posts for AI/ML engineers in seconds. Choose from 5 writing styles — Thought Leader, Storytelling, Tutorial, Hot Take, Career Update. Paste your idea, get a polished post. Free.",
  alternates: { canonical: 'https://amanailab.com/linkedin' },
  openGraph: {
    title: 'LinkedIn Post Generator for AI/ML Engineers — 5 Viral Styles',
    description: 'Turn any AI/ML idea into a high-engagement LinkedIn post in seconds. 5 writing styles. Free.',
    images: [{ url: '/api/og/tool?name=LinkedIn+Posts&tagline=5+viral+styles+for+AI%2FML+engineers&emoji=%F0%9F%92%BC&tool=linkedin', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function LinkedInPage() {
  return (
    <div className="pt-20">
      <LinkedInGenerator />
    </div>
  );
}
