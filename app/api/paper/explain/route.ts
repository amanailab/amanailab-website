import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

type Level = 'eli5' | 'practitioner' | 'expert'

// ─── arXiv helpers (preserved from original) ────────────────────────────────

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

// ─── Multi-source URL resolvers ──────────────────────────────────────────────

/** HuggingFace papers URLs embed the arXiv ID directly in the path. */
function extractHuggingFaceArxivId(input: string): string | null {
  const m = input.match(/huggingface\.co\/papers\/([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)/i)
  return m ? m[1].replace(/v\d+$/, '') : null
}

/** Papers With Code: extract slug then hit their API to get an arXiv ID. */
async function resolveWithCode(input: string): Promise<string | null> {
  const m = input.match(/paperswithcode\.com\/paper\/([a-z0-9-]+)/i)
  if (!m) return null
  const slug = m[1]
  try {
    const res = await fetch(
      `https://paperswithcode.com/api/v1/papers/?title=${encodeURIComponent(slug)}`,
      { headers: { 'User-Agent': 'AmanAILab/1.0 (amanailab.com)' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const arxivUrl: string | undefined = data?.results?.[0]?.arxiv_id
    if (arxivUrl) return arxivUrl.replace(/v\d+$/, '')
  } catch {
    // fall through
  }
  return null
}

/** Semantic Scholar: extract hash ID, call their API, extract arXiv ID from externalIds. */
async function resolveSemanticScholar(
  input: string
): Promise<{ arxivId: string | null; title: string; abstract: string; authors: string[]; year: string } | null> {
  const m = input.match(/semanticscholar\.org\/paper\/[^/]+\/([a-f0-9]{40})/i)
  if (!m) return null
  const ssId = m[1]
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/${ssId}?fields=title,abstract,authors,year,externalIds`,
      { headers: { 'User-Agent': 'AmanAILab/1.0 (amanailab.com)' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const arxivId: string | null = data?.externalIds?.ArXiv ?? null
    const title: string = data?.title ?? ''
    const abstract: string = data?.abstract ?? ''
    const authors: string[] = (data?.authors ?? []).slice(0, 6).map((a: { name?: string }) => a.name ?? '')
    const year: string = data?.year ? String(data.year) : ''
    if (!abstract && !arxivId) return null
    return { arxivId, title, abstract, authors, year }
  } catch {
    return null
  }
}

// ─── Level system prompt ─────────────────────────────────────────────────────

function levelSystemPrompt(level: Level): string {
  if (level === 'eli5') {
    return `You explain research papers to complete beginners using real-world analogies, simple language, and zero jargon. Every explanation should feel like talking to a curious teenager. Make abstract concepts concrete.`
  }
  if (level === 'expert') {
    return `You explain research papers to senior ML researchers and PhD students. Use precise technical language, include mathematical intuition, reference related prior work, and provide deep architectural analysis.`
  }
  // practitioner (default)
  return `You are a world-class AI/ML research communicator and professor. Your job is to write RICH, DETAILED, EDUCATIONAL explanations of research papers. You never give shallow summaries — you go deep. You use analogies, examples, and step-by-step breakdowns. You bridge the gap between researchers and practitioners.`
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:paper`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  // Daily allowance: 3/day anonymous (per IP), 20/day signed-in
  const { enforceDailyAllowance } = await import('@/lib/daily-allowance')
  const exhausted = await enforceDailyAllowance(req, 'paper-explain')
  if (exhausted) return exhausted

  try {
    let input = ''
    let level: Level = 'practitioner'
    let pdfText = ''

    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      input = (formData.get('input') as string | null)?.trim() ?? ''
      level = ((formData.get('level') as string | null) ?? 'practitioner') as Level
      const pdfFile = formData.get('pdf') as File | null
      if (pdfFile) {
        const arrayBuf = await pdfFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuf)
        const pdfParse = (await import('pdf-parse')).default
        const parsed = await pdfParse(buffer)
        pdfText = parsed.text.slice(0, 14_000)
      }
    } else {
      const body = await req.json()
      input = (body.input ?? '').trim()
      level = (body.level ?? 'practitioner') as Level
    }

    if (!['eli5', 'practitioner', 'expert'].includes(level)) level = 'practitioner'

    // If we have PDF text, that's our paper content — skip URL resolution
    if (pdfText) {
      const result = await runAI({
        paperTitle: '',
        paperText: pdfText,
        authors: [],
        year: '',
        arxivId: '',
        level,
      })
      return NextResponse.json({ ...result, arxivId: '', authors: [], year: '', originalTitle: '', level })
    }

    if (!input) {
      return NextResponse.json({ error: 'Please provide an arXiv URL, paper URL, or paper text.' }, { status: 400 })
    }

    let paperTitle = ''
    let paperText = ''
    let authors: string[] = []
    let year = ''
    let arxivId = ''

    // ── 1. Try arXiv ID/URL directly ──
    const directId = extractArxivId(input)
    if (directId) {
      arxivId = directId
      const meta = await fetchArxivMeta(directId)
      if (!meta) {
        return NextResponse.json(
          { error: 'Could not fetch paper from arXiv. Check the URL and try again.' },
          { status: 400 }
        )
      }
      paperTitle = meta.title
      paperText = meta.abstract
      authors = meta.authors
      year = meta.year
    }

    // ── 2. Try HuggingFace papers URL ──
    else if (input.includes('huggingface.co/papers/')) {
      const hfId = extractHuggingFaceArxivId(input)
      if (!hfId) {
        return NextResponse.json({ error: 'Could not parse HuggingFace paper URL.' }, { status: 400 })
      }
      arxivId = hfId
      const meta = await fetchArxivMeta(hfId)
      if (!meta) {
        return NextResponse.json(
          { error: 'Could not fetch paper from arXiv using HuggingFace URL.' },
          { status: 400 }
        )
      }
      paperTitle = meta.title
      paperText = meta.abstract
      authors = meta.authors
      year = meta.year
    }

    // ── 3. Try Papers With Code URL ──
    else if (input.includes('paperswithcode.com/paper/')) {
      const pwcArxivId = await resolveWithCode(input)
      if (pwcArxivId) {
        arxivId = pwcArxivId
        const meta = await fetchArxivMeta(pwcArxivId)
        if (meta) {
          paperTitle = meta.title
          paperText = meta.abstract
          authors = meta.authors
          year = meta.year
        }
      }
      if (!paperText) {
        return NextResponse.json(
          { error: 'Could not resolve paper from Papers With Code. Try the direct arXiv URL.' },
          { status: 400 }
        )
      }
    }

    // ── 4. Try Semantic Scholar URL ──
    else if (input.includes('semanticscholar.org/paper/')) {
      const ssResult = await resolveSemanticScholar(input)
      if (!ssResult || (!ssResult.abstract && !ssResult.arxivId)) {
        return NextResponse.json(
          { error: 'Could not resolve paper from Semantic Scholar.' },
          { status: 400 }
        )
      }
      if (ssResult.arxivId) {
        arxivId = ssResult.arxivId
        // Prefer arXiv metadata for richer author/year data
        const meta = await fetchArxivMeta(ssResult.arxivId)
        if (meta) {
          paperTitle = meta.title
          paperText = meta.abstract
          authors = meta.authors
          year = meta.year
        } else {
          paperTitle = ssResult.title
          paperText = ssResult.abstract
          authors = ssResult.authors
          year = ssResult.year
        }
      } else {
        paperTitle = ssResult.title
        paperText = ssResult.abstract
        authors = ssResult.authors
        year = ssResult.year
      }
    }

    // ── 5. Treat as raw abstract text ──
    else {
      paperText = input.slice(0, 8_000)
    }

    const result = await runAI({ paperTitle, paperText, authors, year, arxivId, level })
    return NextResponse.json({ ...result, arxivId, authors, year, originalTitle: paperTitle, level })
  } catch (err) {
    console.error('[paper/explain]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// ─── AI call ─────────────────────────────────────────────────────────────────

async function runAI(opts: {
  paperTitle: string
  paperText: string
  authors: string[]
  year: string
  arxivId: string
  level: Level
}) {
  const { paperTitle, paperText, authors, year, arxivId, level } = opts

  const bibtexHint = arxivId
    ? `Use arxiv ID "${arxivId}", year "${year || 'unknown'}", and the real authors/title to build the bibtex key and fields.`
    : `Infer author last name, year, and a short title slug from the content for the bibtex key.`

  const raw = (
    await callAI({
      messages: [
        {
          role: 'system',
          content: `${levelSystemPrompt(level)} Return ONLY valid JSON. No markdown fences.`,
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
  "tweetSummary": "Engaging tweet under 280 chars — make it shareable and interesting, no hashtags",
  "interviewQA": [
    {"question": "Interview question about this paper", "answer": "Strong, detailed model answer (3-4 sentences) that would impress an interviewer at Google/OpenAI/Meta"}
  ],
  "codeSketch": "Minimal Python implementation (~20-35 lines) of the paper's core idea. Use numpy/torch where appropriate. Must be actual runnable pseudocode with comments explaining each step.",
  "bibtex": "@article{key2023title,\\n  title={...},\\n  author={...},\\n  journal={arXiv preprint arXiv:xxxx.xxxxx},\\n  year={2023}\\n}"
}

Requirements:
- simpleExplanation MUST use a real-world analogy
- howItWorks MUST be technical but readable — go deep
- keyContributions MUST have at least 3 items with detailed explanations
- keyTerms MUST have at least 5 terms with detailed definitions
- interviewQA MUST have 5-6 questions covering: what problem it solves, how the architecture works, what makes it novel vs prior work, limitations, and one implementation/technical question
- codeSketch MUST be actual runnable Python (~20-35 lines) demonstrating the core idea with comments. For example, for an Attention paper: the scaled dot-product attention function; for RAG: the retrieve-then-generate loop; for LoRA: the low-rank weight update
- bibtex: ${bibtexHint} Format as a valid @article or @inproceedings entry.
- Do NOT be generic — everything must be specific to THIS paper`,
        },
      ],
      temperature: 0.3,
      max_tokens: 6500,
      response_format: { type: 'json_object' },
    })
  ).trim()

  return JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
}
