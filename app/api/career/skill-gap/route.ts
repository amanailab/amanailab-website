import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 30

const AI_ML_TOPICS = ['LLM', 'RAG', 'Agents', 'Fine-Tuning', 'MLOps', 'Transformers', 'System Design', 'Python', 'Vector DB', 'NLP', 'Statistics', 'Computer Vision', 'Behavioral']

export async function POST(req: Request) {
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:skill-gap`, 5, 60_000)
  if (!allowed) return NextResponse.json({ error: `Too many requests. Wait ${retryAfterSec}s.` }, { status: 429 })

  try {
    const { jobDescription, userPerformance } = await req.json()
    if (!jobDescription?.trim()) return NextResponse.json({ error: 'Job description required' }, { status: 400 })

    const raw = await callAI({
      messages: [
          {
            role: 'system',
            content: `You are an expert AI/ML career coach. Analyze a job description and identify skill gaps.
Return ONLY valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Job Description:
${jobDescription.slice(0, 3000)}

Candidate's current performance (from interview sessions):
${userPerformance ? JSON.stringify(userPerformance) : 'No sessions yet — complete at 0/10'}

Available AI/ML topics on our platform: ${AI_ML_TOPICS.join(', ')}

Analyze the JD and return:
{
  "job_title": "extracted job title",
  "company_type": "startup/big tech/research lab",
  "overall_readiness": <0-100 integer>,
  "required_topics": [{"topic": "LLM", "importance": "critical|important|nice-to-have", "jd_evidence": "quote from JD"}],
  "gaps": [{"topic": "System Design", "user_score": null, "required_level": "senior", "priority": 1, "action": "specific action to take"}],
  "strengths": [{"topic": "RAG", "user_score": 8.4, "note": "above JD requirements"}],
  "missing_from_platform": ["any required skill not in our topics list"],
  "recommendation": "2-3 sentence personalized recommendation"
}`,
          },
        ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })
    const result = JSON.parse(raw.trim() || '{}')
    return NextResponse.json(result)
  } catch (err) {
    console.error('[skill-gap]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
