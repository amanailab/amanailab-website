"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Download, X, FileText } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PDF {
  title: string;
  description: string;
  topic: string;
  topicColor: string;
  file: string;
}

const pdfs: PDF[] = [
  {
    title: "LLM GenAI Cheat Sheet",
    description: "Tokens, sampling, models, hallucination — complete reference",
    topic: "LLM",
    topicColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    file: "/pdfs/AmanAI_Lab_LLM_GenAI_CheatSheet.pdf",
  },
  {
    title: "RAG Complete Guide",
    description: "Chunking, embeddings, retrieval, reranking, evaluation pipeline",
    topic: "RAG",
    topicColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    file: "/pdfs/AmanAI_Lab_RAG_Complete_Guide.pdf",
  },
  {
    title: "Agentic AI Complete Guide",
    description: "Agents, ReAct, tools, memory, multi-agent systems, frameworks",
    topic: "Agents",
    topicColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    file: "/pdfs/AmanAI_Lab_Agentic_AI_Guide.pdf",
  },
  {
    title: "LLM Fine Tuning Guide",
    description: "LoRA, QLoRA, DPO, GRPO, RULER, Unsloth, LLaMA-Factory guide",
    topic: "Fine-Tuning",
    topicColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    file: "/pdfs/AmanAI_Lab_FineTuning_Guide_2026.pdf",
  },
  {
    title: "Prompt Engineering Cheat Sheet",
    description: "Zero-shot, CoT, RAG prompts, agent prompts, security guide",
    topic: "Prompting",
    topicColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    file: "/pdfs/AmanAI_Lab_PromptEngineering_CheatSheet.pdf",
  },
  {
    title: "LLM System Design Guide",
    description: "Architecture, scaling, safety, observability, cost optimization",
    topic: "System Design",
    topicColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    file: "/pdfs/AmanAI_Lab_LLM_SystemDesign_Guide.pdf",
  },
  {
    title: "Python for AI/ML Cheat Sheet",
    description: "NumPy, Pandas, PyTorch, HuggingFace, LangChain snippets",
    topic: "Python",
    topicColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    file: "/pdfs/AmanAI_Lab_Python_AI_ML_CheatSheet.pdf",
  },
  {
    title: "Transformer Architecture Deep Dive",
    description: "Attention, multi-head, KV cache, RoPE, Flash Attention, modern LLMs",
    topic: "Transformers",
    topicColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    file: "/pdfs/AmanAI_Lab_Transformer_Architecture_DeepDive.pdf",
  },
  {
    title: "MLOps & LLMOps Guide",
    description: "CI/CD, experiment tracking, drift detection, prompt versioning",
    topic: "MLOps",
    topicColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    file: "/pdfs/AmanAI_Lab_MLOps_LLMOps_Guide.pdf",
  },
];

export default function ResourcesContent() {
  const [selectedPdf, setSelectedPdf] = useState<PDF | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function openModal(pdf: PDF) {
    setSelectedPdf(pdf);
    setEmail("");
    setStatus("idle");
    setErrorMsg("");
  }

  function closeModal() {
    setSelectedPdf(null);
    setEmail("");
    setStatus("idle");
    setErrorMsg("");
  }

  async function handleDownload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPdf) return;

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: trimmed });

    // Ignore duplicate email errors so the user can still download
    if (error && !error.message.includes("duplicate")) {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
      return;
    }

    setStatus("success");

    // Trigger download after short delay so user sees success message
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = selectedPdf.file;
      link.download = selectedPdf.file.split("/").pop() ?? "download.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(closeModal, 800);
    }, 600);
  }

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <FileText className="w-3.5 h-3.5" />
            Free Downloads
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Free AI/ML Resources
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Download free cheat sheets and interview prep materials
          </p>
        </div>
      </div>

      {/* PDF Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pdfs.map((pdf) => (
            <div
              key={pdf.file}
              className="group relative flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200"
            >
              {/* Topic badge */}
              <span
                className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full border mb-4 ${pdf.topicColor}`}
              >
                {pdf.topic}
              </span>

              <h3 className="font-bold text-zinc-100 text-base leading-snug mb-2 flex-1">
                {pdf.title}
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                {pdf.description}
              </p>

              <button
                onClick={() => openModal(pdf)}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
              >
                <Download className="w-4 h-4" />
                Download Free
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Email Capture Modal */}
      {selectedPdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${selectedPdf.topicColor}`}
              >
                {selectedPdf.topic}
              </span>
              <h2 className="text-xl font-bold text-zinc-100 mt-3 mb-1">
                {selectedPdf.title}
              </h2>
              <p className="text-zinc-500 text-sm">{selectedPdf.description}</p>
            </div>

            {status === "success" ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Download className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-semibold">Download starting…</p>
                <p className="text-zinc-500 text-sm">Check your downloads folder.</p>
              </div>
            ) : (
              <form onSubmit={handleDownload} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="email-input" className="block text-sm font-medium text-zinc-300 mb-2">
                    Enter your email to get the free PDF
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="you@example.com"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                    required
                  />
                  {errorMsg && (
                    <p className="mt-2 text-red-400 text-xs">{errorMsg}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3 rounded-xl transition-all"
                >
                  {status === "loading" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Preparing…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Get Free PDF
                    </>
                  )}
                </button>

                <p className="text-zinc-600 text-xs text-center">
                  No spam. Unsubscribe any time.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
