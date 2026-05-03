"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  RotateCcw,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionStatus = "good" | "needs_work" | "missing";

interface AnalysisResult {
  score: number;
  summary: string;
  missingKeywords: string[];
  sectionScores: {
    contactInfo: SectionStatus;
    summary: SectionStatus;
    experience: SectionStatus;
    skills: SectionStatus;
    projects: SectionStatus;
    education: SectionStatus;
  };
  improvements: string[];
  improvedSummary: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  "AI Engineer",
  "Machine Learning Engineer",
  "Data Scientist",
  "Data Analyst",
  "NLP Engineer",
  "MLOps Engineer",
  "AI Research Scientist",
  "Software Engineer (AI Focus)",
];

const MAX_BYTES = 5 * 1024 * 1024;
const DAILY_LIMIT = 3;
const LS_KEY = "amanai_resume_usage";

const SECTION_LABELS: Record<keyof AnalysisResult["sectionScores"], string> = {
  contactInfo: "Contact Info",
  summary: "Summary / Objective",
  experience: "Work Experience",
  skills: "Skills",
  projects: "Projects",
  education: "Education",
};

// ─── Rate-limit helpers ───────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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

function incrementUsage(): number {
  const count = getUsage() + 1;
  localStorage.setItem(LS_KEY, JSON.stringify({ date: todayKey(), count }));
  return count;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function statusMeta(status: SectionStatus) {
  if (status === "good") {
    return {
      Icon: CheckCircle2,
      label: "Good",
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/30",
    };
  }
  if (status === "needs_work") {
    return {
      Icon: AlertCircle,
      label: "Needs work",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/30",
    };
  }
  return {
    Icon: XCircle,
    label: "Missing",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
  };
}

// ─── Score Circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative w-44 h-44">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="rgb(39 39 42)"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-extrabold tabular-nums ${scoreLabel(score)}`}>
          {score}
        </span>
        <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase mt-1">
          / 100
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [role, setRole] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [usedToday, setUsedToday] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasPastedText = pastedText.trim().length > 0;
  const canAnalyze = (!!file || hasPastedText) && !!role;

  useEffect(() => {
    setUsedToday(getUsage());
  }, []);

  const limitReached = usedToday >= DAILY_LIMIT;

  const remaining = useMemo(() => Math.max(0, DAILY_LIMIT - usedToday), [usedToday]);

  function handleFile(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File too large. Max 5MB.");
      return;
    }
    setError("");
    setFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function analyze() {
    if (!canAnalyze || analyzing || limitReached) return;
    setError("");
    setAnalyzing(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("role", role);
      if (hasPastedText) {
        fd.append("text", pastedText.trim());
      } else if (file) {
        fd.append("file", file);
      }

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to analyze resume.");

      const newCount = incrementUsage();
      setUsedToday(newCount);
      setResult(data as AnalysisResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setResult(null);
    setFile(null);
    setPastedText("");
    setRole("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function copyImproved() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.improvedSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  // ── Limit reached ──
  if (limitReached && !result) {
    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 mx-auto">
            <FileText className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">You&apos;ve used your 3 free analyses today</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Want a complete resume rewrite? Our team can help you build an ATS-optimized,
            recruiter-ready resume tailored to AI/ML roles.
          </p>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            View Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Resume Tools
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            AI Resume Analyzer
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Upload your resume and get instant AI-powered feedback. Free. No login needed.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* ── Step 1: Upload ── */}
        {!result && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                Step 1
              </p>
              <h2 className="text-xl font-bold text-zinc-100">Upload your resume</h2>
              <p className="text-zinc-500 text-sm mt-1">
                {remaining} of {DAILY_LIMIT} free analyses remaining today
              </p>
            </div>

            {/* Drop zone */}
            <label
              htmlFor="resume-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                dragActive
                  ? "border-orange-500 bg-orange-500/5"
                  : file
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-zinc-700 bg-zinc-950/40 hover:border-zinc-600"
              }`}
            >
              <input
                id="resume-file"
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-zinc-100 break-all">{file.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB · click to replace
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-zinc-500" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-zinc-200">
                      Drag and drop your resume here
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      or click to browse · PDF only · max 5MB
                    </p>
                  </div>
                </>
              )}
            </label>

            {/* OR divider + paste textarea */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Or paste your resume text below
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                placeholder="Paste your resume content here..."
                style={{ minHeight: "200px" }}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-y"
              />
              {hasPastedText && (
                <p className="text-xs text-zinc-500">
                  {pastedText.trim().length} characters · pasted text will be used instead of the
                  uploaded PDF.
                </p>
              )}
            </div>

            {/* Role selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Select your target role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors"
              >
                <option value="">Choose a role…</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!canAnalyze || analyzing}
              className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your resume…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Resume
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Step 2: Results ── */}
        {result && (
          <div className="flex flex-col gap-5">
            {/* Score */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <ScoreCircle score={result.score} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  ATS Score
                </p>
                <h2 className={`text-2xl font-bold ${scoreLabel(result.score)}`}>
                  {result.score >= 75
                    ? "Strong resume"
                    : result.score >= 50
                    ? "Decent — room to improve"
                    : "Needs significant work"}
                </h2>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {/* Missing keywords */}
            {result.missingKeywords?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                  Card 3
                </p>
                <h3 className="text-lg font-bold text-zinc-100 mb-1">
                  Missing Keywords for {role}
                </h3>
                <p className="text-zinc-500 text-xs mb-4">
                  Add these to your skills, summary, or experience sections.
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-full border bg-orange-500/15 text-orange-300 border-orange-500/30"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Section analysis */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-zinc-100 mb-4">Section Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(SECTION_LABELS) as Array<keyof typeof SECTION_LABELS>).map(
                  (key) => {
                    const status = result.sectionScores?.[key] ?? "missing";
                    const meta = statusMeta(status);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${meta.bg}`}
                      >
                        <meta.Icon className={`w-5 h-5 shrink-0 ${meta.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-100">
                            {SECTION_LABELS[key]}
                          </p>
                          <p className={`text-xs font-medium ${meta.color}`}>{meta.label}</p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Top improvements */}
            {result.improvements?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-4">Top Improvements</h3>
                <ol className="flex flex-col gap-3">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-zinc-300 text-sm leading-relaxed">{imp}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Improved summary */}
            {result.improvedSummary && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <h3 className="text-lg font-bold text-zinc-100">AI-Optimized Summary</h3>
                  </div>
                  <button
                    onClick={copyImproved}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copied ? (
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
                <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 whitespace-pre-line">
                  {result.improvedSummary}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6 sm:p-8 text-center">
              <h3 className="text-xl font-bold text-zinc-100 mb-2">
                Want a complete resume rewrite?
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto mb-5">
                Get a recruiter-ready, ATS-optimized resume tailored to your target AI/ML role.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                Get Full Resume Rewrite <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <button
              onClick={reset}
              disabled={limitReached}
              className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {limitReached ? "Daily limit reached" : "Analyze another resume"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
