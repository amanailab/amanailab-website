import { NextResponse } from "next/server";
import { callAI, AICallError } from "@/lib/ai-fallback";

export const runtime = "nodejs";
export const maxDuration = 60;

interface LinkedInRequest {
  currentRole?: string;
  experience?: string;
  skills?: string;
  achievement?: string;
  targetRole?: string;
  tone?: string;
}

function s(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LinkedInRequest;
    const currentRole = s(body.currentRole);
    const experience = s(body.experience);
    const skills = s(body.skills);
    const achievement = s(body.achievement);
    const targetRole = s(body.targetRole);
    const tone = s(body.tone);

    const missing: string[] = [];
    if (!currentRole) missing.push("Current Role");
    if (!experience) missing.push("Years of Experience");
    if (!skills) missing.push("Top Skills");
    if (!achievement) missing.push("Notable Achievement");
    if (!targetRole) missing.push("Target Role");
    if (!tone) missing.push("Tone");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    let summary: string;
    try {
      summary = (await callAI({
        messages: [
          {
            role: "system",
            content:
              "You are a LinkedIn profile expert. Write compelling LinkedIn About sections that get recruiters attention. Return ONLY the LinkedIn summary text. No explanation. No markdown.",
          },
          {
            role: "user",
            content: `Write a LinkedIn About section for:
Current Role: ${currentRole}
Experience: ${experience} years
Top Skills: ${skills}
Achievement: ${achievement}
Target Role: ${targetRole}
Tone: ${tone}

Requirements:
- Start with a strong hook line
- 3-4 short paragraphs
- Mention key skills naturally
- Include achievement with numbers
- End with what you are looking for
- Max 250 words
- ${tone} tone throughout
- Optimized to appear in recruiter search`,
          },
        ],
        temperature: 0.6,
        max_tokens: 700,
      })).trim();
    } catch (err) {
      if (err instanceof AICallError) {
        let friendlyError = "Failed to generate LinkedIn summary. Please try again.";
        try {
          const errJson = JSON.parse(err.groqErrText);
          const msg = errJson?.error?.message ?? "";
          if (msg.includes("rate_limit") || msg.includes("429")) friendlyError = "AI is busy right now. Please wait 1 minute and try again.";
          else if (msg.includes("invalid_api_key") || msg.includes("401")) friendlyError = "API key error. Please contact support.";
          else if (msg.includes("token")) friendlyError = "Daily AI limit reached. Please try again tomorrow.";
        } catch { /* ignore */ }
        return NextResponse.json({ error: friendlyError }, { status: 500 });
      }
      throw err;
    }

    if (!summary) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[LinkedIn] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
