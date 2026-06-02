"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronDown, ChevronUp, BrainCircuit,
  CheckCircle2, XCircle, SkipForward, RotateCcw, ArrowRight,
  Search, X, Dice5, MessageCircle, Library, Sparkles,
} from "lucide-react";
import { SITE_STATS } from "@/lib/site-stats";
import EmailCaptureCard from "@/components/shared/EmailCaptureCard";
import MockInterviewChat from "@/components/interview/MockInterviewChat";
import AISimulator from "@/components/interview/AISimulator";
import QuestionCard from "@/components/questions/QuestionCard";
import Pagination from "@/components/ui/Pagination";
import { useBookmarks } from "@/hooks/useBookmarks";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  topic: string;
  level: string;
  question: string;
  answer: string;
}

interface Evaluation {
  score: number;
  correct: string[];
  missing: string[];
  modelAnswer: string;
}

type SimStep = "settings" | "question" | "feedback";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOPICS_BANK: { label: string; value: string }[] = [
  { label: "All",            value: "all"           },
  { label: "LLM",            value: "llm"           },
  { label: "RAG",            value: "rag"           },
  { label: "Agents",         value: "agents"        },
  { label: "Fine-Tuning",    value: "fine-tuning"   },
  { label: "MLOps",          value: "mlops"         },
  { label: "Transformers",   value: "transformers"  },
  { label: "System Design",  value: "system-design" },
  { label: "Python",         value: "python"        },
  { label: "Vector DB",      value: "vector-db"     },
  { label: "Computer Vision",value: "computer-vision"},
  { label: "NLP",            value: "nlp"           },
  { label: "Statistics",     value: "statistics"    },
  { label: "Behavioral",     value: "behavioral"    },
];
const TOPICS_SIM = [
  "LLM", "RAG", "Agents", "Fine-Tuning", "MLOps",
  "Transformers", "System Design", "Python", "Vector DB",
  "Computer Vision", "NLP", "Statistics", "Behavioral",
];
const LEVELS_BANK = ["All", "Fresher", "Mid", "Senior"];
const LEVELS_SIM  = ["Fresher", "Mid", "Senior"];

const DAILY_LIMIT = 3;
const LS_KEY = "amanai_sim_usage";

// ─── Rate-limit helpers ───────────────────────────────────────────────────────

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getUsage(): number {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    return date === todayKey() ? count : 0;
  } catch {
    return 0;
  }
}

function incrementUsage() {
  const count = getUsage() + 1;
  localStorage.setItem(LS_KEY, JSON.stringify({ date: todayKey(), count }));
  return count;
}

// ─── Score color ──────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 8) return "text-green-400";
  if (score >= 5) return "text-yellow-400";
  return "text-red-400";
}
function scoreBg(score: number) {
  if (score >= 8) return "bg-green-500/10 border-green-500/30";
  if (score >= 5) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-red-500/10 border-red-500/30";
}

// ─── Question Bank helpers ─────────────────────────────────────────────────────

const PER_PAGE = 10;

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-14 rounded-full bg-zinc-800" />
        <div className="h-5 w-12 rounded-full bg-zinc-800" />
      </div>
      <div className="h-4 w-11/12 rounded bg-zinc-800 mb-2" />
      <div className="h-4 w-9/12 rounded bg-zinc-800 mb-2" />
      <div className="h-4 w-7/12 rounded bg-zinc-800 mb-5" />
      <div className="h-9 w-full rounded-xl bg-zinc-800" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

// Map a Question Bank row to the shared QuestionCard shape.
function toCardData(q: Question) {
  return { id: String(q.id), question: q.question, answer: q.answer, topic: q.topic, level: q.level }
}

export default function InterviewHub() {
  const supabase = useMemo(() => createClient(), [])
  const { bookmarks, toggle: toggleBookmark } = useBookmarks()

  // Default to the browsable Question Bank (lowest-friction first action);
  // honor an explicit ?tab= (e.g. the homepage hero links to ?tab=simulator).
  const [activeTab, setActiveTab]     = useState<"bank" | "simulator" | "chat">('bank')

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'bank' || tab === 'simulator' || tab === 'chat') setActiveTab(tab)
  }, []);
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [randomQuestion, setRandomQuestion] = useState<Question | null>(null);
  const [randomLoading, setRandomLoading]   = useState(false);

  // Debounce the search input → searchQuery so we don't fire a query per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Reset to page 1 whenever any filter or the search changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [topicFilter, levelFilter, searchQuery]);

  // Fetch the current page (with all filters applied server-side) + total count.
  useEffect(() => {
    let cancelled = false;
    async function fetchPage() {
      setLoading(true);
      let query = supabase
        .from("interview_questions")
        .select("id, topic, level, question, answer", { count: "exact" });
      if (topicFilter !== "all") query = query.eq("topic", topicFilter);
      if (levelFilter !== "All") query = query.eq("level", levelFilter.toLowerCase());
      if (searchQuery) query = query.ilike("question", `%${searchQuery}%`);
      const start = (currentPage - 1) * PER_PAGE;
      const end = start + PER_PAGE - 1;
      const { data, error, count } = await query.range(start, end);
      if (cancelled) return;
      if (error) {
        setError("Failed to load questions. Please try again later.");
        setQuestions([]);
        setTotalCount(0);
      } else {
        setError("");
        setQuestions(data ?? []);
        setTotalCount(count ?? 0);
      }
      setLoading(false);
    }
    fetchPage();
    return () => {
      cancelled = true;
    };
  }, [topicFilter, levelFilter, searchQuery, currentPage]);

  // Fetch counts per topic once on mount.
  useEffect(() => {
    let cancelled = false;
    async function fetchCounts() {
      const entries = await Promise.all(
        TOPICS_BANK.map(async (t) => {
          let q = supabase
            .from("interview_questions")
            .select("*", { count: "exact", head: true });
          if (t.value !== "all") q = q.eq("topic", t.value);
          const { count } = await q;
          return [t.value, count ?? 0] as const;
        })
      );
      if (!cancelled) setTopicCounts(Object.fromEntries(entries));
    }
    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  async function pickRandomQuestion() {
    if (totalCount === 0) return;
    setRandomLoading(true);
    try {
      const offset = Math.floor(Math.random() * totalCount);
      let query = supabase
        .from("interview_questions")
        .select("id, topic, level, question, answer");
      if (topicFilter !== "all") query = query.eq("topic", topicFilter);
      if (levelFilter !== "All") query = query.eq("level", levelFilter.toLowerCase());
      if (searchQuery) query = query.ilike("question", `%${searchQuery}%`);
      const { data } = await query.range(offset, offset);
      if (data && data.length > 0) {
        setRandomQuestion(data[0]);
        if (typeof window !== "undefined") {
          requestAnimationFrame(() => {
            randomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      }
    } finally {
      setRandomLoading(false);
    }
  }

  const randomRef = useRef<HTMLDivElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const currentTopicLabel =
    TOPICS_BANK.find((t) => t.value === topicFilter)?.label ?? "";

  const TABS = [
    {
      id: "bank" as const,
      label: "Question Bank",
      desc: `Browse ${SITE_STATS.questions} real AI/ML questions`,
      icon: <Library className="w-4 h-4" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/25",
    },
    {
      id: "simulator" as const,
      label: "AI Simulator",
      desc: "Timed interview with instant scoring",
      icon: <BrainCircuit className="w-4 h-4" />,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/25",
    },
    {
      id: "chat" as const,
      label: "Chat Interview",
      desc: "Conversational AI practice session",
      icon: <MessageCircle className="w-4 h-4" />,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/25",
    },
  ]

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">

      {/* ── Compact page header ─────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-5">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <BrainCircuit className="w-4.5 h-4.5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-zinc-100 leading-tight">AI Interview Prep Hub</h1>
              <p className="text-xs text-zinc-500">Practice real AI/ML questions · Free · No login needed</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                <Sparkles className="w-3 h-3" /> Free · 13 Topics
              </div>
            </div>
          </div>

          {/* Tool tabs — card style */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-px scrollbar-thin scrollbar-thumb-zinc-800">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? `${tab.bg} ${tab.color}`
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                <span className={activeTab === tab.id ? tab.color : "text-zinc-600"}>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="text-[10px] hidden md:inline opacity-70">{tab.desc}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-6">

        {/* Question Bank tab */}
        {activeTab === "bank" && (
          <>
            {/* Search + Random */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-9 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={pickRandomQuestion}
                disabled={randomLoading || totalCount === 0}
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
              >
                <Dice5 className="w-4 h-4" />
                Random Question
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide w-16 shrink-0">Topic</span>
                <div className="flex flex-wrap gap-2">
                  {TOPICS_BANK.map((t) => {
                    const count = topicCounts[t.value];
                    return (
                      <button
                        key={t.value}
                        onClick={() => setTopicFilter(t.value)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          topicFilter === t.value
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                        }`}
                      >
                        {t.label}
                        {typeof count === "number" && (
                          <span className={`ml-1.5 ${topicFilter === t.value ? "text-white/80" : "text-zinc-500"}`}>
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide w-16 shrink-0">Level</span>
                <div className="flex flex-wrap gap-2">
                  {LEVELS_BANK.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevelFilter(l)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        levelFilter === l
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Random question preview */}
            {randomQuestion && (
              <div ref={randomRef} className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                    <Dice5 className="w-3.5 h-3.5" /> Random pick
                  </span>
                  <button
                    onClick={() => setRandomQuestion(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Dismiss
                  </button>
                </div>
                <QuestionCard q={toCardData(randomQuestion)} defaultOpen />
              </div>
            )}

            {/* Count line */}
            <div className="mb-5">
              {!error && (
                <p className="text-zinc-500 text-sm">
                  Showing{" "}
                  <span className="text-zinc-300 font-semibold">{questions.length}</span>{" "}
                  of{" "}
                  <span className="text-zinc-300 font-semibold">{totalCount}</span>{" "}
                  {topicFilter !== "all" ? `${currentTopicLabel} ` : ""}
                  {totalCount === 1 ? "question" : "questions"}
                  {searchQuery && (
                    <>
                      {" "}matching{" "}
                      <span className="text-zinc-300 font-semibold">
                        &ldquo;{searchQuery}&rdquo;
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Array.from({ length: PER_PAGE }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}
            {!loading && error && (
              <div className="text-center py-24 text-red-400 text-sm">{error}</div>
            )}
            {!loading && !error && questions.length === 0 && (
              <div className="text-center py-24">
                <BrainCircuit className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 text-sm">No questions match the selected filters.</p>
                <button
                  onClick={() => {
                    setTopicFilter("all");
                    setLevelFilter("All");
                    setSearchInput("");
                  }}
                  className="mt-4 text-orange-400 text-sm hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
            {!loading && !error && questions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    q={toCardData(q)}
                    bookmarked={bookmarks.has(String(q.id))}
                    onBookmark={toggleBookmark}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-8"
              />
            )}
          </>
        )}

        {/* AI Simulator tab */}
        {activeTab === "simulator" && <AISimulator />}

        {/* Chat Interview tab */}
        {activeTab === "chat" && <MockInterviewChat />}
      </div>
    </section>
  );
}
