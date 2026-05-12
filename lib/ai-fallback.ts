export class AICallError extends Error {
  constructor(
    message: string,
    public readonly groqErrText: string,
  ) {
    super(message);
  }
}

interface AIMessage {
  role: string;
  content: string;
}

interface AIOptions {
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

export async function callAI(options: AIOptions): Promise<string> {
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", ...options }),
  });

  if (groqRes.ok) {
    const data = await groqRes.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  const groqErrText = await groqRes.text();
  console.warn("[AI] Groq failed (status", groqRes.status, "), falling back to Gemini");

  const geminiRes = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({ model: "gemini-2.0-flash", ...options }),
    }
  );

  if (geminiRes.ok) {
    const data = await geminiRes.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  console.error("[AI] Gemini also failed, status:", geminiRes.status);
  throw new AICallError("Both Groq and Gemini failed", groqErrText);
}
