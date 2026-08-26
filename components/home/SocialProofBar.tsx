"use client";

import { motion } from "framer-motion";
import { Users, Wrench, BookOpen, BrainCircuit, ListChecks, Code2 } from "lucide-react";
import { SITE_STATS } from "@/lib/site-stats";

interface Props {
  subscriberCount?: string
  videoCount?: string
}

export default function SocialProofBar({ subscriberCount, videoCount }: Props) {
  const subsCard = subscriberCount
    ? { icon: <Users className="w-4 h-4" />, value: subscriberCount, label: "YouTube Subscribers", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" }
    : { icon: <Code2 className="w-4 h-4" />, value: SITE_STATS.codeProblems + "+", label: "Code Problems", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" }

  const videosCard = videoCount
    ? { icon: <BookOpen className="w-4 h-4" />, value: videoCount, label: "Videos Published", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" }
    : { icon: <ListChecks className="w-4 h-4" />, value: SITE_STATS.systemDesignProblems, label: "System Design Problems", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" }

  const stats = [
    subsCard,
    { icon: <Wrench className="w-4 h-4" />, value: SITE_STATS.tools, label: "Free AI Tools", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { icon: <BrainCircuit className="w-4 h-4" />, value: SITE_STATS.questions, label: "Interview Questions", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    videosCard,
  ]

  return (
    <section className="border-y border-zinc-800/50 bg-zinc-900/30 py-5 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-around sm:justify-between gap-y-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="relative flex items-center gap-3 px-4 sm:px-6"
            >
              {i > 0 && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-zinc-800 hidden sm:block" />
              )}
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className={`text-xl sm:text-2xl font-extrabold tabular-nums leading-none ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 whitespace-nowrap">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
