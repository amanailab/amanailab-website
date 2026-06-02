import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai-fallback";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "interview-generate", 15, 60_000);
  if (limited) return limited;
  try {
    const { topic, level } = await req.json();

    if (!topic || !level) {
      return NextResponse.json({ error: "topic and level are required." }, { status: 400 });
    }

    const question = (await callAI({
      messages: [
          {
            role: "system",
            content:
              "You are an expert AI/ML interviewer. Generate ONE real interview question for the given topic and level. Return ONLY the question text. No explanation. No numbering. Just the question.",
          },
          {
            role: "user",
            content: `Generate a ${level} level interview question about ${topic}`,
          },
        ],
      temperature: 0.8,
      max_tokens: 256,
    })).trim();

    if (!question) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    return NextResponse.json({ question });
  } catch (err) {
    console.error("[Generate] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
