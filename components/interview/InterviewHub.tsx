"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ChevronDown, ChevronUp, BrainCircuit,
  CheckCircle2, XCircle, SkipForward, RotateCcw, ArrowRight,
} from "lucide-react";

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

const TOPICS_BANK = ["All", "LLM", "RAG", "Agents", "Fine-Tuning", "MLOps", "Transformers", "System Design", "Python", "Vector DB"];
const TOPICS_SIM  = ["LLM", "RAG", "Agents", "Fine-Tuning", "MLOps", "Transformers", "System Design", "Python", "Vector DB"];
const LEVELS_BANK = ["All", "Fresher", "Mid", "Senior"];
const LEVELS_SIM  = ["Fresher", "Mid", "Senior"];

const DAILY_LIMIT = 5;
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
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
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

function QuestionCard({ q }: { q: Question }) {
  const [open, setOpen] = useState(false);
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

// ─── AI Simulator ─────────────────────────────────────────────────────────────

function AISimulator() {
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
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function InterviewHub() {
  const [activeTab, setActiveTab]     = useState<"bank" | "simulator">("bank");
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [topicFilter, setTopicFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const { data, error } = await supabase
        .from("interview_questions")
        .select("id, topic, level, question, answer");
      if (error) {
        setError("Failed to load questions. Please try again later.");
      } else {
        setQuestions(data ?? []);
      }
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const topicMatch = topicFilter === "All" || q.topic.toLowerCase() === topicFilter.toLowerCase();
      const levelMatch = levelFilter === "All" || q.level.toLowerCase() === levelFilter.toLowerCase();
      return topicMatch && levelMatch;
    });
  }, [questions, topicFilter, levelFilter]);

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <BrainCircuit className="w-3.5 h-3.5" />
            Interview Prep
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            AI Interview Prep Hub
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Practice real AI/ML interview questions. Free. No login needed.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("bank")}
            className={`px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === "bank"
                ? "text-orange-400 border-b-2 border-orange-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Question Bank
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === "simulator"
                ? "text-orange-400 border-b-2 border-orange-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            AI Simulator
          </button>
        </div>

        {/* Question Bank tab */}
        {activeTab === "bank" && (
          <>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide w-16 shrink-0">Topic</span>
                <div className="flex flex-wrap gap-2">
                  {TOPICS_BANK.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopicFilter(t)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        topicFilter === t
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
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

            <div className="mb-6">
              {!loading && !error && (
                <p className="text-zinc-500 text-sm">
                  Showing <span className="text-zinc-300 font-semibold">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "question" : "questions"}
                </p>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-24">
                <span className="w-8 h-8 border-2 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
              </div>
            )}
            {!loading && error && (
              <div className="text-center py-24 text-red-400 text-sm">{error}</div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-24">
                <BrainCircuit className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 text-sm">No questions match the selected filters.</p>
                <button
                  onClick={() => { setTopicFilter("All"); setLevelFilter("All"); }}
                  className="mt-4 text-orange-400 text-sm hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filtered.map((q) => <QuestionCard key={q.id} q={q} />)}
              </div>
            )}
          </>
        )}

        {/* AI Simulator tab */}
        {activeTab === "simulator" && <AISimulator />}
      </div>
    </section>
  );
}
