"use client";

import { motion } from "framer-motion";
import { Users, Wrench, BookOpen, BrainCircuit } from "lucide-react";

const stats = [
  { icon: <Users className="w-5 h-5" />,       value: "10,000+",  label: "Developers Learning" },
  { icon: <Wrench className="w-5 h-5" />,       value: "15+",      label: "Free AI Tools"       },
  { icon: <BrainCircuit className="w-5 h-5" />, value: "500+",     label: "Interview Questions" },
  { icon: <BookOpen className="w-5 h-5" />,     value: "50+",      label: "Blog Articles"       },
];

export default function SocialProofBar() {
  return (
    <section className="py-8 px-4 border-y border-zinc-800/60 bg-zinc-900/30">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col items-center text-center gap-1.5"
            >
              <div className="text-orange-400 mb-1">{s.icon}</div>
              <p className="text-2xl font-extrabold text-zinc-100 tabular-nums">{s.value}</p>
              <p className="text-xs text-zinc-500 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
