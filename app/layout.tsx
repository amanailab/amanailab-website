import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AmanAI Lab | Generative AI, LLMs & AI Agents",
  description:
    "Learn Generative AI, Large Language Models, and AI Agents with AmanAI Lab. In-depth tutorials, structured series, and hands-on projects — from fundamentals to production.",
  keywords: ["Generative AI", "LLMs", "AI Agents", "RAG", "LangChain", "Fine-tuning", "YouTube"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
