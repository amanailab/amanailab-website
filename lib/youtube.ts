import type { ChannelStats, Video, Playlist } from "./types";

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.NEXT_PUBLIC_CHANNEL_ID;
const BASE = "https://www.googleapis.com/youtube/v3";

// ── Revalidation times ────────────────────────────────────────────────────────
export const REVALIDATE_STATS = 300;    // 5 min — subscriber/view counts
export const REVALIDATE_VIDEOS = 300;   // 5 min — latest uploads
export const REVALIDATE_PLAYLISTS = 1800; // 30 min — series list

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatCount(n: number): { value: number; suffix: string } {
  if (n >= 1_000_000) return { value: parseFloat((n / 1_000_000).toFixed(1)), suffix: "M+" };
  if (n >= 1_000) return { value: Math.floor(n / 1_000), suffix: "K+" };
  return { value: n, suffix: "+" };
}

function inferCategory(title: string, desc: string): string {
  const t = `${title} ${desc}`.toLowerCase();
  if (/\bagent|multi.agent|crew|autogen/.test(t)) return "agents";
  if (/\brag\b|retrieval|vector\s?db|embedding/.test(t)) return "rag";
  if (/\bprompt/.test(t)) return "prompting";
  if (/app|deploy|fastapi|next\.?js|full.?stack|build/.test(t)) return "development";
  return "llm";
}

function inferLevel(title: string, desc: string): string {
  const t = `${title} ${desc}`.toLowerCase();
  if (/advanced|expert|fine.?tun|lora|peft|rlhf/.test(t)) return "Advanced";
  if (/beginner|intro|start|fundamental|basics/.test(t)) return "Beginner";
  return "Intermediate";
}

function inferTags(title: string, desc: string): string[] {
  const keywords = [
    "LangChain","OpenAI","GPT","LLM","RAG","Agents","LoRA","PEFT",
    "Transformers","Embeddings","Pinecone","Chroma","Prompt","FastAPI",
    "LlamaIndex","CrewAI","AutoGen","QLoRA","Gemini","Claude","Ollama",
  ];
  const text = `${title} ${desc}`;
  return keywords.filter((k) => new RegExp(k, "i").test(text)).slice(0, 3);
}

const GRADIENTS = [
  { from: "#f97316", to: "#dc2626" },
  { from: "#3b82f6", to: "#7c3aed" },
  { from: "#10b981", to: "#0891b2" },
  { from: "#f59e0b", to: "#f97316" },
  { from: "#8b5cf6", to: "#ec4899" },
  { from: "#06b6d4", to: "#3b82f6" },
  { from: "#f97316", to: "#8b5cf6" },
  { from: "#10b981", to: "#6366f1" },
];

// ── Raw fetch with Next.js caching ────────────────────────────────────────────

async function ytFetch<T>(endpoint: string, revalidate: number): Promise<T | null> {
  if (!API_KEY || !CHANNEL_ID) return null;
  try {
    const url = `${BASE}/${endpoint}&key=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) {
      console.error(`[YouTube API] ${res.status} — ${endpoint.split("?")[0]}`);
      return null;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.error("[YouTube API] fetch error", err);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YT = { items?: any[]; nextPageToken?: string };

// ── Fallback data ─────────────────────────────────────────────────────────────

const FALLBACK_STATS: ChannelStats = {
  subscriberCount: 0,
  viewCount: 0,
  videoCount: 0,
  seriesCount: 0,
};

const FALLBACK_PLAYLISTS: Playlist[] = [
  {
    id: "fallback-llm",
    title: "LLM Mastery",
    description: "Deep dive into Large Language Models — transformers, APIs, and production systems.",
    thumbnail: "",
    videoCount: 0,
    url: `https://youtube.com/channel/${CHANNEL_ID ?? ""}`,
    category: "llm",
    level: "Beginner",
    tags: ["GPT", "Transformers", "APIs"],
    gradientFrom: "#f97316",
    gradientTo: "#dc2626",
    isNew: false,
  },
  {
    id: "fallback-agents",
    title: "AI Agents from Scratch",
    description: "Build autonomous AI agents using LangChain, tool use, and multi-agent patterns.",
    thumbnail: "",
    videoCount: 0,
    url: `https://youtube.com/channel/${CHANNEL_ID ?? ""}`,
    category: "agents",
    level: "Intermediate",
    tags: ["LangChain", "Tools", "Memory"],
    gradientFrom: "#3b82f6",
    gradientTo: "#7c3aed",
    isNew: true,
  },
  {
    id: "fallback-rag",
    title: "RAG Systems",
    description: "Master Retrieval-Augmented Generation — embeddings, vector databases, and pipelines.",
    thumbnail: "",
    videoCount: 0,
    url: `https://youtube.com/channel/${CHANNEL_ID ?? ""}`,
    category: "rag",
    level: "Intermediate",
    tags: ["Embeddings", "Vector DBs", "Retrieval"],
    gradientFrom: "#10b981",
    gradientTo: "#0891b2",
    isNew: false,
  },
];

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getChannelStats(): Promise<ChannelStats> {
  const data = await ytFetch<YT>(
    `channels?part=statistics,contentDetails&id=${CHANNEL_ID}`,
    REVALIDATE_STATS
  );

  if (!data?.items?.[0]) return FALLBACK_STATS;

  const stats = data.items[0].statistics ?? {};
  const playlists = await getPlaylists();

  return {
    subscriberCount: parseInt(stats.subscriberCount ?? "0", 10),
    viewCount: parseInt(stats.viewCount ?? "0", 10),
    videoCount: parseInt(stats.videoCount ?? "0", 10),
    seriesCount: playlists.length,
  };
}

export function formatStats(stats: ChannelStats) {
  return {
    subs: formatCount(stats.subscriberCount),
    views: formatCount(stats.viewCount),
    videos: formatCount(stats.videoCount),
    series: stats.seriesCount,
  };
}

export async function getPlaylists(limit = 20): Promise<Playlist[]> {
  const data = await ytFetch<YT>(
    `playlists?part=snippet,contentDetails&channelId=${CHANNEL_ID}&maxResults=${limit}`,
    REVALIDATE_PLAYLISTS
  );

  if (!data?.items?.length) return FALLBACK_PLAYLISTS;

  return data.items.map((item, i) => {
    const snippet = item.snippet ?? {};
    const title: string = snippet.title ?? "Untitled";
    const desc: string = snippet.description ?? "";
    const thumb: string =
      snippet.thumbnails?.maxres?.url ??
      snippet.thumbnails?.standard?.url ??
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url ??
      "";
    const videoCount: number = item.contentDetails?.itemCount ?? 0;
    const gradient = GRADIENTS[i % GRADIENTS.length];
    const publishedAt: string = snippet.publishedAt ?? "";
    const isNew = publishedAt
      ? Date.now() - new Date(publishedAt).getTime() < 60 * 24 * 60 * 60 * 1000
      : false;

    return {
      id: item.id as string,
      title,
      description: desc.slice(0, 220),
      thumbnail: thumb,
      videoCount,
      url: `https://www.youtube.com/playlist?list=${item.id}`,
      category: inferCategory(title, desc),
      level: inferLevel(title, desc),
      tags: inferTags(title, desc),
      gradientFrom: gradient.from,
      gradientTo: gradient.to,
      isNew,
    };
  });
}

export async function getPlaylistById(playlistId: string): Promise<Playlist | null> {
  // Check fallback ids first (used when API key was not set)
  if (playlistId.startsWith("fallback-")) {
    return FALLBACK_PLAYLISTS.find((p) => p.id === playlistId) ?? null;
  }

  const data = await ytFetch<YT>(
    `playlists?part=snippet,contentDetails&id=${playlistId}`,
    REVALIDATE_PLAYLISTS
  );

  if (!data?.items?.[0]) return null;
  const item = data.items[0];
  const snippet = item.snippet ?? {};
  const title: string = snippet.title ?? "Untitled";
  const desc: string = snippet.description ?? "";

  return {
    id: item.id as string,
    title,
    description: desc,
    thumbnail:
      snippet.thumbnails?.maxres?.url ??
      snippet.thumbnails?.standard?.url ??
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url ??
      "",
    videoCount: item.contentDetails?.itemCount ?? 0,
    url: `https://www.youtube.com/playlist?list=${item.id}`,
    category: inferCategory(title, desc),
    level: inferLevel(title, desc),
    tags: inferTags(title, desc),
    gradientFrom: GRADIENTS[0].from,
    gradientTo: GRADIENTS[0].to,
    isNew: false,
  };
}

export async function getPlaylistVideos(playlistId: string, limit = 30): Promise<Video[]> {
  if (playlistId.startsWith("fallback-")) return [];

  const data = await ytFetch<YT>(
    `playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${limit}`,
    REVALIDATE_VIDEOS
  );

  if (!data?.items?.length) return [];

  return data.items
    .filter((item) => item.snippet?.resourceId?.videoId)
    .map((item) => {
      const snippet = item.snippet ?? {};
      const videoId: string = snippet.resourceId.videoId;
      const thumb: string = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      return {
        id: videoId,
        title: snippet.title ?? "Untitled",
        description: (snippet.description ?? "").slice(0, 200),
        thumbnail: thumb,
        publishedAt: snippet.publishedAt ?? "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });
}

export async function getLatestVideos(limit = 6): Promise<Video[]> {
  // Get uploads playlist ID from channel data
  const data = await ytFetch<YT>(
    `channels?part=contentDetails&id=${CHANNEL_ID}`,
    REVALIDATE_VIDEOS
  );

  const uploadsId: string =
    data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? "";

  if (!uploadsId) return [];
  return getPlaylistVideos(uploadsId, limit);
}
