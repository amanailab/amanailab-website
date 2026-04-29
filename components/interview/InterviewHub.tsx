"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { ChevronDown, ChevronUp, BrainCircuit, Clock } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Question {
  id: number;
  topic: string;
  level: string;
  question: string;
  answer: string;
}

const TOPICS = ["All", "LLM", "RAG", "Agents", "Fine-Tuning", "MLOps", "Transformers", "System Design", "Python", "Vector DB"];
const LEVELS = ["All", "Fresher", "Mid", "Senior"];

const topicColors: Record<string, string> = {
  llm:            "bg-blue-500/20 text-blue-300 border-blue-500/30",
  rag:            "bg-violet-500/20 text-violet-300 border-violet-500/30",
  agents:         "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "fine-tuning":  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  mlops:          "bg-green-500/20 text-green-300 border-green-500/30",
  transformers:   "bg-teal-500/20 text-teal-300 border-teal-500/30",
  "system design":"bg-red-500/20 text-red-300 border-red-500/30",
  "system-design":"bg-red-500/20 text-red-300 border-red-500/30",
  python:         "bg-lime-500/20 text-lime-300 border-lime-500/30",
  "vector db":    "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "vector-db":    "bg-pink-500/20 text-pink-300 border-pink-500/30",
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

function QuestionCard({ q }: { q: Question }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-200">
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getTopicColor(q.topic)}`}>
          {q.topic}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getLevelColor(q.level)}`}>
          {q.level}
        </span>
      </div>

      <p className="text-zinc-100 font-medium text-sm leading-relaxed flex-1 mb-5">
        {q.question}
      </p>

      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center gap-2 w-full text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${
          open
            ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            : "bg-orange-500 border-transparent text-white hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/20"
        }`}
      >
        {open ? (
          <><ChevronUp className="w-4 h-4" /> Hide Answer</>
        ) : (
          <><ChevronDown className="w-4 h-4" /> Show Answer</>
        )}
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
            {q.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function InterviewHub() {
  const [activeTab, setActiveTab] = useState<"bank" | "simulator">("bank");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      const topicMatch =
        topicFilter === "All" ||
        q.topic.toLowerCase() === topicFilter.toLowerCase();
      const levelMatch =
        levelFilter === "All" ||
        q.level.toLowerCase() === levelFilter.toLowerCase();
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
        <div className="flex items-center gap-2 mb-8 border-b border-zinc-800 pb-0">
          <button
            onClick={() => setActiveTab("bank")}
            className={`relative px-5 py-3 text-sm font-semibold transition-colors rounded-t-lg ${
              activeTab === "bank"
                ? "text-orange-400 border-b-2 border-orange-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Question Bank
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-zinc-500 cursor-not-allowed"
            disabled
          >
            AI Simulator
            <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> Coming Soon
            </span>
          </button>
        </div>

        {activeTab === "bank" && (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Topic filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide w-16 shrink-0">Topic</span>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
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

              {/* Level filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide w-16 shrink-0">Level</span>
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((l) => (
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

            {/* Stats bar */}
            <div className="mb-6">
              {!loading && !error && (
                <p className="text-zinc-500 text-sm">
                  Showing{" "}
                  <span className="text-zinc-300 font-semibold">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "question" : "questions"}
                </p>
              )}
            </div>

            {/* States */}
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
                {filtered.map((q) => (
                  <QuestionCard key={q.id} q={q} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
