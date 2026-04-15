"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Video, Users, BookOpen, TrendingUp } from "lucide-react";

type FormattedStats = {
  subs: { value: number; suffix: string };
  views: { value: number; suffix: string };
  videos: { value: number; suffix: string };
  series: number;
};

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    const steps = 50;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, 1800 / steps);
    return () => clearInterval(interval);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

const DEFAULTS: FormattedStats = {
  subs: { value: 50, suffix: "K+" },
  views: { value: 2, suffix: "M+" },
  videos: { value: 150, suffix: "+" },
  series: 12,
};

export default function StatsSection({ stats }: { stats?: FormattedStats }) {
  const s = stats ?? DEFAULTS;

  const items = [
    { icon: Video, value: s.videos.value, suffix: s.videos.suffix, label: "Videos Published", desc: "In-depth tutorials" },
    { icon: Users, value: s.subs.value, suffix: s.subs.suffix, label: "Subscribers", desc: "Across platforms" },
    { icon: BookOpen, value: s.series, suffix: "+", label: "Course Series", desc: "Structured paths" },
    { icon: TrendingUp, value: s.views.value, suffix: s.views.suffix, label: "Total Views", desc: "And growing" },
  ];

  return (
    <section className="py-16 bg-zinc-900/40 border-y border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800/40">
          {items.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-zinc-950 px-6 py-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-500/10 rounded-xl mb-4">
                <stat.icon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-orange-400 mb-1 tabular-nums">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-zinc-200 text-sm font-semibold mb-0.5">{stat.label}</div>
              <div className="text-zinc-600 text-xs">{stat.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
