"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Rocket,
  Lightbulb,
  Trophy,
  BookOpen,
  Flame,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  XCircle,
  MessageCircle,
  Hash,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { LinkedinIcon } from "@/components/icons/SocialIcons";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = "project" | "learning" | "career" | "tech" | "hottake";
type Variation = "shorter" | "personal" | "data";

type IconComponent = React.ComponentType<{ className?: string }>;

interface ProjectForm {
  projectName: string;
  description: string;
  techStack: string;
  achievement: string;
  audience: string;
  tone: string;
}

interface LearningForm {
  topic: string;
  insight: string;
  timeInvested: string;
  audience: string;
  style: string;
}

interface CareerForm {
  achievement: string;
  background: string;
  timeTaken: string;
  keyFactor: string;
  advice: string;
}

interface TechForm {
  topic: string;
  opinion: string;
  point1: string;
  point2: string;
  point3: string;
  controversyLevel: string;
}

interface HotTakeForm {
  opinion: string;
  reasoning: string;
  evidence: string;
  industry: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 5;
const LS_USES_KEY = "linkedin_gen_uses";
const LS_DATE_KEY = "linkedin_gen_date";
const WHATSAPP_NUMBER = "919997600372";

const TYPES: {
  id: PostType;
  title: string;
  description: string;
  Icon: IconComponent;
}[] = [
  {
    id: "project",
    title: "Project Launch",
    description: "Announce a new AI/ML project",
    Icon: Rocket,
  },
  {
    id: "learning",
    title: "Learning Post",
    description: "Share what you learned",
    Icon: Lightbulb,
  },
  {
    id: "career",
    title: "Career Win",
    description: "Promotions, offers, milestones",
    Icon: Trophy,
  },
  {
    id: "tech",
    title: "Tech Insight",
    description: "Thought leadership take",
    Icon: BookOpen,
  },
  {
    id: "hottake",
    title: "Hot Take",
    description: "Bold opinion, professionally",
    Icon: Flame,
  },
];

const AUDIENCES = [
  "AI Developers",
  "Data Scientists",
  "Job Seekers",
  "Recruiters",
  "Everyone",
];

const PROJECT_TONES = ["Excited", "Professional", "Humble", "Storytelling", "Direct"];

const LEARNING_STYLES = ["Thread style", "Single post", "Listicle", "Story", "Tips"];

const CONTROVERSY = ["Safe", "Slightly Bold", "Bold", "Hot Take"];

const INDUSTRIES = [
  "AI/ML",
  "Data Science",
  "Software Dev",
  "Career Advice",
  "Tech Industry",
];

const INITIAL_PROJECT: ProjectForm = {
  projectName: "",
  description: "",
  techStack: "",
  achievement: "",
  audience: "",
  tone: "",
};
const INITIAL_LEARNING: LearningForm = {
  topic: "",
  insight: "",
  timeInvested: "",
  audience: "",
  style: "",
};
const INITIAL_CAREER: CareerForm = {
  achievement: "",
  background: "",
  timeTaken: "",
  keyFactor: "",
  advice: "",
};
const INITIAL_TECH: TechForm = {
  topic: "",
  opinion: "",
  point1: "",
  point2: "",
  point3: "",
  controversyLevel: "",
};
const INITIAL_HOTTAKE: HotTakeForm = {
  opinion: "",
  reasoning: "",
  evidence: "",
  industry: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getUsage(): number {
  try {
    const date = localStorage.getItem(LS_DATE_KEY);
    const countRaw = localStorage.getItem(LS_USES_KEY);
    if (!date || !countRaw) return 0;
    if (date !== todayKey()) return 0;
    const count = parseInt(countRaw, 10);
    return Number.isFinite(count) ? count : 0;
  } catch {
    return 0;
  }
}

function incrementUsage(): number {
  const count = getUsage() + 1;
  localStorage.setItem(LS_DATE_KEY, todayKey());
  localStorage.setItem(LS_USES_KEY, String(count));
  return count;
}

function buildMakeoverWhatsappLink() {
  const message = "Hi Aman, I want complete LinkedIn profile optimization";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function reachMeta(chars: number): { label: string; bg: string; color: string } {
  if (chars < 1000)
    return {
      label: "High Reach",
      bg: "bg-green-500/15 border-green-500/40",
      color: "text-green-300",
    };
  if (chars <= 2000)
    return {
      label: "Medium Reach",
      bg: "bg-yellow-500/15 border-yellow-500/40",
      color: "text-yellow-300",
    };
  return {
    label: "Lower Reach",
    bg: "bg-red-500/15 border-red-500/40",
    color: "text-red-300",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LinkedInGenerator() {
  const [postType, setPostType] = useState<PostType>("project");
  const [project, setProject] = useState<ProjectForm>(INITIAL_PROJECT);
  const [learning, setLearning] = useState<LearningForm>(INITIAL_LEARNING);
  const [career, setCareer] = useState<CareerForm>(INITIAL_CAREER);
  const [tech, setTech] = useState<TechForm>(INITIAL_TECH);
  const [hottake, setHottake] = useState<HotTakeForm>(INITIAL_HOTTAKE);
  const [working, setWorking] = useState(false);
  const [variationLoading, setVariationLoading] = useState<Variation | null>(null);
  const [error, setError] = useState("");
  const [post, setPost] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [usedToday, setUsedToday] = useState(0);
  const [postCopied, setPostCopied] = useState(false);
  const [tagsCopied, setTagsCopied] = useState(false);

  useEffect(() => {
    setUsedToday(getUsage());
  }, []);

  const limitReached = usedToday >= DAILY_LIMIT;
  const remaining = useMemo(() => Math.max(0, DAILY_LIMIT - usedToday), [usedToday]);
  const usagePct = useMemo(
    () => Math.min(100, Math.round((usedToday / DAILY_LIMIT) * 100)),
    [usedToday]
  );

  function switchType(next: PostType) {
    if (next === postType || working) return;
    setPostType(next);
    setError("");
    setPost("");
    setHashtags("");
  }

  function currentFormData(): Record<string, unknown> {
    if (postType === "project") return { ...project };
    if (postType === "learning") return { ...learning };
    if (postType === "career") return { ...career };
    if (postType === "tech") return { ...tech };
    return { ...hottake };
  }

  async function generate(opts: { variation?: Variation } = {}) {
    if (working || limitReached) return;
    setError("");
    setWorking(true);
    if (opts.variation) setVariationLoading(opts.variation);
    if (!opts.variation) {
      setPost("");
      setHashtags("");
    }
    try {
      const res = await fetch("/api/linkedin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postType,
          variation: opts.variation ?? null,
          formData: currentFormData(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate post.");

      const newCount = incrementUsage();
      setUsedToday(newCount);
      setPost(typeof data.post === "string" ? data.post : "");
      setHashtags(typeof data.hashtags === "string" ? data.hashtags : "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setWorking(false);
      setVariationLoading(null);
    }
  }

  async function copyPost() {
    if (!post) return;
    try {
      await navigator.clipboard.writeText(
        hashtags ? `${post}\n\n${hashtags}` : post
      );
      setPostCopied(true);
      setTimeout(() => setPostCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function copyHashtags() {
    if (!hashtags) return;
    try {
      await navigator.clipboard.writeText(hashtags);
      setTagsCopied(true);
      setTimeout(() => setTagsCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const inputBase =
    "w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors";
  const labelClass = "text-xs font-semibold text-zinc-400 uppercase tracking-wide";

  // ── Limit reached ──
  if (limitReached && !post) {
    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 mx-auto">
            <LinkedinIcon className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Daily limit reached</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Come back tomorrow for {DAILY_LIMIT} more free LinkedIn posts.
          </p>
          <a
            href={buildMakeoverWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            <MessageCircle className="w-4 h-4" />
            Talk to Aman
          </a>
        </div>
      </section>
    );
  }

  const charCount = post.length;
  const reach = reachMeta(charCount);

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative pt-20 pb-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <LinkedinIcon className="w-3.5 h-3.5" />
            LinkedIn Generator
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            LinkedIn Post Generator
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-6">
            Generate viral LinkedIn posts for AI/ML developers in seconds. Free. No login
            needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
            {[
              { label: "5 Post Types" },
              { label: "AI Powered" },
              { label: "100% Free" },
            ].map((stat) => (
              <span
                key={stat.label}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold"
              >
                {stat.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Usage bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="text-xs font-semibold text-zinc-400 tabular-nums shrink-0">
            {remaining} of {DAILY_LIMIT} free uses left today
          </p>
        </div>

        {/* Type grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {TYPES.map(({ id, title, description, Icon }) => {
            const active = postType === id;
            return (
              <button
                key={id}
                onClick={() => switchType(id)}
                className={`group flex flex-col items-start gap-2 text-left p-4 rounded-2xl border transition-all ${
                  active
                    ? "bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/15"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-orange-500/5"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    active
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-800 text-orange-400 group-hover:bg-zinc-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p
                  className={`text-sm font-bold ${
                    active ? "text-orange-300" : "text-zinc-100"
                  }`}
                >
                  {title}
                </p>
                <p className="text-xs text-zinc-500 leading-snug line-clamp-2">
                  {description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5">
          {/* ── Project Launch ── */}
          {postType === "project" && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Project name *</label>
                <input
                  type="text"
                  value={project.projectName}
                  onChange={(e) =>
                    setProject((s) => ({ ...s, projectName: e.target.value }))
                  }
                  placeholder="Example: AI Resume Analyzer"
                  className={inputBase}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>What does it do? *</label>
                <textarea
                  value={project.description}
                  onChange={(e) =>
                    setProject((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Analyzes resumes using AI and gives ATS score"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Tech stack used *</label>
                  <input
                    type="text"
                    value={project.techStack}
                    onChange={(e) =>
                      setProject((s) => ({ ...s, techStack: e.target.value }))
                    }
                    placeholder="Next.js, Groq API, Supabase"
                    className={inputBase}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Key achievement *</label>
                  <input
                    type="text"
                    value={project.achievement}
                    onChange={(e) =>
                      setProject((s) => ({ ...s, achievement: e.target.value }))
                    }
                    placeholder="Processes resume in 5 seconds"
                    className={inputBase}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Target audience *</label>
                  <select
                    value={project.audience}
                    onChange={(e) =>
                      setProject((s) => ({ ...s, audience: e.target.value }))
                    }
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {AUDIENCES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Post tone *</label>
                  <select
                    value={project.tone}
                    onChange={(e) => setProject((s) => ({ ...s, tone: e.target.value }))}
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {PROJECT_TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ── Learning ── */}
          {postType === "learning" && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>What did you learn? *</label>
                <textarea
                  value={learning.topic}
                  onChange={(e) =>
                    setLearning((s) => ({ ...s, topic: e.target.value }))
                  }
                  placeholder="Example: How RAG systems work in production"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Key insight *</label>
                <textarea
                  value={learning.insight}
                  onChange={(e) =>
                    setLearning((s) => ({ ...s, insight: e.target.value }))
                  }
                  placeholder="Most people get chunking strategy wrong"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>How long did it take? *</label>
                  <input
                    type="text"
                    value={learning.timeInvested}
                    onChange={(e) =>
                      setLearning((s) => ({ ...s, timeInvested: e.target.value }))
                    }
                    placeholder="3 months of building"
                    className={inputBase}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Who should read this? *</label>
                  <select
                    value={learning.audience}
                    onChange={(e) =>
                      setLearning((s) => ({ ...s, audience: e.target.value }))
                    }
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {AUDIENCES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Post style *</label>
                <select
                  value={learning.style}
                  onChange={(e) => setLearning((s) => ({ ...s, style: e.target.value }))}
                  className={inputBase}
                >
                  <option value="">Choose…</option>
                  {LEARNING_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* ── Career Win ── */}
          {postType === "career" && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>What is the win? *</label>
                <textarea
                  value={career.achievement}
                  onChange={(e) =>
                    setCareer((s) => ({ ...s, achievement: e.target.value }))
                  }
                  placeholder='Got promoted to Senior AI Engineer or "Got job at Google"'
                  rows={2}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Your background *</label>
                  <input
                    type="text"
                    value={career.background}
                    onChange={(e) =>
                      setCareer((s) => ({ ...s, background: e.target.value }))
                    }
                    placeholder="Started as Java developer"
                    className={inputBase}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Time taken *</label>
                  <input
                    type="text"
                    value={career.timeTaken}
                    onChange={(e) =>
                      setCareer((s) => ({ ...s, timeTaken: e.target.value }))
                    }
                    placeholder="8 months of learning"
                    className={inputBase}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Key factor *</label>
                <textarea
                  value={career.keyFactor}
                  onChange={(e) =>
                    setCareer((s) => ({ ...s, keyFactor: e.target.value }))
                  }
                  placeholder="Built 3 real projects and contributed to open source"
                  rows={2}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Advice to give *</label>
                <textarea
                  value={career.advice}
                  onChange={(e) =>
                    setCareer((s) => ({ ...s, advice: e.target.value }))
                  }
                  placeholder="Focus on building not just watching tutorials"
                  rows={2}
                  className={`${inputBase} resize-y`}
                />
              </div>
            </>
          )}

          {/* ── Tech Insight ── */}
          {postType === "tech" && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Topic *</label>
                <input
                  type="text"
                  value={tech.topic}
                  onChange={(e) => setTech((s) => ({ ...s, topic: e.target.value }))}
                  placeholder="Example: RAG vs Fine-tuning"
                  className={inputBase}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Your opinion *</label>
                <textarea
                  value={tech.opinion}
                  onChange={(e) => setTech((s) => ({ ...s, opinion: e.target.value }))}
                  placeholder="Most people use fine-tuning when RAG would work better"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Point 1 *</label>
                  <input
                    type="text"
                    value={tech.point1}
                    onChange={(e) => setTech((s) => ({ ...s, point1: e.target.value }))}
                    placeholder="Cheaper to run"
                    className={inputBase}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Point 2 *</label>
                  <input
                    type="text"
                    value={tech.point2}
                    onChange={(e) => setTech((s) => ({ ...s, point2: e.target.value }))}
                    placeholder="Easier to update"
                    className={inputBase}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Point 3 *</label>
                  <input
                    type="text"
                    value={tech.point3}
                    onChange={(e) => setTech((s) => ({ ...s, point3: e.target.value }))}
                    placeholder="Better for fresh data"
                    className={inputBase}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Controversy level *</label>
                <select
                  value={tech.controversyLevel}
                  onChange={(e) =>
                    setTech((s) => ({ ...s, controversyLevel: e.target.value }))
                  }
                  className={inputBase}
                >
                  <option value="">Choose…</option>
                  {CONTROVERSY.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* ── Hot Take ── */}
          {postType === "hottake" && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Your controversial opinion *</label>
                <textarea
                  value={hottake.opinion}
                  onChange={(e) =>
                    setHottake((s) => ({ ...s, opinion: e.target.value }))
                  }
                  placeholder="Example: Most AI courses are a waste of money"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Why you believe this *</label>
                <textarea
                  value={hottake.reasoning}
                  onChange={(e) =>
                    setHottake((s) => ({ ...s, reasoning: e.target.value }))
                  }
                  placeholder="Because they teach theory without real projects"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Your evidence *</label>
                <textarea
                  value={hottake.evidence}
                  onChange={(e) =>
                    setHottake((s) => ({ ...s, evidence: e.target.value }))
                  }
                  placeholder="I switched careers in 6 months by only building projects"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Industry *</label>
                <select
                  value={hottake.industry}
                  onChange={(e) =>
                    setHottake((s) => ({ ...s, industry: e.target.value }))
                  }
                  className={inputBase}
                >
                  <option value="">Choose…</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
            </div>
          )}

          <button
            onClick={() => generate()}
            disabled={working}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            {working && !variationLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Writing your post…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Post
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {post && (
          <div className="mt-6 flex flex-col gap-4">
            {/* LinkedIn-style preview */}
            <div className="bg-white text-zinc-900 rounded-2xl shadow-2xl shadow-black/40 border border-zinc-200 overflow-hidden">
              <div className="flex items-center gap-3 px-5 pt-5">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-zinc-200 shrink-0">
                  <Image
                    src="/logo.jpg"
                    alt="Aman Chauhan"
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900">Aman Chauhan</p>
                  <p className="text-xs text-zinc-600 truncate">
                    AI Engineer · AmanAI Lab
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Just now · 🌐</p>
                </div>
                <LinkedinIcon className="w-5 h-5 text-[#0A66C2]" />
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-zinc-900 leading-relaxed whitespace-pre-wrap">
                  {post}
                </p>
                {hashtags && (
                  <p className="mt-4 text-sm text-[#0A66C2] leading-relaxed whitespace-pre-wrap">
                    {hashtags}
                  </p>
                )}
              </div>
              <div className="border-t border-zinc-100 px-5 py-3 flex items-center justify-between text-xs text-zinc-500">
                <span>👍 ❤️ 💡 1.2K</span>
                <span>248 comments · 92 reposts</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${reach.bg} ${reach.color}`}
              >
                {reach.label}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  charCount > 3000
                    ? "bg-red-500/15 border-red-500/40 text-red-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-300"
                }`}
              >
                {charCount} / 3000 characters
              </span>
            </div>

            {/* Hashtags-only block */}
            {hashtags && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-orange-400" />
                    <p className="text-sm font-semibold text-zinc-100">Hashtags</p>
                  </div>
                  <button
                    onClick={copyHashtags}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {tagsCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {hashtags}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={copyPost}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                {postCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Post
                  </>
                )}
              </button>
              <button
                onClick={copyHashtags}
                disabled={!hashtags}
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-orange-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
              >
                {tagsCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Hash className="w-4 h-4" />
                    Copy Hashtags
                  </>
                )}
              </button>
              <button
                onClick={() => generate()}
                disabled={working || limitReached}
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
              >
                {working && !variationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </>
                )}
              </button>
            </div>

            {/* Variations */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-sm font-semibold text-zinc-100 mb-3">
                Want a different style?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    { id: "shorter" as Variation, label: "Make it shorter" },
                    { id: "personal" as Variation, label: "Make it more personal" },
                    { id: "data" as Variation, label: "Add more data points" },
                  ]
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => generate({ variation: id })}
                    disabled={working || limitReached}
                    className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    {variationLoading === id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {label}
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-3 h-3" />
                        {label}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2">
              <p className="text-sm text-zinc-300">
                <span className="font-semibold">💡 Best time to post:</span> Tuesday –
                Thursday, 8 – 10 AM or 5 – 7 PM IST.
              </p>
              <p className="text-sm text-zinc-300">
                <span className="font-semibold">📈 Personal stories</span> get 3× more
                engagement than generic advice.
              </p>
              <p className="text-sm text-zinc-300">
                <span className="font-semibold">🏷️ Use 3 – 5 hashtags</span> max — more
                hurts reach.
              </p>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl font-bold text-zinc-100 mb-2">
            Want a complete LinkedIn profile that attracts recruiters?
          </h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-5">
            Profile optimisation + content strategy included.
          </p>
          <a
            href={buildMakeoverWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            <MessageCircle className="w-4 h-4" />
            Get LinkedIn Makeover ₹999
          </a>
        </div>
      </div>
    </section>
  );
}
