import { NextResponse } from 'next/server'

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
    if (m) return m[1].replace(/v\d+$/, '') // strip version suffix
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

    const title   = xml.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/\n/g, ' ').trim() ?? ''
    const summaryMatch = xml.match(/<summary>([\s\S]*?)<\/summary>/)
    const summary = (summaryMatch?.[1] ?? '').replace(/\n/g, ' ').trim()
    const year    = xml.match(/<published>(\d{4})/)?.[1] ?? ''
    const authors: string[] = []
    const authorRe = /<name>([^<]+)<\/name>/g
    let m
    while ((m = authorRe.exec(xml)) !== null) authors.push(m[1].trim())

    if (!summary) return null
    return { title, abstract: summary, authors: authors.slice(0, 5), year }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { input, email } = await req.json()
    if (!input?.trim()) {
      return NextResponse.json({ error: 'Please provide an arXiv URL or paper text.' }, { status: 400 })
    }

    // Suppress unused variable warning - email collected client-side
    void email

    let paperTitle  = ''
    let paperText   = ''
    let authors: string[] = []
    let year = ''
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
      // Treat as raw text/abstract
      paperText = input.trim().slice(0, 6000)
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI/ML research communicator. You explain complex research papers in clear, accessible language without dumbing them down. You are great at bridging theory and practice. Return ONLY valid JSON. No markdown fences.`,
          },
          {
            role: 'user',
            content: `Explain this AI/ML research paper clearly.

${paperTitle ? `Title: ${paperTitle}` : ''}
${authors.length ? `Authors: ${authors.join(', ')}` : ''}
${year ? `Year: ${year}` : ''}

Paper content:
${paperText}

Return this exact JSON:
{
  "inferredTitle": "title if not provided, else repeat the given title",
  "oneLiner": "one sentence that captures the entire paper — like a tweet",
  "simpleExplanation": "Explain this to a smart person who isn't an ML expert — 3-4 sentences. Use analogies. No jargon.",
  "problemSolved": "What specific problem does this paper solve? Why did it need solving?",
  "howItWorks": "Technical explanation in plain English — how the method actually works, 4-6 sentences",
  "keyContributions": [
    {"point": "contribution title", "detail": "1-2 sentence explanation"}
  ],
  "practicalApplications": ["real-world application 1", "application 2", "application 3"],
  "limitations": ["limitation 1", "limitation 2"],
  "keyTerms": [
    {"term": "technical term", "definition": "simple 1-sentence definition"}
  ],
  "whoShouldRead": "Beginner | Intermediate | Advanced",
  "importanceScore": number 1-10,
  "importanceReason": "1-2 sentences on why this paper matters to the field",
  "relatedConcepts": ["concept to know 1", "concept 2", "concept 3"],
  "tweetSummary": "Tweet-length summary under 280 chars — engaging, no hashtags"
}

Be specific to this paper. Do not be generic.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) {
      return NextResponse.json({ error: 'Failed to explain paper.' }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? ''
    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))

    return NextResponse.json({
      ...result,
      arxivId,
      authors,
      year,
      originalTitle: paperTitle,
    })
  } catch (err) {
    console.error('[paper/explain]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
