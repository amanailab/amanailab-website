import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 30

// Company-specific AI/ML focus areas
const COMPANY_FOCUS: Record<string, string> = {
  Google:         'LLM architecture, Transformer internals, MLOps with Vertex AI/TFX, ML System Design (distributed training/serving), Statistics & probability, Python performance, Behavioral (STAR method)',
  Meta:           'LLM scaling & efficiency, Computer Vision (DETR, SAM, Detectron2), PyTorch internals, ML System Design, NLP, Behavioral (impact stories)',
  OpenAI:         'LLM pre-training & fine-tuning, RLHF & reward modeling, Agents & tool use, RAG & retrieval systems, Safety & alignment, Transformer architecture, Evaluation metrics',
  Anthropic:      'Constitutional AI & safety alignment, RLHF & reward modeling, Fine-tuning & instruction following, Agents & long-horizon reasoning, LLM evaluation & interpretability, Behavioral',
  Microsoft:      'Azure ML & MLOps, LLM integration (Copilot, Azure OpenAI), ML System Design, Python & ML libraries, NLP & semantic search, Behavioral',
  Amazon:         'SageMaker & AWS MLOps, LLM applications, ML System Design, Python & SQL, Behavioral (Amazon 14 Leadership Principles — critical to prepare these)',
  Nvidia:         'GPU architecture & CUDA optimization, Transformer efficiency (Flash Attention, quantization), Computer Vision, MLOps & inference optimization, Python for HPC',
  'Hugging Face': 'Transformers library internals, Fine-tuning & PEFT/LoRA/QLoRA, NLP text generation, Diffusion models, RAG & embeddings, Open source ML contribution',
  Apple:          'On-device ML & CoreML, Computer Vision, Privacy-preserving ML (federated learning, differential privacy), Model compression & quantization, Swift/Python for ML',
  Other:          'LLM fundamentals, RAG pipelines, LangChain Agents, Fine-tuning & LoRA, MLOps, Vector Databases, System Design for ML, Python, Statistics',
}

const DEFAULT_AI_TOPICS = [
  'LLM fundamentals (attention mechanism, tokenization, scaling laws)',
  'RAG pipeline (chunking, embeddings, vector retrieval, reranking)',
  'LangChain Agents (ReAct, tool use, memory, multi-agent)',
  'Fine-tuning & LoRA (PEFT, QLoRA, instruction tuning, RLHF)',
  'MLOps (model serving, monitoring, A/B testing, CI/CD pipelines)',
  'Vector Databases (FAISS, Pinecone, ChromaDB, ANN algorithms)',
  'System Design for ML (distributed training, inference at scale)',
  'Python for ML (numpy, pandas, profiling, async patterns)',
  'Statistics & probability for ML interviews',
  'Behavioral (STAR method, project impact, technical leadership)',
]

export async function POST(req: Request) {
  try {
    const { company, daysLeft, weakTopics, strongTopics } = await req.json()
    if (!company || !daysLeft) return NextResponse.json({ error: 'company and daysLeft required' }, { status: 400 })

    const days          = Math.min(Math.max(Number(daysLeft), 3), 60)
    const companyFocus  = COMPANY_FOCUS[company] ?? COMPANY_FOCUS['Other']
    const hasWeakTopics = weakTopics?.length > 0

    const raw = await callAI({
      messages: [
          {
            role: 'system',
            content: `You are an expert AI/ML interview coach preparing candidates for top AI companies like ${company}.

CRITICAL RULES — follow exactly:
1. This plan is for an AI/ML ENGINEER role ONLY
2. Focus EXCLUSIVELY on AI/ML topics: LLMs, RAG, Agents, Fine-tuning, MLOps, Transformers, Vector DBs, Python for ML, Statistics, Behavioral
3. NEVER include: generic data structures, sorting algorithms, graph theory, OS concepts, general networking, generic system design — UNLESS it is specifically "ML System Design" or "Distributed ML Systems"
4. Each day must reference a real AI/ML concept, framework, or technique (e.g. "attention mechanism", "FAISS index", "LoRA rank", "LangChain ReAct agent")
5. Tasks must be actionable and specific: "Practice implementing scaled dot-product attention from scratch" not "Review transformers"
6. Return ONLY valid JSON, no markdown`,
          },
          {
            role: 'user',
            content: `Create a ${days}-day AI/ML interview prep plan for ${company}.

Company focus areas: ${companyFocus}

${hasWeakTopics ? `Candidate's WEAK topics (prioritize these first): ${weakTopics.join(', ')}` : `Default AI/ML topics to cover: ${DEFAULT_AI_TOPICS.slice(0, Math.min(days, 10)).join(' | ')}`}
${strongTopics?.length > 0 ? `Strong topics (review briefly at end): ${strongTopics.join(', ')}` : ''}

Plan structure:
- Days 1 to ${Math.floor(days * 0.6)}: Core AI/ML topics (LLM, RAG, Agents, Fine-tuning, Transformers)
- Days ${Math.floor(days * 0.6) + 1} to ${Math.floor(days * 0.85)}: Company-specific topics (${companyFocus.split(',')[0].trim()}, ${companyFocus.split(',')[1]?.trim() ?? 'MLOps'})
- Last ${Math.ceil(days * 0.15)} days: Mixed review + Behavioral questions (STAR method, project stories)

Return this exact JSON:
{
  "plan": [
    {
      "day": 1,
      "focus": "LLM Fundamentals",
      "task": "Study the transformer architecture — implement scaled dot-product attention from scratch in Python, understand Q/K/V matrices and why we scale by sqrt(d_k)",
      "duration": "60 min",
      "tip": "Interviewers at ${company} often ask to explain attention complexity — it's O(n²) time and space"
    }
  ]
}`,
          },
        ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })
    const result = JSON.parse(raw.trim() || '{}')
    return NextResponse.json(result)
  } catch (err) {
    console.error('[interview-plan]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
