import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with AmanAI Lab — for questions, collaborations, sponsorships, or feedback.",
  alternates: { canonical: 'https://amanailab.com/contact' },
};

export default function ContactPage() {
  return (
    <div className="pt-20">
      <ContactForm />
    </div>
  );
}
