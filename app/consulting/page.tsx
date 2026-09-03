import type { Metadata } from "next";
import ConsultingContent from "@/components/consulting/ConsultingContent";

export const metadata: Metadata = {
  title: "Consulting — I Build Your Idea, POC or MVP",
  description:
    "Have an idea? Aman builds it for you — AI features, POCs, prototypes and full MVPs. Fixed prices, 50% upfront, you own 100% of the code. Next.js, Supabase, LLMs, payments. Message on WhatsApp to start.",
  alternates: { canonical: "https://amanailab.com/consulting" },
  openGraph: {
    title: "Consulting — I Build Your Idea | AmanAI Lab",
    description:
      "Bring an idea, get a working product. AI features, POCs and full MVP builds — fixed prices, full code ownership, direct with Aman.",
    url: "https://amanailab.com/consulting",
    images: [{ url: "/api/og/tool?name=Consulting&tagline=I+build+your+idea%2C+POC+or+MVP&emoji=%F0%9F%9A%80&tool=consulting", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function ConsultingPage() {
  return (
    <div className="pt-20">
      <ConsultingContent />
    </div>
  );
}
