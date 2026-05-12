import type { Metadata } from "next";
import ServicesContent from "@/components/services/ServicesContent";

export const metadata: Metadata = {
  title: "AI Career Services",
  description:
    "Custom AI projects built for your background. Project + interview prep + placement support. One payment. No timelines. Just results.",
  alternates: { canonical: 'https://amanailab.com/services' },
};

export default function ServicesPage() {
  return (
    <div className="pt-20">
      <ServicesContent />
    </div>
  );
}
