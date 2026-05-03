import { NextResponse } from "next/server";

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

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[LinkedIn] Groq error:", errText);
      return NextResponse.json(
        { error: "Failed to generate LinkedIn summary." },
        { status: 500 }
      );
    }

    const groqData = await groqRes.json();
    const summary: string = (groqData.choices?.[0]?.message?.content ?? "").trim();

    if (!summary) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[LinkedIn] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
