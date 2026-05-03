import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_CHARS = 12000;
const MIN_RESUME_CHARS = 100;

const IMAGE_PDF_MESSAGE =
  "Your PDF appears to be image-based or scanned. Please try one of these:\n1. Export your resume from Word/Google Docs as PDF\n2. Copy your resume text and save as PDF\n3. Use a text-based PDF resume\n\nOr paste your resume text directly using the textarea below.";

const SHORT_TEXT_MESSAGE =
  "Resume text is too short. Please paste your full resume content (at least 100 characters).";

type SectionStatus = "good" | "needs_work" | "missing";

interface AnalysisResult {
  score: number;
  summary: string;
  missingKeywords: string[];
  sectionScores: {
    contactInfo: SectionStatus;
    summary: SectionStatus;
    experience: SectionStatus;
    skills: SectionStatus;
    projects: SectionStatus;
    education: SectionStatus;
  };
  improvements: string[];
  improvedSummary: string;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text ?? "").replace(/\s+\n/g, "\n").trim();
  } finally {
    await parser.destroy().catch(() => {});
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const role = form.get("role");
    const pastedText = form.get("text");

    if (typeof role !== "string" || !role.trim()) {
      return NextResponse.json({ error: "Target role is required." }, { status: 400 });
    }

    let resumeText = "";

    // Prefer pasted text when provided.
    if (typeof pastedText === "string" && pastedText.trim().length > 0) {
      resumeText = pastedText.trim();
    } else {
      // Otherwise fall back to PDF parsing.
      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: "Resume file or pasted text is required." },
          { status: 400 }
        );
      }
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      try {
        resumeText = await extractPdfText(buffer);
      } catch (err) {
        console.error("[Resume] PDF parse error:", err);
        return NextResponse.json({ error: IMAGE_PDF_MESSAGE }, { status: 400 });
      }

      if (resumeText.trim().length < MIN_RESUME_CHARS) {
        return NextResponse.json({ error: IMAGE_PDF_MESSAGE }, { status: 400 });
      }
    }

    if (resumeText.trim().length < MIN_RESUME_CHARS) {
      return NextResponse.json({ error: SHORT_TEXT_MESSAGE }, { status: 400 });
    }

    const truncated =
      resumeText.length > MAX_RESUME_CHARS ? resumeText.slice(0, MAX_RESUME_CHARS) : resumeText;

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
              "You are an expert ATS resume analyzer and career coach specializing in AI/ML roles. Analyze resumes and return ONLY valid JSON. No markdown. No explanation outside JSON.",
          },
          {
            role: "user",
            content: `Analyze this resume for the role of: ${role}

Resume content:
${truncated}

Return this exact JSON structure:
{
  "score": number between 0 and 100,
  "summary": "2-3 sentence overall assessment of what the resume does well",
  "missingKeywords": ["array of strings - important keywords for this role missing from the resume, max 10"],
  "sectionScores": {
    "contactInfo": "good" | "needs_work" | "missing",
    "summary": "good" | "needs_work" | "missing",
    "experience": "good" | "needs_work" | "missing",
    "skills": "good" | "needs_work" | "missing",
    "projects": "good" | "needs_work" | "missing",
    "education": "good" | "needs_work" | "missing"
  },
  "improvements": ["5 specific actionable improvement strings"],
  "improvedSummary": "rewritten 3-4 sentence professional summary optimized for this role"
}

Return ONLY valid JSON. No markdown fences. No commentary.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[Resume] Groq error:", errText);
      return NextResponse.json({ error: "Failed to analyze resume." }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? "";

    let analysis: AnalysisResult;
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      analysis = JSON.parse(cleaned);
    } catch (err) {
      console.error("[Resume] JSON parse error:", err, "raw:", raw);
      return NextResponse.json({ error: "Failed to parse analysis." }, { status: 500 });
    }

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("[Resume] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
