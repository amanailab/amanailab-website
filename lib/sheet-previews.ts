// Interview Q&A previews for sheet items, keyed by item id.
// Merged into items at render time (same pattern as SHEET_THEORY) so the
// authored data in sheet-data.ts stays compact. Inline `preview` on an item
// wins over this map.

export const SHEET_PREVIEWS: Record<string, { q: string; a: string }> = {

  // ── Generative AI ──────────────────────────────────────────────────────────
  'gt-8': {
    q: 'Why do MoE models like Mixtral have huge parameter counts but cheap inference?',
    a: 'A Mixture of Experts layer holds N expert FFNs (e.g. 8) but a router activates only k of them (e.g. 2) per token. Mixtral 8x7B has ~47B total parameters but only ~13B are active per forward pass — so compute cost tracks active parameters while capacity tracks total parameters. Trade-offs: all experts must sit in memory (VRAM cost stays high), routing adds load-balancing challenges (auxiliary losses prevent expert collapse), and fine-tuning is trickier than dense models.',
  },
  'gl-4': {
    q: 'A model trained on 8K context is extended to 128K. What breaks and how do RoPE-scaling methods fix it?',
    a: 'Beyond the trained length, RoPE rotation frequencies produce position patterns the model never saw — attention degrades sharply ("lost in the middle" worsens, perplexity explodes). Position interpolation squeezes 128K positions into the trained 0-8K rotation range so all positions look familiar, at some resolution cost. YaRN refines this by scaling different frequency bands differently (high frequencies — local relationships — are kept intact, low frequencies are interpolated) plus a temperature adjustment, achieving long-context extension with minimal fine-tuning.',
  },
  'gl-7': {
    q: 'Your LLM output is repetitive and bland. Which sampling knobs do you turn and why?',
    a: 'Raise temperature (scales logits before softmax; >1 flattens the distribution, increasing diversity), use top-p (nucleus) sampling rather than greedy/top-k so the candidate pool adapts to the distribution\'s shape, and add a repetition/frequency penalty to push down already-generated tokens. Caveats: temperature too high produces incoherence; for tasks needing determinism (extraction, code) use temperature ~0 instead. Greedy decoding is the usual root cause of loops — "the the the" — because the argmax token keeps winning.',
  },
  'gl-10': {
    q: 'BLEU and ROUGE correlate poorly with quality for LLM outputs. Why, and what do you use instead?',
    a: 'BLEU/ROUGE measure n-gram overlap with a reference — fine for translation-era systems, but modern LLM answers can be perfect with zero lexical overlap (different valid wording) or terrible with high overlap. Alternatives: LLM-as-judge (a strong model grades outputs against a rubric — scalable, but watch for self-preference and position bias; randomize order, use pairwise comparisons), human eval for final calls, and task-specific metrics (exact match for extraction, pass@k for code, RAGAS faithfulness for RAG). Perplexity only measures fluency under the model, not factuality or helpfulness.',
  },
  'gp-4': {
    q: 'How does JSON mode / structured output actually work under the hood?',
    a: 'Two mechanisms. (1) Constrained decoding: at each step the runtime masks logits to only tokens that keep the output valid against the schema/grammar (how OpenAI strict mode and outlines/guidance work) — guarantees validity by construction. (2) Prompt-and-retry: instruct the model, parse, re-prompt on failure — simpler but probabilistic. Function calling is structured output applied to tool invocation: the model emits {name, arguments} JSON validated against the declared parameter schema. Constrained decoding can slightly degrade content quality since the model is forced off its preferred tokens — keep schemas as loose as correctness allows.',
  },
  'gr-1': {
    q: 'Walk me through what happens when a user asks a question to a RAG system.',
    a: 'Offline: documents are chunked, embedded, and indexed in a vector store. Online: (1) embed the query with the same model, (2) ANN search retrieves top-k similar chunks, (3) optionally rerank with a cross-encoder, (4) stuff the best chunks into the prompt with instructions to answer only from context, (5) the LLM generates a grounded answer, ideally with citations. Failure points interviewers probe: chunking that splits semantic units, embedding model mismatch between corpus and queries, k too small (missed evidence) or too large (noise), and the model ignoring context in favor of parametric knowledge.',
  },
  'gr-3': {
    q: 'How do embedding models put "similar meaning" near each other, and what are their limits?',
    a: 'Trained with contrastive learning (e.g. on query-document pairs), the model pulls related texts together and pushes unrelated apart in a ~1K-dim space; cosine similarity then approximates semantic relatedness. Limits worth naming: (1) embeddings are weak at exact keyword/ID/negation matching — "no fever" and "fever" land close, which is why hybrid BM25+vector search wins in production; (2) domain shift — a general model misjudges legal/medical jargon; (3) asymmetry — questions and answers look different, so retrieval-tuned models encode them differently (query vs passage prefixes).',
  },
  'gr-4': {
    q: 'When would you pick pgvector over a dedicated vector DB like Pinecone?',
    a: 'Decision axes: scale, ops, and features. pgvector wins when the corpus is modest (<~5-10M vectors), you already run Postgres, and you want transactional consistency between vectors and metadata with no extra infra or vendor bill. Dedicated stores (Pinecone, Qdrant, Weaviate, Milvus) win at larger scale: better ANN index management (HNSW/IVF tuning), horizontal sharding, metadata filtering at scale, and managed ops. Interview-ready answer: start with pgvector for an MVP, migrate when recall/latency at your scale demands it — and say what you\'d measure (recall@k vs exact search, p95 latency) to make that call.',
  },
  'gr-9': {
    q: 'How do you evaluate a RAG system without ground-truth answers?',
    a: 'RAGAS-style reference-free metrics, each isolating one failure mode: faithfulness (is every claim in the answer supported by retrieved context? — catches hallucination), answer relevancy (does it address the question?), context precision (are retrieved chunks actually relevant? — retrieval noise), and context recall (did retrieval find the needed evidence? — needs a reference or LLM-judged claims). All scored by an LLM judge over claim decomposition. Production practice: build a 100-300 question eval set from real user queries, score on every retrieval/chunking change, and track the retrieval metrics separately from the generation metrics so you know which half to fix.',
  },
  'gf-1': {
    q: 'When do you fine-tune vs use RAG vs just prompt engineer?',
    a: 'Decision rule: where does the gap live — knowledge, behavior, or instructions? Missing/changing KNOWLEDGE → RAG (updatable, auditable, no retraining; fine-tuning is a poor knowledge store and can\'t cite sources). Wrong BEHAVIOR/format/style/domain reasoning → fine-tuning (teaches how to respond: consistent JSON, tone, domain conventions). Gap closable with better INSTRUCTIONS or few-shot examples → prompt engineering first; it\'s the cheapest and you always try it before the others. Production systems commonly combine all three: a fine-tuned model, fed retrieved context, behind an engineered prompt. Bonus point: fine-tuning on new facts increases hallucination risk — the model learns to state things confidently regardless of source.',
  },
  'gf-5': {
    q: 'Why has DPO largely replaced PPO-based RLHF, and what does it give up?',
    a: 'PPO pipeline: train a reward model on human preferences, then RL-optimize the policy against it — four models in memory (policy, ref, reward, value), unstable, hyperparameter-sensitive. DPO\'s insight: the RLHF objective has a closed-form solution expressible directly as a loss on preference pairs — train the policy directly on (chosen, rejected) pairs with a frozen reference model. Two models, supervised-style stability, far cheaper. Give-ups: no explicit reward model to reuse (e.g. for rejection sampling or online RL), purely offline (can\'t explore beyond the preference data), and can overfit preference noise. Frontier labs often still use online RL variants for that reason; DPO dominates open-source alignment.',
  },
  'gi-1': {
    q: 'INT4 quantization cuts your model memory 4× — what does it cost you and how do you check?',
    a: 'Quantization maps FP16 weights to low-bit integers with scale factors. Costs: accuracy degradation concentrated in outlier-heavy layers (modern methods — GPTQ, AWQ — calibrate on sample data and protect salient weights), and sometimes slower-than-expected inference if kernels aren\'t optimized for the format. Verification: never trust perplexity alone — run your actual task evals before/after (the drop is task-dependent; reasoning and math degrade first). Rule of thumb: INT8 is near-lossless, INT4 is usually a 1-3% quality trade for 4× memory — which is why a quantized 70B often beats a full-precision 13B at equal VRAM: parameter count beats precision.',
  },
  'gi-4': {
    q: 'How does knowledge distillation work and when is the student "good enough"?',
    a: 'A small student model trains to match a large teacher\'s outputs. Classic: match softened logits (temperature-scaled probabilities carry "dark knowledge" — relative wrongness of wrong classes — richer signal than hard labels). For LLMs: generate teacher outputs on a task corpus and SFT the student on them (sequence-level distillation — how most "distilled" open models are made). The student is good enough when it passes YOUR task evals within tolerance, not benchmark parity — a 7B distilled on a narrow task routinely matches a 70B teacher on that task at 10× lower cost, while losing general ability you weren\'t using anyway.',
  },

  // ── Agentic AI ─────────────────────────────────────────────────────────────
  'af-1': {
    q: 'What makes something an "agent" rather than a chatbot or a workflow?',
    a: 'An agent decides its own control flow: it perceives state, plans, acts via tools, observes results, and iterates until the goal is met — the LLM chooses what to do next. A chatbot just maps messages to replies; a workflow has hardcoded steps where an LLM may fill in slots but never redirects the flow. The practical line: if you can draw the full flowchart in advance, it\'s a workflow (cheaper, more reliable — and the better choice more often than candidates admit). Strong interview answer includes that judgment: use agents only when the path genuinely can\'t be predetermined.',
  },
  'at-1': {
    q: 'The model "calls" a function — what actually happens end to end?',
    a: 'You send the chat history plus JSON-schema declarations of available tools. The model emits a structured response: tool name + arguments JSON (it does NOT execute anything). Your runtime validates the arguments, executes the real function, and appends the result as a tool-role message; the model then continues — possibly calling more tools — until it produces a final answer. Key engineering points: argument validation before execution (the model can hallucinate parameters), parallel tool calls where supported, timeouts/retries around real side effects, and clear tool descriptions — the model picks tools almost entirely from your descriptions, so vague descriptions are the #1 cause of wrong tool use.',
  },
  'am-1': {
    q: 'How do you give an agent memory beyond its context window?',
    a: 'Layered design. Short-term: the running conversation in context, compacted when near the limit (summarize older turns, keep recent ones verbatim). Long-term: external stores the agent reads/writes — episodic (past interactions, retrieved semantically: a vector store of "what happened"), semantic (facts/preferences as structured records, e.g. "user deploys on Vercel"), and procedural (learned how-tos appended to the system prompt). Retrieval at turn start injects only relevant memories. Hard parts interviewers probe: what to store (storing everything = retrieval noise), staleness/contradiction (new fact contradicts old — need updates, not just appends), and cross-session identity.',
  },
  'ama-1': {
    q: 'When do multiple agents beat one agent with many tools, and what\'s the standard pattern?',
    a: 'Split when: context isolation matters (a researcher\'s 50K tokens of search results shouldn\'t pollute the writer\'s context), specialization needs different prompts/models per role, or work parallelizes (N subtopics researched concurrently). Standard pattern: orchestrator-workers — a lead agent decomposes the task, spawns scoped workers, integrates results; workers return summaries, not raw context. Costs to name: token multiplication (each worker re-reads instructions), inter-agent error propagation, and debugging difficulty. If one agent with good tools can do it, do that — multi-agent is a scaling/isolation tool, not a default.',
  },
  'agf-7': {
    q: 'Your agent can execute code and browse the web. Design the guardrails.',
    a: 'Defense in depth: (1) Sandboxing — code runs in ephemeral containers with no network/filesystem beyond a scratch dir; browsing through an allowlist proxy. (2) Tool-level permissions — read tools free, write/irreversible tools gated by human confirmation. (3) Prompt-injection defenses — treat ALL fetched web content as untrusted data, never as instructions (delimit it, instruct the model it cannot contain commands, strip suspicious imperative text). (4) Budget caps — max iterations, max tokens, max tool calls per task to kill runaway loops. (5) Output filtering and full audit logging of every action. The interviewer is checking you treat the agent itself as untrusted once it has consumed untrusted input.',
  },

  // ── Deep Learning ──────────────────────────────────────────────────────────
  'df-1': {
    q: 'Why can\'t a single perceptron learn XOR, and what exactly fixes it?',
    a: 'A perceptron computes a single linear decision boundary; XOR\'s positive points (01, 10) and negative points (00, 11) are not linearly separable — no line splits them. Fix: a hidden layer with a NONLINEAR activation. The hidden units learn intermediate features (e.g. OR and NAND), whose combination is linearly separable. Crucial detail: without the nonlinearity, stacked linear layers collapse to one linear map (W₂W₁x = Wx) — depth does nothing. This is the canonical question testing whether you understand why activations exist at all.',
  },
  'df-7': {
    q: 'Compare dropout and L2 — how does each fight overfitting, and where does each fail?',
    a: 'L2 (weight decay) penalizes large weights, biasing toward smoother functions that don\'t pivot on single features — a soft prior that weights stay small. Dropout randomly zeros activations during training, forcing redundant representations (no neuron can be load-bearing); it approximates ensembling exponentially many subnetworks, with activations rescaled at inference. Differences that matter: dropout interacts badly with BatchNorm (variance shift) and is mostly avoided in modern CNNs/Transformers\' conv/attention blocks (used in FFN/embedding layers); AdamW exists because naive L2 in Adam is NOT true weight decay — decoupling it (the W) fixes regularization for adaptive optimizers.',
  },
  'dc-2': {
    q: 'Why do plain deep CNNs degrade past ~20 layers, and how do skip connections fix it?',
    a: 'Not (only) vanishing gradients and not overfitting — the degradation problem: deeper plain nets get WORSE training error than shallow ones, because layers struggle to learn identity-like mappings through stacked nonlinear transforms. ResNet reframes each block to learn a residual F(x) added to a skip path: output = F(x) + x. Learning "do nothing" becomes trivial (push F→0), so depth can\'t hurt, and gradients flow directly through the additive skips, keeping 100+ layer networks trainable. This idea — residual streams — is also why Transformers train at depth; modern LLMs are residual networks too.',
  },
  'dc-6': {
    q: 'You have 2,000 labeled images. Walk me through your transfer learning strategy.',
    a: 'Start from a pretrained backbone (ImageNet CNN or a ViT/CLIP encoder). With 2K images: freeze the backbone, train only a new head first — fastest, least overfitting risk. If validation accuracy plateaus and the domain differs from ImageNet (e.g. medical, satellite), unfreeze the last block(s) and fine-tune with a 10-100× lower LR, heavy augmentation, and early stopping. Key reasoning to verbalize: early layers learn generic edges/textures (transfer well), later layers are task-specific (need adaptation); the smaller the dataset and the closer the domain, the more you freeze. Mention you\'d also try zero-shot CLIP as a baseline before training anything.',
  },
  'dr-8': {
    q: 'Transformers won — so when is an RNN/SSM still the right choice in 2026?',
    a: 'Constraints where recurrence wins: (1) Streaming/edge inference — an RNN carries O(1) state per step vs a Transformer\'s growing KV cache; for always-on, low-power, real-time signals (audio, sensors), constant memory matters. (2) Extremely long sequences where O(n²) attention is prohibitive — modern answer: SSMs like Mamba, recurrent models with selective state, O(n) compute. (3) Tiny-data regimes where Transformer capacity overfits. The nuanced close interviewers like: the field is converging on hybrids (attention layers interleaved with SSM layers, e.g. Jamba) — attention for precise random-access recall, recurrence for cheap long-range compression.',
  },

  // ── Machine Learning ───────────────────────────────────────────────────────
  'ma-1': {
    q: 'Your linear regression has highly correlated features. What breaks, and Ridge vs Lasso — which do you reach for?',
    a: 'Multicollinearity makes OLS coefficients unstable: (XᵀX) is near-singular, so estimates get huge variance — tiny data changes flip signs/magnitudes, killing interpretability (predictions can remain fine). Ridge (L2) shrinks coefficients smoothly and SPREADS weight across correlated features — stabilizes, never zeroes; the closed form (XᵀX + λI)⁻¹ literally fixes the singularity. Lasso (L1) zeroes features — between correlated ones it arbitrarily picks one, which is unstable selection. Reach for Ridge for stability with correlated features, Lasso when you want sparse selection, ElasticNet when you want both. Always standardize features first — penalties are scale-sensitive.',
  },
  'ma-4': {
    q: 'Why does a random forest beat a single decision tree, and when does it lose to gradient boosting?',
    a: 'A deep tree is a low-bias, HIGH-variance learner — small data perturbations change splits drastically. The forest attacks variance two ways: bagging (each tree sees a bootstrap sample) and feature subsampling at every split (decorrelates trees — otherwise all trees would lead with the same strong feature and ensemble averaging would gain little). Averaging ~uncorrelated high-variance models slashes variance with little bias cost. Boosting instead builds trees sequentially on residuals, reducing BIAS — typically wins on tabular benchmarks (XGBoost/LightGBM) but is more overfitting-prone and harder to tune. RF: robust, parallel, near-zero tuning. Caveat: impurity-based feature importance inflates high-cardinality features — use permutation importance.',
  },
  'me-2': {
    q: 'Training accuracy 99%, test accuracy 72%. Diagnose and fix.',
    a: 'Classic overfitting (variance) — but verify before treating: check for data leakage first (duplicates across splits, target leakage, temporal leakage in time-series splits), since leakage mimics this signature and no regularizer fixes it. If genuinely overfitting, the ordered toolkit: more/augmented data (best fix), stronger regularization (L2, dropout, early stopping on validation), reduce model capacity, and for tabular models reduce tree depth / increase min-samples-per-leaf. Counter-case to mention: if training accuracy were ALSO low, that\'s bias (underfitting) — the fixes invert (bigger model, more features, less regularization). Stating the bias-variance framing out loud is most of the points.',
  },
  'me-4': {
    q: 'Fraud detection with 0.1% positives — which metric, and why not accuracy or even ROC-AUC?',
    a: 'Accuracy is useless (always-negative scores 99.9%). ROC-AUC is misleading under extreme imbalance: the false-positive RATE stays tiny even with many false positives because true negatives are enormous — curves look great while precision is garbage. Use precision-recall: PR-AUC for model comparison, then pick an operating threshold from business costs — recall at a fixed precision your fraud-ops team can handle (e.g. "recall at 90% precision"), since each flagged case costs review time. Also name: F1 if you must single-number it, calibration if scores feed downstream decisions, and never use the default 0.5 threshold on imbalanced problems.',
  },
  'ms-3': {
    q: 'Your A/B test shows +2% conversion, p = 0.04. The PM wants to ship. What do you check first?',
    a: 'p=0.04 means: IF there were no real effect, data this extreme happens 4% of the time — it is NOT a 96% chance the feature works. Checks before shipping: (1) Was the sample size and runtime fixed in advance, or did someone peek and stop at significance (p-hacking — inflates false positives massively)? (2) Practical vs statistical significance — is +2% worth the complexity; what\'s the confidence interval (could be +0.1% to +3.9%)? (3) Multiple comparisons — if 20 metrics were tested, one will hit p<0.05 by chance; correct or pre-register the primary metric. (4) Novelty effects and segment consistency. The interviewer is testing whether you treat p<0.05 as a ritual or actually understand error rates.',
  },

  // ── MLOps ──────────────────────────────────────────────────────────────────
  'mos-3': {
    q: 'What makes vLLM so much higher-throughput than naive Transformer serving?',
    a: 'Two core ideas. (1) PagedAttention: KV cache stored in fixed-size blocks with an indirection table — like virtual memory — eliminating the fragmentation and worst-case-length over-allocation that wastes 60-80% of VRAM in naive serving; freed memory = bigger batches. (2) Continuous batching: instead of waiting for an entire batch to finish (head-of-line blocking by the longest generation), finished sequences leave and new requests join the batch at every iteration, keeping the GPU saturated. Together: 2-4× throughput at the same hardware. Worth adding: prefix caching for shared system prompts, and the latency/throughput knob (max batch size) you tune per SLO.',
  },
  'mos-4': {
    q: 'Batch vs online vs streaming inference — how do you choose, with examples?',
    a: 'Choose by freshness requirement and cost. Batch: predictions computed on a schedule, served from a store — for slow-changing signals (churn scores, product embeddings refreshed nightly); cheapest, highest throughput, hours-stale. Online (request-time): model behind an API, p99 latency budget — needed when the input only exists at request time (this exact search query, this fraud check). Streaming: continuous scoring over an event stream (Kafka → Flink) — for always-on signals like anomaly detection on transactions. Real systems mix them: batch-precompute candidate embeddings, online-rank at request time. Interviewers want the cost framing: batch is 10-100× cheaper per prediction — default to it unless freshness forces otherwise.',
  },
  'mop-5': {
    q: 'No labels arrive for weeks after prediction. How do you know your production model is degrading?',
    a: 'Monitor proxies in order of signal: (1) Input drift — compare live feature distributions to training: PSI per feature (alert >0.2) or KS tests; catches upstream schema changes and population shift. (2) Prediction drift — the output distribution moving (fraud-rate predictions doubling overnight = something broke). (3) Confidence/entropy shifts. (4) Business proxies that arrive faster than labels (click-through as proxy for relevance). (5) Canary eval sets scored continuously. Key caveat to name: input drift ≠ performance drop (the model may be robust to that shift) — drift alarms trigger investigation and possibly fast-tracked labeling, not automatic retraining.',
  },
  'moi-5': {
    q: 'DDP vs FSDP — when does data parallelism stop being enough?',
    a: 'DDP replicates the FULL model on every GPU; each processes different data, gradients all-reduce after backward. Works until model + optimizer state exceeds one GPU: with Adam that\'s ~16 bytes/param (fp16 weights+grads + fp32 master+moments) — a 7B model needs ~112GB, far past one A100. FSDP/ZeRO-3 shards parameters, gradients, AND optimizer state across GPUs, all-gathering each layer\'s weights just-in-time for compute then freeing them — memory per GPU drops near-linearly with GPU count, paying extra communication. Rule of thumb: DDP if the model fits comfortably (faster, simpler), FSDP when it doesn\'t; beyond that, add tensor/pipeline parallelism (the 3D parallelism used for frontier-scale training).',
  },

  // ── System Design ──────────────────────────────────────────────────────────
  'sdl-5': {
    q: 'Design ChatGPT — what are the components beyond "an LLM behind an API"?',
    a: 'Walk the request path: auth/rate-limiting gateway → conversation service (history store, e.g. DynamoDB/Postgres, with context-window management: truncation + rolling summarization) → safety layer (input moderation classifier) → inference cluster (vLLM-style continuous batching, GPU autoscaling on queue depth, streaming via SSE) → output moderation → response. Cross-cutting: token-based billing/quotas, prompt caching for system prompts, multi-region GPU capacity with failover, and an eval/feedback pipeline (thumbs ratings feeding preference data). Differentiators interviewers listen for: streaming-first design (TTFT is the UX metric), KV-cache-aware routing (sticky sessions to reuse cache), and graceful degradation under GPU shortage (queue + smaller fallback model).',
  },
  'sdm-2': {
    q: 'Design real-time fraud detection — what makes the latency requirement hard?',
    a: 'The decision must land inside the payment authorization flow — ~100ms p99 budget total, leaving maybe 20-30ms for the model. Architecture: rules engine first (instant blocks for known-bad patterns), then ML scoring with features from a low-latency feature store (Redis) — counters like "transactions from this card in last 10 min" maintained by a streaming pipeline (Kafka/Flink) for point-in-time-correct velocity features. The hard parts to name: feature freshness vs latency (the most predictive features are real-time aggregates), extreme class imbalance (~0.1% fraud — PR-AUC, threshold per business cost), adversarial drift (fraudsters adapt — frequent retraining + champion/challenger), and the feedback loop (blocked transactions never get labels — selective labeling bias).',
  },
}
