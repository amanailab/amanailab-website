import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 30

type AssistMode = 'debug' | 'complexity' | 'approach' | 'review' | 'solution'

const SYSTEM: Record<AssistMode, string> = {
  debug: `You are an expert AI/ML coding interviewer reviewing a student's Python solution.
The code has failed one or more test cases.

CRITICAL RULES:
- DO NOT give the correct solution or reveal the answer
- DO NOT write corrected code
- DO identify the specific logical error or missing consideration
- Be Socratic — guide toward the fix with questions and hints
- Keep response under 150 words
- Be warm and encouraging`,

  complexity: `You are an expert algorithm analyst specializing in AI/ML Python code.
Analyze the given Python function and return ONLY valid JSON, no markdown.`,

  approach: `You are an expert AI/ML coding interviewer giving a Socratic hint.
The student is stuck and needs guidance on the approach — NOT the solution.
Give ONE key insight that points toward the right approach without revealing it.
Keep it under 80 words. Reference the relevant AI/ML concept if applicable.`,

  review: `You are a senior AI/ML engineer at a top company (Google, OpenAI, Meta) doing a code review.
The student's solution PASSES all test cases. Give professional feedback on their accepted code.

Cover:
1. Code quality / Pythonic style
2. Would an interviewer accept this? Why/why not?
3. One more elegant alternative approach (brief)
4. What to say when presenting this in an interview

Keep it concise, encouraging, and specific. Under 200 words. Reference the relevant ML concept.`,

  solution: `You are an expert AI/ML educator writing a clean official solution to a coding problem.
Write ONLY Python code — no markdown fences, no explanations outside of code comments.
The solution must:
- Be clean, Pythonic, and interview-ready
- Have a docstring explaining the mathematical approach
- Have inline comments on key lines
- Handle edge cases
- End with: # Time: O(...) | Space: O(...)`,
}

export async function POST(req: Request) {
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:code-assist`, 15, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: `Too many requests. Wait ${retryAfterSec}s.` }, { status: 429 })
  }

  try {
    const { mode, code, problem_title, problem_description, failed_cases } = await req.json()
    if (!mode || !code) return NextResponse.json({ error: 'mode and code required' }, { status: 400 })

    let userPrompt = ''

    if (mode === 'debug') {
      userPrompt = `Problem: ${problem_title}

Student's code:
\`\`\`python
${code}
\`\`\`

Failed test cases:
${(failed_cases ?? []).map((c: { input: string; expected: string; got: string }) =>
  `- Input: ${c.input}\n  Expected: ${c.expected}\n  Got: ${c.got}`
).join('\n')}

Identify what's logically wrong and give a Socratic hint. DO NOT write corrected code.`
    }

    if (mode === 'complexity') {
      userPrompt = `Analyze this Python function from an AI/ML coding interview:

Problem: ${problem_title}
\`\`\`python
${code}
\`\`\`

Return this exact JSON:
{
  "time_complexity": "O(...)",
  "time_explanation": "one sentence why",
  "space_complexity": "O(...)",
  "space_explanation": "one sentence why",
  "interview_ready": true|false,
  "interview_note": "one sentence assessment",
  "improvements": ["improvement 1", "improvement 2"],
  "edge_cases_missed": ["edge case if any"]
}`
    }

    if (mode === 'approach') {
      userPrompt = `Problem: ${problem_title}

Description: ${problem_description?.slice(0, 500)}

The student has been stuck for a while. Give ONE Socratic hint about the approach — not the solution.`
    }

    if (mode === 'review') {
      userPrompt = `Problem: ${problem_title}

Accepted solution:
\`\`\`python
${code}
\`\`\`

This solution passes all test cases. Give professional code review feedback.`
    }

    if (mode === 'solution') {
      userPrompt = `Write the clean official solution for this AI/ML coding problem:

Problem: ${problem_title}
Description summary: ${problem_description?.slice(0, 400)}

Write ONLY Python code with comments. No markdown fences.`
    }

    const content = (await callAI({
      messages: [
          { role: 'system', content: SYSTEM[mode as AssistMode] },
          { role: 'user',   content: userPrompt },
        ],
      temperature: 0.3,
      max_tokens: mode === 'complexity' ? 400 : mode === 'review' ? 350 : mode === 'solution' ? 600 : 200,
      ...(mode === 'complexity' ? { response_format: { type: 'json_object' } } : {}),
    })).trim()

    if (mode === 'complexity') {
      try {
        return NextResponse.json({ result: JSON.parse(content), mode })
      } catch {
        return NextResponse.json({ result: content, mode })
      }
    }

    return NextResponse.json({ result: content, mode })
  } catch (err) {
    console.error('[code-assist]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
