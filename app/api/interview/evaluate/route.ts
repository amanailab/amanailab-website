import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question, answer } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: "question and answer are required." }, { status: 400 });
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
              'You are an expert AI/ML interviewer. Evaluate the candidate answer strictly. Return response in this exact JSON format:\n{\n  "score": number between 1 and 10,\n  "correct": [array of strings - what was good],\n  "missing": [array of strings - what was missing],\n  "modelAnswer": "string - the ideal answer"\n}\nReturn ONLY valid JSON. Nothing else.',
          },
          {
            role: "user",
            content: `Question: ${question}\nCandidate Answer: ${answer}\nEvaluate this answer.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Evaluate] Groq error:", err);
      return NextResponse.json({ error: "Failed to evaluate answer." }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

    let evaluation;
    try {
      // Strip markdown code fences if model wraps JSON in them
      const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      evaluation = JSON.parse(cleaned);
    } catch {
      console.error("[Evaluate] JSON parse error, raw:", raw);
      return NextResponse.json({ error: "Failed to parse evaluation." }, { status: 502 });
    }

    return NextResponse.json(evaluation);
  } catch (err) {
    console.error("[Evaluate] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
