"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  MessageCircle,
  Image as ImageIcon,
  Code2,
  BarChart3,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  XCircle,
  Lightbulb,
  History,
  RotateCcw,
  Wand2,
  ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "chatgpt" | "image" | "code" | "data";

type IconComponent = React.ComponentType<{ className?: string }>;

interface ChatGptForm {
  task: string;
  tone: string;
  format: string;
  audience: string;
  context: string;
}

interface ImageForm {
  description: string;
  style: string;
  mood: string;
  angle: string;
  platform: string;
}

interface CodeForm {
  task: string;
  language: string;
  framework: string;
  level: string;
  includes: string[];
}

interface DataForm {
  data: string;
  goal: string;
  tool: string;
  output: string;
}

interface HistoryEntry {
  mode: Mode;
  prompt: string;
  ts: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 5;
const LS_USES_KEY = "prompt_gen_uses";
const LS_DATE_KEY = "prompt_gen_date";
const LS_HISTORY_KEY = "prompt_gen_history";
const HISTORY_MAX = 5;
const WHATSAPP_NUMBER = "919997600372";

const MODES: { id: Mode; title: string; description: string; Icon: IconComponent }[] = [
  {
    id: "chatgpt",
    title: "ChatGPT Prompt",
    description: "Detailed prompts for Claude, ChatGPT, and friends",
    Icon: MessageCircle,
  },
  {
    id: "image",
    title: "Image Prompt",
    description: "Optimised for Midjourney, DALL·E, Stable Diffusion",
    Icon: ImageIcon,
  },
  {
    id: "code",
    title: "Code Prompt",
    description: "Specific coding prompts for any language",
    Icon: Code2,
  },
  {
    id: "data",
    title: "Data Analysis",
    description: "Prompts for Pandas, SQL, and BI tools",
    Icon: BarChart3,
  },
];

const TONES = ["Professional", "Casual", "Technical", "Creative", "Formal"];
const FORMATS = ["Paragraph", "Bullet Points", "Step by Step", "Table", "Code"];

const STYLES = [
  "Photorealistic",
  "Digital Art",
  "Anime",
  "Minimalist",
  "Cinematic",
  "Oil Painting",
  "Watercolor",
];
const MOODS = ["Dark", "Bright", "Dramatic", "Peaceful", "Mysterious", "Epic"];
const ANGLES = ["Close-up", "Wide shot", "Bird's eye", "Low angle", "Portrait"];
const PLATFORMS = ["Midjourney", "DALL-E", "Stable Diffusion", "Adobe Firefly"];

const LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "SQL",
  "Bash",
  "Other",
];
const LEVELS = ["Beginner", "Intermediate", "Expert"];
const INCLUDE_OPTIONS = [
  "Error handling",
  "Comments",
  "Tests",
  "Documentation",
  "Examples",
];

const TOOLS = ["Python/Pandas", "SQL", "Excel", "Power BI", "Tableau"];
const OUTPUTS = ["Visualization", "Summary", "Predictions", "Cleaning", "Report"];

const INITIAL_CHATGPT: ChatGptForm = {
  task: "",
  tone: "",
  format: "",
  audience: "",
  context: "",
};
const INITIAL_IMAGE: ImageForm = {
  description: "",
  style: "",
  mood: "",
  angle: "",
  platform: "",
};
const INITIAL_CODE: CodeForm = {
  task: "",
  language: "",
  framework: "",
  level: "",
  includes: [],
};
const INITIAL_DATA: DataForm = {
  data: "",
  goal: "",
  tool: "",
  output: "",
};

const PLATFORM_TIPS: Record<string, string> = {
  Midjourney:
    "Append --ar 16:9 or --ar 1:1 for aspect ratio, and --v 6 for the latest model.",
  "DALL-E":
    "DALL·E reads natural language well — keep modifiers like camera, lighting and style in plain words.",
  "Stable Diffusion":
    "Use comma-separated tags and negative prompts (e.g. `--no blurry, low quality`).",
  "Adobe Firefly":
    "Firefly works best with shorter, descriptive prompts and preset style options.",
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

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        e &&
        typeof e === "object" &&
        typeof e.prompt === "string" &&
        typeof e.ts === "number" &&
        (e.mode === "chatgpt" ||
          e.mode === "image" ||
          e.mode === "code" ||
          e.mode === "data")
    );
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function buildHelpWhatsappLink() {
  const message = "Hi Aman, I need custom AI prompts for my business or project";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function modeLabel(mode: Mode) {
  return MODES.find((m) => m.id === mode)?.title ?? mode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PromptGenerator() {
  const [mode, setMode] = useState<Mode>("chatgpt");
  const [chatgpt, setChatgpt] = useState<ChatGptForm>(INITIAL_CHATGPT);
  const [imageForm, setImageForm] = useState<ImageForm>(INITIAL_IMAGE);
  const [codeForm, setCodeForm] = useState<CodeForm>(INITIAL_CODE);
  const [dataForm, setDataForm] = useState<DataForm>(INITIAL_DATA);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState("");
  const [usedToday, setUsedToday] = useState(0);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setUsedToday(getUsage());
    setHistory(loadHistory());
  }, []);

  const limitReached = usedToday >= DAILY_LIMIT;
  const remaining = useMemo(() => Math.max(0, DAILY_LIMIT - usedToday), [usedToday]);
  const usagePct = useMemo(
    () => Math.min(100, Math.round((usedToday / DAILY_LIMIT) * 100)),
    [usedToday]
  );

  function switchMode(next: Mode) {
    if (next === mode || working) return;
    setMode(next);
    setError("");
    setGenerated("");
  }

  function currentFormData(): Record<string, unknown> {
    if (mode === "chatgpt") return { ...chatgpt };
    if (mode === "image") return { ...imageForm };
    if (mode === "code") return { ...codeForm };
    return { ...dataForm };
  }

  async function generate({ regenerate = false }: { regenerate?: boolean } = {}) {
    if (working || limitReached) return;
    setError("");
    setWorking(true);
    if (!regenerate) setGenerated("");
    try {
      const res = await fetch("/api/prompt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, formData: currentFormData() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate prompt.");

      const prompt = typeof data.prompt === "string" ? data.prompt : "";
      const newCount = incrementUsage();
      setUsedToday(newCount);
      setGenerated(prompt);

      const entry: HistoryEntry = { mode, prompt, ts: Date.now() };
      const next = [entry, ...history.filter((h) => h.prompt !== prompt)].slice(
        0,
        HISTORY_MAX
      );
      setHistory(next);
      saveHistory(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  async function copyGenerated() {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function restoreFromHistory(entry: HistoryEntry) {
    setMode(entry.mode);
    setGenerated(entry.prompt);
    setError("");
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  function toggleInclude(item: string) {
    setCodeForm((f) =>
      f.includes.includes(item)
        ? { ...f, includes: f.includes.filter((i) => i !== item) }
        : { ...f, includes: [...f.includes, item] }
    );
  }

  const inputBase =
    "w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors";
  const labelClass = "text-xs font-semibold text-zinc-400 uppercase tracking-wide";

  // ── Limit reached ──
  if (limitReached && !generated) {
    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 mx-auto">
            <Wand2 className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Daily limit reached</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Come back tomorrow for {DAILY_LIMIT} more free prompt generations.
          </p>
          <a
            href={buildHelpWhatsappLink()}
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

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative pt-20 pb-10 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <Wand2 className="w-3.5 h-3.5" />
            Prompt Generator
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            AI Prompt Generator
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Generate perfect prompts for any AI task. Free. Instant. No login.
          </p>
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

        {/* Mode grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {MODES.map(({ id, title, description, Icon }) => {
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

        {/* Form card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5">
          {/* ── ChatGPT mode ── */}
          {mode === "chatgpt" && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>What do you want to do? *</label>
                <textarea
                  value={chatgpt.task}
                  onChange={(e) => setChatgpt((s) => ({ ...s, task: e.target.value }))}
                  placeholder="Example: Write a blog post about RAG systems"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Tone *</label>
                  <select
                    value={chatgpt.tone}
                    onChange={(e) => setChatgpt((s) => ({ ...s, tone: e.target.value }))}
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Output Format *</label>
                  <select
                    value={chatgpt.format}
                    onChange={(e) => setChatgpt((s) => ({ ...s, format: e.target.value }))}
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Target audience *</label>
                <input
                  type="text"
                  value={chatgpt.audience}
                  onChange={(e) =>
                    setChatgpt((s) => ({ ...s, audience: e.target.value }))
                  }
                  placeholder="Example: AI developers"
                  className={inputBase}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>
                  Additional context <span className="text-zinc-600">(optional)</span>
                </label>
                <textarea
                  value={chatgpt.context}
                  onChange={(e) =>
                    setChatgpt((s) => ({ ...s, context: e.target.value }))
                  }
                  placeholder="Any extra details..."
                  rows={2}
                  className={`${inputBase} resize-y`}
                />
              </div>
            </>
          )}

          {/* ── Image mode ── */}
          {mode === "image" && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>What do you want to generate? *</label>
                <textarea
                  value={imageForm.description}
                  onChange={(e) =>
                    setImageForm((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Example: A futuristic AI robot in a lab"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Style *</label>
                  <select
                    value={imageForm.style}
                    onChange={(e) =>
                      setImageForm((s) => ({ ...s, style: e.target.value }))
                    }
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {STYLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Mood *</label>
                  <select
                    value={imageForm.mood}
                    onChange={(e) =>
                      setImageForm((s) => ({ ...s, mood: e.target.value }))
                    }
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {MOODS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Camera angle *</label>
                  <select
                    value={imageForm.angle}
                    onChange={(e) =>
                      setImageForm((s) => ({ ...s, angle: e.target.value }))
                    }
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {ANGLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Platform *</label>
                  <select
                    value={imageForm.platform}
                    onChange={(e) =>
                      setImageForm((s) => ({ ...s, platform: e.target.value }))
                    }
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {PLATFORMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ── Code mode ── */}
          {mode === "code" && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>What do you want to build? *</label>
                <textarea
                  value={codeForm.task}
                  onChange={(e) =>
                    setCodeForm((s) => ({ ...s, task: e.target.value }))
                  }
                  placeholder="Example: A FastAPI endpoint that processes PDF files"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Programming language *</label>
                  <select
                    value={codeForm.language}
                    onChange={(e) =>
                      setCodeForm((s) => ({ ...s, language: e.target.value }))
                    }
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {LANGUAGES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>
                    Framework <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={codeForm.framework}
                    onChange={(e) =>
                      setCodeForm((s) => ({ ...s, framework: e.target.value }))
                    }
                    placeholder="Example: FastAPI, React"
                    className={inputBase}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Experience level *</label>
                <select
                  value={codeForm.level}
                  onChange={(e) =>
                    setCodeForm((s) => ({ ...s, level: e.target.value }))
                  }
                  className={inputBase}
                >
                  <option value="">Choose…</option>
                  {LEVELS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Include</label>
                <div className="flex flex-wrap gap-2">
                  {INCLUDE_OPTIONS.map((item) => {
                    const checked = codeForm.includes.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInclude(item)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                          checked
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        {checked ? "✓ " : ""}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Data mode ── */}
          {mode === "data" && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>What data do you have? *</label>
                <textarea
                  value={dataForm.data}
                  onChange={(e) =>
                    setDataForm((s) => ({ ...s, data: e.target.value }))
                  }
                  placeholder="Example: Sales data with columns date, revenue, region"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>What insight do you need? *</label>
                <textarea
                  value={dataForm.goal}
                  onChange={(e) =>
                    setDataForm((s) => ({ ...s, goal: e.target.value }))
                  }
                  placeholder="Example: Find trends and anomalies"
                  rows={3}
                  className={`${inputBase} resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Tool *</label>
                  <select
                    value={dataForm.tool}
                    onChange={(e) =>
                      setDataForm((s) => ({ ...s, tool: e.target.value }))
                    }
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {TOOLS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Output needed *</label>
                  <select
                    value={dataForm.output}
                    onChange={(e) =>
                      setDataForm((s) => ({ ...s, output: e.target.value }))
                    }
                    className={inputBase}
                  >
                    <option value="">Choose…</option>
                    {OUTPUTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
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
            {working ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating prompt…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {mode === "image"
                  ? "Generate Image Prompt"
                  : mode === "code"
                  ? "Generate Code Prompt"
                  : mode === "data"
                  ? "Generate Analysis Prompt"
                  : "Generate Prompt"}
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {generated && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-orange-400" />
                  <h3 className="text-lg font-bold text-zinc-100">
                    Generated {modeLabel(mode)}
                  </h3>
                </div>
                <button
                  onClick={copyGenerated}
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
              <p className="text-zinc-200 text-sm leading-relaxed bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 whitespace-pre-wrap font-sans">
                {generated}
              </p>
              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                <p className="text-xs text-zinc-500">{generated.length} characters</p>
                <button
                  onClick={() => generate({ regenerate: true })}
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
                {mode === "chatgpt" && (
                  <>
                    <span className="font-semibold">Pro tip:</span> Paste this directly into
                    ChatGPT or Claude.
                  </>
                )}
                {mode === "image" && (
                  <>
                    <span className="font-semibold">{imageForm.platform || "Platform"} tip:</span>{" "}
                    {(imageForm.platform && PLATFORM_TIPS[imageForm.platform]) ||
                      "Paste the prompt into your image generator and tweak the aspect ratio for best results."}
                  </>
                )}
                {mode === "code" && (
                  <>
                    <span className="font-semibold">Pro tip:</span> Use this in Claude Code for
                    full repo-aware results.
                  </>
                )}
                {mode === "data" && (
                  <>
                    <span className="font-semibold">Pro tip:</span> Paste this into Claude or
                    ChatGPT alongside a sample of your dataset.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-zinc-100">Recent Prompts</h3>
              </div>
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {history.map((entry) => (
                <li key={entry.ts}>
                  <button
                    onClick={() => restoreFromHistory(entry)}
                    className="w-full flex items-center justify-between gap-3 text-left px-3 py-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800 hover:border-orange-500/40 transition-colors"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-orange-400">
                        {modeLabel(entry.mode)}
                      </span>
                      <span className="text-sm text-zinc-300 truncate">
                        {entry.prompt.slice(0, 50)}
                        {entry.prompt.length > 50 ? "…" : ""}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* WhatsApp CTA */}
        <div className="mt-8 bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl font-bold text-zinc-100 mb-2">
            Need custom AI prompts for your business or project?
          </h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-5">
            Get tailored prompt libraries and bespoke prompt engineering work.
          </p>
          <a
            href={buildHelpWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            <MessageCircle className="w-4 h-4" />
            Talk to Aman
          </a>
        </div>
      </div>
    </section>
  );
}
