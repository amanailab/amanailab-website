import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 45

type Action = 'explain' | 'debug' | 'improve' | 'complexity' | 'interview' | 'generate'

const SYSTEM: Record<Action, string> = {
  explain: `You are an expert AI/ML engineer and educator. Explain the given Python code clearly.
- Go section by section, explain what each block does and WHY it's written that way
- Highlight key AI/ML concepts and design decisions
- Use plain English — assume the reader knows Python but may be new to the concept
- Format with clear headings and bullet points`,

  debug: `You are an expert Python debugger specializing in AI/ML code.
- Identify ALL bugs, errors, and potential issues (runtime, logic, performance)
- For each issue: state the problem, explain why it's wrong, provide the fixed code
- Check for: missing imports, wrong API usage, off-by-one errors, type mismatches, resource leaks
- If no bugs found, say so clearly and suggest defensive improvements`,

  improve: `You are a senior ML engineer doing a code review.
- Suggest concrete improvements: performance, readability, production-readiness, best practices
- Rewrite the improved version and explain each change
- Cover: efficiency, error handling, logging, type hints, scalability
- Be specific — show before/after for key changes`,

  complexity: `You are a computer science expert analyzing algorithm complexity.
- Analyze time complexity (Big-O) for each major operation
- Analyze space/memory complexity
- For ML code: include model parameters, VRAM usage, training complexity
- Explain tradeoffs and bottlenecks
- Suggest optimization opportunities with their complexity tradeoffs`,

  interview: `You are an expert AI/ML interviewer at a top tech company (Google, Meta, OpenAI).
Generate a challenging but fair interview discussion based on this code.
Format:
1. **Core Concept Questions** (3-4 questions about the main algorithm/architecture)
2. **Deep Dive Questions** (2-3 questions testing real understanding)
3. **Trade-off Questions** (2 questions about design decisions and alternatives)
4. **Follow-up Extensions** (2 questions on how to scale or extend this)
Include model answers for each question.`,

  generate: `You are an expert AI/ML Python developer.
Write clean, production-quality code based on the user's description.
- Add clear section comments explaining each part
- Include all necessary imports
- Add interview question comments at the bottom
- Make it educational — it will be used to learn AI/ML concepts
- Use current best practices (2024/2025 libraries and APIs)`,
}

const USER_PROMPT: Record<Action, (code: string, extra?: string) => string> = {
  explain:    (code) => `Explain this code in detail:\n\n\`\`\`python\n${code}\n\`\`\``,
  debug:      (code) => `Find and fix all bugs in this code:\n\n\`\`\`python\n${code}\n\`\`\``,
  improve:    (code) => `Review and improve this code:\n\n\`\`\`python\n${code}\n\`\`\``,
  complexity: (code) => `Analyze the time and space complexity of this code:\n\n\`\`\`python\n${code}\n\`\`\``,
  interview:  (code) => `Generate interview questions based on this code:\n\n\`\`\`python\n${code}\n\`\`\``,
  generate:   (_,    desc) => `Write Python code for the following: ${desc}`,
}

export async function POST(req: Request) {
  try {
    const { code, action, description } = await req.json()

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    if (action !== 'generate' && !code?.trim()) {
      return NextResponse.json({ error: 'code is required for this action' }, { status: 400 })
    }

    if (action === 'generate' && !description?.trim()) {
      return NextResponse.json({ error: 'description is required for generate action' }, { status: 400 })
    }

    const systemPrompt = SYSTEM[action as Action]
    const userPrompt   = USER_PROMPT[action as Action]?.(code ?? '', description ?? '')

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const result = (await callAI({
      messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
      temperature: action === 'generate' ? 0.4 : 0.2,
      max_tokens: 2000,
    })).trim()

    return NextResponse.json({ result, action })
  } catch (err) {
    console.error('[Playground Assist]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
