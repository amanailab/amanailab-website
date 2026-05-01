import type { Metadata } from "next";
import ServicesContent from "@/components/services/ServicesContent";

export const metadata: Metadata = {
  title: "AI Career Services | AmanAI Lab",
  description:
    "Custom AI projects built for your background. Project + interview prep + placement support. One payment. No timelines. Just results.",
};

export default function ServicesPage() {
  return (
    <div className="pt-16">
      <ServicesContent />
    </div>
  );
}
