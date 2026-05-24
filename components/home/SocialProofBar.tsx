"use client";

import { motion } from "framer-motion";
import { Users, Wrench, BookOpen, BrainCircuit, ListChecks, Code2 } from "lucide-react";
import { SITE_STATS } from "@/lib/site-stats";

interface Props {
  subscriberCount?: string  // real YouTube subs e.g. "52K+"
  videoCount?: string       // real YouTube videos e.g. "148+"
}

export default function SocialProofBar({ subscriberCount, videoCount }: Props) {
  // Show live YouTube numbers when available; otherwise fall back to real
  // platform stats so the bar never renders a bare "—" or a made-up count.
  const subsCard = subscriberCount
    ? {
        icon: <Users className="w-5 h-5" />,
        value: subscriberCount,
        label: "Subscribers",
        sub: "on YouTube",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        glow: "from-red-500/0 via-red-500/10 to-red-500/0",
      }
    : {
        icon: <Code2 className="w-5 h-5" />,
        value: SITE_STATS.codeProblems + "+",
        label: "Code Problems",
        sub: "implement from scratch",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        glow: "from-red-500/0 via-red-500/10 to-red-500/0",
      }

  const videosCard = videoCount
    ? {
        icon: <BookOpen className="w-5 h-5" />,
        value: videoCount,
        label: "Videos Published",
        sub: "weekly drops",
        color: "text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
        glow: "from-blue-500/0 via-blue-500/10 to-blue-500/0",
      }
    : {
        icon: <ListChecks className="w-5 h-5" />,
        value: SITE_STATS.sheetTopics,
        label: "Interview Topics",
        sub: "A-to-Z prep sheet",
        color: "text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
        glow: "from-blue-500/0 via-blue-500/10 to-blue-500/0",
      }

  const stats = [
    subsCard,
    {
      icon: <Wrench className="w-5 h-5" />,
      value: SITE_STATS.tools,
      label: "Free AI Tools",
      sub: "no signup needed",
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      glow: "from-orange-500/0 via-orange-500/10 to-orange-500/0",
    },
    {
      icon: <BrainCircuit className="w-5 h-5" />,
      value: SITE_STATS.questions,
      label: "Interview Questions",
      sub: "with model answers",
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
      glow: "from-violet-500/0 via-violet-500/10 to-violet-500/0",
    },
    videosCard,
  ]

  return (
    <section className="py-10 px-4 border-y border-zinc-800/60 bg-zinc-900/30">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative overflow-hidden bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 transition-all"
            >
              {/* hover sheen */}
              <div className={`absolute inset-0 bg-gradient-to-r ${s.glow} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
              <div className="relative flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-2xl font-extrabold tabular-nums leading-none ${s.color}`}>{s.value}</p>
                  <p className="text-xs font-semibold text-zinc-300 mt-1.5 truncate">{s.label}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{s.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
