import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ExperienceInput {
  company?: string;
  role?: string;
  duration?: string;
  responsibilities?: string;
}

interface ProjectInput {
  name?: string;
  description?: string;
}

interface BuildRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
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
  projects?: ProjectInput[];
}

function s(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BuildRequest;

    const fullName = s(body.fullName);
    const email = s(body.email);
    const phone = s(body.phone);
    const linkedin = s(body.linkedin);
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

    const experiences = (Array.isArray(body.experiences) ? body.experiences : [])
      .map((e) => ({
        company: s(e?.company),
        role: s(e?.role),
        duration: s(e?.duration),
        responsibilities: s(e?.responsibilities),
      }))
      .filter((e) => e.company || e.role || e.responsibilities);

    const projects = (Array.isArray(body.projects) ? body.projects : [])
      .map((p) => ({
        name: s(p?.name),
        description: s(p?.description),
      }))
      .filter((p) => p.name || p.description);

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

    const contactLine = [email, phone, location].filter(Boolean).join(" · ");
    const linksLine = linkedin ? `LinkedIn: ${linkedin}` : "";

    const workHistory =
      experiences
        .map(
          (e, i) =>
            `${i + 1}. ${e.role || "(role)"} at ${e.company || "(company)"} (${
              e.duration || "(duration)"
            })\nResponsibilities: ${e.responsibilities || "(not provided)"}`
        )
        .join("\n\n") || "(none provided)";

    const projectsBlock =
      projects.length > 0
        ? projects
            .map(
              (p, i) =>
                `${i + 1}. ${p.name || "(unnamed)"}: ${p.description || "(no description)"}`
            )
            .join("\n")
        : "(none provided)";

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
            content: "You are an expert resume writer. Return ONLY valid JSON. No markdown.",
          },
          {
            role: "user",
            content: `Create resume data for:
Name: ${fullName}
Contact: ${contactLine || "(not provided)"}
${linksLine}
Target Role: ${targetRole}
Experience: ${yearsExperience} years
Current Role: ${currentRole}
Top Skills: ${topSkills}
About: ${oneLiner || "(not provided)"}

Work History:
${workHistory}

Skills: ${technicalSkills}
Tools: ${tools || "(not provided)"}

Education: ${degree} from ${college} (${graduationYear})

Projects:
${projectsBlock}

Return this exact JSON:
{
  "summary": "3-sentence ATS-optimized professional summary tailored to ${targetRole}",
  "experiences": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "bullets": ["3 bullet strings — each starts with an action verb and includes a quantified achievement and impact"]
    }
  ],
  "skillsFormatted": "comma-separated technical skills, ordered for ATS relevance to ${targetRole}",
  "toolsFormatted": "comma-separated tools and frameworks, ordered for ATS relevance"
}

Use the same number of experiences as Work History above, in the same order.
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
      console.error("[Build] Groq error:", errText);
      return NextResponse.json({ error: "Failed to generate resume." }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const raw: string = (groqData.choices?.[0]?.message?.content ?? "").trim();

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
