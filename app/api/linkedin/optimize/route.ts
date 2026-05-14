import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── Prompt builders ──────────────────────────────────────────────────────────

function manualPrompt(sections: string, targetRole: string) {
  return `Optimize this LinkedIn profile for maximum recruiter appeal and keyword density in the AI/ML space.
${targetRole ? `\nTarget role: ${targetRole}` : ''}

${sections}

Return this exact JSON:
{
  "optimizedHeadline": "improved headline (under 220 chars, keyword-rich)",
  "optimizedAbout": "rewritten About section (2000 chars max, strong opening hook, keywords woven in, first-person, ends with CTA)",
  "keywordsAdded": ["important keywords/skills added or strengthened"],
  "improvements": ["3-5 specific changes made and why"],
  "profileStrengthScore": number 0-100,
  "profileStrengthLabel": "Beginner|Intermediate|All-Star",
  "quickTips": ["3 quick actionable tips to further improve"],
  "skillsToAdd": ["5-8 skills/technologies to add to the Skills section based on experience"],
  "crossSectionKeywords": ["keywords visible in experience/education that should also appear in headline or About but currently don't"],
  "profileCompleteness": {
    "score": number 0-100,
    "missing": ["list of profile sections that appear incomplete or missing, e.g. 'Featured section', 'Skills endorsements', 'Certifications'"]
  }
}`
}

function pdfPrompt(profileText: string, targetRole: string) {
  return `You are given a raw LinkedIn profile export (PDF-to-text). The formatting is messy — extract all visible sections (Headline, About/Summary, Experience, Education, Skills, Certifications) and optimize the full profile for maximum recruiter visibility in the AI/ML space.
${targetRole ? `\nTarget role: ${targetRole}` : ''}

RAW PROFILE TEXT:
${profileText}

Return this exact JSON with comprehensive analysis of the FULL profile:
{
  "optimizedHeadline": "improved headline (under 220 chars, keyword-rich, reflects full career scope from the PDF)",
  "optimizedAbout": "completely rewritten About/Summary (2000 chars max, strong opening hook, AI/ML keywords woven in, first-person, ends with CTA — synthesize the best parts of their experience)",
  "keywordsAdded": ["important AI/ML keywords/skills added or strengthened"],
  "improvements": ["4-6 specific improvements and why they matter for recruiter visibility"],
  "profileStrengthScore": number 0-100,
  "profileStrengthLabel": "Beginner|Intermediate|All-Star",
  "quickTips": ["3 quick actionable tips"],
  "experienceRewrites": [
    {
      "role": "job title from their experience",
      "company": "company name",
      "bullets": ["rewritten bullet 1 — strong verb + quantified impact", "rewritten bullet 2", "rewritten bullet 3"]
    }
  ],
  "skillsToAdd": ["5-8 skills/technologies they clearly have but may not list, or should add based on their experience"],
  "crossSectionKeywords": ["specific technical keywords visible in their experience/projects that should also appear in headline or About but currently don't"],
  "profileCompleteness": {
    "score": number 0-100,
    "missing": ["sections that appear incomplete or missing based on the PDF, e.g. 'Featured section', 'Certifications', 'Volunteer work', 'Publications'"]
  }
}

Requirements:
- experienceRewrites MUST cover the top 2-3 most recent or relevant roles from the PDF
- Each role MUST have 3 strong rewritten bullets using action verbs + metrics where inferable
- skillsToAdd must be specific technologies/frameworks (not generic like "communication")
- crossSectionKeywords must be specific terms, not vague categories`
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:linkedin-opt`, 6, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  try {
    const contentType = req.headers.get('content-type') ?? ''
    let isPdf = false
    let profileText = ''
    let headline = ''
    let about = ''
    let experience = ''
    let targetRole = ''

    if (contentType.includes('multipart/form-data')) {
      isPdf = true
      const formData = await req.formData()
      targetRole = (formData.get('targetRole') as string | null)?.trim() ?? ''
      const pdfFile = formData.get('pdf') as File | null
      if (!pdfFile) return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 })
      const arrayBuf = await pdfFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuf)
      const pdfParse = (await import('pdf-parse')).default
      const parsed = await pdfParse(buffer)
      profileText = parsed.text.slice(0, 14_000)
      if (!profileText.trim()) {
        return NextResponse.json({ error: 'Could not extract text from the PDF. Make sure it is a LinkedIn profile export.' }, { status: 400 })
      }
    } else {
      const body = await req.json()
      headline   = body.headline   ?? ''
      about      = body.about      ?? ''
      experience = body.experience ?? ''
      targetRole = body.targetRole ?? ''
      if (!about?.trim() && !headline?.trim()) {
        return NextResponse.json({ error: 'At least headline or About section is required.' }, { status: 400 })
      }
    }

    let userContent: string
    if (isPdf) {
      userContent = pdfPrompt(profileText, targetRole)
    } else {
      const safeHeadline   = headline   ? String(headline).slice(0, 300)    : ''
      const safeAbout      = about      ? String(about).slice(0, 8000)      : ''
      const safeExperience = experience ? String(experience).slice(0, 6000) : ''
      const sections = [
        safeHeadline   ? `Headline: ${safeHeadline}`                   : '',
        safeAbout      ? `About/Summary:\n${safeAbout}`                : '',
        safeExperience ? `Experience highlights:\n${safeExperience}`   : '',
      ].filter(Boolean).join('\n\n')
      userContent = manualPrompt(sections, targetRole)
    }

    const raw = (await callAI({
      messages: [
        {
          role: 'system',
          content: 'You are an expert LinkedIn profile optimizer for AI/ML professionals. Return ONLY valid JSON. No markdown fences.',
        },
        { role: 'user', content: userContent },
      ],
      temperature: 0.4,
      max_tokens: isPdf ? 4000 : 2500,
      response_format: { type: 'json_object' },
    })).trim()

    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json({ ...result, inputMode: isPdf ? 'pdf' : 'manual' })
  } catch (err) {
    console.error('[LinkedIn Optimize]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
