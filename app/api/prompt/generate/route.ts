import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Mode = "chatgpt" | "image" | "code" | "data";

interface ChatGptForm {
  task: string;
  tone: string;
  format: string;
  audience: string;
  context: string;
}

interface ImageForm {
  description: string;
  style: string;
  mood: string;
  angle: string;
  platform: string;
}

interface CodeForm {
  task: string;
  language: string;
  framework: string;
  level: string;
  includes: string[];
}

interface DataForm {
  data: string;
  goal: string;
  tool: string;
  output: string;
}

interface Body {
  mode?: Mode;
  formData?: Partial<ChatGptForm & ImageForm & CodeForm & DataForm> & {
    includes?: unknown;
  };
}

function s(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildPromptParts(
  mode: Mode,
  fd: NonNullable<Body["formData"]>
): { system: string; user: string; missing: string[] } | null {
  if (mode === "chatgpt") {
    const task = s(fd.task);
    const tone = s(fd.tone);
    const format = s(fd.format);
    const audience = s(fd.audience);
    const context = s(fd.context);

    const missing: string[] = [];
    if (!task) missing.push("Task");
    if (!tone) missing.push("Tone");
    if (!format) missing.push("Output format");
    if (!audience) missing.push("Target audience");

    return {
      system:
        "You are an expert prompt engineer. Create detailed, effective prompts that get the best results from AI models. Return ONLY the prompt text. No explanation.",
      user: `Create a ${tone} prompt to ${task} for ${audience}.
Output should be in ${format} format.
Context: ${context || "(none)"}

Make the prompt:
- Clear and specific
- Include role assignment at start
- Include output format instructions
- Include constraints
- Ready to paste into ChatGPT or Claude`,
      missing,
    };
  }

  if (mode === "image") {
    const description = s(fd.description);
    const style = s(fd.style);
    const mood = s(fd.mood);
    const angle = s(fd.angle);
    const platform = s(fd.platform);

    const missing: string[] = [];
    if (!description) missing.push("Description");
    if (!style) missing.push("Style");
    if (!mood) missing.push("Mood");
    if (!angle) missing.push("Camera angle");
    if (!platform) missing.push("Platform");

    return {
      system:
        "You are an expert at writing image generation prompts. Return ONLY the optimized prompt. No explanation.",
      user: `Create a ${style} ${mood} image prompt for ${platform} showing: ${description}
Camera: ${angle}
Include style keywords, lighting, quality boosters specific to ${platform}.`,
      missing,
    };
  }

  if (mode === "code") {
    const task = s(fd.task);
    const language = s(fd.language);
    const framework = s(fd.framework);
    const level = s(fd.level);
    const includesArr = Array.isArray(fd.includes)
      ? fd.includes.filter((v): v is string => typeof v === "string")
      : [];

    const missing: string[] = [];
    if (!task) missing.push("Task");
    if (!language) missing.push("Programming language");
    if (!level) missing.push("Experience level");

    return {
      system:
        "You are an expert at writing coding prompts. Return ONLY the prompt. No explanation.",
      user: `Create a prompt to build: ${task}
Language: ${language}
Framework: ${framework || "(any suitable)"}
Level: ${level}
Must include: ${includesArr.length > 0 ? includesArr.join(", ") : "(none specified)"}

Make it specific with:
- Clear requirements
- Expected inputs and outputs
- Error handling requirements
- Code style preferences`,
      missing,
    };
  }

  if (mode === "data") {
    const data = s(fd.data);
    const goal = s(fd.goal);
    const tool = s(fd.tool);
    const output = s(fd.output);

    const missing: string[] = [];
    if (!data) missing.push("Data description");
    if (!goal) missing.push("Insight goal");
    if (!tool) missing.push("Tool");
    if (!output) missing.push("Output");

    return {
      system:
        "You are an expert at data analysis prompts. Return ONLY prompt.",
      user: `Create a data analysis prompt:
Data: ${data}
Goal: ${goal}
Tool: ${tool}
Output: ${output}`,
      missing,
    };
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const mode = body.mode;
    const formData = body.formData ?? {};

    if (mode !== "chatgpt" && mode !== "image" && mode !== "code" && mode !== "data") {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    const parts = buildPromptParts(mode, formData);
    if (!parts) {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }
    if (parts.missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${parts.missing.join(", ")}.` },
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
          { role: "system", content: parts.system },
          { role: "user", content: parts.user },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[Prompt] Groq error:", errText);
      return NextResponse.json({ error: "Failed to generate prompt." }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const prompt: string = (groqData.choices?.[0]?.message?.content ?? "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 500 });
    }

    return NextResponse.json({ prompt });
  } catch (err) {
    console.error("[Prompt] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
