"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ChevronDown, ChevronUp, BrainCircuit,
  CheckCircle2, XCircle, SkipForward, RotateCcw, ArrowRight,
  Search, X, Dice5, MessageCircle, Library, Sparkles,
} from "lucide-react";
import EmailCaptureCard from "@/components/shared/EmailCaptureCard";
import MockInterviewChat from "@/components/interview/MockInterviewChat";
import AISimulator from "@/components/interview/AISimulator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const topicColors: Record<string, string> = {
  llm:             "bg-blue-500/20 text-blue-300 border-blue-500/30",
  rag:             "bg-violet-500/20 text-violet-300 border-violet-500/30",
  agents:          "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "fine-tuning":   "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  mlops:           "bg-green-500/20 text-green-300 border-green-500/30",
  transformers:    "bg-teal-500/20 text-teal-300 border-teal-500/30",
  "system design": "bg-red-500/20 text-red-300 border-red-500/30",
  "system-design": "bg-red-500/20 text-red-300 border-red-500/30",
  python:          "bg-lime-500/20 text-lime-300 border-lime-500/30",
  "vector db":     "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "vector-db":     "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

const levelColors: Record<string, string> = {
  fresher: "bg-green-500/20 text-green-300 border-green-500/30",
  mid:     "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  senior:  "bg-red-500/20 text-red-300 border-red-500/30",
};

function getTopicColor(topic: string) {
  return topicColors[topic.toLowerCase()] ?? "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
}
function getLevelColor(level: string) {
  return levelColors[level.toLowerCase()] ?? "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
}

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

// ─── QuestionCard (Question Bank) ─────────────────────────────────────────────

function QuestionCard({ q, defaultOpen = false }: { q: Question; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-200">
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getTopicColor(q.topic)}`}>{q.topic}</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getLevelColor(q.level)}`}>{q.level}</span>
      </div>
      <p className="text-zinc-100 font-medium text-sm leading-relaxed flex-1 mb-5">{q.question}</p>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center gap-2 w-full text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${
          open
            ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            : "bg-orange-500 border-transparent text-white hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/20"
        }`}
      >
        {open ? <><ChevronUp className="w-4 h-4" /> Hide Answer</> : <><ChevronDown className="w-4 h-4" /> Show Answer</>}
      </button>
      {open && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">{q.answer}</p>
        </div>
      )}
    </div>
  );
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

// ─── AI Simulator — replaced by AISimulator component ─────────────────────────

function _OldAISimulator_UNUSED() {
  const [step, setStep]               = useState<SimStep>("settings");
  const [topic, setTopic]             = useState(TOPICS_SIM[0]);
  const [level, setLevel]             = useState(LEVELS_SIM[0]);
  const [currentQ, setCurrentQ]       = useState("");
  const [userAnswer, setUserAnswer]   = useState("");
  const [evaluation, setEvaluation]   = useState<Evaluation | null>(null);
  const [loadingQ, setLoadingQ]       = useState(false);
  const [loadingE, setLoadingE]       = useState(false);
  const [apiError, setApiError]       = useState("");
  const [usedToday, setUsedToday]     = useState(0);

  useEffect(() => {
    setUsedToday(getUsage());
  }, []);

  const limitReached = usedToday >= DAILY_LIMIT;

  async function startInterview() {
    if (limitReached) return;
    setApiError("");
    setLoadingQ(true);
    try {
      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate question.");
      const newCount = incrementUsage();
      setUsedToday(newCount);
      setCurrentQ(data.question);
      setUserAnswer("");
      setEvaluation(null);
      setStep("question");
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoadingQ(false);
    }
  }

  async function submitAnswer() {
    if (!userAnswer.trim()) return;
    setApiError("");
    setLoadingE(true);
    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQ, answer: userAnswer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to evaluate answer.");
      setEvaluation(data);
      setStep("feedback");
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoadingE(false);
    }
  }

  function nextQuestion() {
    setStep("settings");
    setCurrentQ("");
    setUserAnswer("");
    setEvaluation(null);
    setApiError("");
  }

  const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;

  // ── Limit reached ──
  if (limitReached && step === "settings") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
          <BrainCircuit className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 mb-3">Daily Limit Reached</h2>
        <p className="text-zinc-400 text-sm max-w-sm">
          You have used your 5 free questions today. Come back tomorrow for more!
        </p>
      </div>
    );
  }

  // ── Settings ──
  if (step === "settings") {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-1">Configure Your Interview</h2>
            <p className="text-zinc-500 text-sm">
              {DAILY_LIMIT - usedToday} of {DAILY_LIMIT} free questions remaining today
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors"
            >
              {TOPICS_SIM.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors"
            >
              {LEVELS_SIM.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {apiError && <p className="text-red-400 text-sm">{apiError}</p>}

          <button
            onClick={startInterview}
            disabled={loadingQ}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            {loadingQ ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating Question…</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> Start Interview</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Question ──
  if (step === "question") {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getTopicColor(topic)}`}>{topic}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getLevelColor(level)}`}>{level}</span>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Question</p>
            <p className="text-zinc-100 text-base font-medium leading-relaxed">{currentQ}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Your Answer</label>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={8}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
            />
            <p className="text-xs text-zinc-600 text-right">{wordCount} {wordCount === 1 ? "word" : "words"}</p>
          </div>

          {apiError && <p className="text-red-400 text-sm">{apiError}</p>}

          <div className="flex gap-3">
            <button
              onClick={nextQuestion}
              className="flex items-center justify-center gap-2 flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              <SkipForward className="w-4 h-4" /> Skip Question
            </button>
            <button
              onClick={submitAnswer}
              disabled={loadingE || !userAnswer.trim()}
              className="flex items-center justify-center gap-2 flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
            >
              {loadingE ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Evaluating…</>
              ) : (
                <>Submit Answer</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Feedback ──
  if (step === "feedback" && evaluation) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="flex flex-col gap-5">
          {/* Score card */}
          <div className={`bg-zinc-900 border rounded-2xl p-6 flex items-center gap-5 ${scoreBg(evaluation.score)}`}>
            <div className={`text-5xl font-extrabold tabular-nums ${scoreColor(evaluation.score)}`}>
              {evaluation.score}<span className="text-2xl text-zinc-500">/10</span>
            </div>
            <div>
              <p className="text-zinc-300 font-semibold text-sm">Overall Score</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {evaluation.score >= 8 ? "Excellent answer!" : evaluation.score >= 5 ? "Good attempt, room to improve." : "Needs more depth — study the model answer."}
              </p>
            </div>
          </div>

          {/* What you got right */}
          {evaluation.correct.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">What You Got Right</p>
              <ul className="flex flex-col gap-2.5">
                {evaluation.correct.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What was missing */}
          {evaluation.missing.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">What Was Missing</p>
              <ul className="flex flex-col gap-2.5">
                {evaluation.missing.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Model answer */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Model Answer</p>
            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">{evaluation.modelAnswer}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep("question"); setUserAnswer(""); setEvaluation(null); setApiError(""); }}
              className="flex items-center justify-center gap-2 flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={nextQuestion}
              disabled={usedToday >= DAILY_LIMIT}
              className="flex items-center justify-center gap-2 flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
            >
              <ArrowRight className="w-4 h-4" /> Next Question
            </button>
          </div>

          {usedToday >= DAILY_LIMIT && (
            <p className="text-center text-zinc-500 text-xs">
              Daily limit reached. Come back tomorrow for more questions!
            </p>
          )}

          {/* Email capture after 3 completed questions */}
          {usedToday >= 3 && (
            <EmailCaptureCard
              source="interview_simulator"
              title="Get 50 more free questions"
              subtitle="Interview questions for RAG, Agents, LLMs and more delivered to your inbox."
              buttonLabel="Send Questions Free"
              successMessage="Questions sent! Check your inbox."
              hideOnCaptured
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Question Bank helpers ─────────────────────────────────────────────────────

const PER_PAGE = 10;

function getVisiblePages(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const result: (number | "...")[] = [1];
  if (current > 3) result.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    result.push(i);
  }
  if (current < total - 2) result.push("...");
  result.push(total);
  return result;
}

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

export default function InterviewHub() {
  // Default to simulator — "New Practice Session" from dashboard should land on simulator
  // Support ?tab=bank URL param for direct links to question bank
  const [activeTab, setActiveTab]     = useState<"bank" | "simulator" | "chat">(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab')
      if (tab === 'bank' || tab === 'chat') return tab
    }
    return 'simulator'
  });
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
      desc: "Browse 500+ real AI/ML questions",
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
                <Sparkles className="w-3 h-3" /> Free · 14 Topics
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
                <QuestionCard q={randomQuestion} defaultOpen />
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
                {questions.map((q) => <QuestionCard key={q.id} q={q} />)}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                {getVisiblePages(currentPage, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`gap-${i}`} className="px-2 text-zinc-600 text-xs">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-9 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        currentPage === p
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
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
