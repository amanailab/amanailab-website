import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { callAI, AICallError } from "@/lib/ai-fallback";
import { enforceRateLimit } from "@/lib/rate-limit";

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

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "resume-coverletter", 5, 60_000);
  if (limited) return limited;
  try {
    const form = await req.formData();
    const file = form.get("file");
    const pastedText = form.get("text");
    const jobDescription = form.get("jobDescription");
    const companyName = form.get("companyName");
    const userName = form.get("userName");

    if (typeof jobDescription !== "string" || jobDescription.trim().length < MIN_JD_CHARS) {
      return NextResponse.json(
        { error: "Job description is required (at least 50 characters)." },
        { status: 400 }
      );
    }
    if (typeof companyName !== "string" || !companyName.trim()) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }
    if (typeof userName !== "string" || !userName.trim()) {
      return NextResponse.json({ error: "Your name is required." }, { status: 400 });
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
        console.error("[CoverLetter] PDF parse error:", err);
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

    let coverLetter: string;
    try {
      coverLetter = (await callAI({
        messages: [
          {
            role: "system",
            content:
              "You are an expert cover letter writer. Write professional, personalized cover letters. Return ONLY the cover letter text. No explanation.",
          },
          {
            role: "user",
            content: `Write a cover letter for ${userName.trim()} applying to ${companyName.trim()}.

Resume: ${truncatedResume}
Job Description: ${truncatedJD}

Requirements:
- Professional tone
- 3 paragraphs
- Paragraph 1: Why this role excites them
- Paragraph 2: Relevant experience match
- Paragraph 3: Call to action
- ATS optimized
- Use keywords from job description
- Max 300 words`,
          },
        ],
        temperature: 0.6,
        max_tokens: 800,
      })).trim();
    } catch (err) {
      if (err instanceof AICallError) {
        let friendlyError = "Failed to generate cover letter. Please try again.";
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

    if (!coverLetter) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 500 });
    }

    return NextResponse.json({ coverLetter });
  } catch (err) {
    console.error("[CoverLetter] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
