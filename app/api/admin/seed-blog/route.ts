import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'

// ─── Minimal markdown → HTML ────────────────────────────────────────────────
// Targets only what the blog renderer's sanitize-html whitelist supports
// (h1-h4, p, ul, ol, li, pre, code, strong, em, a, table-related tags).
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderInline(s: string): string {
  // Escape first, then re-introduce safe tags. Order matters: code before bold/italic.
  let out = escapeHtml(s)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  // Links [text](url) — only http(s) urls
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>')
  return out
}

function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line — skip
    if (line.trim() === '') { i++; continue }

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim()
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i])
        i++
      }
      i++ // skip closing fence
      const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : ''
      out.push(`<pre><code${langClass}>${escapeHtml(buf.join('\n'))}</code></pre>`)
      continue
    }

    // Headings
    const h4 = line.match(/^####\s+(.+)/)
    if (h4) { out.push(`<h4>${renderInline(h4[1])}</h4>`); i++; continue }
    const h3 = line.match(/^###\s+(.+)/)
    if (h3) { out.push(`<h3>${renderInline(h3[1])}</h3>`); i++; continue }
    const h2 = line.match(/^##\s+(.+)/)
    if (h2) { out.push(`<h2>${renderInline(h2[1])}</h2>`); i++; continue }
    const h1 = line.match(/^#\s+(.+)/)
    if (h1) { out.push(`<h1>${renderInline(h1[1])}</h1>`); i++; continue }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) { out.push('<hr />'); i++; continue }

    // Pipe table — first row + separator row + data rows
    if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s\-:|]+\|\s*$/.test(lines[i + 1])) {
      const head = line.trim().slice(1, -1).split('|').map(c => c.trim())
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
        rows.push(lines[i].trim().slice(1, -1).split('|').map(c => c.trim()))
        i++
      }
      const thead = `<thead><tr>${head.map(c => `<th>${renderInline(c)}</th>`).join('')}</tr></thead>`
      const tbody = `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`
      out.push(`<table>${thead}${tbody}</table>`)
      continue
    }

    // Bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    // Paragraph — gather consecutive non-blank, non-special lines
    const para: string[] = [line]
    i++
    while (i < lines.length && lines[i].trim() !== ''
      && !/^#{1,6}\s/.test(lines[i])
      && !/^\s*[-*]\s+/.test(lines[i])
      && !/^\s*\d+\.\s+/.test(lines[i])
      && !lines[i].trim().startsWith('```')
      && !/^\s*\|.+\|\s*$/.test(lines[i])
      && !/^---+$/.test(lines[i].trim())) {
      para.push(lines[i])
      i++
    }
    out.push(`<p>${renderInline(para.join(' '))}</p>`)
  }

  return out.join('\n')
}

// Build a cover image URL from the existing OG endpoint so every post has visual.
// Use a RELATIVE path — Next.js Image treats relative URLs as same-origin and
// renders them without needing the hostname in remotePatterns. The blog page
// metadata code prepends SITE_URL when generating absolute URLs for social meta.
function coverFor(p: { title: string; category: string; read_time: string }): string {
  const rt = parseInt((p.read_time || '5').toString()) || 5
  return `/api/og/blog?title=${encodeURIComponent(p.title)}&category=${encodeURIComponent(p.category)}&rt=${rt}`
}

// Five starter blog posts. Inserted as PUBLISHED so they appear on /blog immediately.
// Re-running is safe — slugs that already exist are skipped.
const POSTS = [
  {
    title: 'How to Crack the RAG System Design Interview',
    slug:  'rag-system-design-interview',
    description: 'A 7-step framework for designing a production-grade RAG system in 45 minutes — covers chunking, retrieval, reranking, hallucination defenses, and scaling.',
    category: 'Interview Prep',
    tags: ['RAG', 'System Design', 'Interviews'],
    read_time: '8 min read',
    content: `## Why this question matters

RAG system design is the most common ML system design question in 2026. Every team building an AI product hits the same wall: how do you make an LLM cite real data without hallucinating? Interviewers want to see whether you can navigate the trade-offs.

## The 7-step framework

### 1. Clarify scope (2-3 min)
- How many documents? Static or growing?
- Query patterns: short questions or long context dumps?
- Latency budget? (Usually <500ms P95.)
- Do answers need source attribution?

### 2. Pipeline diagram
Index → Retrieve → Rerank → Generate. Talk about each stage explicitly.

### 3. Chunking strategy
Don't say "I'll use 512 tokens with 50 overlap" without justifying. Discuss: sentence-aware splitting, semantic chunking, recursive splitter, header-based for technical docs.

### 4. Retrieval
Hybrid search (BM25 + vector) beats either alone. Mention HNSW for ANN, talk about embedding model choice (bge-m3, e5-large, OpenAI text-embedding-3).

### 5. Reranking
Cross-encoder reranker on top-K (Cohere Rerank, bge-reranker-v2). Adds ~50ms but huge precision boost.

### 6. Generation
Prompt template with explicit "cite sources" instruction. Stream tokens. Guard against context-window blowup with token counting.

### 7. Evaluation & hallucinations
RAGAS (faithfulness, answer relevancy, context precision/recall). Add a faithfulness verifier as a second LLM call.

## Common pitfalls

- Forgetting to discuss data freshness (incremental indexing)
- Skipping the eval loop
- No mention of "lost in the middle" — show you know to rerank top-K so most relevant is at start

## Final tip

Always end with "here's how I'd measure success." Interviewers love candidates who think in metrics.`,
  },
  {
    title: 'LoRA vs QLoRA vs DPO: Which Fine-Tuning Method Should You Use?',
    slug:  'lora-qlora-dpo-comparison',
    description: 'A practical guide to choosing between LoRA, QLoRA, and DPO for your fine-tuning project — with VRAM math and dataset size guidelines.',
    category: 'Fine-Tuning',
    tags: ['LoRA', 'QLoRA', 'DPO', 'Fine-Tuning'],
    read_time: '6 min read',
    content: `## TL;DR
- **LoRA**: best when you have a 24GB+ GPU and clean instruction data.
- **QLoRA**: only option for 7B+ models on consumer GPUs (RTX 3090, 4090).
- **DPO**: when you have preference pairs (chosen vs rejected). Comes AFTER LoRA SFT.

## LoRA: the baseline

Inject low-rank matrices into attention projections. Only ~0.1% of params train. Rule of thumb: r=8, alpha=16, target q_proj, v_proj.

VRAM math for Llama-3.1-8B:
- Base model (bf16): 16 GB
- LoRA adapters: ~0.2 GB
- Optimizer states (AdamW): ~0.5 GB
- Activations + KV: ~3-5 GB
- **Total: ~22 GB** → fits on RTX 3090.

## QLoRA: the consumer-GPU unlock

Same as LoRA but the base model is loaded in 4-bit NF4. Same Llama-3.1-8B drops from 16 GB → 4 GB for the base. Fine-tuning fits on 12 GB.

When to use: 13B+ models on a single GPU.
When NOT to use: when you can afford the VRAM — LoRA in bf16 trains slightly faster.

## DPO: preference alignment without RLHF

DPO is NOT a replacement for SFT. The right order:
1. SFT (LoRA or full): teach the model the format/domain.
2. DPO: align preferences.

Dataset format: (prompt, chosen, rejected) triples. Min size: 5K pairs.

## Decision tree

- Have instruction data only? → LoRA SFT.
- 7B+ model on <24 GB GPU? → QLoRA.
- Have preference data? → DPO after SFT.
- Need state-of-the-art reasoning on math/code? → GRPO (the DeepSeek-R1 approach).`,
  },
  {
    title: 'What It’s Actually Like to Interview at Anthropic',
    slug:  'anthropic-interview-experience',
    description: 'A look at the Anthropic interview loop for ML/AI engineers: phone screen, take-home, on-site rounds, and what they actually evaluate.',
    category: 'Companies',
    tags: ['Anthropic', 'Interviews'],
    read_time: '5 min read',
    content: `## The loop

1. **Recruiter screen** (30 min) — culture fit, motivation, salary expectations.
2. **Technical phone screen** (60 min) — ML fundamentals + one coding problem.
3. **Take-home or live coding** (~3 hours) — usually a small RL or RAG project.
4. **On-site / virtual onsite** (4-5 rounds):
   - ML system design
   - Coding (Python, no leetcode-style; more practical)
   - Research discussion
   - Behavioral / culture

## What they actually evaluate

- **Rigor**: do you reason from first principles, or repeat blog-post talking points?
- **Safety mindset**: do you proactively think about misuse, failure modes, evaluation?
- **Communication**: can you explain technical decisions to a non-expert?

## Tips that work

- Read the Anthropic blog before your interview. Their RSP, Constitutional AI, and interpretability papers come up indirectly.
- Have an opinion on alignment, but hold it loosely — they value updating on evidence.
- For system design: always discuss eval before scaling. "How would I know this is working?" is the right reflex.

## Compensation (2026 estimates)

ML Engineer L4: $310K - $410K base + equity. SWE roles similar.

(Numbers from Levels.fyi composites; verify with your recruiter.)`,
  },
  {
    title: '10 LLM Interview Questions That Catch People Off Guard',
    slug:  '10-llm-interview-questions-that-catch-people-off-guard',
    description: 'Surface-level LLM knowledge gets exposed fast. These 10 questions separate candidates who read papers from those who only watched YouTube.',
    category: 'Interview Prep',
    tags: ['LLM', 'Interviews', 'Question Bank'],
    read_time: '7 min read',
    content: `## 1. Why does temperature=0 still sometimes give non-deterministic output?

Floating-point non-associativity on GPU. Same prompt → different ordering of partial sums → different logits at the last decimal → different argmax in rare ties.

## 2. What’s the actual VRAM cost of a 70B model at inference?

Base weights at bf16: 140 GB. KV-cache for one 8K-context request: ~5 GB. Total per replica: ~150 GB. You need either 2x A100 80G or 1x H100 80G with INT8 quantization.

## 3. Why is GQA used instead of MHA in modern models?

Multi-Head Attention duplicates K and V for every head — dominates KV-cache memory at inference. GQA shares K/V across groups (e.g., 32 query heads share 8 KV heads). Memory drops 4x, quality drops <1%.

## 4. What does \`rope_theta\` control in Llama 3?

The base frequency for rotary embeddings. Llama 3.1 sets it to 500,000 (vs 10,000 in Llama 2) to extend context to 128K without retraining position embeddings from scratch.

## 5. When does Flash Attention NOT help?

Sequence length under ~512. The kernel launch overhead dominates and you don’t hit the memory wall the technique was designed to break.

## 6. Why is BPE language-dependent in practice?

The vocab is learned from frequencies in the training corpus. English-trained tokenizers split Hindi/Tamil/Chinese into many more tokens, making non-English inference more expensive and slower.

## 7. Why does the FFN have 4x expansion?

Empirically optimal trade-off between capacity and compute. Smaller expansion underfits; larger has diminishing returns. Some models (PaLM) use 8x with adjustments.

## 8. What’s the difference between top-k and top-p sampling?

top-k: keep highest-k tokens, sample from those. top-p (nucleus): keep smallest set whose probabilities sum to p, sample from those. top-p adapts to confidence — when the model is confident, the set is small.

## 9. Why does \`use_cache=True\` break gradient checkpointing?

Gradient checkpointing recomputes activations during backward pass. KV-cache assumes activations exist. They’re mutually exclusive — pick one.

## 10. What’s the role of the [BOS] token?

Marks sequence start; gives the model a stable starting state. In decoder-only models, omitting it can degrade quality because the model was trained to condition on it. Always include it (most tokenizers do automatically).`,
  },
  {
    title: 'Building Your First AI Agent: A Realistic Step-by-Step Guide',
    slug:  'building-your-first-ai-agent',
    description: 'Skip the LangChain hello-world. This is what actually breaks when you build a working agent — and what to do about each one.',
    category: 'Agents',
    tags: ['Agents', 'LangGraph', 'Tool Use', 'Tutorial'],
    read_time: '9 min read',
    content: `## What “agent” actually means

A loop where an LLM picks a tool, runs it, reads the output, and decides what to do next. That’s it. The complexity comes from making that loop reliable.

## Step 1: Define the tools first, prompt second

Mistake everyone makes: prompt-engineer first, add tools later. Do the opposite. Pick 2-4 tools that cover your domain. For a research agent: \`web_search\`, \`fetch_url\`, \`final_answer\`.

## Step 2: Write tools as plain functions with type hints

\`\`\`python
def web_search(query: str, num_results: int = 5) -> list[dict]:
    """Search the web for current information."""
    ...
\`\`\`

Frameworks (OpenAI tool use, Anthropic tool use) convert these to JSON schemas automatically.

## Step 3: Build the loop, not a chain

A chain is N → N+1. An agent is "while not done: pick tool". Use a state machine:

\`\`\`python
state = {"messages": [...], "iterations": 0}
while state["iterations"] < 15:
    response = llm.call(state["messages"])
    if response.tool_calls:
        result = run_tool(response.tool_calls[0])
        state["messages"].append(response)
        state["messages"].append(result)
        state["iterations"] += 1
    else:
        return response.content
\`\`\`

## Step 4: The 5 things that will break first

1. **Infinite loops** — agent calls the same tool 20 times. Add max iterations + repeated-call detection.
2. **Tool argument hallucinations** — agent passes \`country="USA"\` to a search tool that wants \`country="us"\`. Strict JSON schemas help.
3. **Lost context** — long conversations push relevant info out of the window. Summarize older messages.
4. **Silent tool failures** — tool errors but agent thinks it succeeded. Return errors as observations, not exceptions.
5. **Cost explosions** — one bad query → 50 tool calls → $30 spent. Add a hard token budget.

## Step 5: When to graduate to LangGraph

If your agent has branches (route to specialist), cycles (retry until valid), or human approval steps — LangGraph’s state-machine model pays off. Otherwise plain Python is fine.

## Step 6: Eval before scaling

Build a 30-task eval set BEFORE you ship. Track: task completion rate, average tool calls per task, cost per task. You can’t improve what you don’t measure.`,
  },
  {
    title: 'The 2026 AI/ML Job Market — Honest Compensation and Hiring Trends',
    slug:  '2026-ai-ml-job-market',
    description: 'Compensation ranges, what companies are actually hiring for, and the skills that moved the needle this cycle.',
    category: 'Career',
    tags: ['Career', 'Compensation', '2026 Trends'],
    read_time: '6 min read',
    content: `## What’s changed since 2024

- **Research roles compressed**: fewer pure-research seats, more "applied research" hybrids.
- **Forward-deployed engineering exploded**: model labs are hiring people who can deploy LLMs into specific verticals.
- **GPU-systems engineers are golden**: anyone who can squeeze more throughput out of H100s is overpaid relative to ML scientists.

## Compensation (US, 2026 composites)

| Role | Base | Total Comp (yr 1) |
|---|---|---|
| ML Eng L4 (FAANG) | $200K-$240K | $310K-$420K |
| LLM Research (frontier lab) | $250K-$320K | $500K-$900K |
| Applied AI Eng (startup) | $180K-$240K | $260K-$400K |
| GPU systems / kernels | $230K-$300K | $400K-$650K |

## What gets you in the door now

- **Public artifacts** beat resumes. A blog post on training a Llama variant > 3 years at a no-name lab.
- **Eval mindset**: every senior interviewer asks "how would you know this is working?" Be ready.
- **Distributed training**: not just "I used DDP" — actually understanding NCCL, FSDP, ZeRO sharding.
- **Production deploys**: can you ship a model behind a real API at <500ms P95? That alone clears most bars.

## Where the jobs are

- **Anthropic, OpenAI, DeepMind**: still hiring but the bar is genuinely hard.
- **Mid-tier labs (Cohere, Mistral, AI21, Reka)**: faster loops, more flexibility.
- **Vertical AI**: legal (Harvey), code (Cursor, Sourcegraph), bio (Isomorphic) — fewer competitors than horizontal AI.
- **Enterprise AI infrastructure**: Databricks, Vellum, Modal, Together — boring on paper, lucrative in practice.

## The skills that actually moved the needle

1. Building an eval set BEFORE building the model.
2. Knowing when NOT to fine-tune.
3. Writing readable code under pressure.
4. Communicating trade-offs without hand-waving.

The rest is table stakes.`,
  },
]

export async function POST(req: Request) {
  // Parse body once (handles both auth password and force flag).
  const body = (await req.json().catch(() => ({}))) as { password?: string; force?: boolean }
  const force = body.force === true

  const cookieStore = await cookies()
  const hasSession = cookieStore.get('admin_session')?.value === 'true'

  if (!hasSession) {
    if (!process.env.ADMIN_PASSWORD || body.password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = getAdminSupabase()

  // Convert markdown source to sanitize-html-friendly HTML upfront.
  // Also build cover URLs so every post has an image.
  const prepared = POSTS.map(p => ({
    ...p,
    htmlContent: mdToHtml(p.content),
    cover:       coverFor(p),
  }))

  // Fetch existing rows for these slugs — we may need to UPDATE posts whose
  // content was previously inserted as raw markdown (no HTML tags) so they
  // re-render properly.
  const slugs = prepared.map(p => p.slug)
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id, slug, content, cover_image')
    .in('slug', slugs)
  const existingBySlug = new Map((existing ?? []).map(r => [r.slug as string, r as { id: string; slug: string; content: string; cover_image: string | null }]))

  // INSERT for new slugs
  const toInsert = prepared
    .filter(p => !existingBySlug.has(p.slug))
    .map(p => ({
      title:       p.title,
      slug:        p.slug,
      description: p.description,
      content:     p.htmlContent,
      category:    p.category,
      tags:        p.tags,
      cover_image: p.cover,
      read_time:   p.read_time,
      published:   true,
    }))

  // UPDATE for existing slugs whose content still looks like raw markdown
  // (no html tags) — fix formatting without overwriting user-edited posts.
  // When force=true, overwrite EVERY existing post regardless of state.
  const looksLikeMarkdown = (c: string | null | undefined) => {
    if (!c) return true
    const s = c.trim()
    // Heuristic: starts with ##, contains \n## , or has no html tags at all.
    if (/<\/?(p|h[1-6]|ul|ol|li|pre|code|table|blockquote|div|span)\b/i.test(s)) return false
    return true
  }
  // An old cover_image counts as "needs update" if it's missing OR is an
  // absolute URL pointing at /api/og/blog (previous seeder format) which
  // Next.js Image rejects because the hostname isn't in remotePatterns.
  const coverNeedsUpdate = (cover: string | null | undefined) => {
    if (!cover) return true
    if (/^https?:\/\/[^/]+\/api\/og\/blog/.test(cover)) return true
    return false
  }
  const toUpdate = prepared.filter(p => {
    const row = existingBySlug.get(p.slug)
    if (!row) return false
    if (force) return true
    return looksLikeMarkdown(row.content) || coverNeedsUpdate(row.cover_image)
  })

  let updated = 0
  const updateErrors: string[] = []
  for (const p of toUpdate) {
    const row = existingBySlug.get(p.slug)!
    const patch: Record<string, unknown> = {}
    if (force || looksLikeMarkdown(row.content)) patch.content = p.htmlContent
    if (force || coverNeedsUpdate(row.cover_image)) patch.cover_image = p.cover
    if (force) {
      patch.category = p.category
      patch.tags = p.tags
    }
    if (Object.keys(patch).length === 0) continue
    patch.updated_at = new Date().toISOString()
    const { error: upErr } = await supabase.from('blog_posts').update(patch).eq('id', row.id)
    if (upErr) {
      updateErrors.push(`${p.slug}: ${upErr.message}`)
    } else {
      updated++
      // Bust the cached blog post page so the new HTML/cover shows immediately
      try { revalidatePath(`/blog/${p.slug}`) } catch {}
    }
  }
  // Bust the blog list cache once if anything changed
  if (updated > 0 || toInsert.length > 0) {
    try { revalidatePath('/blog') } catch {}
  }

  if (toInsert.length === 0 && updated === 0) {
    return NextResponse.json({
      seeded: 0,
      updated: 0,
      skipped: prepared.length,
      updateErrors,
      message: updateErrors.length
        ? `No updates applied. Errors: ${updateErrors.join('; ')}`
        : (force
          ? 'Force re-seed ran but no posts matched (table may be empty).'
          : 'All starter posts already exist with proper HTML content. Re-run with force:true to overwrite.'),
    })
  }

  if (toInsert.length === 0) {
    return NextResponse.json({
      seeded: 0,
      updated,
      skipped: prepared.length - updated,
      updateErrors,
      message: `Reformatted ${updated} existing post${updated === 1 ? '' : 's'} (converted markdown to HTML, added cover image).`,
    })
  }

  const { error, data } = await supabase
    .from('blog_posts')
    .insert(toInsert)
    .select('id, slug')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({
    seeded:  data?.length ?? toInsert.length,
    updated,
    skipped: prepared.length - toInsert.length - updated,
    updateErrors,
    message: `Inserted ${data?.length ?? toInsert.length} new post(s)${updated ? ` and reformatted ${updated} existing post(s)` : ''}. Live on /blog now.`,
  })
}
