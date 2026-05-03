import { NextResponse } from "next/server";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> =
  require("pdf-parse/lib/pdf-parse");

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_CHARS = 12000;
const MAX_JD_CHARS = 6000;
const MIN_RESUME_CHARS = 100;
const MIN_JD_CHARS = 50;

const IMAGE_PDF_MESSAGE =
  "Your PDF appears to be image-based or scanned. Please paste your resume text instead, or use a text-based PDF resume.";

type Verdict = "strong_match" | "good_match" | "weak_match" | "poor_match";

interface MatchResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  topSuggestions: string[];
  verdict: Verdict;
  verdictReason: string;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const pastedText = form.get("text");
    const jobDescription = form.get("jobDescription");

    if (typeof jobDescription !== "string" || jobDescription.trim().length < MIN_JD_CHARS) {
      return NextResponse.json(
        { error: "Job description is required (at least 50 characters)." },
        { status: 400 }
      );
    }

    let resumeText = "";

    if (typeof pastedText === "string" && pastedText.trim().length > 0) {
      resumeText = pastedText.trim();
    } else {
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

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      try {
        const data = await pdfParse(buffer);
        resumeText = (data.text ?? "").replace(/\s+\n/g, "\n").trim();
      } catch (err) {
        console.error("[Match] PDF parse error:", err);
        return NextResponse.json(
          {
            error:
              "Could not read PDF. Please paste your resume text in the text box instead.",
          },
          { status: 400 }
        );
      }

      if (resumeText.trim().length < MIN_RESUME_CHARS) {
        return NextResponse.json({ error: IMAGE_PDF_MESSAGE }, { status: 400 });
      }
    }

    if (resumeText.trim().length < MIN_RESUME_CHARS) {
      return NextResponse.json(
        { error: "Resume text is too short. Please paste your full resume." },
        { status: 400 }
      );
    }

    const truncatedResume =
      resumeText.length > MAX_RESUME_CHARS ? resumeText.slice(0, MAX_RESUME_CHARS) : resumeText;
    const truncatedJD =
      jobDescription.length > MAX_JD_CHARS
        ? jobDescription.slice(0, MAX_JD_CHARS)
        : jobDescription.trim();

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
              "You are an ATS expert. Compare resumes against job descriptions and return ONLY valid JSON. No markdown. No explanation outside JSON.",
          },
          {
            role: "user",
            content: `Compare this resume against this job description.

Resume:
${truncatedResume}

Job Description:
${truncatedJD}

Return this exact JSON structure:
{
  "matchScore": number 0-100,
  "matchedKeywords": ["array of strings - keywords in BOTH resume and JD"],
  "missingKeywords": ["array of strings - keywords in JD but NOT in resume"],
  "matchedSkills": ["array of strings - skills the candidate has that the JD asks for"],
  "missingSkills": ["array of strings - skills the JD asks for that the candidate lacks"],
  "topSuggestions": ["exactly 5 strings - specifically what to add or change in the resume to match this JD"],
  "verdict": "strong_match" | "good_match" | "weak_match" | "poor_match",
  "verdictReason": "1 sentence explaining the verdict"
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
      console.error("[Match] Groq error:", errText);
      return NextResponse.json({ error: "Failed to match resume." }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? "";

    let match: MatchResult;
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      match = JSON.parse(cleaned);
    } catch (err) {
      console.error("[Match] JSON parse error:", err, "raw:", raw);
      return NextResponse.json({ error: "Failed to parse match result." }, { status: 500 });
    }

    return NextResponse.json(match);
  } catch (err) {
    console.error("[Match] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
