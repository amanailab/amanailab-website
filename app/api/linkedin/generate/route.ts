import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type PostType = "project" | "learning" | "career" | "tech" | "hottake";

type Variation = "shorter" | "personal" | "data";

interface Body {
  postType?: PostType;
  variation?: Variation | null;
  formData?: Record<string, unknown>;
}

function s(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const SYSTEM_PROMPT =
  "You are an expert LinkedIn content creator specializing in AI/ML content. You write posts that get high engagement from developers and tech professionals. Return the post text followed by\n---HASHTAGS---\nthen the hashtags on next line. No other explanation.";

function variationInstruction(v: Variation | null | undefined): string {
  if (v === "shorter") return "\n\nVariation request: Make the post 30-40% shorter while keeping the hook and call to action.";
  if (v === "personal")
    return "\n\nVariation request: Make it more personal — open with a first-person moment and add one specific anecdote.";
  if (v === "data")
    return "\n\nVariation request: Add more concrete data points, numbers, and metrics throughout.";
  return "";
}

function buildUserPrompt(
  postType: PostType,
  fd: Record<string, unknown>
): { user: string; missing: string[] } | null {
  if (postType === "project") {
    const projectName = s(fd.projectName);
    const description = s(fd.description);
    const techStack = s(fd.techStack);
    const achievement = s(fd.achievement);
    const audience = s(fd.audience);
    const tone = s(fd.tone);
    const missing: string[] = [];
    if (!projectName) missing.push("Project name");
    if (!description) missing.push("Description");
    if (!techStack) missing.push("Tech stack");
    if (!achievement) missing.push("Key achievement");
    if (!audience) missing.push("Audience");
    if (!tone) missing.push("Tone");
    return {
      user: `Write a viral LinkedIn post announcing this project:
Project: ${projectName}
Description: ${description}
Tech Stack: ${techStack}
Achievement: ${achievement}
Audience: ${audience}
Tone: ${tone}

Requirements:
- Start with a hook that stops scrolling
- Use line breaks for readability
- Include specific numbers or metrics
- Tell a brief story
- End with a call to action
- 150-300 words
- Add 5 relevant hashtags after ---HASHTAGS---
- Hashtags must include: #GenerativeAI #MachineLearning #AI`,
      missing,
    };
  }

  if (postType === "learning") {
    const topic = s(fd.topic);
    const insight = s(fd.insight);
    const timeInvested = s(fd.timeInvested);
    const audience = s(fd.audience);
    const style = s(fd.style);
    const missing: string[] = [];
    if (!topic) missing.push("What did you learn");
    if (!insight) missing.push("Key insight");
    if (!timeInvested) missing.push("Time invested");
    if (!audience) missing.push("Audience");
    if (!style) missing.push("Style");
    return {
      user: `Write a viral LinkedIn learning post:
Topic: ${topic}
Key insight: ${insight}
Time invested: ${timeInvested}
Audience: ${audience}
Style: ${style}

Requirements:
- Hook: counterintuitive statement
- Share the journey briefly
- Give 3-5 actionable takeaways
- End with question to audience
- 150-250 words
- Add 5 hashtags after ---HASHTAGS---`,
      missing,
    };
  }

  if (postType === "career") {
    const achievement = s(fd.achievement);
    const background = s(fd.background);
    const timeTaken = s(fd.timeTaken);
    const keyFactor = s(fd.keyFactor);
    const advice = s(fd.advice);
    const missing: string[] = [];
    if (!achievement) missing.push("Win");
    if (!background) missing.push("Background");
    if (!timeTaken) missing.push("Time taken");
    if (!keyFactor) missing.push("Key factor");
    if (!advice) missing.push("Advice");
    return {
      user: `Write an inspiring LinkedIn post:
Achievement: ${achievement}
Background: ${background}
Time: ${timeTaken}
Key factor: ${keyFactor}
Advice: ${advice}

Requirements:
- Start with the win statement
- Share the struggle briefly
- Give specific actionable advice
- Be humble but confident
- Inspire others
- 150-300 words
- Add 5 hashtags after ---HASHTAGS---`,
      missing,
    };
  }

  if (postType === "tech") {
    const topic = s(fd.topic);
    const opinion = s(fd.opinion);
    const point1 = s(fd.point1);
    const point2 = s(fd.point2);
    const point3 = s(fd.point3);
    const controversyLevel = s(fd.controversyLevel);
    const missing: string[] = [];
    if (!topic) missing.push("Topic");
    if (!opinion) missing.push("Opinion");
    if (!point1) missing.push("Supporting point 1");
    if (!point2) missing.push("Supporting point 2");
    if (!point3) missing.push("Supporting point 3");
    if (!controversyLevel) missing.push("Controversy level");
    return {
      user: `Write a thought leadership post:
Topic: ${topic}
Opinion: ${opinion}
Points: ${point1}, ${point2}, ${point3}
Controversy: ${controversyLevel}

Requirements:
- Bold opening statement
- Back it up with evidence
- Use numbered list for points
- Acknowledge other views briefly
- End with your conclusion
- 150-250 words
- Add 5 hashtags after ---HASHTAGS---`,
      missing,
    };
  }

  if (postType === "hottake") {
    const opinion = s(fd.opinion);
    const reasoning = s(fd.reasoning);
    const evidence = s(fd.evidence);
    const industry = s(fd.industry);
    const missing: string[] = [];
    if (!opinion) missing.push("Opinion");
    if (!reasoning) missing.push("Reasoning");
    if (!evidence) missing.push("Evidence");
    if (!industry) missing.push("Industry");
    return {
      user: `Write a controversial but professional LinkedIn hot take:
Opinion: ${opinion}
Reasoning: ${reasoning}
Evidence: ${evidence}
Industry: ${industry}

Requirements:
- Start with the hot take directly
- Back it up immediately
- Share personal experience as proof
- Invite disagreement respectfully
- Keep it professional not aggressive
- 100-200 words
- Add 5 hashtags after ---HASHTAGS---`,
      missing,
    };
  }

  return null;
}

function parseResponse(raw: string): { post: string; hashtags: string } {
  const cleaned = raw.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
  const idx = cleaned.indexOf("---HASHTAGS---");
  if (idx === -1) {
    return { post: cleaned, hashtags: "" };
  }
  const post = cleaned.slice(0, idx).trim();
  const hashtags = cleaned.slice(idx + "---HASHTAGS---".length).trim();
  return { post, hashtags };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const postType = body.postType;
    const variation = body.variation ?? null;
    const formData = body.formData ?? {};

    if (
      postType !== "project" &&
      postType !== "learning" &&
      postType !== "career" &&
      postType !== "tech" &&
      postType !== "hottake"
    ) {
      return NextResponse.json({ error: "Invalid post type." }, { status: 400 });
    }

    const built = buildUserPrompt(postType, formData);
    if (!built) {
      return NextResponse.json({ error: "Invalid post type." }, { status: 400 });
    }
    if (built.missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${built.missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const userPrompt = built.user + variationInstruction(variation);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[LinkedIn Post] Groq error:", errText);
      return NextResponse.json({ error: "Failed to generate post." }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const raw: string = (groqData.choices?.[0]?.message?.content ?? "").trim();

    if (!raw) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 500 });
    }

    const { post, hashtags } = parseResponse(raw);

    return NextResponse.json({ post, hashtags });
  } catch (err) {
    console.error("[LinkedIn Post] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
