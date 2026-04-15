import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact | AmanAI Lab",
  description:
    "Get in touch with AmanAI Lab — for questions, collaborations, sponsorships, or feedback.",
};

export default function ContactPage() {
  return (
    <div className="pt-16">
      <ContactForm />
    </div>
  );
}
