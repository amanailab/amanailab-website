import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topic, level } = await req.json();

    if (!topic || !level) {
      return NextResponse.json({ error: "topic and level are required." }, { status: 400 });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
              "You are an expert AI/ML interviewer. Generate ONE real interview question for the given topic and level. Return ONLY the question text. No explanation. No numbering. Just the question.",
          },
          {
            role: "user",
            content: `Generate a ${level} level interview question about ${topic}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 256,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Generate] Groq error:", err);
      return NextResponse.json({ error: "Failed to generate question." }, { status: 502 });
    }

    const data = await res.json();
    const question = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (!question) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    return NextResponse.json({ question });
  } catch (err) {
    console.error("[Generate] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
