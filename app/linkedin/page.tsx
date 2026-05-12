import type { Metadata } from "next";
import LinkedInGenerator from "@/components/linkedin/LinkedInGenerator";

export const metadata: Metadata = {
  title: "LinkedIn Post Generator",
  description:
    "Generate viral LinkedIn posts for AI/ML developers in seconds. Free. No login needed.",
  alternates: { canonical: 'https://amanailab.com/linkedin' },
};

export default function LinkedInPage() {
  return (
    <div className="pt-20">
      <LinkedInGenerator />
    </div>
  );
}
