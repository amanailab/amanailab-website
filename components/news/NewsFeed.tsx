"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { RefreshCw, Newspaper, ExternalLink } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  developer_take: string;
  impact_score: "game_changer" | "important" | "good_to_know";
  source: string;
  source_url: string;
  category: string;
  published_at: string;
}

type Category = "all" | "models" | "research" | "tools" | "agents" | "india_ai";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "models", label: "Models" },
  { value: "research", label: "Research" },
  { value: "tools", label: "Tools" },
  { value: "agents", label: "Agents" },
  { value: "india_ai", label: "India AI" },
];

const IMPACT_CONFIG = {
  game_changer: {
    label: "Game Changer",
    emoji: "🔴",
    classes: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  important: {
    label: "Important",
    emoji: "🟡",
    classes: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  },
  good_to_know: {
    label: "Good to Know",
    emoji: "🟢",
    classes: "bg-green-500/15 text-green-300 border-green-500/30",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  models:    "bg-blue-500/15 text-blue-300 border-blue-500/30",
  research:  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  tools:     "bg-teal-500/15 text-teal-300 border-teal-500/30",
  agents:    "bg-orange-500/15 text-orange-300 border-orange-500/30",
  india_ai:  "bg-green-500/15 text-green-300 border-green-500/30",
  general:   "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
};

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.general;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────

function NewsCard({ article }: { article: NewsArticle }) {
  const impact = IMPACT_CONFIG[article.impact_score] ?? IMPACT_CONFIG.good_to_know;
  const catLabel = article.category === "india_ai"
    ? "India AI"
    : article.category.charAt(0).toUpperCase() + article.category.slice(1);

  return (
    <article className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-200 gap-4">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${impact.classes}`}>
          {impact.emoji} {impact.label}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getCategoryColor(article.category)}`}>
          {catLabel}
        </span>
      </div>

      {/* Title */}
      <a
        href={article.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-2"
      >
        <h2 className="text-zinc-100 font-semibold text-sm leading-snug group-hover:text-orange-400 transition-colors flex-1">
          {article.title}
        </h2>
        <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-orange-400 transition-colors shrink-0 mt-0.5" />
      </a>

      {/* Meta */}
      <p className="text-xs text-zinc-500">
        <span className="text-zinc-400 font-medium">{article.source}</span>
        {" · "}
        {timeAgo(article.published_at)}
      </p>

      {/* Summary */}
      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
        {article.summary}
      </p>

      {/* Developer take */}
      <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1.5">
          What this means for devs
        </p>
        <p className="text-zinc-300 text-sm leading-relaxed">
          {article.developer_take}
        </p>
      </div>
    </article>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

function lastUpdatedLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function NewsFeed() {
  const [articles, setArticles]     = useState<NewsArticle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState<Category>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("news_last_updated");
    if (stored) setLastUpdated(stored);
  }, []);

  const fetchArticles = useCallback(async (cat: Category) => {
    setLoading(true);
    let query = supabase
      .from("news_articles")
      .select("id, title, summary, developer_take, impact_score, source, source_url, category, published_at")
      .order("published_at", { ascending: false })
      .limit(50);

    if (cat !== "all") {
      query = query.eq("category", cat);
    }

    const { data, error } = await query;
    if (!error) {
      setArticles(data ?? []);
      const now = new Date().toISOString();
      localStorage.setItem("news_last_updated", now);
      setLastUpdated(now);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles(category);
  }, [category, fetchArticles]);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/news/fetch");
      const data = await res.json();
      if (res.ok && data.success) {
        setRefreshMsg({ type: "success", text: "Feed updated!" });
        await fetchArticles(category);
      } else {
        setRefreshMsg({ type: "error", text: data.message ?? "Failed to refresh." });
      }
    } catch {
      setRefreshMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMsg(null), 4000);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <Newspaper className="w-3.5 h-3.5" />
            AI News Feed
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            AI News Feed
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Latest AI updates curated for developers. Updated daily.
          </p>
          {lastUpdated && (
            <p className="text-zinc-600 text-sm mt-3">
              Last updated: {lastUpdatedLabel(lastUpdated)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Category tabs */}
          <div className="flex items-center gap-1 flex-wrap border-b border-zinc-800 w-full sm:w-auto sm:border-b-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap rounded-t-lg sm:rounded-lg ${
                  category === cat.value
                    ? "text-orange-400 border-b-2 border-orange-500 sm:border-b-0 sm:bg-orange-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Refresh button + status */}
          <div className="flex items-center gap-3 shrink-0">
            {refreshMsg && (
              <span className={`text-xs font-medium ${
                refreshMsg.type === "success" ? "text-green-400" : "text-red-400"
              }`}>
                {refreshMsg.text}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Fetching…" : "Refresh Feed"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <span className="w-8 h-8 border-2 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
              <Newspaper className="w-8 h-8 text-zinc-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mb-3">No news yet</h2>
            <p className="text-zinc-400 text-sm max-w-xs mb-8">
              Click Refresh Feed to fetch the latest AI news
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Fetching…" : "Refresh Feed"}
            </button>
          </div>
        )}

        {/* Article grid */}
        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
