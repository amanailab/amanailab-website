"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain, BookOpen, Code2, Cpu, Network, MessageSquare } from "lucide-react";
import Image from "next/image";
import { YoutubeIcon, GithubIcon, LinkedinIcon } from "@/components/icons/SocialIcons";

const expertise = [
  {
    icon: Brain,
    title: "Large Language Models",
    desc: "GPT-4, Claude, Llama, Gemini — architecture, fine-tuning, and deployment.",
  },
  {
    icon: Network,
    title: "AI Agents & Multi-agent",
    desc: "LangChain, AutoGen, CrewAI — building autonomous and collaborative agents.",
  },
  {
    icon: Code2,
    title: "RAG & Knowledge Systems",
    desc: "Pinecone, Weaviate, Chroma — embedding, indexing, and retrieval pipelines.",
  },
  {
    icon: Cpu,
    title: "Model Fine-tuning",
    desc: "LoRA, QLoRA, PEFT, RLHF — customizing models for specific domains.",
  },
  {
    icon: BookOpen,
    title: "Prompt Engineering",
    desc: "Chain-of-thought, few-shot, structured output, and adversarial robustness.",
  },
  {
    icon: MessageSquare,
    title: "GenAI Applications",
    desc: "End-to-end app development with FastAPI, Next.js, and cloud platforms.",
  },
];

const socials = [
  { icon: YoutubeIcon, label: "YouTube", href: "https://youtube.com/@AmanAI_lab", color: "hover:text-red-400 hover:border-red-400/30" },
  { icon: GithubIcon, label: "GitHub", href: "https://github.com/amanailab", color: "hover:text-white hover:border-zinc-500" },
  { icon: LinkedinIcon, label: "LinkedIn", href: "https://www.linkedin.com/in/aman-chauhan71/", color: "hover:text-blue-400 hover:border-blue-400/30" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }),
};

interface Props {
  videoCount: string;
  subscriberCount: string;
  viewCount: string;
}

export default function AboutContent({ videoCount, subscriberCount, viewCount }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-28">
      {/* Hero */}
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-orange-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            About
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 leading-tight">
            Hi, I&apos;m Aman Chauhan
          </h1>
          <p className="text-orange-400 font-semibold text-base mb-6">Founder, AmanAI Lab</p>
          <div className="space-y-4 text-zinc-400 text-[16px] leading-relaxed mb-8">
            <p>
              With over 10 years of industry experience, I have worked on real-world AI and
              technology projects with Fortune 500 companies including SAP Labs, S&amp;P Global,
              Amdocs, and LTIMindtree. My hands-on experience spans Machine Learning, Deep
              Learning, Computer Vision, NLP, Generative AI, and Agentic AI — from research
              to production.
            </p>
            <p>
              I founded AmanAI Lab to make high-quality, practical AI education accessible to
              everyone. Every course, video, and resource here is built from real project
              experience — not just theory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://youtube.com/@AmanAI_lab"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/25 text-sm"
            >
              <YoutubeIcon className="w-4 h-4" />
              Subscribe
            </a>
            {socials.slice(1).map(({ icon: Icon, label, href, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 transition-all ${color}`}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Visual card */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex justify-center lg:justify-end"
        >
          <div className="relative w-80 h-80">
            {/* Outer ring glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/15 to-transparent border border-orange-500/10" />

            {/* Card */}
            <div className="absolute inset-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 p-6">
              <Image
                src="/logo.jpg"
                alt="AmanAI Lab"
                width={96}
                height={96}
                className="rounded-2xl object-cover ring-1 ring-zinc-700"
              />
              <div className="text-center">
                <p className="font-bold text-lg">AmanAI Lab</p>
                <p className="text-zinc-400 text-sm">AI Educator & Builder</p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full mt-2">
                {[
                  { v: videoCount, l: "Videos" },
                  { v: subscriberCount, l: "Subs" },
                  { v: viewCount, l: "Views" },
                ].map(({ v, l }) => (
                  <div key={l} className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
                    <p className="text-orange-400 font-bold text-sm">{v}</p>
                    <p className="text-zinc-500 text-[10px] mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-3 -right-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-orange-400 shadow-lg">
              🤖 AI Agents
            </div>
            <div className="absolute -bottom-3 -left-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-400 shadow-lg">
              🧠 LLMs
            </div>
          </div>
        </motion.div>
      </div>

      {/* Expertise */}
      <div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-10"
        >
          <p className="text-orange-500 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            Skills
          </p>
          <h2 className="text-3xl font-bold">Areas of Expertise</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expertise.map((item, i) => (
            <motion.div
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 rounded-xl p-5 transition-colors group"
            >
              <div className="w-10 h-10 bg-orange-500/10 group-hover:bg-orange-500/15 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <item.icon className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{item.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div>
          <h3 className="text-xl font-bold mb-1">Want to learn AI together?</h3>
          <p className="text-zinc-400 text-sm">Subscribe to the channel and never miss a lesson.</p>
        </div>
        <a
          href="https://youtube.com/@AmanAI_lab"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 shrink-0 text-sm"
        >
          <YoutubeIcon className="w-4 h-4" />
          Subscribe
          <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>
    </div>
  );
}
