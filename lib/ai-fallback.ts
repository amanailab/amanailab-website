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

const TIMEOUT_MS = 30_000
const MAX_MESSAGES = 50
const MAX_CONTENT_CHARS = 50_000

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

export async function callAI(options: AIOptions): Promise<string> {
  // Guard: clamp message history and total content size
  if (options.messages.length > MAX_MESSAGES) {
    throw new AICallError(`Too many messages (max ${MAX_MESSAGES})`, "")
  }
  const totalChars = options.messages.reduce((n, m) => n + m.content.length, 0)
  if (totalChars > MAX_CONTENT_CHARS) {
    throw new AICallError(`Prompt too large (${totalChars} chars, max ${MAX_CONTENT_CHARS})`, "")
  }

  let groqErrText = ""

  try {
    const groqRes = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", ...options }),
      },
      TIMEOUT_MS,
    )

    if (groqRes.ok) {
      const data = await groqRes.json()
      const content = data.choices?.[0]?.message?.content ?? ""
      if (!content) console.warn("[AI] Groq returned empty content")
      return content
    }

    groqErrText = await groqRes.text()
    console.warn("[AI] Groq failed (status", groqRes.status, "), falling back to Gemini")
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("abort") || msg.includes("AbortError")) {
      console.warn("[AI] Groq timed out after", TIMEOUT_MS, "ms, falling back to Gemini")
    } else {
      console.warn("[AI] Groq network error:", msg, "— falling back to Gemini")
    }
    groqErrText = msg
  }

  try {
    const geminiRes = await fetchWithTimeout(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({ model: "gemini-2.0-flash", ...options }),
      },
      TIMEOUT_MS,
    )

    if (geminiRes.ok) {
      const data = await geminiRes.json()
      const content = data.choices?.[0]?.message?.content ?? ""
      if (!content) console.warn("[AI] Gemini returned empty content")
      return content
    }

    const geminiErrText = await geminiRes.text()
    console.error("[AI] Gemini also failed, status:", geminiRes.status, geminiErrText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[AI] Gemini network/timeout error:", msg)
  }

  throw new AICallError("Both Groq and Gemini failed", groqErrText)
}
