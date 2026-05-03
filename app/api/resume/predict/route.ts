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

interface PredictResult {
  technicalQuestions: string[];
  behavioralQuestions: string[];
  roleSpecificQuestions: string[];
  trickyQuestions: string[];
  questionsToAsk: string[];
  preparationTips: string[];
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const pastedText = form.get("text");
    const jobDescription = form.get("jobDescription");
    const companyName = form.get("companyName");

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
        console.error("[Predict] PDF parse error:", err);
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

    const company =
      typeof companyName === "string" ? companyName.trim() : "";

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
              "You are an expert technical interviewer with 15 years experience. Predict interview questions based on resume and job description. Return ONLY valid JSON. No markdown.",
          },
          {
            role: "user",
            content: `Predict interview questions for this candidate:

Resume: ${truncatedResume}
Job Description: ${truncatedJD}
Company: ${company || "(not specified)"}

Return this exact JSON:
{
  "technicalQuestions": ["array of 5 strings - technical questions from their resume"],
  "behavioralQuestions": ["array of 3 strings - behavioral based on experience"],
  "roleSpecificQuestions": ["array of 4 strings - specific to the job description"],
  "trickyQuestions": ["array of 3 strings - hard questions they might struggle with"],
  "questionsToAsk": ["array of 3 strings - good questions candidate should ask interviewer"],
  "preparationTips": ["array of 3 strings - specific tips based on their profile"]
}

Return ONLY valid JSON. No markdown fences. No commentary.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1800,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[Predict] Groq error:", errText);
      return NextResponse.json({ error: "Failed to predict questions." }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? "";

    let predict: PredictResult;
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      predict = JSON.parse(cleaned);
    } catch (err) {
      console.error("[Predict] JSON parse error:", err, "raw:", raw);
      return NextResponse.json({ error: "Failed to parse questions." }, { status: 500 });
    }

    return NextResponse.json(predict);
  } catch (err) {
    console.error("[Predict] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
