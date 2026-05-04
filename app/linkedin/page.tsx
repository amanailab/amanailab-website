import type { Metadata } from "next";
import LinkedInGenerator from "@/components/linkedin/LinkedInGenerator";

export const metadata: Metadata = {
  title: "LinkedIn Post Generator | AmanAI Lab",
  description:
    "Generate viral LinkedIn posts for AI/ML developers in seconds. Free. No login needed.",
};

export default function LinkedInPage() {
  return (
    <div className="pt-16">
      <LinkedInGenerator />
    </div>
  );
}
