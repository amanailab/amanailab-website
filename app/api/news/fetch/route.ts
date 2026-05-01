import { NextResponse } from "next/server";

interface RawArticle {
  title: string;
  source: string;
  source_url: string;
  published_at: string;
  raw_description: string;
}

interface GroqAnalysis {
  summary: string;
  developer_take: string;
  impact_score: "game_changer" | "important" | "good_to_know";
  category: "models" | "research" | "tools" | "agents" | "india_ai" | "general";
}

const AI_KEYWORDS = [
  "artificial intelligence",
  "large language model",
  "llm",
  "generative ai",
  "gpt",
  "claude ai",
  "gemini ai",
  "openai",
  "anthropic",
  "hugging face",
  "huggingface",
  "mistral",
  "llama",
  "ai model",
  "machine learning",
  "deep learning",
  "neural network",
  "ai agent",
  "chatgpt",
  "foundation model",
  "diffusion model",
  "transformer model",
];

function containsAIKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return AI_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractTagContent(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1].trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

async function fetchRSSFeed(url: string, sourceName: string): Promise<RawArticle[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AmanAI-Lab-NewsBot/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
    const articles: RawArticle[] = [];

    for (const item of itemMatches) {
      if (articles.length >= 5) break;

      const title = stripHtml(extractTagContent(item, "title"));
      const link = extractTagContent(item, "link") ||
        (item.match(/<link\s*\/?>\s*(https?:\/\/[^\s<]+)/i)?.[1] ?? "");
      const pubDate = extractTagContent(item, "pubDate");
      const description = stripHtml(
        extractTagContent(item, "description") || extractTagContent(item, "content:encoded")
      );

      if (!title || !link) continue;
      if (!containsAIKeyword(title + " " + description)) continue;

      articles.push({
        title,
        source: sourceName,
        source_url: link.trim(),
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        raw_description: description,
      });
    }

    if (articles.length === 0) {
      console.log(`[RSS] No matching items from ${url}`);
    }
    return articles;
  } catch (err) {
    console.error(`[RSS] Failed to fetch ${url}:`, err);
    return [];
  }
}

async function analyzeWithGroq(article: RawArticle): Promise<GroqAnalysis | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: "You are an AI news analyst. Return ONLY valid JSON. No markdown.",
          },
          {
            role: "user",
            content: `Summarize this AI news for developers.\nTitle: ${article.title}\nDescription: ${article.raw_description}\n\nReturn exactly this JSON:\n{\n  "summary": "one sentence summary",\n  "developer_take": "one sentence on what this means for developers",\n  "impact_score": "game_changer or important or good_to_know",\n  "category": "models or research or tools or agents or india_ai or general"\n}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error("[Groq] Error status:", res.status);
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as GroqAnalysis;
    const validImpact = ["game_changer", "important", "good_to_know"];
    const validCategory = ["models", "research", "tools", "agents", "india_ai", "general"];

    return {
      summary: String(parsed.summary ?? "").slice(0, 500),
      developer_take: String(parsed.developer_take ?? "").slice(0, 300),
      impact_score: validImpact.includes(parsed.impact_score) ? parsed.impact_score : "good_to_know",
      category: validCategory.includes(parsed.category) ? parsed.category : "general",
    };
  } catch (err) {
    console.error("[Groq] Parse error:", err);
    return null;
  }
}

export async function GET() {
  try {
    const articles: RawArticle[] = [];

    // STEP 1 — NewsData.io
    try {
      const newsdataUrl =
        "https://newsdata.io/api/1/latest?" +
        "apikey=" + process.env.NEWSDATA_API_KEY +
        "&q=artificial intelligence OR LLM OR " +
        "large language model OR generative AI OR " +
        "GPT OR Claude AI OR Gemini AI OR " +
        "AI model OR machine learning model OR " +
        "AI agent OR deep learning OR " +
        "HuggingFace OR OpenAI OR Anthropic OR " +
        "Llama AI OR Mistral AI" +
        "&language=en" +
        "&category=technology,science" +
        "&removeduplicate=1" +
        "&size=10";

      const ndRes = await fetch(newsdataUrl, { signal: AbortSignal.timeout(10000) });
      if (ndRes.ok) {
        const ndData = await ndRes.json();
        for (const item of ndData.results ?? []) {
          articles.push({
            title: String(item.title ?? "").slice(0, 300),
            source: String(item.source_id ?? "NewsData"),
            source_url: String(item.link ?? ""),
            published_at: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : new Date().toISOString(),
            raw_description: String(item.description ?? "").slice(0, 500),
          });
        }
      }
    } catch (err) {
      console.error("[NewsData] Error:", err);
    }

    // STEP 2 — RSS feeds
    const rssFeeds = [
      { url: "https://huggingface.co/blog/feed.xml", name: "Hugging Face" },
      { url: "https://venturebeat.com/ai/feed", name: "VentureBeat" },
      { url: "https://techcrunch.com/tag/artificial-intelligence/feed", name: "TechCrunch" },
      { url: "https://analyticsindiamag.com/feed", name: "Analytics India Magazine" },
    ];

    const rssResults = await Promise.allSettled(
      rssFeeds.map((feed) => fetchRSSFeed(feed.url, feed.name))
    );

    for (const result of rssResults) {
      if (result.status === "fulfilled") {
        articles.push(...result.value);
      }
    }

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 30);

    const recentArticles = articles.filter((a) => {
      const d = new Date(a.published_at);
      return isNaN(d.getTime()) ? true : d >= oneDayAgo;
    });

    if (recentArticles.length === 0) {
      return NextResponse.json({ success: false, count: 0, message: "No articles found from sources." });
    }

    // STEP 3+4 — Analyze each article with Groq (sequential to avoid rate limits)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

    let savedCount = 0;

    for (const article of recentArticles) {
      if (!article.title || !article.source_url) continue;

      const analysis = await analyzeWithGroq(article);
      if (!analysis) continue;

      // STEP 5 — Upsert into Supabase
      try {
        const upsertRes = await fetch(`${supabaseUrl}/rest/v1/news_articles`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            title: article.title,
            summary: analysis.summary,
            developer_take: analysis.developer_take,
            impact_score: analysis.impact_score,
            source: article.source,
            source_url: article.source_url,
            category: analysis.category,
            published_at: article.published_at,
            is_manual: false,
          }),
        });

        if (upsertRes.ok || upsertRes.status === 201 || upsertRes.status === 200) {
          savedCount++;
        } else {
          const errText = await upsertRes.text();
          console.error("[Supabase] Upsert error:", upsertRes.status, errText);
        }
      } catch (err) {
        console.error("[Supabase] Fetch error:", err);
      }
    }

    // STEP 6 — Return response
    return NextResponse.json({
      success: true,
      count: savedCount,
      message: `Fetched ${savedCount} new articles`,
    });
  } catch (err) {
    console.error("[news/fetch] Unhandled error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
