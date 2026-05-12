import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

function extractArxivId(input: string): string | null {
  const patterns = [
    /arxiv\.org\/abs\/([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)/i,
    /arxiv\.org\/pdf\/([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)/i,
    /^([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)$/,
  ]
  for (const p of patterns) {
    const m = input.trim().match(p)
    if (m) return m[1].replace(/v\d+$/, '')
  }
  return null
}

async function fetchArxivMeta(id: string) {
  try {
    const res = await fetch(`https://export.arxiv.org/api/query?id_list=${id}&max_results=1`, {
      headers: { 'User-Agent': 'AmanAILab/1.0 (amanailab.com)' },
    })
    if (!res.ok) return null
    const xml = await res.text()

    // arXiv XML has TWO <title> tags: feed title first, then paper title inside <entry>
    // We extract everything inside <entry>...</entry> first to avoid the feed title
    const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/)
    const entry = entryMatch?.[1] ?? xml

    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]
      ?.replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() ?? ''

    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/)
    const summary = (summaryMatch?.[1] ?? '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const year = xml.match(/<published>(\d{4})/)?.[1] ?? ''

    const authors: string[] = []
    const authorRe = /<name>([^<]+)<\/name>/g
    let m
    while ((m = authorRe.exec(xml)) !== null) authors.push(m[1].trim())

    if (!summary) return null
    return { title, abstract: summary, authors: authors.slice(0, 6), year }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:paper`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  try {
    const { input } = await req.json()
    if (!input?.trim()) {
      return NextResponse.json({ error: 'Please provide an arXiv URL or paper text.' }, { status: 400 })
    }

    let paperTitle = ''
    let paperText  = ''
    let authors: string[] = []
    let year    = ''
    let arxivId = ''

    const id = extractArxivId(input.trim())
    if (id) {
      arxivId = id
      const meta = await fetchArxivMeta(id)
      if (!meta) {
        return NextResponse.json({ error: 'Could not fetch paper from arXiv. Check the URL and try again.' }, { status: 400 })
      }
      paperTitle = meta.title
      paperText  = meta.abstract
      authors    = meta.authors
      year       = meta.year
    } else {
      paperText = input.trim().slice(0, 8000)
    }

    const raw = (await callAI({
      messages: [
          {
            role: 'system',
            content: `You are a world-class AI/ML research communicator and professor. Your job is to write RICH, DETAILED, EDUCATIONAL explanations of research papers. You never give shallow summaries — you go deep. You use analogies, examples, and step-by-step breakdowns. You bridge the gap between researchers and practitioners. Return ONLY valid JSON. No markdown fences.`,
          },
          {
            role: 'user',
            content: `Give a comprehensive, detailed explanation of this AI/ML research paper. Go deep — this should be educational, not just a summary.

${paperTitle ? `Title: ${paperTitle}` : ''}
${authors.length ? `Authors: ${authors.join(', ')}` : ''}
${year ? `Year: ${year}` : ''}

Paper content:
${paperText}

Return this exact JSON with DETAILED, RICH content in each field:
{
  "inferredTitle": "exact paper title",
  "oneLiner": "one punchy sentence capturing the core idea — like a tweet",
  "simpleExplanation": "Explain this paper to a smart non-expert using a real-world analogy. 6-8 sentences. Walk them through the core idea step by step. Use concrete examples. Avoid jargon completely.",
  "problemSolved": "Describe the SPECIFIC problem in 4-5 sentences. What was broken before this paper? What were existing solutions doing wrong? Why was this a hard problem? Include any stats or context if known.",
  "howItWorks": "Detailed technical explanation in plain English — 8-10 sentences. Walk through the architecture/method step by step. Explain the key innovation with enough depth that an ML practitioner would understand HOW it actually works, not just WHAT it does. Use comparisons to familiar concepts.",
  "architectureDetails": "Specific technical details: key components, how data flows through the system, what makes it different architecturally. 4-6 sentences. Be precise about the method.",
  "keyContributions": [
    {"point": "Short contribution title", "detail": "3-4 sentence explanation of WHY this contribution matters, what problem it solves, and what was novel about it"}
  ],
  "experimentResults": "What experiments did the authors run? What were the key results and benchmark numbers? How did it compare to prior work? 4-5 sentences.",
  "practicalApplications": ["detailed real-world application 1 — explain HOW it would be used", "application 2 with context", "application 3"],
  "limitations": ["specific limitation 1 with explanation", "limitation 2"],
  "keyTerms": [
    {"term": "technical term used in the paper", "definition": "2-3 sentence clear definition with an analogy or example — explain it as if teaching a beginner"}
  ],
  "whoShouldRead": "Beginner | Intermediate | Advanced",
  "importanceScore": number 1-10,
  "importanceReason": "3-4 sentences explaining the paper's impact on the field, what it changed, and why practitioners should care about it today",
  "relatedConcepts": ["concept 1 — brief note on why it relates", "concept 2", "concept 3", "concept 4"],
  "tweetSummary": "Engaging tweet under 280 chars — make it shareable and interesting, no hashtags"
}

Requirements:
- simpleExplanation MUST use a real-world analogy
- howItWorks MUST be technical but readable — go deep
- keyContributions MUST have at least 3 items with detailed explanations
- keyTerms MUST have at least 5 terms with detailed definitions
- Do NOT be generic — everything must be specific to THIS paper`,
          },
        ],
      temperature: 0.3,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
    })).trim()
    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))

    return NextResponse.json({ ...result, arxivId, authors, year, originalTitle: paperTitle })
  } catch (err) {
    console.error('[paper/explain]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
