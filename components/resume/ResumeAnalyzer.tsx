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
  Target,
  MessageCircle,
  ListChecks,
  Mail,
  RefreshCw,
  FilePlus,
  Plus,
  Trash2,
  Mic2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { LinkedinIcon } from "@/components/icons/SocialIcons";

type IconComponent = React.ComponentType<{ className?: string }>;

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "analyze" | "match" | "cover" | "build" | "linkedin" | "predict";

interface FeatureMeta {
  id: Mode;
  title: string;
  description: string;
  Icon: IconComponent;
}

interface LinkedInState {
  currentRole: string;
  experience: string;
  skills: string;
  achievement: string;
  targetRole: string;
  tone: string;
}

interface PredictState {
  jobDescription: string;
  companyName: string;
}

interface PredictResult {
  technicalQuestions: string[];
  behavioralQuestions: string[];
  roleSpecificQuestions: string[];
  trickyQuestions: string[];
  questionsToAsk: string[];
  preparationTips: string[];
}

interface BuilderExperience {
  company: string;
  role: string;
  duration: string;
  responsibilities: string;
}

interface BuilderProject {
  name: string;
  description: string;
}

interface BuilderResumeExperience {
  company: string;
  role: string;
  duration: string;
  bullets: string[];
}

interface BuilderResume {
  summary: string;
  experiences: BuilderResumeExperience[];
  skillsFormatted: string;
  toolsFormatted: string;
}

interface BuilderState {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  targetRole: string;
  currentRole: string;
  yearsExperience: string;
  topSkills: string;
  oneLiner: string;
  experiences: BuilderExperience[];
  technicalSkills: string;
  tools: string;
  degree: string;
  college: string;
  graduationYear: string;
  projects: BuilderProject[];
}

const YEARS_OPTIONS = ["0-1", "1-3", "3-5", "5-10", "10+"];
const MAX_EXPERIENCES = 3;
const MAX_PROJECTS = 2;

const FEATURES: FeatureMeta[] = [
  {
    id: "analyze",
    title: "Resume Analyzer",
    description: "ATS score, missing keywords, section feedback",
    Icon: Sparkles,
  },
  {
    id: "match",
    title: "JD Matcher",
    description: "Score your resume against any job description",
    Icon: Target,
  },
  {
    id: "cover",
    title: "Cover Letter",
    description: "Personalised, ATS-optimised in seconds",
    Icon: Mail,
  },
  {
    id: "build",
    title: "Resume Builder",
    description: "Build a recruiter-ready resume from scratch",
    Icon: FilePlus,
  },
  {
    id: "linkedin",
    title: "LinkedIn Summary",
    description: "Compelling About section that ranks in search",
    Icon: LinkedinIcon,
  },
  {
    id: "predict",
    title: "Interview Predictor",
    description: "Predict the questions you will be asked",
    Icon: Mic2,
  },
];

const EMPTY_EXPERIENCE: BuilderExperience = {
  company: "",
  role: "",
  duration: "",
  responsibilities: "",
};
const EMPTY_PROJECT: BuilderProject = { name: "", description: "" };

const INITIAL_BUILDER: BuilderState = {
  fullName: "",
  email: "",
  phone: "",
  linkedin: "",
  location: "",
  targetRole: "",
  currentRole: "",
  yearsExperience: "",
  topSkills: "",
  oneLiner: "",
  experiences: [{ ...EMPTY_EXPERIENCE }],
  technicalSkills: "",
  tools: "",
  degree: "",
  college: "",
  graduationYear: "",
  projects: [],
};

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

type Verdict = "strong_match" | "good_match" | "weak_match" | "poor_match";

interface MatchResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  topSuggestions: string[];
  verdict: Verdict;
  verdictReason: string;
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
const DAILY_LIMIT = 5;
const LS_USES_KEY = "resume_tool_uses";
const LS_DATE_KEY = "resume_tool_date";
const WHATSAPP_NUMBER = "919997600372";

const LINKEDIN_YEARS = ["1-2", "3-5", "5-10", "10+"];
const LINKEDIN_TONES = ["Professional", "Conversational", "Bold"];

const INITIAL_LINKEDIN: LinkedInState = {
  currentRole: "",
  experience: "",
  skills: "",
  achievement: "",
  targetRole: "",
  tone: "",
};

const INITIAL_PREDICT: PredictState = {
  jobDescription: "",
  companyName: "",
};

const SECTION_LABELS: Record<keyof AnalysisResult["sectionScores"], string> = {
  contactInfo: "Contact Info",
  summary: "Summary / Objective",
  experience: "Work Experience",
  skills: "Skills",
  projects: "Projects",
  education: "Education",
};

const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string }> = {
  strong_match: {
    label: "Strong Match",
    color: "text-green-300",
    bg: "bg-green-500/15 border-green-500/40",
  },
  good_match: {
    label: "Good Match",
    color: "text-yellow-300",
    bg: "bg-yellow-500/15 border-yellow-500/40",
  },
  weak_match: {
    label: "Weak Match",
    color: "text-orange-300",
    bg: "bg-orange-500/15 border-orange-500/40",
  },
  poor_match: {
    label: "Poor Match",
    color: "text-red-300",
    bg: "bg-red-500/15 border-red-500/40",
  },
};

// ─── Rate-limit helpers ───────────────────────────────────────────────────────

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

function buildWhatsappLink(score: number) {
  const message = `Hi Aman, I want my resume rewritten for a specific job. My JD match is ${score}%`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildCoverLetterWhatsappLink() {
  const message = "Hi Aman, I need my cover letter reviewed professionally";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildResumeReviewWhatsappLink() {
  const message =
    "Hi Aman, I generated my resume using AmanAI Lab and want expert review";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildLinkedInWhatsappLink() {
  const message = "Hi Aman, I want my complete LinkedIn profile optimized";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildMockInterviewWhatsappLink() {
  const message = "Hi Aman, I want a mock interview session";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildUnlimitedAccessWhatsappLink() {
  const message = "Hi Aman, I want unlimited access to the resume tools";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
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

// ─── Builder Form ─────────────────────────────────────────────────────────────

interface BuilderFormProps {
  builder: BuilderState;
  errors: Record<string, string>;
  updateBuilder: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void;
  updateExperience: (index: number, field: keyof BuilderExperience, value: string) => void;
  addExperience: () => void;
  removeExperience: (index: number) => void;
  updateProject: (index: number, field: keyof BuilderProject, value: string) => void;
  addProject: () => void;
  removeProject: (index: number) => void;
  onSubmit: () => void;
  working: boolean;
  error: string;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-400 mt-1">{message}</p>;
}

function inputClass(hasError: boolean) {
  return `w-full bg-zinc-800 border ${
    hasError ? "border-red-500/60" : "border-zinc-700"
  } focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors`;
}

function BuilderForm(props: BuilderFormProps) {
  const {
    builder,
    errors,
    updateBuilder,
    updateExperience,
    addExperience,
    removeExperience,
    updateProject,
    addProject,
    removeProject,
    onSubmit,
    working,
    error,
  } = props;

  const sectionHeader = (n: number, title: string) => (
    <div>
      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">
        Section {n}
      </p>
      <h3 className="text-base font-bold text-zinc-100">{title}</h3>
    </div>
  );

  const labelClass = "text-xs font-semibold text-zinc-400 uppercase tracking-wide";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
          Resume Builder
        </p>
        <h2 className="text-xl font-bold text-zinc-100">Build a recruiter-ready resume</h2>
        <p className="text-zinc-500 text-sm mt-1">
          Fill in the sections below — required fields are marked with *
        </p>
      </div>

      {/* Section 1 — Personal Info */}
      <div className="flex flex-col gap-4">
        {sectionHeader(1, "Personal Info")}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Full Name *</label>
            <input
              type="text"
              value={builder.fullName}
              onChange={(e) => updateBuilder("fullName", e.target.value)}
              placeholder="Aman Chauhan"
              className={inputClass(!!errors.fullName)}
            />
            <FieldError message={errors.fullName} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={builder.email}
              onChange={(e) => updateBuilder("email", e.target.value)}
              placeholder="you@example.com"
              className={inputClass(!!errors.email)}
            />
            <FieldError message={errors.email} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={builder.phone}
              onChange={(e) => updateBuilder("phone", e.target.value)}
              placeholder="+91 99999 99999"
              className={inputClass(false)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>LinkedIn URL</label>
            <input
              type="url"
              value={builder.linkedin}
              onChange={(e) => updateBuilder("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
              className={inputClass(false)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={builder.location}
              onChange={(e) => updateBuilder("location", e.target.value)}
              placeholder="Bengaluru, India"
              className={inputClass(false)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Target Role *</label>
            <select
              value={builder.targetRole}
              onChange={(e) => updateBuilder("targetRole", e.target.value)}
              className={inputClass(!!errors.targetRole)}
            >
              <option value="">Choose a role…</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <FieldError message={errors.targetRole} />
          </div>
        </div>
      </div>

      {/* Section 2 — Professional Summary */}
      <div className="flex flex-col gap-4">
        {sectionHeader(2, "Professional Summary")}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Current Role *</label>
            <input
              type="text"
              value={builder.currentRole}
              onChange={(e) => updateBuilder("currentRole", e.target.value)}
              placeholder="Data Engineer at TCS"
              className={inputClass(!!errors.currentRole)}
            />
            <FieldError message={errors.currentRole} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Years of Experience *</label>
            <select
              value={builder.yearsExperience}
              onChange={(e) => updateBuilder("yearsExperience", e.target.value)}
              className={inputClass(!!errors.yearsExperience)}
            >
              <option value="">Select…</option>
              {YEARS_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <FieldError message={errors.yearsExperience} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Top 3 Skills *</label>
          <input
            type="text"
            value={builder.topSkills}
            onChange={(e) => updateBuilder("topSkills", e.target.value)}
            placeholder="Python, Machine Learning, RAG"
            className={inputClass(!!errors.topSkills)}
          />
          <FieldError message={errors.topSkills} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>One line about yourself</label>
          <textarea
            value={builder.oneLiner}
            onChange={(e) => updateBuilder("oneLiner", e.target.value)}
            placeholder="Passionate about building production AI systems"
            rows={2}
            className={`${inputClass(false)} resize-y`}
          />
        </div>
      </div>

      {/* Section 3 — Work Experience */}
      <div className="flex flex-col gap-4">
        {sectionHeader(3, "Work Experience")}
        {builder.experiences.map((exp, i) => {
          const expError = errors[`experience_${i}`];
          return (
            <div
              key={i}
              className={`flex flex-col gap-3 p-4 rounded-xl border ${
                expError ? "border-red-500/40 bg-red-500/5" : "border-zinc-800 bg-zinc-950/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                  Experience {i + 1}
                  {i === 0 ? " *" : ""}
                </p>
                {builder.experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(i)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(i, "company", e.target.value)}
                  placeholder="Company"
                  className={inputClass(false)}
                />
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => updateExperience(i, "role", e.target.value)}
                  placeholder="Role / Title"
                  className={inputClass(false)}
                />
              </div>
              <input
                type="text"
                value={exp.duration}
                onChange={(e) => updateExperience(i, "duration", e.target.value)}
                placeholder="Duration (e.g. 2023-Present)"
                className={inputClass(false)}
              />
              <textarea
                value={exp.responsibilities}
                onChange={(e) => updateExperience(i, "responsibilities", e.target.value)}
                placeholder="Describe what you did..."
                rows={3}
                className={`${inputClass(false)} resize-y`}
              />
              <FieldError message={expError} />
            </div>
          );
        })}
        {builder.experiences.length < MAX_EXPERIENCES && (
          <button
            type="button"
            onClick={addExperience}
            className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add More Experience
          </button>
        )}
      </div>

      {/* Section 4 — Skills */}
      <div className="flex flex-col gap-4">
        {sectionHeader(4, "Skills")}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Technical Skills *</label>
          <textarea
            value={builder.technicalSkills}
            onChange={(e) => updateBuilder("technicalSkills", e.target.value)}
            placeholder="Python, SQL, TensorFlow..."
            rows={3}
            className={`${inputClass(!!errors.technicalSkills)} resize-y`}
          />
          <FieldError message={errors.technicalSkills} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Tools & Frameworks</label>
          <textarea
            value={builder.tools}
            onChange={(e) => updateBuilder("tools", e.target.value)}
            placeholder="LangChain, FastAPI, AWS..."
            rows={3}
            className={`${inputClass(false)} resize-y`}
          />
        </div>
      </div>

      {/* Section 5 — Education */}
      <div className="flex flex-col gap-4">
        {sectionHeader(5, "Education")}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Degree *</label>
            <input
              type="text"
              value={builder.degree}
              onChange={(e) => updateBuilder("degree", e.target.value)}
              placeholder="B.Tech in Computer Science"
              className={inputClass(!!errors.degree)}
            />
            <FieldError message={errors.degree} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>College / University *</label>
            <input
              type="text"
              value={builder.college}
              onChange={(e) => updateBuilder("college", e.target.value)}
              placeholder="IIT Delhi"
              className={inputClass(!!errors.college)}
            />
            <FieldError message={errors.college} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Year of Graduation *</label>
          <input
            type="text"
            value={builder.graduationYear}
            onChange={(e) => updateBuilder("graduationYear", e.target.value)}
            placeholder="2024"
            className={inputClass(!!errors.graduationYear)}
          />
          <FieldError message={errors.graduationYear} />
        </div>
      </div>

      {/* Section 6 — Projects (optional) */}
      <div className="flex flex-col gap-4">
        {sectionHeader(6, "Projects (Optional)")}
        {builder.projects.length === 0 && (
          <p className="text-xs text-zinc-500">
            Add up to {MAX_PROJECTS} side projects to strengthen your resume.
          </p>
        )}
        {builder.projects.map((p, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/40"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                Project {i + 1}
              </p>
              <button
                type="button"
                onClick={() => removeProject(i)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
            <input
              type="text"
              value={p.name}
              onChange={(e) => updateProject(i, "name", e.target.value)}
              placeholder="Project Name"
              className={inputClass(false)}
            />
            <textarea
              value={p.description}
              onChange={(e) => updateProject(i, "description", e.target.value)}
              placeholder="What you built and impact"
              rows={3}
              className={`${inputClass(false)} resize-y`}
            />
          </div>
        ))}
        {builder.projects.length < MAX_PROJECTS && (
          <button
            type="button"
            onClick={addProject}
            className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add More Project
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={working}
        className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-base font-semibold px-4 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
      >
        {working ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating your resume…
          </>
        ) : (
          <>
            <FilePlus className="w-5 h-5" />
            Generate My Resume
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResumeAnalyzer() {
  const [mode, setMode] = useState<Mode>("analyze");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [userName, setUserName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [working, setWorking] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");
  const [usedToday, setUsedToday] = useState(0);
  const [copied, setCopied] = useState(false);
  const [coverCopied, setCoverCopied] = useState(false);
  const [linkedInCopied, setLinkedInCopied] = useState(false);
  const [builder, setBuilder] = useState<BuilderState>(INITIAL_BUILDER);
  const [builderResume, setBuilderResume] = useState<BuilderResume | null>(null);
  const [builderErrors, setBuilderErrors] = useState<Record<string, string>>({});
  const [pdfWorking, setPdfWorking] = useState(false);
  const [linkedIn, setLinkedIn] = useState<LinkedInState>(INITIAL_LINKEDIN);
  const [linkedInErrors, setLinkedInErrors] = useState<Record<string, string>>({});
  const [linkedInResult, setLinkedInResult] = useState("");
  const [predict, setPredict] = useState<PredictState>(INITIAL_PREDICT);
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null);
  const [expandedTechIdx, setExpandedTechIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasPastedText = pastedText.trim().length > 0;
  const hasResume = !!file || hasPastedText;
  const canAnalyze = hasResume && !!role;
  const canMatch = hasResume && jobDescription.trim().length >= 50;
  const canCover =
    hasResume &&
    jobDescription.trim().length >= 50 &&
    companyName.trim().length > 0 &&
    userName.trim().length > 0;

  useEffect(() => {
    setUsedToday(getUsage());
  }, []);

  const limitReached = usedToday >= DAILY_LIMIT;
  const remaining = useMemo(() => Math.max(0, DAILY_LIMIT - usedToday), [usedToday]);
  const usagePct = useMemo(
    () => Math.min(100, Math.round((usedToday / DAILY_LIMIT) * 100)),
    [usedToday]
  );
  const hasResult =
    (mode === "analyze" && !!analysis) ||
    (mode === "match" && !!match) ||
    (mode === "cover" && !!coverLetter) ||
    (mode === "build" && !!builderResume) ||
    (mode === "linkedin" && !!linkedInResult) ||
    (mode === "predict" && !!predictResult);

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

  function switchMode(next: Mode) {
    if (next === mode || working) return;
    setMode(next);
    setError("");
    setAnalysis(null);
    setMatch(null);
    setCoverLetter("");
    setBuilderResume(null);
    setBuilderErrors({});
    setLinkedInResult("");
    setLinkedInErrors({});
    setPredictResult(null);
    setExpandedTechIdx(null);
  }

  function appendResumeFields(fd: FormData) {
    if (hasPastedText) {
      fd.append("text", pastedText.trim());
    } else if (file) {
      fd.append("file", file);
    }
  }

  async function runAnalyze() {
    if (!canAnalyze || working || limitReached) return;
    setError("");
    setWorking(true);
    setAnalysis(null);
    try {
      const fd = new FormData();
      fd.append("role", role);
      appendResumeFields(fd);

      const res = await fetch("/api/resume/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to analyze resume.");

      const newCount = incrementUsage();
      setUsedToday(newCount);
      setAnalysis(data as AnalysisResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  async function runMatch() {
    if (!canMatch || working || limitReached) return;
    setError("");
    setWorking(true);
    setMatch(null);
    try {
      const fd = new FormData();
      fd.append("jobDescription", jobDescription.trim());
      appendResumeFields(fd);

      const res = await fetch("/api/resume/match", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to match resume.");

      const newCount = incrementUsage();
      setUsedToday(newCount);
      setMatch(data as MatchResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  async function runCover({ regenerate = false }: { regenerate?: boolean } = {}) {
    if (!canCover || working) return;
    if (!regenerate && limitReached) return;
    setError("");
    setWorking(true);
    if (!regenerate) setCoverLetter("");
    try {
      const fd = new FormData();
      fd.append("jobDescription", jobDescription.trim());
      fd.append("companyName", companyName.trim());
      fd.append("userName", userName.trim());
      appendResumeFields(fd);

      const res = await fetch("/api/resume/coverletter", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate cover letter.");

      const newCount = incrementUsage();
      setUsedToday(newCount);
      setCoverLetter(typeof data.coverLetter === "string" ? data.coverLetter : "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    setAnalysis(null);
    setMatch(null);
    setCoverLetter("");
    setBuilderResume(null);
    setBuilderErrors({});
    setBuilder(INITIAL_BUILDER);
    setLinkedIn(INITIAL_LINKEDIN);
    setLinkedInErrors({});
    setLinkedInResult("");
    setPredict(INITIAL_PREDICT);
    setPredictResult(null);
    setExpandedTechIdx(null);
    setFile(null);
    setPastedText("");
    setRole("");
    setJobDescription("");
    setCompanyName("");
    setUserName("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function copyImproved() {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis.improvedSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function copyCover() {
    if (!coverLetter) return;
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCoverCopied(true);
      setTimeout(() => setCoverCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function downloadResumePDF() {
    if (!builderResume || pdfWorking) return;
    setPdfWorking(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // NAME — large, centered, black
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      const nameText = (builder.fullName || "").toUpperCase();
      doc.text(nameText, pageWidth / 2, y, { align: "center" });
      y += 8;

      // Target role — centered, gray
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      if (builder.targetRole) {
        doc.text(builder.targetRole, pageWidth / 2, y, { align: "center" });
        y += 6;
      }

      // Contact — centered, small
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const contact = [builder.email, builder.phone, builder.location, builder.linkedin]
        .filter(Boolean)
        .join("  |  ");
      if (contact) {
        const contactLines = doc.splitTextToSize(contact, contentWidth);
        doc.text(contactLines, pageWidth / 2, y, { align: "center" });
        y += contactLines.length * 5;
      }
      y += 4;

      // Orange divider
      doc.setDrawColor(255, 107, 53);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      const sectionHeader = (label: string) => {
        ensureSpace(14);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 107, 53);
        doc.text(label, margin, y);
        y += 6;
      };

      const grayDivider = () => {
        ensureSpace(8);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      };

      // PROFESSIONAL SUMMARY
      sectionHeader("PROFESSIONAL SUMMARY");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const summaryLines = doc.splitTextToSize(builderResume.summary || "", contentWidth);
      ensureSpace(summaryLines.length * 5);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 5 + 6;

      grayDivider();

      // WORK EXPERIENCE
      sectionHeader("WORK EXPERIENCE");
      const experiences = builderResume.experiences ?? [];
      experiences.forEach((exp) => {
        ensureSpace(10);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        const heading = `${exp.role || ""}${exp.role && exp.company ? " | " : ""}${exp.company || ""}`;
        doc.text(heading, margin, y);

        if (exp.duration) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(100, 100, 100);
          doc.text(exp.duration, pageWidth - margin, y, { align: "right" });
        }
        y += 5;

        (exp.bullets ?? []).forEach((bullet) => {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          const bulletLines = doc.splitTextToSize(`• ${bullet}`, contentWidth - 5);
          ensureSpace(bulletLines.length * 4 + 2);
          doc.text(bulletLines, margin + 3, y);
          y += bulletLines.length * 4 + 2;
        });
        y += 3;
      });

      grayDivider();

      // TECHNICAL SKILLS
      sectionHeader("TECHNICAL SKILLS");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const skillsBlock = [
        `Technical: ${builderResume.skillsFormatted || builder.technicalSkills}`,
        builder.tools || builderResume.toolsFormatted
          ? `Tools: ${builderResume.toolsFormatted || builder.tools}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      const skillLines = doc.splitTextToSize(skillsBlock, contentWidth);
      ensureSpace(skillLines.length * 5);
      doc.text(skillLines, margin, y);
      y += skillLines.length * 5 + 6;

      grayDivider();

      // EDUCATION
      sectionHeader("EDUCATION");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      ensureSpace(10);
      doc.text(builder.degree || "", margin, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const eduLine = [builder.college, builder.graduationYear].filter(Boolean).join(" | ");
      if (eduLine) {
        doc.text(eduLine, margin, y);
        y += 5;
      }
      y += 3;

      // PROJECTS
      const projects = (builder.projects || []).filter(
        (p) => p.name.trim() || p.description.trim()
      );
      if (projects.length > 0) {
        grayDivider();
        sectionHeader("PROJECTS");
        projects.forEach((project) => {
          if (project.name) {
            ensureSpace(10);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(project.name, margin, y);
            y += 5;
          }
          if (project.description) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            const projLines = doc.splitTextToSize(`• ${project.description}`, contentWidth - 5);
            ensureSpace(projLines.length * 4 + 2);
            doc.text(projLines, margin + 3, y);
            y += projLines.length * 4 + 4;
          }
        });
      }

      const safeName = (builder.fullName || "Resume").replace(/[^a-z0-9]+/gi, "_");
      doc.save(`${safeName}_Resume_AmanAI_Lab.pdf`);
    } catch (err) {
      console.error("[Resume PDF] Error:", err);
      setError("Could not generate PDF. Please try again.");
    } finally {
      setPdfWorking(false);
    }
  }

  function updateBuilder<K extends keyof BuilderState>(key: K, value: BuilderState[K]) {
    setBuilder((b) => ({ ...b, [key]: value }));
    if (builderErrors[key as string]) {
      setBuilderErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  }

  function updateExperience(index: number, field: keyof BuilderExperience, value: string) {
    setBuilder((b) => {
      const next = [...b.experiences];
      next[index] = { ...next[index], [field]: value };
      return { ...b, experiences: next };
    });
    const errKey = `experience_${index}`;
    if (builderErrors[errKey]) {
      setBuilderErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  }

  function addExperience() {
    setBuilder((b) =>
      b.experiences.length >= MAX_EXPERIENCES
        ? b
        : { ...b, experiences: [...b.experiences, { ...EMPTY_EXPERIENCE }] }
    );
  }

  function removeExperience(index: number) {
    setBuilder((b) => {
      if (b.experiences.length <= 1) return b;
      const next = b.experiences.filter((_, i) => i !== index);
      return { ...b, experiences: next };
    });
  }

  function updateProject(index: number, field: keyof BuilderProject, value: string) {
    setBuilder((b) => {
      const next = [...b.projects];
      next[index] = { ...next[index], [field]: value };
      return { ...b, projects: next };
    });
  }

  function addProject() {
    setBuilder((b) =>
      b.projects.length >= MAX_PROJECTS
        ? b
        : { ...b, projects: [...b.projects, { ...EMPTY_PROJECT }] }
    );
  }

  function removeProject(index: number) {
    setBuilder((b) => ({ ...b, projects: b.projects.filter((_, i) => i !== index) }));
  }

  function validateBuilder(): boolean {
    const errs: Record<string, string> = {};
    if (!builder.fullName.trim()) errs.fullName = "Full name is required";
    if (!builder.email.trim()) errs.email = "Email is required";
    if (!builder.targetRole.trim()) errs.targetRole = "Target role is required";
    if (!builder.currentRole.trim()) errs.currentRole = "Current role is required";
    if (!builder.yearsExperience.trim()) errs.yearsExperience = "Select years of experience";
    if (!builder.topSkills.trim()) errs.topSkills = "List your top 3 skills";
    if (!builder.technicalSkills.trim()) errs.technicalSkills = "Technical skills are required";
    if (!builder.degree.trim()) errs.degree = "Degree is required";
    if (!builder.college.trim()) errs.college = "College is required";
    if (!builder.graduationYear.trim()) errs.graduationYear = "Graduation year is required";

    const firstExp = builder.experiences[0];
    if (
      !firstExp ||
      !firstExp.company.trim() ||
      !firstExp.role.trim() ||
      !firstExp.duration.trim() ||
      !firstExp.responsibilities.trim()
    ) {
      errs.experience_0 = "Fill in all fields for your first experience";
    }

    setBuilderErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function runBuild({ regenerate = false }: { regenerate?: boolean } = {}) {
    if (working || limitReached) return;
    if (!validateBuilder()) {
      setError("Please fill in the highlighted required fields.");
      return;
    }
    setError("");
    setWorking(true);
    if (!regenerate) setBuilderResume(null);
    try {
      const res = await fetch("/api/resume/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(builder),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate resume.");

      const newCount = incrementUsage();
      setUsedToday(newCount);
      const r = data.resume;
      if (
        r &&
        typeof r === "object" &&
        typeof r.summary === "string" &&
        Array.isArray(r.experiences)
      ) {
        setBuilderResume({
          summary: r.summary,
          experiences: r.experiences.map((e: BuilderResumeExperience) => ({
            company: typeof e?.company === "string" ? e.company : "",
            role: typeof e?.role === "string" ? e.role : "",
            duration: typeof e?.duration === "string" ? e.duration : "",
            bullets: Array.isArray(e?.bullets)
              ? e.bullets.filter((b: unknown): b is string => typeof b === "string")
              : [],
          })),
          skillsFormatted: typeof r.skillsFormatted === "string" ? r.skillsFormatted : "",
          toolsFormatted: typeof r.toolsFormatted === "string" ? r.toolsFormatted : "",
        });
      } else {
        throw new Error("Unexpected response format from server.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  function validateLinkedIn(): boolean {
    const errs: Record<string, string> = {};
    if (!linkedIn.currentRole.trim()) errs.currentRole = "Current role is required";
    if (!linkedIn.experience.trim()) errs.experience = "Select years of experience";
    if (!linkedIn.skills.trim()) errs.skills = "Top skills are required";
    if (!linkedIn.achievement.trim()) errs.achievement = "Notable achievement is required";
    if (!linkedIn.targetRole.trim()) errs.targetRole = "Target role is required";
    if (!linkedIn.tone.trim()) errs.tone = "Select a tone";
    setLinkedInErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function updateLinkedIn<K extends keyof LinkedInState>(key: K, value: LinkedInState[K]) {
    setLinkedIn((s) => ({ ...s, [key]: value }));
    if (linkedInErrors[key as string]) {
      setLinkedInErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  }

  async function runLinkedIn({ regenerate = false }: { regenerate?: boolean } = {}) {
    if (working || limitReached) return;
    if (!validateLinkedIn()) {
      setError("Please fill in the highlighted required fields.");
      return;
    }
    setError("");
    setWorking(true);
    if (!regenerate) setLinkedInResult("");
    try {
      const res = await fetch("/api/resume/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkedIn),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate LinkedIn summary.");

      const newCount = incrementUsage();
      setUsedToday(newCount);
      setLinkedInResult(typeof data.summary === "string" ? data.summary : "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  async function copyLinkedIn() {
    if (!linkedInResult) return;
    try {
      await navigator.clipboard.writeText(linkedInResult);
      setLinkedInCopied(true);
      setTimeout(() => setLinkedInCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function runPredict() {
    if (working || limitReached) return;
    if (!hasResume) {
      setError("Please upload your resume PDF or paste your resume text.");
      return;
    }
    if (predict.jobDescription.trim().length < 50) {
      setError("Job description must be at least 50 characters.");
      return;
    }
    setError("");
    setWorking(true);
    setPredictResult(null);
    setExpandedTechIdx(null);
    try {
      const fd = new FormData();
      fd.append("jobDescription", predict.jobDescription.trim());
      if (predict.companyName.trim()) fd.append("companyName", predict.companyName.trim());
      appendResumeFields(fd);

      const res = await fetch("/api/resume/predict", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to predict questions.");

      const newCount = incrementUsage();
      setUsedToday(newCount);
      setPredictResult(data as PredictResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  // ── Limit reached — shared across all 6 features ──
  if (limitReached && !hasResult) {
    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 mx-auto">
            <FileText className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Daily limit reached</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Come back tomorrow for {DAILY_LIMIT} more free uses across all six tools.
          </p>
          <a
            href={buildUnlimitedAccessWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            <MessageCircle className="w-4 h-4" />
            Get Unlimited Access
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative pt-20 pb-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            AI Resume Suite
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            AI Resume Suite
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-6">
            6 powerful AI tools to land your dream AI job. Free. No login needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
            {[
              { label: "6 Tools" },
              { label: "100% Free" },
              { label: "No Login" },
            ].map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold"
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Usage progress */}
        {!hasResult && (
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
        )}

        {/* Feature grid */}
        {!hasResult && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {FEATURES.map(({ id, title, description, Icon }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  onClick={() => switchMode(id)}
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
        )}

        {/* ── Resume Builder form ── */}
        {!hasResult && mode === "build" && (
          <BuilderForm
            builder={builder}
            errors={builderErrors}
            updateBuilder={updateBuilder}
            updateExperience={updateExperience}
            addExperience={addExperience}
            removeExperience={removeExperience}
            updateProject={updateProject}
            addProject={addProject}
            removeProject={removeProject}
            onSubmit={() => runBuild()}
            working={working}
            error={error}
          />
        )}

        {/* ── LinkedIn form ── */}
        {!hasResult && mode === "linkedin" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                LinkedIn Summary
              </p>
              <h2 className="text-xl font-bold text-zinc-100">
                Generate a recruiter-ready About section
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Tell us a bit about you — we&apos;ll write the LinkedIn About in your chosen tone.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Current Role *
                </label>
                <input
                  type="text"
                  value={linkedIn.currentRole}
                  onChange={(e) => updateLinkedIn("currentRole", e.target.value)}
                  placeholder="ML Engineer at Acme"
                  className={inputClass(!!linkedInErrors.currentRole)}
                />
                <FieldError message={linkedInErrors.currentRole} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Years of Experience *
                </label>
                <select
                  value={linkedIn.experience}
                  onChange={(e) => updateLinkedIn("experience", e.target.value)}
                  className={inputClass(!!linkedInErrors.experience)}
                >
                  <option value="">Select…</option>
                  {LINKEDIN_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <FieldError message={linkedInErrors.experience} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Top Skills *
              </label>
              <input
                type="text"
                value={linkedIn.skills}
                onChange={(e) => updateLinkedIn("skills", e.target.value)}
                placeholder="Python, LLMs, RAG, FastAPI"
                className={inputClass(!!linkedInErrors.skills)}
              />
              <FieldError message={linkedInErrors.skills} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Notable Achievement *
              </label>
              <textarea
                value={linkedIn.achievement}
                onChange={(e) => updateLinkedIn("achievement", e.target.value)}
                placeholder="Built RAG system for Fortune 500..."
                rows={3}
                className={`${inputClass(!!linkedInErrors.achievement)} resize-y`}
              />
              <FieldError message={linkedInErrors.achievement} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Target Role *
                </label>
                <select
                  value={linkedIn.targetRole}
                  onChange={(e) => updateLinkedIn("targetRole", e.target.value)}
                  className={inputClass(!!linkedInErrors.targetRole)}
                >
                  <option value="">Choose a role…</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <FieldError message={linkedInErrors.targetRole} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Tone *
                </label>
                <select
                  value={linkedIn.tone}
                  onChange={(e) => updateLinkedIn("tone", e.target.value)}
                  className={inputClass(!!linkedInErrors.tone)}
                >
                  <option value="">Pick a tone…</option>
                  {LINKEDIN_TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <FieldError message={linkedInErrors.tone} />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
              </div>
            )}

            <button
              onClick={() => runLinkedIn()}
              disabled={working}
              className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
            >
              {working ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Writing your About section…
                </>
              ) : (
                <>
                  <LinkedinIcon className="w-4 h-4" />
                  Generate LinkedIn Summary
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Step 1: Upload (Analyzer / Matcher / Cover Letter / Predictor) ── */}
        {!hasResult && (mode === "analyze" || mode === "match" || mode === "cover" || mode === "predict") && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                Step 1
              </p>
              <h2 className="text-xl font-bold text-zinc-100">
                {mode === "analyze"
                  ? "Upload your resume"
                  : mode === "match"
                  ? "Match your resume to a JD"
                  : mode === "cover"
                  ? "Generate a cover letter"
                  : "Predict your interview questions"}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Upload your resume PDF or paste the text below.
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

            {/* Mode-specific input */}
            {mode === "analyze" && (
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
            )}

            {mode === "match" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Paste Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    if (e.target.value.trim()) setError("");
                  }}
                  placeholder="Paste the full job description here..."
                  style={{ minHeight: "150px" }}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-y"
                />
                <p className="text-xs text-zinc-500">
                  {jobDescription.trim().length} characters · paste the complete listing for the
                  most accurate match
                </p>
              </div>
            )}

            {mode === "cover" && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    Paste Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      if (e.target.value.trim()) setError("");
                    }}
                    placeholder="Paste the full job description here..."
                    style={{ minHeight: "150px" }}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-y"
                  />
                  <p className="text-xs text-zinc-500">
                    {jobDescription.trim().length} characters · the more detail, the more
                    personalised the letter
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Aman Chauhan"
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === "predict" && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    Paste Job Description
                  </label>
                  <textarea
                    value={predict.jobDescription}
                    onChange={(e) => {
                      setPredict((p) => ({ ...p, jobDescription: e.target.value }));
                      if (e.target.value.trim()) setError("");
                    }}
                    placeholder="Paste the full job description here..."
                    style={{ minHeight: "120px" }}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-y"
                  />
                  <p className="text-xs text-zinc-500">
                    {predict.jobDescription.trim().length} characters · paste the listing to get
                    role-specific predictions
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    Company Name <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={predict.companyName}
                    onChange={(e) =>
                      setPredict((p) => ({ ...p, companyName: e.target.value }))
                    }
                    placeholder="e.g. OpenAI"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
              </div>
            )}

            {mode === "analyze" && (
              <button
                onClick={runAnalyze}
                disabled={!canAnalyze || working}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                {working ? (
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
            )}

            {mode === "match" && (
              <button
                onClick={runMatch}
                disabled={!canMatch || working}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                {working ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Matching to job description…
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Match My Resume
                  </>
                )}
              </button>
            )}

            {mode === "cover" && (
              <button
                onClick={() => runCover()}
                disabled={!canCover || working}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                {working ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating cover letter…
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Generate Cover Letter
                  </>
                )}
              </button>
            )}

            {mode === "predict" && (
              <button
                onClick={runPredict}
                disabled={
                  !hasResume || predict.jobDescription.trim().length < 50 || working
                }
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                {working ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Predicting interview questions…
                  </>
                ) : (
                  <>
                    <Mic2 className="w-4 h-4" />
                    Predict My Interview Questions
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* ── Analyze results ── */}
        {analysis && mode === "analyze" && (
          <div className="flex flex-col gap-5">
            {/* Score */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <ScoreCircle score={analysis.score} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  ATS Score
                </p>
                <h2 className={`text-2xl font-bold ${scoreLabel(analysis.score)}`}>
                  {analysis.score >= 75
                    ? "Strong resume"
                    : analysis.score >= 50
                    ? "Decent — room to improve"
                    : "Needs significant work"}
                </h2>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{analysis.summary}</p>
              </div>
            </div>

            {/* Missing keywords */}
            {analysis.missingKeywords?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-1">
                  Missing Keywords for {role}
                </h3>
                <p className="text-zinc-500 text-xs mb-4">
                  Add these to your skills, summary, or experience sections.
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((kw) => (
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
                    const status = analysis.sectionScores?.[key] ?? "missing";
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
            {analysis.improvements?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-4">Top Improvements</h3>
                <ol className="flex flex-col gap-3">
                  {analysis.improvements.map((imp, i) => (
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
            {analysis.improvedSummary && (
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
                  {analysis.improvedSummary}
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

        {/* ── Match results ── */}
        {match && mode === "match" && (
          <div className="flex flex-col gap-5">
            {/* Score + verdict */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <ScoreCircle score={match.matchScore} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  JD Match Score
                </p>
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-2">
                  <h2 className={`text-2xl font-bold ${scoreLabel(match.matchScore)}`}>
                    {match.matchScore}/100
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      VERDICT_META[match.verdict]?.bg ?? "bg-zinc-800 border-zinc-700"
                    } ${VERDICT_META[match.verdict]?.color ?? "text-zinc-300"}`}
                  >
                    {VERDICT_META[match.verdict]?.label ?? match.verdict}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{match.verdictReason}</p>
              </div>
            </div>

            {/* Matched keywords */}
            {match.matchedKeywords?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Keywords You Have
                </h3>
                <p className="text-zinc-500 text-xs mb-4">
                  Found in both your resume and the job description.
                </p>
                <div className="flex flex-wrap gap-2">
                  {match.matchedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-full border bg-green-500/15 text-green-300 border-green-500/30"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing keywords */}
            {match.missingKeywords?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-1 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  Keywords You Are Missing
                </h3>
                <p className="text-zinc-500 text-xs mb-4">Add these to your resume.</p>
                <div className="flex flex-wrap gap-2">
                  {match.missingKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-full border bg-red-500/15 text-red-300 border-red-500/30"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills gap */}
            {(match.matchedSkills?.length > 0 || match.missingSkills?.length > 0) && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-4">Skills Gap</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-3">
                      Skills You Have
                    </p>
                    {match.matchedSkills?.length > 0 ? (
                      <ul className="flex flex-col gap-2">
                        {match.matchedSkills.map((s) => (
                          <li
                            key={s}
                            className="flex items-start gap-2 text-sm text-zinc-200 bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-zinc-500 text-sm">No matching skills found.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">
                      Skills You Need
                    </p>
                    {match.missingSkills?.length > 0 ? (
                      <ul className="flex flex-col gap-2">
                        {match.missingSkills.map((s) => (
                          <li
                            key={s}
                            className="flex items-start gap-2 text-sm text-zinc-200 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2"
                          >
                            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-zinc-500 text-sm">No skill gaps detected.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Top suggestions */}
            {match.topSuggestions?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-orange-400" />
                  Top 5 Suggestions
                </h3>
                <ol className="flex flex-col gap-3">
                  {match.topSuggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-zinc-300 text-sm leading-relaxed">{s}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* WhatsApp CTA */}
            <div className="bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6 sm:p-8 text-center">
              <h3 className="text-xl font-bold text-zinc-100 mb-2">
                Want us to rewrite your resume for this specific job?
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto mb-5">
                We&apos;ll tailor every section to this exact JD so your match score jumps before
                you apply.
              </p>
              <a
                href={buildWhatsappLink(match.matchScore)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                <MessageCircle className="w-4 h-4" />
                Get Resume Rewrite ₹999
              </a>
            </div>

            <button
              onClick={reset}
              disabled={limitReached}
              className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {limitReached ? "Daily limit reached" : "Try another match"}
            </button>
          </div>
        )}

        {/* ── Cover letter result ── */}
        {coverLetter && mode === "cover" && (
          <div className="flex flex-col gap-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-400" />
                  <h3 className="text-lg font-bold text-zinc-100">
                    Cover Letter for {companyName.trim() || "your application"}
                  </h3>
                </div>
                <button
                  onClick={copyCover}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  {coverCopied ? (
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
              <p className="text-zinc-200 text-sm leading-relaxed bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 whitespace-pre-wrap font-sans">
                {coverLetter}
              </p>
              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                <p className="text-xs text-zinc-500">
                  {coverLetter.length} characters ·{" "}
                  {coverLetter.trim().split(/\s+/).filter(Boolean).length} words
                </p>
                <button
                  onClick={() => runCover({ regenerate: true })}
                  disabled={working || limitReached}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  {working ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </>
                  )}
                </button>
              </div>
            </div>

            {limitReached && (
              <p className="text-center text-zinc-500 text-xs">
                Daily limit reached — regenerate option will be available again tomorrow.
              </p>
            )}

            {/* WhatsApp CTA */}
            <div className="bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6 sm:p-8 text-center">
              <h3 className="text-xl font-bold text-zinc-100 mb-2">
                Want a professionally reviewed cover letter?
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto mb-5">
                We&apos;ll polish tone, structure and impact so it lands the recruiter&apos;s
                attention.
              </p>
              <a
                href={buildCoverLetterWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                <MessageCircle className="w-4 h-4" />
                Get Expert Review ₹499
              </a>
            </div>

            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start over
            </button>
          </div>
        )}

        {/* ── Builder result ── */}
        {builderResume && mode === "build" && (
          <div className="flex flex-col gap-5">
            {/* White preview that mirrors the PDF */}
            <div className="bg-white text-zinc-900 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-black/40 border border-zinc-200">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
                  {builder.fullName || "Your Name"}
                </h2>
                {builder.targetRole && (
                  <p className="text-sm text-zinc-600 mt-1">{builder.targetRole}</p>
                )}
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  {[builder.email, builder.phone, builder.location, builder.linkedin]
                    .filter(Boolean)
                    .join("  |  ")}
                </p>
              </div>

              <div className="my-5 h-0.5 bg-orange-500 rounded" />

              {/* Summary */}
              <h3 className="text-xs font-bold text-orange-600 tracking-[0.2em] uppercase mb-2">
                Professional Summary
              </h3>
              <p className="text-sm leading-relaxed text-zinc-800">{builderResume.summary}</p>

              <div className="my-5 h-px bg-zinc-200" />

              {/* Experience */}
              <h3 className="text-xs font-bold text-orange-600 tracking-[0.2em] uppercase mb-3">
                Work Experience
              </h3>
              <div className="flex flex-col gap-4">
                {builderResume.experiences.map((exp, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <p className="text-sm font-bold text-zinc-900">
                        {exp.role}
                        {exp.role && exp.company ? " | " : ""}
                        {exp.company}
                      </p>
                      {exp.duration && (
                        <p className="text-xs italic text-zinc-500">{exp.duration}</p>
                      )}
                    </div>
                    {exp.bullets?.length > 0 && (
                      <ul className="mt-1.5 ml-4 list-disc text-sm text-zinc-800 space-y-1">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="leading-relaxed">
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="my-5 h-px bg-zinc-200" />

              {/* Skills */}
              <h3 className="text-xs font-bold text-orange-600 tracking-[0.2em] uppercase mb-2">
                Technical Skills
              </h3>
              <p className="text-sm leading-relaxed text-zinc-800">
                <span className="font-semibold">Technical:</span>{" "}
                {builderResume.skillsFormatted || builder.technicalSkills}
              </p>
              {(builderResume.toolsFormatted || builder.tools) && (
                <p className="text-sm leading-relaxed text-zinc-800 mt-1">
                  <span className="font-semibold">Tools:</span>{" "}
                  {builderResume.toolsFormatted || builder.tools}
                </p>
              )}

              <div className="my-5 h-px bg-zinc-200" />

              {/* Education */}
              <h3 className="text-xs font-bold text-orange-600 tracking-[0.2em] uppercase mb-2">
                Education
              </h3>
              <p className="text-sm font-bold text-zinc-900">{builder.degree}</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {[builder.college, builder.graduationYear].filter(Boolean).join(" | ")}
              </p>

              {/* Projects */}
              {builder.projects.filter((p) => p.name.trim() || p.description.trim()).length >
                0 && (
                <>
                  <div className="my-5 h-px bg-zinc-200" />
                  <h3 className="text-xs font-bold text-orange-600 tracking-[0.2em] uppercase mb-2">
                    Projects
                  </h3>
                  <div className="flex flex-col gap-3">
                    {builder.projects
                      .filter((p) => p.name.trim() || p.description.trim())
                      .map((p, i) => (
                        <div key={i}>
                          {p.name && (
                            <p className="text-sm font-bold text-zinc-900">{p.name}</p>
                          )}
                          {p.description && (
                            <ul className="mt-1 ml-4 list-disc text-sm text-zinc-800">
                              <li className="leading-relaxed">{p.description}</li>
                            </ul>
                          )}
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={downloadResumePDF}
                disabled={pdfWorking}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-base font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                {pdfWorking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Building PDF…
                  </>
                ) : (
                  <>
                    <FilePlus className="w-5 h-5" />
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={() => runBuild({ regenerate: true })}
                disabled={working || limitReached}
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-orange-300 text-base font-semibold px-4 py-3.5 rounded-xl transition-colors"
              >
                {working ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Regenerating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Regenerate
                  </>
                )}
              </button>
            </div>

            {limitReached && (
              <p className="text-center text-zinc-500 text-xs">
                Daily limit reached — regenerate available again tomorrow.
              </p>
            )}

            {/* WhatsApp CTA */}
            <div className="bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6 sm:p-8 text-center">
              <h3 className="text-xl font-bold text-zinc-100 mb-2">
                Want a human expert to review and polish this resume?
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto mb-5">
                We&apos;ll refine wording, structure and impact to give you a recruiter-ready,
                ATS-optimised version.
              </p>
              <a
                href={buildResumeReviewWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                <MessageCircle className="w-4 h-4" />
                Get Expert Review ₹999
              </a>
            </div>

            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start over
            </button>
          </div>
        )}

        {/* ── LinkedIn result ── */}
        {linkedInResult && mode === "linkedin" && (
          <div className="flex flex-col gap-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <LinkedinIcon className="w-4 h-4 text-orange-400" />
                  <h3 className="text-lg font-bold text-zinc-100">Your LinkedIn About</h3>
                </div>
                <button
                  onClick={copyLinkedIn}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  {linkedInCopied ? (
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
              <p className="text-zinc-200 text-sm leading-relaxed bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 whitespace-pre-wrap font-sans">
                {linkedInResult}
              </p>
              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                <p
                  className={`text-xs ${
                    linkedInResult.length > 2600 ? "text-red-400" : "text-zinc-500"
                  }`}
                >
                  {linkedInResult.length} / 2600 characters
                </p>
                <button
                  onClick={() => runLinkedIn({ regenerate: true })}
                  disabled={working || limitReached}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  {working ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-300">
                <span className="font-semibold">Pro tip:</span> Add emojis to make it stand out.
              </p>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6 sm:p-8 text-center">
              <h3 className="text-xl font-bold text-zinc-100 mb-2">
                Want complete LinkedIn profile optimization?
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto mb-5">
                We&apos;ll polish your headline, About, experience and skills end-to-end so
                recruiters find you first.
              </p>
              <a
                href={buildLinkedInWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                <MessageCircle className="w-4 h-4" />
                Get LinkedIn Review ₹499
              </a>
            </div>

            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start over
            </button>
          </div>
        )}

        {/* ── Predictor result ── */}
        {predictResult && mode === "predict" && (
          <div className="flex flex-col gap-5">
            {/* Section 1 — Technical */}
            {predictResult.technicalQuestions?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  Technical Questions
                </h3>
                <p className="text-zinc-500 text-xs mb-4">
                  Click a question to see how to approach it.
                </p>
                <ol className="flex flex-col gap-2">
                  {predictResult.technicalQuestions.map((q, i) => {
                    const open = expandedTechIdx === i;
                    return (
                      <li key={i} className="bg-zinc-950/40 border border-orange-500/20 rounded-xl">
                        <button
                          onClick={() => setExpandedTechIdx(open ? null : i)}
                          className="w-full flex items-start gap-3 text-left px-4 py-3"
                        >
                          <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-sm text-zinc-200 leading-relaxed">{q}</span>
                          {open ? (
                            <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0 mt-1" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 mt-1" />
                          )}
                        </button>
                        {open && (
                          <div className="px-4 pb-4 pt-1 ml-9 text-xs text-zinc-400 leading-relaxed">
                            <p className="font-semibold text-zinc-300 mb-1">How to answer this</p>
                            Walk through your reasoning step by step. Reference the specific
                            tools, projects or numbers from your resume. State trade-offs and
                            close with what you would do differently at scale.
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Section 2 — Behavioral */}
            {predictResult.behavioralQuestions?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-1 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                  Behavioral Questions
                </h3>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-blue-200 mb-4">
                  <span className="font-semibold">STAR method:</span> Situation · Task · Action ·
                  Result
                </div>
                <ol className="flex flex-col gap-2">
                  {predictResult.behavioralQuestions.map((q, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 bg-zinc-950/40 border border-blue-500/20 rounded-xl px-4 py-3"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-zinc-200 leading-relaxed">{q}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Section 3 — Role specific */}
            {predictResult.roleSpecificQuestions?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Role-Specific Questions
                </h3>
                <ol className="flex flex-col gap-2">
                  {predictResult.roleSpecificQuestions.map((q, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 bg-zinc-950/40 border border-purple-500/20 rounded-xl px-4 py-3"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-zinc-200 leading-relaxed">{q}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Section 4 — Tricky */}
            {predictResult.trickyQuestions?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Tricky Questions
                </h3>
                <p className="text-zinc-500 text-xs mb-4">Be prepared for these.</p>
                <ol className="flex flex-col gap-2">
                  {predictResult.trickyQuestions.map((q, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 bg-zinc-950/40 border border-red-500/20 rounded-xl px-4 py-3"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-zinc-200 leading-relaxed">{q}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Section 5 — Questions to ask */}
            {predictResult.questionsToAsk?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Questions to Ask Your Interviewer
                </h3>
                <p className="text-zinc-500 text-xs mb-4">Ask these to impress them.</p>
                <ol className="flex flex-col gap-2">
                  {predictResult.questionsToAsk.map((q, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 bg-zinc-950/40 border border-green-500/20 rounded-xl px-4 py-3"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-zinc-200 leading-relaxed">{q}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Section 6 — Preparation tips */}
            {predictResult.preparationTips?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-4">Preparation Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {predictResult.preparationTips.map((t, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 bg-zinc-950/40 border border-zinc-800 rounded-xl p-4"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-orange-400" />
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp CTA */}
            <div className="bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6 sm:p-8 text-center">
              <h3 className="text-xl font-bold text-zinc-100 mb-2">
                Want a full mock interview session?
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto mb-5">
                Practise live with Aman and get personalised feedback before your real interview.
              </p>
              <a
                href={buildMockInterviewWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                <MessageCircle className="w-4 h-4" />
                Book Mock Interview ₹999
              </a>
            </div>

            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start over
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
