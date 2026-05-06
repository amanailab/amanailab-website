export interface Flashcard {
  front: string
  back: string
}

export interface TopicMeta {
  slug: string
  label: string
  description: string
  seoTitle: string
  seoDescription: string
  color: string
  bg: string
  bar: string
  concepts: string[]
  cards: Flashcard[]
}

export const TOPICS: TopicMeta[] = [
  {
    slug: 'llm',
    label: 'LLM',
    description: 'Large Language Models power modern AI products. Interviews test your understanding of transformer internals, generation strategies, prompt engineering, and production challenges like hallucination and latency.',
    seoTitle: 'LLM Interview Questions — Complete Guide 2025 | AmanAI Lab',
    seoDescription: 'Top Large Language Model interview questions with model answers. Covers attention, tokenization, RLHF, KV cache, hallucination, and more. Practice for Google, OpenAI, Meta.',
    color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', bar: 'bg-blue-500',
    concepts: ['Attention mechanism','Tokenization & BPE','Temperature & sampling','Context window','Hallucination mitigation','RLHF & alignment','KV cache','Prompt engineering'],
    cards: [
      { front: 'What is the attention mechanism?', back: 'Self-attention lets each token attend to all others by computing weighted sums of values based on query-key dot products. Enables capturing long-range dependencies regardless of distance. Multi-head attention runs this in parallel with different learned projections.' },
      { front: 'What is temperature in LLM sampling?', back: 'Controls output randomness. Low temp (0.1–0.3) = focused/deterministic. High temp (0.8–1.2) = creative/diverse. Temperature=0 is greedy decoding (always picks highest probability token). Used to trade off between consistency and creativity.' },
      { front: 'What is a context window?', back: 'The maximum number of tokens an LLM can process at once (input + output). GPT-4: 128K, Claude: 200K, Gemini: 1M. Larger windows cost more to run due to O(n²) attention complexity. Critical constraint for RAG and long document tasks.' },
      { front: 'What is hallucination in LLMs?', back: 'When models generate plausible-sounding but factually wrong content. Caused by training data gaps, pattern completion bias, and lack of factual grounding. Mitigated by RAG (grounding in real docs), RLHF, citations, and low temperature.' },
      { front: 'What is RLHF?', back: 'Reinforcement Learning from Human Feedback. Step 1: supervised fine-tuning on demonstrations. Step 2: train reward model on human preference pairs. Step 3: PPO to maximize reward. Used by GPT-4, Claude, Llama. Aligns model with human values.' },
      { front: 'What is chain-of-thought prompting?', back: 'Prompting LLMs to reason step-by-step before answering. "Let\'s think step by step." Significantly improves accuracy on math, logic, and multi-step tasks. Zero-shot CoT works without examples. Auto-CoT generates reasoning chains automatically.' },
      { front: 'What is a KV cache?', back: 'Stores key-value matrices from previously processed tokens during autoregressive generation to avoid recomputation. Speeds up inference significantly. Main memory bottleneck for long sequences. Critical optimization for LLM serving infrastructure.' },
      { front: 'What is few-shot prompting?', back: 'Providing input-output examples in the prompt to guide model behavior without gradient updates. 0-shot = no examples, 1-shot = one, few-shot = 2-5+. More effective than zero-shot on complex tasks. Foundation of in-context learning.' },
      { front: 'What is prompt injection?', back: 'Security attack where malicious input overrides system instructions (e.g., "Ignore previous instructions and..."). Key risk in production LLM apps. Mitigated by input validation, sandboxing, output filtering, and least-privilege tool access.' },
      { front: 'What is the difference between encoder and decoder models?', back: 'Encoders (BERT): bidirectional attention, good for classification/NER/embeddings. Decoders (GPT): causal attention, good for generation. Encoder-decoder (T5): seq2seq tasks like translation/summarization. Most modern LLMs are decoder-only.' },
    ],
  },
  {
    slug: 'rag',
    label: 'RAG',
    description: 'Retrieval-Augmented Generation is the dominant pattern for grounding LLMs in real data. Interviews test chunking strategies, embedding models, vector search, re-ranking, and evaluation.',
    seoTitle: 'RAG Interview Questions — Retrieval-Augmented Generation Guide | AmanAI Lab',
    seoDescription: 'Complete RAG interview preparation. Covers chunking, vector embeddings, hybrid search, re-ranking, HyDE, RAGAS evaluation, and advanced RAG patterns.',
    color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', bar: 'bg-violet-500',
    concepts: ['Vector embeddings','Chunking strategies','Hybrid search','Re-ranking','HyDE','RAGAS evaluation','Naive vs Advanced RAG','Knowledge graphs'],
    cards: [
      { front: 'What is RAG?', back: 'Retrieval-Augmented Generation: retrieve relevant documents from a knowledge base and inject them into the LLM context. Reduces hallucination by grounding answers in real data. Enables real-time knowledge updates without retraining the model.' },
      { front: 'What is chunking and why does it matter?', back: 'Splitting documents into smaller pieces for embedding and retrieval. Too small = loses context, too large = noisy and expensive. Optimal: 256-512 tokens with 10-20% overlap. Semantic chunking (by topic) outperforms fixed-size chunking.' },
      { front: 'What is a vector embedding?', back: 'A dense numerical representation of text in high-dimensional space. Similar meanings → similar vectors (close in space). Generated by encoder models (OpenAI ada-002, Cohere, E5). Used for semantic search, clustering, and retrieval.' },
      { front: 'What is hybrid search?', back: 'Combining dense (semantic/vector) and sparse (BM25/keyword) retrieval. Dense handles synonyms and concepts; sparse handles exact matches and rare terms. Reciprocal Rank Fusion (RRF) merges ranked results. Usually outperforms either alone.' },
      { front: 'What is re-ranking?', back: 'A second-stage retrieval pass that scores top-k candidates more precisely using a cross-encoder. Slower than bi-encoder retrieval but much more accurate. Common models: Cohere Rerank, MS MARCO. Dramatically improves precision of final results.' },
      { front: 'What is HyDE?', back: 'Hypothetical Document Embedding: use an LLM to generate a hypothetical answer to the query, then embed the hypothetical answer for retrieval (instead of the raw query). Bridges the semantic gap between question style and answer style.' },
      { front: 'How do you evaluate a RAG pipeline?', back: 'RAGAS framework: faithfulness (is answer grounded in context?), answer relevance (does it answer the question?), context precision (are retrieved docs relevant?), context recall (are all relevant docs retrieved?). Use LLM-as-judge for automated evaluation.' },
      { front: 'What is naive vs advanced RAG?', back: 'Naive: fixed chunking → simple retrieval → generation. Advanced RAG: query rewriting, HyDE, iterative/multi-hop retrieval, self-RAG, fusion retrieval. Modular RAG breaks pipeline into swappable components for better optimization.' },
      { front: 'What are common RAG failure modes?', back: 'Retrieval misses (wrong chunks fetched), lost in the middle (LLM ignores middle context), too much noise (irrelevant chunks), semantic drift (query-document mismatch), outdated knowledge. Each has specific mitigation strategies.' },
      { front: 'What is self-RAG?', back: 'LLM learns to decide when to retrieve, generates retrieval tokens (RETRIEVE, ISREL, ISSUP), and critiques its own outputs. More efficient than always retrieving — only fetches when needed. Trained end-to-end with special reflection tokens.' },
    ],
  },
  {
    slug: 'agents',
    label: 'Agents',
    description: 'AI Agents use LLMs to plan and execute actions. Interviews cover ReAct, tool use, memory management, multi-agent coordination, and evaluation challenges.',
    seoTitle: 'AI Agents Interview Questions — Complete Guide | AmanAI Lab',
    seoDescription: 'AI Agent interview questions covering ReAct, tool use, memory, planning, multi-agent systems, and agent evaluation for ML engineer interviews.',
    color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', bar: 'bg-orange-500',
    concepts: ['ReAct framework','Tool use & function calling','Memory types','Planning strategies','Multi-agent coordination','Agent evaluation','Safety & guardrails','LangChain & LlamaIndex'],
    cards: [
      { front: 'What is the ReAct framework?', back: 'Reasoning + Acting: agent alternates between Thought (reasoning about what to do), Action (calling a tool), and Observation (processing result). Combines chain-of-thought with tool use. Significantly improves task completion on complex problems.' },
      { front: 'What types of memory do agents have?', back: 'In-context (within current context window), External (vector DB for episodic memory), Procedural (fine-tuned skills), Semantic (knowledge bases). Short-term = context. Long-term = external stores. Memory management is key bottleneck for long-running agents.' },
      { front: 'What is function calling / tool use?', back: 'LLMs can output structured JSON to invoke external tools (APIs, code execution, search). Model is trained to select appropriate function and fill parameters. OpenAI/Anthropic provide native function calling. Enables grounded, actionable outputs.' },
      { front: 'What is the difference between task decomposition approaches?', back: 'Zero-shot: agent plans from scratch. Few-shot: examples guide decomposition. Tree of Thoughts: explore multiple reasoning paths. LLM Compiler: parallelize independent subtasks. LATS: Monte Carlo tree search for planning.' },
      { front: 'What are multi-agent systems?', back: 'Multiple specialized agents collaborating on complex tasks. Patterns: supervisor (orchestrator delegates to workers), peer-to-peer (agents communicate directly), hierarchical (nested agent teams). Enables parallelism and specialization but adds coordination complexity.' },
      { front: 'How do you evaluate agent performance?', back: 'Task completion rate, step efficiency (fewer steps = better), tool call accuracy, faithfulness to instructions, safety violations, latency, cost. Hard to evaluate due to long-horizon tasks. Benchmarks: AgentBench, GAIA, WebArena.' },
      { front: 'What is agent safety / guardrails?', back: 'Preventing agents from taking harmful or unauthorized actions. Techniques: action whitelisting, human-in-the-loop for irreversible actions, sandboxed code execution, prompt injection defense, output filtering. Critical for production deployment.' },
      { front: 'What is the context management challenge in agents?', back: 'Agents accumulate context (observations, tool outputs) that quickly fills the window. Solutions: summarization of old context, sliding window, selective memory retrieval, compressing tool outputs. Key engineering challenge for long-running agents.' },
    ],
  },
  {
    slug: 'fine-tuning',
    label: 'Fine-Tuning',
    description: 'Fine-tuning adapts pre-trained models for specific tasks. Interviews focus on parameter-efficient methods (LoRA, QLoRA), RLHF, DPO, data preparation, and evaluation.',
    seoTitle: 'Fine-Tuning Interview Questions — LoRA, RLHF, DPO | AmanAI Lab',
    seoDescription: 'Fine-tuning LLM interview questions. Covers LoRA, QLoRA, RLHF, DPO, instruction tuning, catastrophic forgetting, and when to fine-tune vs RAG.',
    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-500',
    concepts: ['LoRA & QLoRA','RLHF & PPO','DPO','Instruction tuning','Catastrophic forgetting','When to fine-tune vs RAG','Data preparation','Evaluation'],
    cards: [
      { front: 'What is LoRA?', back: 'Low-Rank Adaptation: freeze base model weights, inject trainable low-rank matrices (A×B) into attention layers. Full fine-tune: millions of params. LoRA: thousands. Rank r=16-64 typical. Merges into base model at inference — no latency overhead.' },
      { front: 'What is QLoRA?', back: 'LoRA + 4-bit quantization of base model. Enables fine-tuning 65B models on a single GPU (vs 8× A100s for full fine-tune). Uses NF4 quantization, double quantization, paged attention. Near full fine-tune quality at fraction of compute.' },
      { front: 'What is DPO vs RLHF?', back: 'RLHF: train reward model on preferences, use PPO to optimize LLM — complex, unstable. DPO (Direct Preference Optimization): directly optimizes on preference pairs without reward model or RL. Simpler, more stable, comparable results. DPO is now preferred in practice.' },
      { front: 'When should you fine-tune vs use RAG?', back: 'RAG: dynamic/recent knowledge, factual grounding needed, large knowledge base. Fine-tune: specific style/format, task-specific behavior, domain-specific reasoning. Often combine both: fine-tune for style + RAG for knowledge. Fine-tune is expensive — exhaust prompt engineering first.' },
      { front: 'What is catastrophic forgetting?', back: 'Fine-tuning on new task causes model to forget original capabilities. Mitigated by: LoRA (minimal weight changes), replay (mix original data), regularization (EWC), lower learning rates. Key concern when fine-tuning general-purpose models.' },
      { front: 'What is instruction tuning?', back: 'Fine-tuning on instruction-response pairs to improve model\'s ability to follow diverse instructions. FLAN, Alpaca, WizardLM. Enables zero-shot generalization to new tasks. Quality > quantity: 1K high-quality instructions outperforms 100K noisy ones.' },
      { front: 'How do you prepare fine-tuning data?', back: 'Collect diverse, high-quality examples. Clean noisy data. Format as instruction-response pairs. Split train/eval. Deduplicate. Balance across categories. Augment with synthetic data (GPT-4 generated). 1K-10K examples often sufficient for LoRA fine-tune.' },
      { front: 'How do you evaluate a fine-tuned model?', back: 'Task-specific benchmarks, human evaluation (preference vs base model), MT-Bench for instruction following, perplexity on held-out data, behavioral evals for safety. Check for regression on general capabilities. A/B test against base model on real prompts.' },
    ],
  },
  {
    slug: 'mlops',
    label: 'MLOps',
    description: 'MLOps covers the full production ML lifecycle. Interviews test model serving, monitoring, CI/CD, feature stores, drift detection, and infrastructure design.',
    seoTitle: 'MLOps Interview Questions — Model Serving, Monitoring, CI/CD | AmanAI Lab',
    seoDescription: 'MLOps interview questions covering model serving, feature stores, drift detection, CI/CD pipelines, A/B testing, and ML infrastructure design.',
    color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', bar: 'bg-green-500',
    concepts: ['Model serving','Feature stores','Drift detection','CI/CD for ML','A/B testing','Model monitoring','Experiment tracking','Model registry'],
    cards: [
      { front: 'What is model drift and how do you detect it?', back: 'Data drift: input distribution changes. Concept drift: relationship between inputs/outputs changes. Detect via: statistical tests (KS test, PSI), monitoring prediction distributions, shadow models, periodic retraining triggers. Tools: Evidently, Whylogs, Arize.' },
      { front: 'What is a feature store?', back: 'Centralized repository for storing, sharing, and serving ML features. Separates feature computation from model training. Ensures training-serving consistency. Online store (Redis) for low-latency serving, offline store (S3/BigQuery) for training. Examples: Feast, Tecton, Hopsworks.' },
      { front: 'How do you serve ML models in production?', back: 'REST API (Flask/FastAPI), gRPC for low latency, batch prediction for offline. Tools: TorchServe, Triton, TF Serving, BentoML, Ray Serve. Consider: latency SLA, throughput, batching, model versioning, rollback capability, autoscaling.' },
      { front: 'What is shadow mode deployment?', back: 'New model runs in parallel with production model, receives same traffic but responses are not served. Compare predictions offline. Safe way to validate model behavior before full rollout. Identifies edge cases and distribution mismatches without user impact.' },
      { front: 'What is a model registry?', back: 'Versioned repository for ML models with metadata (metrics, parameters, training data). Enables reproducibility, comparison, and deployment pipelines. Examples: MLflow Model Registry, Weights & Biases, SageMaker Registry. Links model artifact to evaluation results.' },
      { front: 'What is training-serving skew?', back: 'Discrepancy between features/data distribution at training time vs inference time. Common cause of production model degradation. Prevented by: feature stores, logging training features, consistent preprocessing pipelines, online-offline consistency checks.' },
      { front: 'How do you do A/B testing for ML models?', back: 'Split traffic between control (current) and treatment (new model). Measure business metrics (CTR, conversion, revenue) not just ML metrics. Statistical significance testing. Canary releases (1% → 10% → 100%). Watch for novelty effect and holdout pollution.' },
      { front: 'What is experiment tracking?', back: 'Recording parameters, metrics, artifacts, and code version for each training run. Enables comparison, reproducibility, and audit trails. Tools: MLflow, W&B, Comet. Track: hyperparameters, dataset version, git commit, eval metrics, model artifacts.' },
    ],
  },
  {
    slug: 'system-design',
    label: 'System Design',
    description: 'ML System Design combines software architecture with machine learning. Interviews test recommendation systems, search, real-time ML, and production ML infrastructure at scale.',
    seoTitle: 'ML System Design Interview Questions — Complete Guide | AmanAI Lab',
    seoDescription: 'ML System Design interview questions covering recommendation systems, search ranking, real-time ML, feature pipelines, and production infrastructure design.',
    color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', bar: 'bg-red-500',
    concepts: ['Recommendation systems','Search ranking','Two-tower models','Real-time vs batch','Feature pipelines','Embeddings at scale','A/B testing','ML infrastructure'],
    cards: [
      { front: 'Design a recommendation system', back: 'Candidate generation (two-tower: user + item embeddings, ANN search) → Ranking (point-wise, pair-wise, or list-wise with rich features) → Re-ranking (business rules, diversity, freshness). Store user history in feature store. Key metrics: CTR, watch time, diversity.' },
      { front: 'What is a two-tower model?', back: 'Separate encoders for queries and items, trained to maximize similarity between relevant pairs. Query tower: user features/history → embedding. Item tower: item features → embedding. ANN search at inference. Used by YouTube, Pinterest, Google Search.' },
      { front: 'How do you handle cold start?', back: 'New users: use demographic/contextual features, popular items, onboarding preferences. New items: use content-based features (text/image embeddings), metadata. Hybrid approach: gradually incorporate collaborative signals as data accumulates.' },
      { front: 'Design a real-time ML feature pipeline', back: 'Stream processing (Kafka + Flink/Spark Streaming) for real-time features. Batch pipeline (Spark/dbt) for historical aggregations. Merge in feature store. Key challenges: late data, exactly-once semantics, backfill, data freshness vs cost trade-off.' },
      { front: 'How do you scale embedding lookups?', back: 'Partition embedding tables across machines (model parallelism). Use FP16/INT8 quantization to reduce memory. FAISS/ScaNN for ANN search. Cache frequent embeddings. Shard by item popularity. 100B+ items need distributed embedding servers (like Meta\'s ZionEX).' },
      { front: 'Design a search ranking system', back: 'Query understanding → Retrieval (BM25 + dense retrieval) → Multi-stage ranking (L1: cheap features + simple model, L2: expensive features + complex model) → Business rules. Features: query-doc relevance, user behavior signals, freshness, authority.' },
      { front: 'How do you evaluate ML systems end-to-end?', back: 'Offline: precision/recall on held-out data, ranking metrics (NDCG, MAP). Online: A/B test on business metrics (CTR, conversion, revenue). Shadow mode for safe testing. Counterfactual evaluation for logging-based feedback. Guard metrics to prevent regression.' },
      { front: 'What is the exploration-exploitation tradeoff?', back: 'Exploit: show high-confidence recommendations. Explore: try new/uncertain items to gather data. Strategies: ε-greedy, Thompson Sampling, UCB, contextual bandits. Critical for recommendation systems to avoid filter bubbles and discover new user preferences.' },
    ],
  },
  {
    slug: 'transformers',
    label: 'Transformers',
    description: 'The transformer architecture underpins virtually all modern AI. Interviews go deep on attention variants, positional encoding, layer normalization, and efficiency improvements.',
    seoTitle: 'Transformer Architecture Interview Questions | AmanAI Lab',
    seoDescription: 'Deep transformer architecture interview questions. Covers multi-head attention, positional encoding, layer norm, BERT, GPT, flash attention, and efficiency variants.',
    color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', bar: 'bg-teal-500',
    concepts: ['Multi-head attention','Positional encoding','Layer normalization','BERT vs GPT','Flash attention','Mixture of Experts','RoPE & ALiBi','Grouped query attention'],
    cards: [
      { front: 'Explain the transformer architecture', back: 'Stack of identical layers, each with: multi-head self-attention (attend to all positions), feed-forward network (2 linear layers + activation), residual connections, layer normalization. Encoder: bidirectional. Decoder: causal + cross-attention to encoder. All ops are parallelizable.' },
      { front: 'What is the computational complexity of attention?', back: 'O(n²·d) where n = sequence length, d = dimension. The n² bottleneck is why long contexts are expensive. Flash Attention optimizes memory access patterns to O(n²) compute but O(n) memory via tiling. Sparse attention reduces to O(n·log n) or O(n).' },
      { front: 'What is RoPE?', back: 'Rotary Position Embedding: encodes position by rotating query/key vectors. Naturally extrapolates to unseen lengths. Relative positional information emerges from dot products. Used by LLaMA, PaLM, Mistral. Better than absolute PE for long contexts.' },
      { front: 'What is Flash Attention?', back: 'IO-aware exact attention algorithm that tiles Q/K/V to avoid materializing the full n×n attention matrix in HBM. Reduces memory from O(n²) to O(n), speeds up training 2-4×. Critical for training with long contexts. Flash Attention 3 further optimizes for H100.' },
      { front: 'What is Grouped Query Attention (GQA)?', back: 'Compromise between Multi-Head (MHA) and Multi-Query (MQA) attention. Groups of query heads share one key/value head. Reduces KV cache memory significantly while maintaining most of MHA quality. Used by LLaMA 2, Mistral, Gemma.' },
      { front: 'What is Mixture of Experts (MoE)?', back: 'Replace dense FFN with N expert FFNs, router selects top-k experts per token. Sparse activation: 8× parameters but same compute as dense model. Mixtral 8×7B ≈ quality of 47B dense at 13B compute. Challenge: load balancing and communication overhead.' },
      { front: 'Pre-LN vs Post-LN transformers?', back: 'Post-LN (original): LayerNorm after residual. Unstable at large scale. Pre-LN: LayerNorm before attention/FFN. More stable training, better gradient flow, enables higher learning rates. Most modern LLMs use Pre-LN. GPT-2+ switched to Pre-LN.' },
      { front: 'What is BERT vs GPT training objective?', back: 'BERT: Masked Language Modeling (predict masked tokens bidirectionally) + Next Sentence Prediction. GPT: Causal Language Modeling (predict next token left-to-right). BERT → better representations/classification. GPT → better generation. Modern trend: decoder-only (GPT style) dominates.' },
    ],
  },
  {
    slug: 'python',
    label: 'Python',
    description: 'Python proficiency is essential for ML engineers. Interviews test data structures, PyTorch internals, async programming, memory management, and production-quality code.',
    seoTitle: 'Python Interview Questions for ML Engineers | AmanAI Lab',
    seoDescription: 'Python interview questions for ML engineers. Covers PyTorch, NumPy, generators, async, memory management, decorators, and data structures.',
    color: 'text-lime-400', bg: 'bg-lime-500/10 border-lime-500/20', bar: 'bg-lime-500',
    concepts: ['PyTorch internals','NumPy broadcasting','Generators','Async/await','Memory management','Decorators','Data structures','Type hints'],
    cards: [
      { front: 'What is PyTorch autograd?', back: 'Dynamic computation graph that records operations on tensors. On backward(), traverses graph in reverse computing gradients via chain rule. requires_grad=True enables gradient tracking. Detach tensors to stop gradient flow. torch.no_grad() for inference (no graph overhead).' },
      { front: 'Explain NumPy broadcasting', back: 'Mechanism allowing operations on arrays of different shapes. Rules: 1) Align shapes right-to-left, 2) Dimensions of size 1 expand to match, 3) Missing dimensions treated as 1. (3,) + (4,3) works; (3,) + (4,5) fails. Avoids explicit loops — critical for performance.' },
      { front: 'What are Python generators?', back: 'Functions using yield to lazily produce values one at a time. Memory efficient vs returning full list. Generator expressions: (x*2 for x in range(1M)) uses O(1) memory. Use for: data pipelines, infinite sequences, co-routines. next() or for loop to consume.' },
      { front: 'What is the GIL?', back: 'Global Interpreter Lock: only one thread executes Python bytecode at a time. CPU-bound threads don\'t benefit from threading. Solutions: multiprocessing (separate processes, no GIL), NumPy/PyTorch (release GIL during C extensions), async (I/O-bound concurrency). Python 3.13 free-threaded mode.' },
      { front: 'What is a Python decorator?', back: 'Function that wraps another function, extending behavior without modifying source code. @functools.lru_cache (memoization), @torch.no_grad(), @property, @staticmethod. functools.wraps preserves original function metadata. Class-based decorators for stateful behavior.' },
      { front: 'Explain async/await in Python', back: 'Cooperative multitasking for I/O-bound code. async def creates coroutine. await suspends until awaitable completes, yielding control to event loop. asyncio.gather() runs concurrently. Never await blocking code (use run_in_executor). 10-100× better throughput for API calls.' },
      { front: 'What is a Python context manager?', back: 'Object using __enter__/__exit__ (or @contextmanager) for setup/teardown. with torch.cuda.amp.autocast(): enables mixed precision. Ensures cleanup even on exceptions. Examples: file handles, database connections, timing blocks, temporary directory creation.' },
      { front: 'How does Python memory management work?', back: 'Reference counting (objects freed when refcount=0) + cyclic garbage collector for reference cycles. del removes references, gc.collect() forces GC. In ML: pin_memory=True for faster CPU→GPU transfer, gradient checkpointing to trade compute for memory.' },
    ],
  },
  {
    slug: 'vector-db',
    label: 'Vector DB',
    description: 'Vector databases enable semantic search and similarity at scale. Interviews cover indexing algorithms, distance metrics, approximate nearest neighbor, and production trade-offs.',
    seoTitle: 'Vector Database Interview Questions — ANN, HNSW, FAISS | AmanAI Lab',
    seoDescription: 'Vector database interview questions covering HNSW, FAISS, IVF, distance metrics, approximate nearest neighbor search, and production vector DB design.',
    color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', bar: 'bg-pink-500',
    concepts: ['HNSW algorithm','FAISS index types','Distance metrics','ANN vs exact search','Product quantization','Filtered search','Hybrid search','Pinecone vs Weaviate vs Qdrant'],
    cards: [
      { front: 'What is HNSW?', back: 'Hierarchical Navigable Small World: graph-based ANN index. Multi-layer graph where top layers are long-range connections, bottom is full graph. O(log n) search complexity. High recall, fast insertion. Memory intensive vs IVF. Default in Pinecone, Weaviate, Qdrant.' },
      { front: 'What is FAISS IVF?', back: 'Inverted File Index: k-means cluster vectors into N cells, store inverted lists per cell. At query time, search nearest nprobe cells only. Trade-off: higher nprobe = higher recall + slower. Much lower memory than HNSW. Good for read-heavy, batch workloads.' },
      { front: 'What distance metric should you use?', back: 'Cosine similarity: direction only, good for normalized embeddings, sentence embeddings. Dot product: magnitude matters, used with OpenAI ada-002. Euclidean (L2): raw distance in space. Most embedding models recommend cosine or dot product. Always normalize if using cosine.' },
      { front: 'What is product quantization (PQ)?', back: 'Compresses vectors by splitting into M subvectors, quantizing each to a codebook of centroids. 32× compression with modest recall loss. Essential for billion-scale deployments. FAISS supports PQ+IVF. Trade-off: compression ratio vs recall vs memory.' },
      { front: 'What is filtered vector search?', back: 'Combining ANN search with metadata filtering (e.g., "find similar items where category=electronics AND price<100"). Naive approach: filter first (few vectors remain), then search. Smart approach: search then filter, or ACORN/filtered HNSW. Pinecone, Qdrant have native support.' },
      { front: 'What are trade-offs between vector DB options?', back: 'Pinecone: managed, easy, expensive. Weaviate: open-source, multi-modal, GraphQL. Qdrant: Rust, fast, good filtering. Chroma: local-first, great for prototyping. pgvector: PostgreSQL extension, simple stack. Milvus: large-scale distributed. Choose based on scale, ops burden, features.' },
      { front: 'How do you handle real-time vector updates?', back: 'HNSW supports online insertion (O(log n)). IVF requires periodic rebuilding. Strategies: dual-index (new vectors in small fresh index, merge periodically), versioned immutable segments, LSM-tree approach. Write-heavy workloads favor LSM; read-heavy favor HNSW.' },
      { front: 'What is the recall vs latency trade-off?', back: 'ANN sacrifices some recall for speed. Tuning: HNSW ef (search depth) — higher ef = better recall + slower. IVF nprobe — more probes = better recall + slower. Target 95%+ recall @ <10ms P99 latency for most production use cases. Benchmark on your data.' },
    ],
  },
  {
    slug: 'behavioral',
    label: 'Behavioral',
    description: 'Behavioral interviews test how you handle real situations. Use the STAR method (Situation, Task, Action, Result) for every answer. Prepare 5-6 strong stories covering multiple leadership principles.',
    seoTitle: 'Behavioral Interview Questions for ML Engineers | AmanAI Lab',
    seoDescription: 'Behavioral interview questions for AI/ML engineers. STAR method guidance, leadership principles, conflict resolution, and failure stories for Google, Meta, OpenAI.',
    color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', bar: 'bg-rose-500',
    concepts: ['STAR method','Amazon Leadership Principles','Conflict resolution','Failure stories','Cross-team collaboration','Technical leadership','Impact measurement','AI ethics'],
    cards: [
      { front: 'What is the STAR method?', back: 'Situation: set context (team, project, timeline). Task: your specific responsibility. Action: what YOU did (use "I" not "we"). Result: measurable outcome (%, time saved, revenue). Keep to 2-3 minutes. Always quantify results. Prepare 5-6 stories covering multiple themes.' },
      { front: '"Tell me about a time you failed"', back: 'Pick a real failure with genuine impact. Show: you take ownership (no blaming), learned concrete lessons, changed your behavior. Structure: what went wrong → your responsibility → immediate impact → what you changed → result of change. Avoid trivial failures.' },
      { front: '"Tell me about a time you disagreed with your manager"', back: 'Show: you raised concern professionally, used data, were willing to be wrong. Structure: disagreement with data → how you escalated → outcome (either they changed or you did → why that was OK). Shows intellectual honesty and confidence. Avoid making manager look bad.' },
      { front: '"Describe a time you had to influence without authority"', back: 'Key skill for ML engineers working across teams. Show: you understood others\' incentives, built allies, framed proposal around their goals, moved without formal power. Result should show cross-team alignment, not forcing your way.' },
      { front: '"What\'s your biggest technical achievement?"', back: 'Choose something with clear business impact (not just technical elegance). Structure: problem size → your unique insight → implementation challenges → measurable result. Show: you can scope large problems, execute, and articulate business value. Quantify everything.' },
      { front: 'How do you measure impact of ML work?', back: 'Tie to business metrics, not just model metrics. "Improved F1 by 3%" → "Reduced customer escalations by 12% and saved $2M annually." Show you understand the product. Use A/B testing for online experiments. Quantify in terms stakeholders care about (revenue, latency, user retention).' },
      { front: '"Why do you want to work here?"', back: 'Specific, researched, genuine. Reference: specific projects they\'ve published, technical problems unique to their scale, values that align with yours. Avoid generic "amazing team, great product." Show you\'ve done research: read their engineering blog, papers, recent announcements.' },
      { front: 'How do you handle AI ethics concerns?', back: 'Show awareness of: bias in training data, fairness metrics, dual-use risks, privacy, environmental impact. Have a concrete example of raising/addressing an ethics concern. Companies (especially OpenAI, Anthropic) weight this heavily. Mention specific frameworks (Responsible AI, Constitutional AI).' },
    ],
  },
]

export const TOPIC_MAP: Record<string, TopicMeta> = Object.fromEntries(
  TOPICS.map(t => [t.slug, t])
)

// Maps DB topic values to slugs
export const DB_TOPIC_TO_SLUG: Record<string, string> = {
  'LLM': 'llm',
  'RAG': 'rag',
  'Agents': 'agents',
  'Fine-Tuning': 'fine-tuning',
  'MLOps': 'mlops',
  'Transformers': 'transformers',
  'System Design': 'system-design',
  'Python': 'python',
  'Vector DB': 'vector-db',
  'Computer Vision': 'computer-vision',
  'NLP': 'nlp',
  'Statistics': 'statistics',
  'SQL & Data': 'sql-data',
  'Behavioral': 'behavioral',
}

export const SLUG_TO_DB_TOPIC: Record<string, string> = Object.fromEntries(
  Object.entries(DB_TOPIC_TO_SLUG).map(([k, v]) => [v, k])
)
