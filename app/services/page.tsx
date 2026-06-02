import type { Metadata } from "next";
import ServicesContent from "@/components/services/ServicesContent";

export const metadata: Metadata = {
  title: "AI Career Coaching & Custom AI Website Development",
  description:
    "Work 1-on-1 with Aman: a custom AI project + interview prep + placement support to land an AI/ML job, or a full custom AI website/SaaS built from scratch (Next.js, Supabase, Groq/OpenAI). Fixed prices, you own the code.",
  alternates: { canonical: 'https://amanailab.com/services' },
  openGraph: {
    title: "AI Career Coaching & Custom AI Website Development | AmanAI Lab",
    description:
      "Land an AI/ML job with a custom project + interview prep, or get a full AI website/SaaS built for you. Direct with Aman, fixed prices, full code ownership.",
    url: "https://amanailab.com/services",
    images: [{ url: '/api/og/tool?name=Work+With+Aman&tagline=AI+career+coaching+%26+custom+AI+development&emoji=%F0%9F%9A%80&tool=services', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function ServicesPage() {
  return (
    <div className="pt-20">
      <ServicesContent />
    </div>
  );
}
