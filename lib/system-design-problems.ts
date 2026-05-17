export interface SDProblem {
  slug: string
  title: string
  difficulty: 'Medium' | 'Hard'
  companies: string[]
  category: 'LLM Infrastructure' | 'ML Systems' | 'Classic Tech'
  problem: string        // markdown — the design question
  constraints: string[]  // scale and non-functional requirements
  keyAreas: string[]     // checklist — must address these
  hints: string[]        // nudges if stuck
  linkedSheetItemId: string
}

const TEMPLATE = `## 1. Requirements Clarification

### Functional Requirements
-
-

### Non-Functional Requirements
- Latency:
- Scale:
- Availability:
- Consistency:

---

## 2. Capacity Estimation

- Daily Active Users:
- Requests per second (read / write):
- Storage:
- Bandwidth:

---

## 3. High-Level Architecture

<!-- Describe your system here. List main components and how data flows between them. -->

Key components:
1.
2.
3.

---

## 4. Core Component Design

### Component 1:

### Component 2:

### Component 3:

---

## 5. Data Model & Storage

<!-- Tables, schemas, data formats. Justify your storage choices (SQL vs NoSQL, etc.) -->

---

## 6. API Design

<!-- Key endpoints or interfaces your system exposes -->

\`\`\`
POST /api/...
GET  /api/...
\`\`\`

---

## 7. Scalability & Performance

<!-- Caching strategy, sharding, replication, CDN, load balancing -->

---

## 8. Monitoring & Reliability

<!-- Key metrics, SLOs, alerting thresholds, failure modes and mitigation -->

---

## 9. Trade-offs & Alternatives Considered

<!-- What you chose vs. what you rejected and why -->
`

export const SYSTEM_DESIGN_PROBLEMS: SDProblem[] = [
  {
    slug: 'llm-serving',
    linkedSheetItemId: 'sdl-1',
    title: 'Design LLM Serving at Scale',
    difficulty: 'Hard',
    category: 'LLM Infrastructure',
    companies: ['OpenAI','Google','Meta','Microsoft','Nvidia'],
    problem: `## Problem

Design a production LLM inference system that can handle **100,000 requests per day** with:
- P99 latency ≤ 2 seconds for a 70B parameter model
- Support for streaming responses (SSE/WebSockets)
- Cost-efficient GPU utilisation
- Graceful handling of traffic spikes

Your system should serve both interactive (real-time) and batch (async) workloads.

### What you'll be assessed on
In a real FAANG interview, the interviewer will probe:
- How you manage KV cache across concurrent requests
- Your batching strategy (static vs continuous batching)
- GPU cost optimisation (spot instances, quantisation, caching)
- Failure recovery and load shedding under pressure`,
    constraints: [
      '100K requests/day (~1.2 QPS average, 10× peak = 12 QPS)',
      'Average request: 1K input tokens, 500 output tokens',
      'P99 latency ≤ 2s for 70B model at FP16',
      '99.9% availability SLA',
      'Support streaming (token-by-token) and batch responses',
      'Budget constraint: minimise GPU-hours per request',
    ],
    keyAreas: [
      'Request queue and load balancer architecture',
      'vLLM / PagedAttention for KV cache management',
      'Continuous batching strategy',
      'GPU fleet sizing and auto-scaling',
      'Semantic response caching (exact + approximate)',
      'Prompt caching for shared prefixes',
      'Model quantisation trade-offs (INT4 vs FP16)',
      'Streaming via SSE / WebSocket',
      'Monitoring: TTFT, TPS, queue depth, GPU utilisation',
      'Fallback and rate limiting strategy',
    ],
    hints: [
      'Each A100 80GB can serve ~24 concurrent requests with PagedAttention vs ~2-3 without it.',
      'vLLM\'s continuous batching removes the "wait for all to finish" bottleneck.',
      'Semantic cache: embed the prompt, search for similar past prompts at similarity ≥ 0.97.',
      'Think about per-tenant rate limits before the GPU queue, not after.',
      'Streaming changes the latency metric from total time to time-to-first-token (TTFT).',
    ],
  },
  {
    slug: 'rag-system',
    linkedSheetItemId: 'sdl-2',
    title: 'Design a Production RAG System',
    difficulty: 'Hard',
    category: 'LLM Infrastructure',
    companies: ['Microsoft','Amazon','Google','Anthropic'],
    problem: `## Problem

Design a production RAG (Retrieval-Augmented Generation) system for an enterprise that needs to answer questions over **1 million internal documents** (PDFs, Word files, Slack messages, wikis).

Requirements:
- Answer any question grounded in company knowledge
- Responses must cite source documents with page numbers
- Queries answered within **3 seconds end-to-end**
- System must handle **10,000 queries/day**
- Data must stay secure (no data sent to public APIs without encryption)

### What you'll be assessed on
The interviewer will dig into chunking strategy, embedding model choice, hybrid search architecture, re-ranking, and how you evaluate quality at scale.`,
    constraints: [
      '1M documents (avg 5K words each) ≈ 50B tokens total',
      '10K queries/day at peak load',
      'P99 query latency ≤ 3 seconds (retrieve + generate)',
      'New documents indexed within 5 minutes of upload',
      'Answer faithfulness ≥ 95% on held-out eval set (RAGAS)',
      'Security: enterprise data must be encrypted in transit and at rest',
    ],
    keyAreas: [
      'Document ingestion pipeline (format parsing, deduplication)',
      'Chunking strategy (fixed vs semantic vs recursive vs late chunking)',
      'Embedding model choice (bi-encoder, dimensions, multilingual?)',
      'Vector database selection and index type (HNSW vs IVF)',
      'Hybrid search: BM25 + dense retrieval with RRF fusion',
      'Re-ranking with a cross-encoder (Cohere Rerank, BGE)',
      'Query rewriting / HyDE for query-answer style gap',
      'Context construction and citation tracking',
      'LLM generation with faithfulness guardrails',
      'Evaluation pipeline (RAGAS: faithfulness, relevance, recall)',
      'Caching for repeated queries',
    ],
    hints: [
      'Contextual Retrieval (Anthropic): prepend chunk-specific context before embedding for 35-49% better retrieval.',
      'Hybrid search consistently beats dense-only by 5-15% recall@10.',
      'Re-rankers are 10-100× more accurate but too slow for retrieval — only re-rank top-50.',
      'Cache query embeddings and results: repeated queries are common in enterprise (30-40%).',
      'Latency budget: retrieval ≤ 500ms, re-rank ≤ 200ms, generation ≤ 2s.',
    ],
  },
  {
    slug: 'chatgpt-product',
    linkedSheetItemId: 'sdl-5',
    title: 'Design a ChatGPT-Like Product',
    difficulty: 'Hard',
    category: 'LLM Infrastructure',
    companies: ['OpenAI','Microsoft','Google','Meta'],
    problem: `## Problem

Design a consumer chatbot product (like ChatGPT) from scratch that can serve **10 million daily active users**.

The product should support:
- Multi-turn conversations with memory
- Streaming token output
- File uploads (PDF, images, code)
- Tool use (web search, code execution)
- Multiple model tiers (fast cheap model and a slower premium model)

### What you'll be assessed on
This is a full-stack ML systems design question. The interviewer will probe your thinking on conversation state, streaming architecture, tool orchestration, abuse prevention, and cost management.`,
    constraints: [
      '10M DAU, average 5 messages per session',
      '50M messages/day peak',
      '99.9% availability (max ~8.7h downtime/year)',
      'P95 time-to-first-token ≤ 500ms',
      'Conversation history maintained per user across sessions',
      'File uploads up to 50MB',
      'Code execution sandbox must be isolated',
    ],
    keyAreas: [
      'Streaming architecture (SSE vs WebSocket)',
      'Conversation state storage (per-user history management)',
      'Context window management (truncation, summarisation)',
      'Model routing: cheap model vs premium model decision',
      'Tool use orchestration (web search, code execution, file parsing)',
      'Sandbox security for code execution',
      'Rate limiting and abuse prevention',
      'Content moderation (input + output)',
      'Cost optimisation (caching, model selection)',
      'Multi-modal handling (image, PDF, code)',
      'CDN and global distribution for latency',
    ],
    hints: [
      'SSE (Server-Sent Events) is simpler than WebSocket for one-directional streaming.',
      'Store conversation history in Redis (hot) + PostgreSQL (durable) with a 30-day TTL.',
      'Context window limits require a strategy: summarise old turns, use sliding window, or RAG over history.',
      'E2B or Modal provide secure sandboxed code execution with container isolation.',
      'Content moderation runs in parallel with generation — don\'t block on it.',
    ],
  },
  {
    slug: 'llm-gateway',
    linkedSheetItemId: 'sdl-3',
    title: 'Design a Multi-Tenant LLM API Gateway',
    difficulty: 'Hard',
    category: 'LLM Infrastructure',
    companies: ['Amazon','Microsoft','Google'],
    problem: `## Problem

Design an LLM API gateway that provides a unified API over multiple LLM providers (OpenAI, Anthropic, Google Gemini, self-hosted models) for **1,000 enterprise tenants**.

Requirements:
- Each tenant has their own API keys, rate limits, and spending caps
- Route to optimal provider based on cost/latency/capability
- Complete audit log of every request per tenant (for compliance)
- 99.99% availability (the gateway itself cannot be a single point of failure)

### What you'll be assessed on
Multi-tenancy isolation, model routing strategy, quota enforcement, observability, and failover.`,
    constraints: [
      '1,000 enterprise tenants, each with unique rate limits',
      '100M requests/day total across all tenants',
      'P99 gateway overhead ≤ 50ms (added on top of model latency)',
      'Tenant spending cap enforcement within 1-minute accuracy',
      '99.99% gateway availability (≤ 52 minutes downtime/year)',
      'Full audit log retained for 2 years (compliance)',
    ],
    keyAreas: [
      'Tenant isolation (API keys, rate limits, quotas)',
      'Model routing logic (cost, latency, capability rules)',
      'Rate limiting (token bucket per tenant, Redis)',
      'Spending cap enforcement with near-real-time tracking',
      'Circuit breakers for downstream provider outages',
      'Request/response logging for audit compliance',
      'Prompt and response caching (semantic, per-tenant)',
      'Load balancing across multiple gateway instances',
      'Observability: per-tenant cost, latency, error rate',
      'Failover: automatic retry with different providers',
    ],
    hints: [
      'Token bucket rate limiting in Redis: decrement on request, refill on schedule.',
      'Circuit breaker pattern: trip after N failures, half-open after timeout, close after success.',
      'Route cheaply by default (GPT-4o-mini, Haiku), escalate to expensive models only when needed.',
      'Async audit logging via Kafka → S3/BigQuery to avoid adding latency to the critical path.',
      'Per-tenant Redis namespace prevents cross-tenant data leakage.',
    ],
  },
  {
    slug: 'recommendation-system',
    linkedSheetItemId: 'sdm-1',
    title: 'Design YouTube Video Recommendation',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Google','Meta','Netflix','Amazon','Apple'],
    problem: `## Problem

Design YouTube's video recommendation system that serves **2 billion users** and selects the best 10-20 videos for each user's homepage feed from a catalogue of **500 million videos**.

Requirements:
- Personalised recommendations for each user
- Serve recommendations in ≤ 100ms
- Maximise watch time while maintaining creator equity
- Handle cold start for new users and new videos
- Support A/B testing of ranking models

### What you'll be assessed on
Two-stage retrieval + ranking architecture, cold start solutions, feature engineering, exploration vs exploitation, and how to evaluate recommendation quality.`,
    constraints: [
      '2B users, 500M videos, 100M uploads/day',
      'Serving latency ≤ 100ms P99 for homepage load',
      '10–20 candidate videos per feed request',
      'Retrieve from 500M videos in ≤ 10ms',
      'Model training: daily batch re-training',
      'Real-time signals (clicks, watch time) fed back within 1 hour',
    ],
    keyAreas: [
      'Two-stage architecture: candidate generation → ranking',
      'Two-tower model for candidate generation',
      'ANN indexing (HNSW/ScaNN) for embedding retrieval at scale',
      'Ranking model: features, architecture, training objective',
      'Cold start: new users (demographic/interest onboarding) and new videos (content embeddings)',
      'Feature engineering: watch time, CTR, user history embeddings, temporal signals',
      'Exploration vs exploitation (epsilon-greedy, Thompson Sampling, UCB)',
      'Re-ranking for diversity, freshness, and creator equity',
      'Offline evaluation: precision@k, recall@k, NDCG',
      'Online evaluation: A/B test on watch time and session length',
    ],
    hints: [
      'Two-tower: user tower (watch history → embedding) + video tower (metadata → embedding) → dot product.',
      'ScaNN by Google achieves billion-scale ANN search in <10ms.',
      'Watch time is a better objective than CTR — it reduces clickbait.',
      'Serve 1000 candidates from retrieval, rank all 1000, serve top 20.',
      'New video cold start: use content-based features (title embedding, thumbnail CLIP, category) until 100 watches.',
    ],
  },
  {
    slug: 'fraud-detection',
    linkedSheetItemId: 'sdm-2',
    title: 'Design Real-Time Fraud Detection',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Amazon','Google','Microsoft','Apple'],
    problem: `## Problem

Design a real-time fraud detection system for a payment processor handling **10,000 transactions per second** that must make an allow/deny decision within **100 milliseconds**.

Requirements:
- Detect fraudulent credit card transactions in real time
- P99 decision latency ≤ 100ms
- False positive rate ≤ 0.1% (too many declines hurt customer experience)
- False negative rate ≤ 1% (missed fraud is costly)
- System must adapt to new fraud patterns within 24 hours

### What you'll be assessed on
Real-time feature engineering, model architecture choices, latency budget, the FP/FN trade-off, and online learning for drift adaptation.`,
    constraints: [
      '10K transactions/second at peak',
      'Decision latency ≤ 100ms P99',
      'False positive rate ≤ 0.1%, false negative rate ≤ 1%',
      'Fraud patterns change weekly — model must adapt',
      '99.999% availability (payment infrastructure)',
      'Regulatory requirement: store all decisions with explanations for 7 years',
    ],
    keyAreas: [
      'Real-time feature engineering (velocity, geo, device fingerprint)',
      'Kafka + Flink stream processing for real-time features',
      'Online feature store (Redis) for <1ms feature reads',
      'Offline feature store (S3) for training',
      'Model architecture: rules engine + GBM ensemble',
      'Latency budget allocation across components',
      'FP/FN trade-off and threshold tuning',
      'Model drift detection and triggered retraining',
      'Decision explainability for regulatory compliance',
      'Champion-challenger deployment for safe rollout',
    ],
    hints: [
      'Velocity features (N transactions in last 1h/24h per card/merchant) are the most predictive.',
      'Rule engine first (fast, interpretable), then ML model for borderline cases — reduces latency.',
      'Latency budget: features from Redis ≤ 5ms, model inference ≤ 20ms, rules ≤ 5ms, response ≤ 70ms buffer.',
      'Keep a human review queue for high-confidence fraud (false negative cheaper to miss if caught later).',
      'SHAP values for explainability — required by financial regulators in many jurisdictions.',
    ],
  },
  {
    slug: 'search-ranking',
    linkedSheetItemId: 'sdm-3',
    title: 'Design Search Ranking System',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Google','Amazon','Microsoft','Meta'],
    problem: `## Problem

Design a search ranking system for an e-commerce platform with **100 million products** and **10,000 search queries per second**.

Requirements:
- Return ranked results in ≤ 200ms
- Ranking should maximise purchase conversion rate
- Support personalisation (different rankings for different users)
- Support real-time inventory and price updates
- Enable A/B testing of ranking algorithms

### What you'll be assessed on
Multi-stage retrieval and ranking architecture, feature engineering for ranking, learning-to-rank approaches, and how you balance relevance vs business metrics.`,
    constraints: [
      '100M products, 10K QPS',
      'Serving latency ≤ 200ms P99',
      'Inventory updates reflected in ≤ 1 minute',
      'Price changes reflected in ≤ 5 minutes',
      'New products indexed within 10 minutes of upload',
      'Personalised results for 500M registered users',
    ],
    keyAreas: [
      'Query understanding (intent classification, spelling correction)',
      'Multi-stage retrieval: BM25 + dense retrieval → top 1000 candidates',
      'L1 ranker: cheap features (query-product relevance, popularity)',
      'L2 ranker: expensive features (user-product affinity, real-time signals)',
      'Learning-to-rank: LambdaMART/XGBoost with click logs as implicit labels',
      'Business rules: inventory availability, margin, sponsored boost',
      'Personalisation: per-user click history embeddings',
      'Real-time index updates for inventory and prices',
      'NDCG@10 offline; purchase conversion and revenue online A/B',
      'Diversity constraints (avoid 10 identical products in top results)',
    ],
    hints: [
      'BM25 handles keyword and brand name queries; dense retrieval handles "comfortable running shoes."',
      'L1 ranker processes all 1000 candidates; L2 ranker only processes top 100 (expensive features).',
      'Position bias in click logs: correct with inverse propensity weighting before training.',
      'Cache query embeddings (hot queries repeat) — 70% of e-commerce queries repeat within a day.',
      'Price and inventory filters can be applied at the retrieval stage to avoid ranking unavailable items.',
    ],
  },
  {
    slug: 'ads-ctr',
    linkedSheetItemId: 'sdm-4',
    title: 'Design Ads CTR Prediction Pipeline',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Google','Meta','Amazon','Microsoft'],
    problem: `## Problem

Design the ads click-through rate (CTR) prediction system for a social media platform with **1 billion daily users** and **5 million advertisers**.

The system needs to:
- Predict the probability that a user clicks an ad (CTR)
- Serve predictions in ≤ 10ms per ad impression
- Handle 1 trillion impressions per day
- Retrain the model with fresh data every hour

### What you'll be assessed on
Feature engineering for ads (user + ad + context), model architecture (Wide & Deep, DLRM), real-time vs batch feature serving, and the calibration of predicted probabilities for auction pricing.`,
    constraints: [
      '1B DAU, 5M advertisers',
      '1 trillion impressions/day (~11M impressions/second)',
      'CTR prediction latency ≤ 10ms',
      'Hourly model retraining with last 7 days of data',
      'Predicted probability must be well-calibrated (used in auction)',
      'Handle high-cardinality categorical features (user IDs, ad IDs: billions)',
    ],
    keyAreas: [
      'Feature engineering: user features, ad features, context features, interaction features',
      'High-cardinality embeddings (user/ad/publisher ID → embedding table)',
      'Model architecture: Wide & Deep, DLRM, or two-tower',
      'Online feature store for real-time user signals (Redis)',
      'Offline feature store for historical aggregations (BigQuery/S3)',
      'Negative sampling strategy (1:100+ class imbalance)',
      'Calibration: Platt scaling for auction-accurate probabilities',
      'Hourly model training pipeline (Spark feature join → XGBoost → online deploy)',
      'Serving: pre-computed user and ad embeddings for fast dot products',
      'Evaluation: AUC-ROC, Normalised Cross-Entropy (NCE), revenue lift',
    ],
    hints: [
      'Pre-compute and cache user and ad embeddings offline — dot product at serving is <1ms.',
      'In-batch negatives: treat other ads in the batch as negatives for the two-tower model.',
      'Wide part handles memorisation (feature crosses), deep part handles generalisation.',
      'Calibration is critical: uncalibrated probabilities lead to poor auction pricing and revenue loss.',
      'Feature freshness: user recent clicks must be within seconds; historical aggregates can be 1h stale.',
    ],
  },
  {
    slug: 'feature-pipeline',
    linkedSheetItemId: 'sdm-5',
    title: 'Design Real-Time ML Feature Pipeline',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Google','Meta','Amazon','Netflix'],
    problem: `## Problem

Design a real-time ML feature pipeline that computes features used by multiple ML models (fraud detection, recommendation, ads CTR) and serves them with:
- Online serving latency ≤ 5ms
- Feature freshness ≤ 1 minute for real-time features
- Point-in-time correct joins for training (no data leakage)
- Support for 10,000 feature definitions shared across 50 ML teams

### What you'll be assessed on
This tests your understanding of the full feature store architecture — both online and offline paths, point-in-time correctness, and operational complexity.`,
    constraints: [
      '10K feature definitions used by 50 ML teams',
      'Online feature reads ≤ 5ms P99',
      'Real-time features must be ≤ 1 minute stale',
      'Historical features needed for training with point-in-time correct joins',
      '100K feature read QPS at peak serving',
      'Feature backfill: compute historical features for any 2-year window',
    ],
    keyAreas: [
      'Online store: Redis for ≤5ms reads (hot features)',
      'Offline store: S3/BigQuery for training datasets',
      'Stream processing: Kafka → Flink for real-time aggregations (windowed counts)',
      'Batch processing: Spark/dbt for historical aggregations (nightly)',
      'Point-in-time correct joins: only use feature values available at prediction time',
      'Feature definitions as code (Feast/Tecton): versioned, reproducible',
      'Backfill: run batch job to compute historical features for retraining',
      'Monitoring: feature freshness, drift, serving latency SLA',
      'Access control: team-level permissions on feature groups',
    ],
    hints: [
      'Point-in-time join: for each training sample (user, item, timestamp), join the feature value that existed at that timestamp — not the latest.',
      'Training-serving skew is the #1 cause of model degradation in production.',
      'Keep stream and batch feature definitions in the same DSL — compute once, serve everywhere.',
      'Redis key format: feature_group:entity_id → JSON or msgpack blob.',
      'Flink watermarks handle late-arriving events — critical for fraud velocity features.',
    ],
  },
  {
    slug: 'google-search-personalization',
    linkedSheetItemId: 'sdc-1',
    title: 'Design Google Search Personalization',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Google'],
    problem: `## Problem

Design a personalisation layer on top of Google Search that customises result rankings based on each user's historical search and browsing behaviour, while respecting:
- User privacy (no PII shared across requests)
- The ability for users to opt out
- Search quality must not degrade for cold-start users

### What you'll be assessed on
How you model user intent from behaviour, privacy-preserving personalisation techniques, and the tension between personalisation and search diversity/serendipity.`,
    constraints: [
      'Serve personalised results for 8B+ search users',
      'Personalisation signal added in ≤ 5ms (on top of core ranking)',
      'On-device or privacy-preserving computation required',
      'Cold start: no degradation for users with <10 searches',
      'Opt-out must completely remove personalisation',
      'Avoid filter bubble: maintain some content diversity',
    ],
    keyAreas: [
      'User interest model (embedding from search/click history)',
      'Privacy: on-device embeddings, federated learning, differential privacy',
      'Personalisation as a ranking feature (late fusion with base ranking)',
      'Cold start strategy for new and opted-out users',
      'Diversity constraints to prevent filter bubble',
      'Session-level signals (in-session personalisation within a search session)',
      'Geographic and temporal personalisation signals',
      'A/B testing framework: measuring personalisation lift',
    ],
    hints: [
      'On-device embedding computation avoids sending user history to servers.',
      'Late fusion: compute base ranking score, then add a personalisation delta — keeps base quality stable.',
      'Diversity via Maximal Marginal Relevance (MMR): balance relevance with dissimilarity to already-selected results.',
      'K-anonymity: only personalise when a user segment has ≥ K users — protects rare preferences.',
    ],
  },
  {
    slug: 'uber-eta',
    linkedSheetItemId: 'sdc-2',
    title: 'Design Uber ETA Prediction',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Amazon','Google'],
    problem: `## Problem

Design Uber's ETA (Estimated Time of Arrival) prediction system that must predict pickup and trip times accurately for **20 million rides per day** across 70 countries.

ETA predictions power:
- Driver-rider matching
- Surge pricing
- Route optimisation
- Customer notifications

### What you'll be assessed on
Feature engineering for spatio-temporal data, model architecture for short vs long horizon ETAs, real-time traffic data integration, and evaluation metrics.`,
    constraints: [
      '20M rides/day, 200K concurrent trips at peak',
      'ETA prediction within 100ms of ride request',
      'P50 ETA error ≤ 2 minutes, P95 ≤ 5 minutes',
      'Real-time traffic data updated every 30 seconds',
      'Model accuracy must be maintained across 70 countries',
      'Must handle special events (concerts, holidays) that break historical patterns',
    ],
    keyAreas: [
      'Feature engineering: route segments, historical travel times, real-time traffic, weather, time-of-day',
      'Short-horizon ETA (< 30 min): gradient boosted trees on route segments',
      'Long-horizon ETA (> 30 min): sequence models with traffic signal integration',
      'Real-time traffic: Google Maps API or own road sensor network',
      'Geospatial indexing: H3 hexagons for region-based traffic features',
      'Online learning for rapid adaptation to unusual events',
      'Uncertainty quantification: confidence intervals, not just point estimates',
      'Evaluation: MAE, MAPE, quantile loss; A/B test on driver acceptance rate',
      'Fallback for new regions with limited historical data',
    ],
    hints: [
      'Segment the route into road segments and predict each segment\'s travel time independently, then sum.',
      'H3 hexagons (Uber\'s open-source library) partition the map for region-level traffic aggregation.',
      'Real-time traffic is the strongest feature — integrate it via a streaming join at inference time.',
      'Online learning: fine-tune on the last N=1000 trips in real time to catch emerging patterns.',
    ],
  },
  {
    slug: 'content-moderation',
    linkedSheetItemId: 'sdc-3',
    title: 'Design Content Moderation at Scale',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Meta','Google','Amazon','OpenAI'],
    problem: `## Problem

Design a content moderation system for a social media platform with **500 million posts per day** that must detect and remove harmful content (hate speech, CSAM, violence, spam, misinformation) while minimising false positives on legitimate content.

### What you'll be assessed on
Multi-stage moderation pipeline, human review queues, adversarial adaptation, the FP/FN trade-off for different content categories, and appeals handling.`,
    constraints: [
      '500M posts/day across text, images, and video',
      'Harmful content removed within 1 hour of posting (regulatory requirement)',
      'CSAM removed within 5 minutes (legal requirement)',
      'False positive rate ≤ 0.01% for mainstream content',
      'System must adapt to new harmful content patterns weekly',
      'Multi-language support (100+ languages)',
    ],
    keyAreas: [
      'Multi-stage pipeline: fast heuristic → ML classifier → LLM verifier → human review',
      'Multimodal classification: text (BERT/LLaMA), image (CLIP, custom CV), video (frame sampling)',
      'Hash matching for known harmful content (PhotoDNA for CSAM)',
      'Severity tiers: auto-remove (CSAM), hide pending review, flag for review',
      'Human review queue: priority, routing, annotator calibration',
      'Appeals and error correction feedback loop',
      'Adversarial robustness: detecting evasion tactics (text in images, typo obfuscation)',
      'Active learning: human review labels fed back to retrain classifiers',
      'Multilingual: shared embedding space across languages',
    ],
    hints: [
      'Hash-based matching (PhotoDNA) is instant and 100% recall for known content — first stage.',
      'Active learning: send borderline predictions (0.4–0.6 confidence) to human review for highest labelling ROI.',
      'Context matters: "I killed it on the presentation" is different from a literal threat — use conversation context.',
      'FN (missed harmful content) is far more costly than FP (false removal) for CSAM — adjust thresholds accordingly.',
    ],
  },
  {
    slug: 'spotify-discovery',
    linkedSheetItemId: 'sdc-4',
    title: 'Design Spotify Song Discovery Engine',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Apple','Amazon','Netflix'],
    problem: `## Problem

Design Spotify's music discovery engine — the system that powers Discover Weekly, Daily Mixes, and Radio — for **400 million users** and a catalogue of **100 million tracks**.

The system must balance:
- Personalisation (tracks the user will enjoy)
- Discovery (tracks they haven't heard that they'll love)
- Serendipity (pleasant surprises outside their comfort zone)

### What you'll be assessed on
Collaborative filtering at scale, audio-based content embeddings, the exploration-exploitation trade-off, and playlist coherence.`,
    constraints: [
      '400M users, 100M tracks',
      'Discover Weekly: 30 tracks, refreshed every Monday morning',
      'Recommendations generated within 2 hours for all users',
      'New track cold start: must appear in relevant playlists within 24h of upload',
      'P99 radio recommendation latency ≤ 200ms',
      'Diversity: no two adjacent tracks by the same artist',
    ],
    keyAreas: [
      'Collaborative filtering: matrix factorisation over implicit feedback (streams, skips, saves)',
      'Audio embeddings: CNN on mel-spectrograms for content-based similarity',
      'Context-aware recommendations: time of day, mood, activity (workout, sleep)',
      'Cold start: audio embeddings + metadata (genre, BPM, key) for new tracks',
      'Playlist coherence: BPM gradient, key transitions, energy flow',
      'Exploration: epsilon-greedy or Thompson Sampling for novel tracks',
      'Offline: batch generation for Discover Weekly (Spark collaborative filtering)',
      'Online: real-time Radio recommendations (ANN lookup on pre-computed embeddings)',
      'Evaluation: skip rate, save rate, 30-second listen rate',
    ],
    hints: [
      'Matrix factorisation on play counts gives good similarity; audio embeddings handles cold start.',
      'Positive signal: stream >30s, save, add to playlist. Negative: skip <5s, hide.',
      'BPM and key analysis via audio fingerprinting for seamless playlist flow.',
      'Diversity via the inverse frequency boost — boost less-heard artists proportionally.',
    ],
  },
  {
    slug: 'instagram-feed',
    linkedSheetItemId: 'sdc-5',
    title: 'Design Instagram Feed Ranking',
    difficulty: 'Hard',
    category: 'ML Systems',
    companies: ['Meta','Google'],
    problem: `## Problem

Design Instagram's feed ranking system that selects and orders posts for **2 billion users** from their followed accounts and recommended content.

The system must:
- Maximise meaningful engagement (comments, shares > passive scrolling)
- Balance posts from followed accounts with recommended content
- Ensure creator equity (small creators get fair distribution)
- Detect and demote harmful or low-quality content

### What you'll be assessed on
Multi-objective ranking, candidate generation from followed accounts vs recommendations, creator equity, and measuring "meaningful" vs vanity engagement.`,
    constraints: [
      '2B users, 50M posts/day',
      'Average user follows 500 accounts',
      'Feed generation latency ≤ 500ms',
      'Mix: 70% followed accounts + 30% recommended content',
      'New posts from followed accounts appear in feed within 5 minutes',
      'Creator equity: small creators (< 10K followers) receive proportional distribution',
    ],
    keyAreas: [
      'Candidate generation: followed accounts (recent posts) + recommendation engine',
      'Multi-objective ranking: engagement, creator equity, content quality, diversity',
      'User-post affinity model (interaction history with creator)',
      'Content quality signals: engagement rate, integrity score, shares, saves',
      'Creator equity: normalise distribution by follower count',
      'Real-time signals: early engagement velocity for new posts',
      'Integrity: demote misinformation, hate speech, clickbait',
      'Exploration: occasionally surface content outside user\'s usual interests',
      'Evaluation: session time vs "meaningful engagement" (comments, shares, DMs)',
      'A/B testing infrastructure for ranking experiments',
    ],
    hints: [
      'Long-form engagement (comments, DMs) correlates better with satisfaction than likes.',
      'Post freshness decay: an older post from a close friend outranks a newer post from a distant connection.',
      'Creator equity: if everyone saw at rate proportional to follow count, small creators would disappear.',
      'Cascade ranking: first rank all followed-account content, then interleave recommended content at fixed positions.',
    ],
  },
]

// Map from sheet item ID to design slug
export const SHEET_TO_DESIGN: Record<string, string> = Object.fromEntries(
  SYSTEM_DESIGN_PROBLEMS.map(p => [p.linkedSheetItemId, p.slug])
)

// Map from slug to problem for O(1) lookup
export const DESIGN_PROBLEM_MAP: Record<string, SDProblem> = Object.fromEntries(
  SYSTEM_DESIGN_PROBLEMS.map(p => [p.slug, p])
)

export const DESIGN_TEMPLATE = TEMPLATE
