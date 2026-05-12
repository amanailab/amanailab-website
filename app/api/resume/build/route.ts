import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai-fallback";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ExperienceInput {
  company?: string;
  role?: string;
  duration?: string;
  location?: string;
  responsibilities?: string;
}

interface ProjectInput {
  name?: string;
  description?: string;
  techStack?: string;
}

interface CertificationInput {
  name?: string;
  issuer?: string;
  year?: string;
}

interface BuildRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
  targetRole?: string;
  currentRole?: string;
  yearsExperience?: string;
  topSkills?: string;
  oneLiner?: string;
  experiences?: ExperienceInput[];
  technicalSkills?: string;
  tools?: string;
  degree?: string;
  college?: string;
  graduationYear?: string;
  gpa?: string;
  projects?: ProjectInput[];
  certifications?: CertificationInput[];
}

function s(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  // Rate limit: 3 builds per 2 minutes per IP
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:resume-build`, 3, 120_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Please wait ${retryAfterSec} seconds before generating again.` },
      { status: 429 }
    )
  }

  try {
    const body = (await req.json()) as BuildRequest;

    const fullName = s(body.fullName);
    const email = s(body.email);
    const phone = s(body.phone);
    const linkedin = s(body.linkedin);
    const github = s(body.github);
    const website = s(body.website);
    const location = s(body.location);
    const targetRole = s(body.targetRole);
    const currentRole = s(body.currentRole);
    const yearsExperience = s(body.yearsExperience);
    const topSkills = s(body.topSkills);
    const oneLiner = s(body.oneLiner);
    const technicalSkills = s(body.technicalSkills);
    const tools = s(body.tools);
    const degree = s(body.degree);
    const college = s(body.college);
    const graduationYear = s(body.graduationYear);
    const gpa = s(body.gpa);

    const experiences = (Array.isArray(body.experiences) ? body.experiences : [])
      .map((e) => ({
        company: s(e?.company),
        role: s(e?.role),
        duration: s(e?.duration),
        location: s(e?.location),
        responsibilities: s(e?.responsibilities),
      }))
      .filter((e) => e.company || e.role || e.responsibilities);

    const projects = (Array.isArray(body.projects) ? body.projects : [])
      .map((p) => ({
        name: s(p?.name),
        description: s(p?.description),
        techStack: s(p?.techStack),
      }))
      .filter((p) => p.name || p.description);

    const certifications = (Array.isArray(body.certifications) ? body.certifications : [])
      .map((c) => ({
        name: s(c?.name),
        issuer: s(c?.issuer),
        year: s(c?.year),
      }))
      .filter((c) => c.name);

    // Required field validation
    const missing: string[] = [];
    if (!fullName) missing.push("Full Name");
    if (!email) missing.push("Email");
    if (!targetRole) missing.push("Target Role");
    if (!currentRole) missing.push("Current Role");
    if (!yearsExperience) missing.push("Years of Experience");
    if (!topSkills) missing.push("Top 3 Skills");
    if (experiences.length === 0) missing.push("At least one Work Experience");
    if (!technicalSkills) missing.push("Technical Skills");
    if (!degree) missing.push("Degree");
    if (!college) missing.push("College/University");
    if (!graduationYear) missing.push("Year of Graduation");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const contactLine = [email, phone, location].filter(Boolean).join(" | ");
    const linksLine = [linkedin, github, website].filter(Boolean).join(" | ");

    const workHistory = experiences.map((e, i) =>
      `${i + 1}. ${e.role || "(role)"} at ${e.company || "(company)"}${e.location ? `, ${e.location}` : ""} (${e.duration || "dates not specified"})
   Responsibilities: ${e.responsibilities || "(not provided)"}`
    ).join("\n\n") || "(none provided)";

    const projectsBlock = projects.length > 0
      ? projects.map((p, i) =>
          `${i + 1}. ${p.name || "(unnamed)"}${p.techStack ? ` [${p.techStack}]` : ""}: ${p.description || "(no description)"}`
        ).join("\n")
      : "(none)";

    const certsBlock = certifications.length > 0
      ? certifications.map(c => `- ${c.name}${c.issuer ? ` | ${c.issuer}` : ""}${c.year ? ` | ${c.year}` : ""}`).join("\n")
      : "(none)";

    const raw: string = (await callAI({
      messages: [
          {
            role: "system",
            content: `You are an elite ATS resume writer who creates resumes that score 90%+ on ATS systems and impress human recruiters. You write powerful bullet points that start with strong action verbs, include specific metrics, and showcase real impact. Return ONLY valid JSON. No markdown.`,
          },
          {
            role: "user",
            content: `Create a world-class ATS-optimised resume for:
Name: ${fullName}
Contact: ${contactLine || "(not provided)"}
${linksLine ? `Links: ${linksLine}` : ""}
Target Role: ${targetRole}
Experience: ${yearsExperience} years
Current Role: ${currentRole}
Top Skills: ${topSkills}
About: ${oneLiner || "(not provided)"}

Work History:
${workHistory}

Technical Skills: ${technicalSkills}
Tools & Frameworks: ${tools || "(not provided)"}

Education: ${degree} from ${college}${gpa ? ` | GPA: ${gpa}` : ""} (${graduationYear})

Projects:
${projectsBlock}

Certifications:
${certsBlock}

IMPORTANT RULES for bullets:
- Every bullet MUST start with a strong past-tense action verb (Built, Developed, Designed, Led, Reduced, Improved, Deployed, Achieved, Implemented, Optimized…)
- Include specific numbers, %, $, or scale wherever possible (even estimated)
- Show impact: what changed because of this work?
- Max 2 lines per bullet, no fluff

Return this exact JSON:
{
  "summary": "3-sentence ATS-optimized professional summary for ${targetRole}. Sentence 1: years of experience + key skills. Sentence 2: biggest achievement with a number. Sentence 3: what value they bring.",
  "experiences": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "bullets": ["4 powerful bullet strings — action verb + metric + impact"]
    }
  ],
  "skillsFormatted": "comma-separated technical skills, ordered for ATS relevance to ${targetRole}",
  "toolsFormatted": "comma-separated tools and frameworks, ordered for ATS relevance"
}

Use the same number of experiences as Work History above, in the same order.
Return ONLY valid JSON. No markdown fences. No commentary.`,
          },
        ],
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    })).trim();

    if (!raw) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 500 });
    }

    let resume: unknown;
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      resume = JSON.parse(cleaned);
    } catch (err) {
      console.error("[Build] JSON parse error:", err, "raw:", raw);
      return NextResponse.json({ error: "Failed to parse resume." }, { status: 500 });
    }

    return NextResponse.json({ resume });
  } catch (err) {
    console.error("[Build] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
