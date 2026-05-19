import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

// Curated company-specific questions for each of your 9 companies.
// Inserts into company_questions table. Idempotent — skips on exact (company_id, question) match.
const COMPANY_QUESTIONS: Record<string, Array<{ question: string; model_answer: string; topic: string; level: string }>> = {
  google: [
    {
      topic: 'LLM', level: 'Senior',
      question: 'How would you scale a transformer model to 1 trillion parameters?',
      model_answer: 'Combine multiple parallelism strategies: tensor parallelism (split each weight matrix across GPUs in a node), pipeline parallelism (assign layers to different nodes), and data parallelism with ZeRO sharding (split optimizer/gradient/parameter states across data-parallel ranks). For 1T params: probably 8-way tensor × 8-way pipeline × 64-way data parallel = 4,096 GPUs. Use Mixture-of-Experts to grow total params without proportional compute cost. Critical infrastructure: NVLink within nodes, InfiniBand between, and a robust checkpointing system because training runs for weeks. Talk about gradient accumulation, activation checkpointing, and bf16+stochastic rounding for numerical stability.',
    },
    {
      topic: 'System Design', level: 'Senior',
      question: 'Design Google Search but with an LLM as the primary ranker.',
      model_answer: 'Hybrid architecture: keep the existing inverted-index retrieval (BM25-style) to fetch top-1000 candidates in <100ms because LLM scoring of 10B docs is impossible. Then use a small (1B-param) ranking model as a first reranker on the top-1000 to get top-50, then a larger 70B model with full attention over query + 50 docs for the final 10 results. Cache aggressively at every layer (query → ranked doc IDs). Use distillation: train the small ranker on the big ranker\'s outputs. Latency budget: 200ms retrieval + 150ms small rerank + 200ms big rerank = 550ms total. For freshness, partition the index by recency and combine.',
    },
    {
      topic: 'Transformers', level: 'Mid',
      question: 'Explain self-attention to a Googler who has never seen it.',
      model_answer: 'Self-attention computes "for each token in a sequence, how much should it look at every other token?" Each token produces three vectors via learned projections: Query (what am I looking for?), Key (what do I represent?), Value (what info do I carry?). For token i, the attention to token j is dot(Q_i, K_j) / sqrt(d_k), then softmax across all j gives weights. Output for token i is weighted sum of V_j vectors. Result: each token becomes a context-aware representation. Self-attention is permutation-invariant, which is why we add positional encodings. It\'s O(n²) in sequence length — that\'s the famous bottleneck. Show the math; Google interviewers want rigor.',
    },
    {
      topic: 'MLOps', level: 'Senior',
      question: 'How would you serve Gemini-scale models with sub-second latency?',
      model_answer: 'Layer your optimizations: (1) Model: quantize to INT8 with smoothquant for accuracy, use GQA to shrink KV-cache, distill to smaller models for easy queries. (2) Serving: vLLM-style PagedAttention + continuous batching for high throughput. (3) Hardware: TPU pods with optical interconnect for tensor parallelism, no host-device copies in the hot path. (4) Routing: query classifier (sub-100ms) sends simple queries to a small model, only routes complex queries to the big one. (5) Caching: prefix cache for shared system prompts, KV-cache reuse across turns of a conversation. End-to-end target: first token in 300ms, ~100 tokens/s after that. Talk about TPU vs GPU trade-offs.',
    },
    {
      topic: 'Behavioral', level: 'Mid',
      question: 'Tell us about a time you had to make a decision with incomplete information.',
      model_answer: 'Use Google\'s Googleyness lens: structured thinking + humility. Strong pattern: (1) Specific situation — describe the decision, the missing data, and the deadline. (2) How you bounded the unknown — running a fast experiment, asking specific stakeholders, building a decision tree. (3) The decision itself and the explicit risk you accepted. (4) Outcome AND what you learned. Avoid stories where everything worked out — Google specifically watches for self-awareness about when you were wrong. End with the meta-lesson, not the war story.',
    },
  ],
  meta: [
    {
      topic: 'System Design', level: 'Senior',
      question: 'Design Facebook\'s News Feed ranking system for 3 billion users.',
      model_answer: 'Two-stage architecture standard at Meta. Stage 1 — Retrieval: per user, fetch ~10K candidate posts via fan-out (friends, groups, pages followed). Use BloomFilter to exclude already-seen content. Stage 2 — Ranking: a two-tower model predicts engagement probability (click, like, comment, share) for each post. Features: user embeddings, post embeddings, freshness, social graph signals. Models served via in-memory key-value store with hourly refresh. Latency: <300ms P95 for the ranker. Show you know about multi-objective optimization (engagement vs time-spent vs misinformation risk) and how to handle cold-start users with collaborative filtering on similar users. Mention shadow ranking for A/B testing new models.',
    },
    {
      topic: 'LLM', level: 'Senior',
      question: 'How does Llama 3 differ architecturally from Llama 2?',
      model_answer: 'Key changes: (1) Vocab grew from 32K → 128K tokens — much better non-English efficiency and multilingual coverage. (2) GQA used at all model sizes including 8B (Llama 2 only used GQA at 34B+). (3) Context length 4K → 8K base, with continued pretraining extending to 128K via rope_theta=500K. (4) Trained on 15T tokens (vs 2T for Llama 2) — that\'s the biggest single quality lever. (5) Instruction tuning combines SFT + rejection sampling + DPO instead of pure PPO RLHF. (6) Tool-use support trained into the base model. Architecturally simple — Meta\'s philosophy is "scale data and tokens, keep the architecture clean."',
    },
    {
      topic: 'MLOps', level: 'Mid',
      question: 'How do you A/B test a new recommendation model at Meta scale?',
      model_answer: 'Step 1: shadow deployment — send 100% of production traffic to both old and new model, but return only old to users. Compare offline metrics for a week. Step 2: small holdout — 1% of users get the new model, measure online metrics (CTR, session length, complaints). Step 3: ramp 5% → 25% → 50% → 100% over 2-4 weeks. Use stratified sampling so age/region/device distributions match. Always test against THE primary metric your team owns; don\'t move multiple metrics at once. Tools at Meta: Deltoid (experimentation platform), guardrail metrics (auto-halt if integrity metric drops). Talk about novelty effect — users react to new things; measure after 2 weeks too.',
    },
    {
      topic: 'Behavioral', level: 'Mid',
      question: 'Tell us about a time you moved a metric significantly.',
      model_answer: 'Meta lives and dies on metrics. Strong answer: (1) Pick a specific metric tied to product value (NOT a vanity number). (2) Quantify the baseline and the lift — e.g., "click-through rate from 8.2% to 9.1%, 11% relative lift". (3) Explain the experiment design — control / treatment, sample size, duration. (4) Be honest about what surprised you — every real experiment has a surprise. (5) Mention the SECOND-order effects you watched for (cannibalization, novelty, gaming). Bad answer: "I optimized this metric." Good answer: "I optimized this metric by 11% while keeping the guardrail metric flat, validated with 4M users over 2 weeks."',
    },
  ],
  openai: [
    {
      topic: 'LLM', level: 'Senior',
      question: 'How does RLHF work and what are its main failure modes?',
      model_answer: 'Three stages: (1) Supervised fine-tuning on human demonstrations of good responses. (2) Train a reward model on PAIRS of responses ranked by humans. (3) Use PPO to optimize the policy (LLM) to maximize the reward model\'s score, with a KL penalty against the SFT model to prevent drift. Failure modes: (a) Reward hacking — the model finds ways to score high that humans wouldn\'t actually approve (sycophancy, refusing instead of helping). (b) Reward model overfitting — RM is a smaller model and the policy can exploit its blind spots. (c) Mode collapse — KL too low, model becomes repetitive. (d) Annotator bias — RM learns annotator preferences, not true human preferences. Modern alternatives: DPO (no RM), GRPO (no value function), Constitutional AI (AI critique replaces some human labeling).',
    },
    {
      topic: 'Agents', level: 'Senior',
      question: 'How would you design an evaluation suite for a coding agent?',
      model_answer: 'Three layers: (1) Static tasks — SWE-bench-style real bug fixes from GitHub. Measure: % tasks where the agent\'s patch passes the original test suite. (2) Interactive tasks — TerminalBench-style where the agent has a shell. Measure: success on multi-step tasks like "set up a Postgres DB and import this CSV". (3) Open-ended — give a real GitHub issue, no test suite. Use LLM-as-judge or human review. CRITICAL: log every action, file edit, and tool call. Most agent failures are silent (agent thinks it succeeded). Build a "trajectory replay" tool so failures can be debugged. Track: success rate, average actions per task, cost per task, regression rate vs prior model. Avoid: trusting a single benchmark — they all become saturated and gameable.',
    },
    {
      topic: 'Fine-Tuning', level: 'Senior',
      question: 'How do you avoid catastrophic forgetting when fine-tuning a base model?',
      model_answer: 'Several techniques, used together: (1) LoRA / QLoRA — only train low-rank adapters, base weights are frozen so old capabilities can\'t be overwritten. (2) Data mixing — include a fraction (5-20%) of the original pretraining data or a general instruction dataset in your fine-tune mix. (3) Low learning rate (1e-5 to 5e-5) and small number of epochs (1-3). (4) EWC (Elastic Weight Consolidation) — penalize changes to weights that were important for the original task. (5) Continuous evaluation on a held-out general-capability benchmark (MMLU, HellaSwag) during fine-tuning; stop when it degrades. (6) For RLHF specifically, the KL penalty is exactly this mechanism — pulls the policy back toward the SFT model.',
    },
    {
      topic: 'Behavioral', level: 'Senior',
      question: 'Where do you stand on the helpful/harmless trade-off?',
      model_answer: 'Don\'t take an extreme position — OpenAI looks for nuanced thinking. Strong answer: (1) Acknowledge real trade-off — refusing is the easy fallback but creates a worse product and pushes users to less safe alternatives. (2) Frame it as: refuse the rare actually-harmful case, help in the ambiguous case with caveats, fully assist on the clear-benign case. (3) Talk about how the refusal classifier itself can be wrong — it must be evaluated for both false positives and false negatives. (4) Acknowledge that "safe" is contextual — what\'s safe at API level may not be safe at consumer product level. (5) Show humility — admit you\'d want to learn the org\'s specific framework rather than impose your own. OpenAI specifically values people who\'ve actually thought about this rather than just having a slogan.',
    },
  ],
  anthropic: [
    {
      topic: 'LLM', level: 'Senior',
      question: 'What is Constitutional AI and what problem does it solve?',
      model_answer: 'CAI replaces human labelers for harm-avoidance training with an AI critic guided by a written set of principles ("constitution"). Process: (1) Have model generate responses. (2) Have a critic model (or the same model) critique outputs against constitution rules. (3) Have the model revise its responses based on the critique. (4) Train on the revised responses (SFT phase) and on preferences between original and revised (RL phase, "RLAIF" — RL from AI feedback). Why it matters: human labeling at scale is expensive AND inconsistent. CAI is reproducible (rules are explicit), auditable (anyone can read the constitution), and scalable. Anthropic uses it for Claude — that\'s why Claude is consistent on safety across topics.',
    },
    {
      topic: 'System Design', level: 'Senior',
      question: 'How would you design an interpretability pipeline for a deployed LLM?',
      model_answer: 'Stack: (1) Activation logging — sample 0.1% of production requests, store activations from key layers in cold storage. (2) Feature extraction — run sparse autoencoders on activations to find interpretable features (a la Anthropic\'s recent work). (3) Behavior monitoring — for each known feature, track activation rate in production. Alert when a feature suddenly fires (e.g., "deception" feature activating). (4) Probing — train linear probes for capabilities you care about (math, code, refusal). Track probe scores over time. (5) Causal interventions — periodically run feature-ablation experiments offline to verify which features actually drive which behaviors. Output: dashboards that say "this week, the model\'s sycophancy feature fired 12% more than baseline." Hard but Anthropic-distinctive answer.',
    },
    {
      topic: 'Behavioral', level: 'Senior',
      question: 'How do you balance shipping speed against thoroughness on safety?',
      model_answer: 'Anthropic watches carefully for two failure modes: (a) "safety theater" — using safety as an excuse not to ship anything, and (b) "move fast and break things" — ignoring real risk. Strong answer: (1) Concrete framework — what risk levels exist, what evals correspond to each level, what the launch bar is. (2) Real example — a time you shipped despite incomplete evals because the risk was low, OR delayed a launch because evals failed even though the team wanted to ship. (3) Acknowledge the cost of being wrong in each direction. (4) End with: "I want to be at a company where safety is not someone else\'s job and not a blocker — it\'s integrated into the engineering practice." That last line specifically resonates at Anthropic.',
    },
  ],
  microsoft: [
    {
      topic: 'MLOps', level: 'Mid',
      question: 'How would you design Copilot to handle 50M daily code completion requests?',
      model_answer: 'Layered approach: (1) Edge inference — small models (300M-1B params) running close to the user (Azure regions) for sub-100ms latency on most completions. (2) Cloud fallback — when edge model is uncertain (low logit margin), upgrade to a 7B-30B model in Azure. (3) Continuous batching with vLLM. (4) Streaming responses — show tokens as they arrive. (5) Aggressive caching — same code prefix produces same suggestion. (6) Smart routing — language detection, repo context size, user tier all affect which model serves the request. (7) Logging for quality eval — track accept rate, edit rate, deletion rate of suggestions. Cost lever: ensure 95%+ of requests hit the cheap edge model.',
    },
    {
      topic: 'System Design', level: 'Mid',
      question: 'Design an AI service that integrates across Outlook, Teams, and Word.',
      model_answer: 'Architecture: (1) Unified user context layer — abstracts each Microsoft Graph API behind a single interface (emails, meetings, documents). (2) Permission layer — every retrieval respects user ACLs (you should NEVER summarize an email the user doesn\'t have access to). (3) Retrieval — vector search over user\'s OWN content, never cross-tenant. Per-tenant index. (4) Prompt assembly — system prompt + retrieved context + user message. (5) Response generation via Azure OpenAI. (6) Caching — but per-user, never share results across users. Compliance: SOC2, HIPAA, EU data residency requirements. Mention Responsible AI principles (Microsoft specifically watches for this). Talk about the data flywheel — feedback signals from accept/reject improve the retrieval ranker.',
    },
    {
      topic: 'Behavioral', level: 'Mid',
      question: 'Tell us about a time you collaborated across teams to ship something.',
      model_answer: 'Microsoft is matrix-heavy — cross-team collaboration is core to the job. Strong pattern: (1) Concrete project that REQUIRED collaboration (not just had it). (2) Stakeholders — who needed to align, what their different priorities were. (3) Specific blocker that came from cross-team friction and how you unblocked it (escalation, finding a shared metric, making a trade-off explicit). (4) How you kept commitments to the partner team even when your team had pressure. (5) Outcome — for both teams, not just yours. Microsoft\'s "One Microsoft" value means they want you to identify with the company, not just your team.',
    },
  ],
  amazon: [
    {
      topic: 'System Design', level: 'Senior',
      question: 'Design Amazon\'s product recommendation system.',
      model_answer: 'Multi-stage: (1) Candidate generation — for each user, fetch ~1000 candidate products via collaborative filtering (matrix factorization or two-tower neural net). Add diversity-aware retrieval (don\'t just show similar items). (2) Ranking — gradient-boosted trees or DLRM-style model with features: user history embeddings, item embeddings, contextual (time of day, device), business (margin, inventory). (3) Re-ranking for business constraints — diversity, fairness across sellers, pinned items for promotions. (4) Online serving — feature store (Redis), model server (SageMaker). (5) Offline retraining nightly on the day\'s click + purchase data. Reference Leadership Principles: Customer Obsession (rank for what the user actually wants, not what we want to sell), Are Right A Lot (use experimentation), Insist on the Highest Standards.',
    },
    {
      topic: 'Behavioral', level: 'Senior',
      question: 'Tell us about a time you had to deal with ambiguity.',
      model_answer: 'Amazon\'s "Deal with Ambiguity" is implicit in many LPs (Are Right A Lot, Have Backbone, Bias for Action). Strong STAR answer: (S) Specific situation — vague goal, unclear stakeholder, unknown constraints. (T) Your TASK as you defined it (showing how you cut through ambiguity). (A) Actions — what you did to reduce ambiguity (write a doc, propose a strawman, run a small experiment, talk to customers). (B) Outcome — what shipped and what you\'d do differently. Reference 1-2 specific LPs by name. Avoid LP-stuffing (mentioning 6 LPs in one story signals you memorized rather than internalized). Use 2 LPs per answer, max.',
    },
    {
      topic: 'MLOps', level: 'Mid',
      question: 'How do you monitor an ML model in production for data drift?',
      model_answer: 'Several signals to track: (1) Feature distributions — compute Population Stability Index (PSI) per feature daily; alert when PSI > 0.25. (2) Prediction distributions — score histogram should be stable; sudden shift = drift. (3) Performance — for labeled data (delayed labels work), track AUC / accuracy. For unlabeled, use proxy metrics like prediction confidence calibration. (4) Embedding drift — for embedding-based models, cluster embeddings periodically and check cluster sizes. Response: automatic retraining pipelines triggered by drift signals, shadow deployment of retrained model, A/B test before promotion. Tools: Amazon SageMaker Model Monitor, CloudWatch alarms. Reference: "Customer Obsession means catching degradation before customers do."',
    },
  ],
  apple: [
    {
      topic: 'MLOps', level: 'Senior',
      question: 'How would you deploy an LLM on-device on iPhone?',
      model_answer: 'Hard constraints: <3GB RAM at runtime, <1GB on disk, <100ms time-to-first-token, must respect Privacy by design. Steps: (1) Model selection — start with a 1-3B-param model (Phi, Gemma, Apple Intelligence-style). (2) Quantization — INT4 with mixed-precision (some critical layers at INT8). Apple uses palettization. (3) On-device runtime — Core ML with Neural Engine (ANE) acceleration. (4) KV-cache management — fixed maximum context (e.g., 2K tokens) to bound memory. (5) Routing — easy queries use on-device, complex queries go to Private Cloud Compute. (6) Privacy — Apple\'s big win: all on-device processing means data never leaves the phone. Show you\'ve thought about thermal throttling and battery impact. Reference Apple Intelligence architecture.',
    },
    {
      topic: 'System Design', level: 'Senior',
      question: 'Design Siri\'s NLU pipeline with privacy as the top priority.',
      model_answer: 'Architecture: (1) Wake word detection — entirely on-device, never uploaded. (2) Speech-to-text — on-device for short queries, cloud (anonymized) for long-form. (3) Intent classification — small on-device model. (4) Entity extraction — on-device for personal data (contacts, calendar), cloud only for general knowledge. (5) Response generation — fully on-device for personal queries ("text my mom"), cloud for general ("what\'s the weather in Tokyo"). (6) Federated learning for model improvement — gradients computed on-device, only differential-privacy-noised aggregates uploaded. Apple\'s framework: Private Cloud Compute for cloud queries — verifiable, audited, no persistence. Mention that on-device gives competitive advantage no cloud-only competitor can match.',
    },
  ],
  nvidia: [
    {
      topic: 'MLOps', level: 'Senior',
      question: 'How do you optimize a transformer for inference on an H100?',
      model_answer: 'Layered optimizations: (1) Flash Attention 3 — H100-specific, exploits TMA and FP8 tensor cores; 2-4× faster than FA2. (2) Quantization — FP8 for activations and weights (H100 has native FP8 tensor cores giving 2× throughput vs FP16). Use SmoothQuant for accuracy. (3) Continuous batching with vLLM or TensorRT-LLM. (4) KV-cache: PagedAttention for memory, INT8 quantization of the cache, sliding window for very long context. (5) CUDA Graphs — capture the entire forward pass to skip kernel launch overhead. (6) Tensor parallelism for models that don\'t fit on one GPU — use NCCL with NVLink. End-to-end: a well-optimized 70B model can hit 5000+ tokens/sec/H100 batched. Talk about NVIDIA-specific tools: Nsight Compute for profiling, NeMo for training, TensorRT-LLM for serving.',
    },
    {
      topic: 'Fine-Tuning', level: 'Senior',
      question: 'How does FSDP differ from DeepSpeed ZeRO and when do you use which?',
      model_answer: 'Both implement parameter sharding — only the shard you need is on each GPU. FSDP is PyTorch-native (since 1.12), tightly integrated with the framework, simpler API, works with FSDP2 mixed precision. DeepSpeed has been around longer, more configuration options (ZeRO-1/2/3, offload to CPU/NVMe, infinity), better for huge models that don\'t fit in aggregate GPU memory. Choose FSDP if: you\'re happy with PyTorch ecosystem, want simpler config, model fits in aggregate GPU memory. Choose DeepSpeed if: training >100B params, need CPU/NVMe offloading, need pipeline parallelism in addition to ZeRO. NVIDIA\'s NeMo framework wraps DeepSpeed + Megatron. Both work well with NCCL on NVIDIA hardware.',
    },
    {
      topic: 'Transformers', level: 'Senior',
      question: 'Why does GPU memory bandwidth limit inference more than FLOPs?',
      model_answer: 'During autoregressive generation, you load all the model weights from HBM (GPU memory) to SRAM (compute) for every single token — but you only do one token\'s worth of computation. Arithmetic intensity (FLOPs per byte loaded) is roughly 1 — far below the GPU\'s peak. For training and prompt processing (lots of tokens at once), arithmetic intensity is high and you\'re compute-bound. This is why: (a) batched inference is much more efficient (amortize the memory load over many requests), (b) Flash Attention helps even though it does more FLOPs (it reduces memory traffic), (c) quantization is dramatic — INT4 cuts memory bandwidth needed by 4× and you get 4× throughput. NVIDIA-specific: H100 has 3 TB/s HBM, B100 has 8 TB/s — bandwidth is the real spec to watch.',
    },
  ],
  'hugging-face': [
    {
      topic: 'NLP', level: 'Mid',
      question: 'Walk us through what happens when you call AutoTokenizer.from_pretrained()',
      model_answer: '(1) Resolve the model id ("bert-base-uncased") to a Hugging Face Hub repo. (2) Download (or read from cache) tokenizer_config.json which says which tokenizer class to use. (3) Download tokenizer.json (fast tokenizer, Rust-backed) or vocab.txt + merges.txt (slow tokenizer, Python). (4) Instantiate the right class — BertTokenizerFast, GPT2TokenizerFast, etc. — and load vocab + merges. (5) Tokenizer is now ready: .encode() converts strings to token IDs, .decode() reverses. Fast tokenizer uses Rust (HF tokenizers crate) — 100-1000× faster than the Python slow tokenizer for batched encoding. Mention how AutoTokenizer dispatches via the model\'s config — that\'s the magic.',
    },
    {
      topic: 'LLM', level: 'Mid',
      question: 'How would you contribute a new model to the transformers library?',
      model_answer: 'Process: (1) Fork transformers repo. (2) Read CONTRIBUTING.md and the "adding a new model" guide. (3) Run `transformers-cli add-new-model-like` to scaffold based on an existing model. (4) Implement the model class in `src/transformers/models/<name>/modeling_<name>.py` — typically mirror an existing architecture and modify. (5) Implement config and tokenizer if they\'re custom. (6) Write integration tests that verify outputs match the original implementation (this is the hard part — needs the original checkpoints). (7) Add docs and code examples. (8) Submit PR with reviewers from the HF team. Tips: contribute alongside the model authors if possible — many modern models are added in collaboration with the labs that trained them. HF specifically loves contributors who care about clean code and good docs.',
    },
  ],
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const hasSession = cookieStore.get('admin_session')?.value === 'true'

  if (!hasSession) {
    const { password } = await req.json().catch(() => ({}))
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = getAdminSupabase()

  // Resolve company slug → company id
  const { data: companies } = await supabase.from('companies').select('id, slug')
  if (!companies || companies.length === 0) {
    return NextResponse.json({ error: 'No companies found. Seed companies first.' }, { status: 400 })
  }
  const slugToId = Object.fromEntries(companies.map(c => [c.slug as string, c.id as number]))

  // Existing questions (used to skip duplicates by exact text per company)
  const { data: existing } = await supabase
    .from('company_questions')
    .select('company_id, question')
  const existingKey = new Set(
    (existing ?? []).map(r => `${r.company_id}::${(r.question as string).trim()}`)
  )

  const rows: Array<{ company_id: number; question: string; model_answer: string; topic: string; level: string }> = []
  let unknownCompanies = 0

  for (const [slug, qs] of Object.entries(COMPANY_QUESTIONS)) {
    const id = slugToId[slug]
    if (!id) { unknownCompanies++; continue }
    for (const q of qs) {
      const k = `${id}::${q.question.trim()}`
      if (existingKey.has(k)) continue
      rows.push({ company_id: id, question: q.question, model_answer: q.model_answer, topic: q.topic, level: q.level })
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ seeded: 0, message: 'All company questions already seeded.', unknownCompanies })
  }

  const { error, data } = await supabase
    .from('company_questions')
    .insert(rows)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    seeded: data?.length ?? rows.length,
    unknownCompanies,
    message: 'Company questions inserted (verified=true by default).',
  })
}
