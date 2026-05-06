import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { currentSkills, targetRole, timePerWeek, currentLevel } = await req.json()

    if (!targetRole?.trim()) {
      return NextResponse.json({ error: 'Target role is required.' }, { status: 400 })
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content: `You are a world-class AI/ML career coach in 2026. You have deep expertise in the modern AI ecosystem including:
- Generative AI (LLMs, diffusion models, multimodal AI)
- Agentic AI (AI agents, multi-agent systems, tool use, autonomous workflows)
- RAG (Retrieval-Augmented Generation, vector databases, embeddings)
- LLM Engineering (prompt engineering, fine-tuning, RLHF, PEFT, LoRA, QLoRA)
- AI Frameworks (LangChain, LlamaIndex, CrewAI, AutoGen, Haystack, DSPy)
- Vector DBs (Pinecone, Weaviate, Chroma, Qdrant, pgvector)
- LLM APIs (OpenAI, Anthropic Claude, Google Gemini, Groq, Mistral, Cohere)
- Open source LLMs (Llama 3, Mistral, Phi-3, Gemma, Qwen)
- MLOps (MLflow, Weights & Biases, ZenML, BentoML, vLLM, Ollama)
- AI Safety, Evaluation, Guardrails, Red-teaming
- Classic ML (scikit-learn, XGBoost, feature engineering)
- Deep Learning (PyTorch, transformers, attention mechanisms)
- Cloud AI (AWS Bedrock, GCP Vertex AI, Azure AI)

Generate highly specific, up-to-date 2026 roadmaps. Include actual tool names, libraries, courses, and projects. Return ONLY valid JSON. No markdown fences.`,
          },
          {
            role: 'user',
            content: `Create a detailed 2026 career roadmap for someone who wants to become a ${targetRole}.

Current Skills: ${currentSkills || 'Not specified'}
Current Level: ${currentLevel || 'Beginner'}
Available Time: ${timePerWeek || '10'} hours per week

IMPORTANT:
- Include the LATEST 2026 AI tools, frameworks, and concepts
- Cover Generative AI, Agentic AI, LLMs, RAG wherever relevant to the role
- Name SPECIFIC resources (courses, books, GitHub repos, YouTube channels)
- Each phase must have real, buildable project ideas
- Topics must include cutting-edge 2026 skills employers look for

Return this exact JSON:
{
  "totalDuration": "e.g. 6 months",
  "overview": "2-3 sentence summary covering what modern skills they'll gain",
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "e.g. 4 weeks",
      "goal": "What you'll achieve by end of this phase",
      "topics": ["specific topic 1", "specific topic 2", "specific topic 3", "specific topic 4"],
      "resources": ["Specific Course/Book/Repo name 1", "Specific resource 2", "Specific resource 3"],
      "milestone": "Concrete measurable outcome to verify completion",
      "projects": ["Specific project idea 1 with tech stack mentioned", "project idea 2"]
    }
  ],
  "keySkills": ["specific skill 1", "specific skill 2", "specific skill 3", "specific skill 4", "specific skill 5", "specific skill 6"],
  "jobReadySignals": ["concrete signal 1", "concrete signal 2", "concrete signal 3", "concrete signal 4"],
  "trendingIn2026": ["trending skill/tool 1", "trending skill/tool 2", "trending skill/tool 3", "trending skill/tool 4"],
  "tips": ["specific actionable tip 1", "tip 2", "tip 3"]
}

Generate 5-6 phases covering beginner through job-ready. Be extremely specific about tools and technologies.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to generate roadmap.' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() ?? ''
    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[roadmap]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
