export type ItemType = 'theory' | 'code' | 'project' | 'interview'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface SheetItem {
  id: string
  title: string
  type: ItemType
  difficulty: Difficulty
  topic?: string
  hasCode?: boolean
  hasFlashcard?: boolean
  hasQuiz?: boolean
  hasInterview?: boolean
}

export interface SheetSection {
  id: string
  title: string
  items: SheetItem[]
}

export interface SheetTrack {
  id: string
  title: string
  description: string
  color: string
  bg: string
  bar: string
  icon: string
  sections: SheetSection[]
}

function item(
  id: string,
  title: string,
  type: ItemType,
  difficulty: Difficulty,
  opts: Partial<Omit<SheetItem, 'id' | 'title' | 'type' | 'difficulty'>> = {}
): SheetItem {
  return { id, title, type, difficulty, ...opts }
}

export const SHEET_TRACKS: SheetTrack[] = [
  // ─── TRACK 1: GENERATIVE AI ──────────────────────────────────────────────
  {
    id: 'genai',
    title: 'Generative AI',
    description: 'Transformers, LLMs, Prompt Engineering, RAG, Fine-Tuning, Multimodal & Inference Optimization',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    bar: 'bg-violet-500',
    icon: '✨',
    sections: [
      {
        id: 'genai-transformers',
        title: 'Transformer Architecture',
        items: [
          item('gt-1', 'Self-Attention Mechanism (Query, Key, Value)', 'theory', 'medium', { topic: 'transformers', hasFlashcard: true, hasQuiz: true }),
          item('gt-2', 'Multi-Head Attention & Scaled Dot-Product', 'theory', 'hard', { topic: 'transformers', hasFlashcard: true }),
          item('gt-3', 'Positional Encoding — Absolute, RoPE, ALiBi', 'theory', 'medium', { topic: 'transformers', hasFlashcard: true }),
          item('gt-4', 'Feed-Forward Layers & Layer Normalization', 'theory', 'easy', { topic: 'transformers', hasQuiz: true }),
          item('gt-5', 'Encoder vs Decoder vs Encoder-Decoder Models', 'theory', 'medium', { topic: 'transformers', hasFlashcard: true }),
          item('gt-6', 'Flash Attention 1 & 2 — Memory & Speed', 'theory', 'hard', { topic: 'transformers', hasFlashcard: true }),
          item('gt-7', 'Grouped Query Attention (GQA) & Multi-Query Attention', 'theory', 'hard', { topic: 'transformers' }),
          item('gt-8', 'Mixture of Experts (MoE) Architecture', 'theory', 'hard', { topic: 'transformers' }),
          item('gt-9', 'Implement Self-Attention from Scratch in PyTorch', 'code', 'hard', { hasCode: true }),
          item('gt-10', 'Transformer Architecture — Interview Deep Dive', 'interview', 'hard', { hasInterview: true, hasQuiz: true }),
        ],
      },
      {
        id: 'genai-llms',
        title: 'Large Language Models',
        items: [
          item('gl-1', 'GPT Architecture — Decoder-Only Deep Dive', 'theory', 'medium', { topic: 'llm', hasFlashcard: true }),
          item('gl-2', 'BERT & Masked Language Modeling', 'theory', 'medium', { topic: 'llm', hasFlashcard: true }),
          item('gl-3', 'Tokenization — BPE, WordPiece, SentencePiece', 'theory', 'medium', { topic: 'llm', hasFlashcard: true }),
          item('gl-4', 'Context Window & Long Context Techniques (RoPE, YaRN)', 'theory', 'hard', { topic: 'llm', hasFlashcard: true }),
          item('gl-5', 'Hallucination — Causes, Types & Mitigation', 'theory', 'medium', { topic: 'llm', hasFlashcard: true }),
          item('gl-6', 'RLHF — Reinforcement Learning from Human Feedback', 'theory', 'hard', { topic: 'llm', hasFlashcard: true }),
          item('gl-7', 'Sampling — Temperature, Top-p, Top-k, Repetition Penalty', 'theory', 'easy', { topic: 'llm', hasQuiz: true }),
          item('gl-8', 'KV Cache — How It Works & Why It Matters', 'theory', 'hard', { topic: 'llm', hasFlashcard: true }),
          item('gl-9', 'Scaling Laws — Chinchilla, Kaplan et al.', 'theory', 'hard', { topic: 'llm' }),
          item('gl-10', 'LLM Evaluation — BLEU, ROUGE, Perplexity, LLM-as-Judge', 'theory', 'medium', { topic: 'llm', hasQuiz: true }),
        ],
      },
      {
        id: 'genai-prompt',
        title: 'Prompt Engineering',
        items: [
          item('gp-1', 'Zero-Shot & Few-Shot Prompting', 'theory', 'easy', { topic: 'llm', hasQuiz: true }),
          item('gp-2', 'Chain-of-Thought (CoT) & Self-Consistency', 'theory', 'medium', { topic: 'llm', hasFlashcard: true }),
          item('gp-3', 'ReAct Prompting (Reasoning + Acting)', 'theory', 'medium', { topic: 'agents', hasFlashcard: true }),
          item('gp-4', 'Structured Output — JSON Mode & Tool Calling', 'theory', 'medium', { topic: 'llm', hasCode: true }),
          item('gp-5', 'Prompt Injection, Jailbreaking & Security', 'theory', 'hard', { topic: 'llm', hasInterview: true }),
          item('gp-6', 'System Prompts, Personas & Meta-Prompting', 'theory', 'easy', { topic: 'llm' }),
          item('gp-7', 'DSPy — Automatic Prompt Optimization', 'theory', 'hard', { topic: 'llm' }),
          item('gp-8', 'Prompt Caching & Cost Optimization', 'theory', 'medium', { topic: 'llm', hasInterview: true }),
        ],
      },
      {
        id: 'genai-rag',
        title: 'RAG Systems',
        items: [
          item('gr-1', 'Naive RAG — Retrieve, Augment, Generate', 'theory', 'easy', { topic: 'rag', hasFlashcard: true }),
          item('gr-2', 'Chunking Strategies — Fixed, Semantic, Recursive, Late', 'theory', 'medium', { topic: 'rag', hasFlashcard: true }),
          item('gr-3', 'Embedding Models & Semantic Search', 'theory', 'medium', { topic: 'rag', hasFlashcard: true }),
          item('gr-4', 'Vector Databases — FAISS, Pinecone, Weaviate, Chroma', 'theory', 'medium', { topic: 'vector-db', hasFlashcard: true, hasQuiz: true }),
          item('gr-5', 'HNSW Algorithm for Approximate Nearest Neighbor', 'theory', 'hard', { topic: 'vector-db', hasFlashcard: true }),
          item('gr-6', 'Hybrid Search — BM25 + Dense Retrieval Re-ranking', 'theory', 'hard', { topic: 'rag', hasFlashcard: true }),
          item('gr-7', 'Advanced RAG — HyDE, RAPTOR, Contextual Retrieval', 'theory', 'hard', { topic: 'rag', hasFlashcard: true }),
          item('gr-8', 'GraphRAG — Knowledge Graphs + RAG', 'theory', 'hard', { topic: 'rag' }),
          item('gr-9', 'RAG Evaluation with RAGAS Framework', 'theory', 'medium', { topic: 'rag', hasFlashcard: true }),
          item('gr-10', 'Build a Production RAG Pipeline (End-to-End)', 'project', 'hard', { hasCode: true }),
        ],
      },
      {
        id: 'genai-finetuning',
        title: 'Fine-Tuning',
        items: [
          item('gf-1', 'Fine-Tuning vs Prompt Engineering vs RAG — When to Use', 'theory', 'medium', { topic: 'fine-tuning', hasQuiz: true }),
          item('gf-2', 'Supervised Fine-Tuning (SFT) Pipeline', 'theory', 'medium', { topic: 'fine-tuning', hasFlashcard: true }),
          item('gf-3', 'LoRA — Low-Rank Adaptation (Math + Intuition)', 'theory', 'hard', { topic: 'fine-tuning', hasFlashcard: true }),
          item('gf-4', 'QLoRA — 4-bit Quantized LoRA', 'theory', 'hard', { topic: 'fine-tuning', hasFlashcard: true }),
          item('gf-5', 'DPO — Direct Preference Optimization', 'theory', 'hard', { topic: 'fine-tuning', hasFlashcard: true }),
          item('gf-6', 'GRPO — Group Relative Policy Optimization (2025)', 'theory', 'hard', { topic: 'fine-tuning' }),
          item('gf-7', 'Catastrophic Forgetting & Continual Learning', 'theory', 'hard', { topic: 'fine-tuning', hasFlashcard: true }),
          item('gf-8', 'Fine-Tune Llama 3.2 with QLoRA (Hands-On)', 'project', 'hard', { hasCode: true }),
        ],
      },
      {
        id: 'genai-multimodal',
        title: 'Multimodal AI',
        items: [
          item('gm-1', 'Vision-Language Models — LLaVA, GPT-4V, Gemini', 'theory', 'medium', { topic: 'llm' }),
          item('gm-2', 'CLIP — Contrastive Language-Image Pre-Training', 'theory', 'hard', { topic: 'transformers' }),
          item('gm-3', 'Image Tokenization & Visual Patch Embeddings', 'theory', 'hard', { topic: 'transformers' }),
          item('gm-4', 'Diffusion Models — DDPM & Stable Diffusion', 'theory', 'hard', { topic: 'llm' }),
          item('gm-5', 'Audio-Language Models — Whisper, Gemini Audio', 'theory', 'medium', { topic: 'llm' }),
          item('gm-6', 'Build Multimodal Q&A App', 'project', 'hard', { hasCode: true }),
        ],
      },
      {
        id: 'genai-inference',
        title: 'Inference & Optimization',
        items: [
          item('gi-1', 'Quantization — INT4, INT8, FP16, BF16, GGUF', 'theory', 'hard', { topic: 'fine-tuning', hasFlashcard: true }),
          item('gi-2', 'vLLM & PagedAttention for LLM Serving', 'theory', 'hard', { topic: 'system-design' }),
          item('gi-3', 'Speculative Decoding — Theory & Implementation', 'theory', 'hard', { topic: 'transformers' }),
          item('gi-4', 'Knowledge Distillation', 'theory', 'hard', { topic: 'fine-tuning', hasFlashcard: true }),
          item('gi-5', 'Model Pruning — Structured & Unstructured', 'theory', 'hard', { topic: 'fine-tuning' }),
          item('gi-6', 'Continuous Batching & Dynamic Scheduling', 'theory', 'hard', { topic: 'system-design' }),
          item('gi-7', 'Ollama & Local LLM Deployment', 'theory', 'medium', { hasCode: true }),
          item('gi-8', 'Benchmark & Profile LLM Throughput/Latency', 'project', 'medium', { hasCode: true }),
        ],
      },
    ],
  },

  // ─── TRACK 2: AGENTIC AI ─────────────────────────────────────────────────
  {
    id: 'agentic',
    title: 'Agentic AI',
    description: 'Agent Architectures, Tool Use, Memory Systems, Multi-Agent & 2026 Frameworks (MCP, LangGraph)',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    bar: 'bg-orange-500',
    icon: '🤖',
    sections: [
      {
        id: 'ag-fundamentals',
        title: 'Agent Fundamentals',
        items: [
          item('af-1', 'What Is an AI Agent? (Perceive → Plan → Act Loop)', 'theory', 'easy', { topic: 'agents', hasFlashcard: true }),
          item('af-2', 'ReAct Framework — Reasoning + Acting', 'theory', 'medium', { topic: 'agents', hasFlashcard: true }),
          item('af-3', 'Chain-of-Thought & Step-by-Step Reasoning', 'theory', 'medium', { topic: 'agents', hasFlashcard: true }),
          item('af-4', 'Tree of Thoughts (ToT) & Graph of Thoughts', 'theory', 'hard', { topic: 'agents' }),
          item('af-5', 'Self-Reflection & Critique — Reflexion Framework', 'theory', 'hard', { topic: 'agents' }),
          item('af-6', 'o1-Style Test-Time Compute Scaling', 'theory', 'hard', { topic: 'agents' }),
          item('af-7', 'Agent Evaluation Frameworks & Benchmarks', 'theory', 'medium', { topic: 'agents', hasInterview: true }),
          item('af-8', 'Build a ReAct Agent from Scratch', 'project', 'medium', { hasCode: true }),
        ],
      },
      {
        id: 'ag-tools',
        title: 'Tool Use & Function Calling',
        items: [
          item('at-1', 'OpenAI / Anthropic Function Calling Spec', 'theory', 'medium', { topic: 'agents', hasFlashcard: true }),
          item('at-2', 'Tool Schema Design with JSON Schema', 'theory', 'medium', { topic: 'agents', hasCode: true }),
          item('at-3', 'Parallel Tool Calling & Tool Chaining', 'theory', 'hard', { topic: 'agents' }),
          item('at-4', 'Code Execution & Sandboxed Tools', 'theory', 'medium', { topic: 'agents' }),
          item('at-5', 'Web Search, Browser Use & Computer Use', 'theory', 'medium', { topic: 'agents' }),
          item('at-6', 'Implement a Multi-Tool Agent', 'code', 'hard', { hasCode: true }),
        ],
      },
      {
        id: 'ag-memory',
        title: 'Memory Systems',
        items: [
          item('am-1', 'Short-Term vs Long-Term Agent Memory', 'theory', 'medium', { topic: 'agents', hasFlashcard: true }),
          item('am-2', 'Episodic & Semantic Memory', 'theory', 'hard', { topic: 'agents', hasFlashcard: true }),
          item('am-3', 'Retrieval-Augmented Memory (Store + Retrieve)', 'theory', 'medium', { topic: 'rag' }),
          item('am-4', 'Memory Compression & Summarization', 'theory', 'hard', { topic: 'agents' }),
          item('am-5', 'Persistent Agent State Across Sessions', 'theory', 'medium', { topic: 'agents' }),
          item('am-6', 'Build Agent with Long-Term Memory', 'project', 'hard', { hasCode: true }),
        ],
      },
      {
        id: 'ag-multiagent',
        title: 'Multi-Agent Systems',
        items: [
          item('ama-1', 'Multi-Agent Architecture Patterns', 'theory', 'hard', { topic: 'agents', hasFlashcard: true }),
          item('ama-2', 'Supervisor & Subagent Pattern', 'theory', 'hard', { topic: 'agents' }),
          item('ama-3', 'Agent Handoffs & Communication Protocols', 'theory', 'hard', { topic: 'agents' }),
          item('ama-4', 'CrewAI — Roles, Tasks & Crew Execution', 'theory', 'medium', { topic: 'agents', hasCode: true }),
          item('ama-5', 'AutoGen — Conversational Agents', 'theory', 'medium', { topic: 'agents' }),
          item('ama-6', 'Build a Multi-Agent Research Pipeline', 'project', 'hard', { hasCode: true }),
        ],
      },
      {
        id: 'ag-frameworks',
        title: '2026 Agent Frameworks',
        items: [
          item('agf-1', 'LangChain LCEL — Runnable Chains & Pipelines', 'theory', 'medium', { topic: 'agents', hasCode: true }),
          item('agf-2', 'LangGraph — State Machines for Agentic Workflows', 'theory', 'hard', { topic: 'agents', hasFlashcard: true }),
          item('agf-3', 'MCP — Model Context Protocol (Anthropic 2025)', 'theory', 'medium', { topic: 'agents', hasFlashcard: true }),
          item('agf-4', 'OpenAI Agents SDK & Swarm Framework', 'theory', 'medium', { topic: 'agents' }),
          item('agf-5', 'Structured Outputs with Instructor & Pydantic AI', 'theory', 'medium', { hasCode: true }),
          item('agf-6', 'Agent Observability — LangSmith, Arize Phoenix', 'theory', 'medium', { topic: 'mlops' }),
          item('agf-7', 'Safety, Guardrails & Prompt Firewalls', 'theory', 'hard', { topic: 'agents', hasInterview: true }),
          item('agf-8', 'Build a Full-Stack Production Agent', 'project', 'hard', { hasCode: true }),
        ],
      },
    ],
  },

  // ─── TRACK 3: DEEP LEARNING ──────────────────────────────────────────────
  {
    id: 'deeplearning',
    title: 'Deep Learning',
    description: 'Neural Networks, Optimization, CNNs, RNNs, PyTorch & Advanced Architectures',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    bar: 'bg-blue-500',
    icon: '🧠',
    sections: [
      {
        id: 'dl-fundamentals',
        title: 'Neural Network Fundamentals',
        items: [
          item('df-1', 'Perceptron → Multi-Layer Perceptron (MLP)', 'theory', 'easy', { hasFlashcard: true, hasQuiz: true }),
          item('df-2', 'Activation Functions — ReLU, GELU, SiLU, Swish', 'theory', 'easy', { hasFlashcard: true }),
          item('df-3', 'Forward Pass & Backpropagation (Chain Rule)', 'theory', 'hard', { hasFlashcard: true, hasCode: true }),
          item('df-4', 'Loss Functions — Cross-Entropy, MSE, Focal Loss', 'theory', 'medium', { hasCode: true }),
          item('df-5', 'Weight Initialization — Xavier, Kaiming (He)', 'theory', 'medium', { hasFlashcard: true }),
          item('df-6', 'Batch Norm, Layer Norm & RMS Norm', 'theory', 'medium', { hasFlashcard: true }),
          item('df-7', 'Dropout, L1/L2 Regularization & Weight Decay', 'theory', 'medium', { hasFlashcard: true }),
          item('df-8', 'Universal Approximation Theorem', 'theory', 'hard', { hasQuiz: true }),
          item('df-9', 'Implement MLP from Scratch in NumPy', 'code', 'hard', { hasCode: true }),
          item('df-10', 'Neural Network Interview Deep Dive', 'interview', 'medium', { hasInterview: true }),
        ],
      },
      {
        id: 'dl-optimization',
        title: 'Training & Optimization',
        items: [
          item('do-1', 'SGD, Momentum, RMSProp, Adam, AdamW — Intuition & Math', 'theory', 'medium', { hasFlashcard: true }),
          item('do-2', 'Learning Rate Scheduling — Cosine, Warmup, OneCycleLR', 'theory', 'medium', { hasCode: true }),
          item('do-3', 'Gradient Clipping & Gradient Explosion', 'theory', 'medium', { hasCode: true }),
          item('do-4', 'Mixed Precision Training — FP16 & BF16', 'theory', 'hard', { hasCode: true }),
          item('do-5', 'Gradient Accumulation for Large Batch Training', 'theory', 'hard', { hasCode: true }),
          item('do-6', 'Data Augmentation & Regularization Strategies', 'theory', 'easy', { hasCode: true }),
          item('do-7', 'Early Stopping, Checkpointing & Model Selection', 'theory', 'easy', { hasCode: true }),
          item('do-8', 'Distributed Training — DDP, FSDP, DeepSpeed ZeRO', 'theory', 'hard', { hasFlashcard: true }),
        ],
      },
      {
        id: 'dl-cnn',
        title: 'CNNs & Computer Vision',
        items: [
          item('dc-1', 'Convolution, Padding, Stride & Receptive Field', 'theory', 'medium', { hasFlashcard: true, hasCode: true }),
          item('dc-2', 'ResNet — Skip Connections & Deep Network Training', 'theory', 'medium', { hasFlashcard: true }),
          item('dc-3', 'EfficientNet & Neural Architecture Search', 'theory', 'hard', { hasFlashcard: true }),
          item('dc-4', 'Object Detection — YOLO Family (v8, v11)', 'theory', 'hard', { hasCode: true }),
          item('dc-5', 'Semantic & Instance Segmentation', 'theory', 'hard', { hasCode: true }),
          item('dc-6', 'Transfer Learning — When, Why & How', 'theory', 'medium', { hasFlashcard: true, hasCode: true }),
          item('dc-7', 'Vision Transformers (ViT, DeiT, DINO)', 'theory', 'hard', { topic: 'transformers' }),
          item('dc-8', 'Build Image Classifier with Transfer Learning', 'project', 'medium', { hasCode: true }),
        ],
      },
      {
        id: 'dl-rnn',
        title: 'RNNs & Sequence Models',
        items: [
          item('dr-1', 'RNN Architecture & Unrolling Through Time', 'theory', 'medium', { hasFlashcard: true, hasCode: true }),
          item('dr-2', 'LSTM — Cell State, Forget, Input & Output Gates', 'theory', 'hard', { hasFlashcard: true, hasCode: true }),
          item('dr-3', 'GRU — Simplified LSTM', 'theory', 'medium', { hasFlashcard: true }),
          item('dr-4', 'Vanishing & Exploding Gradients in RNNs', 'theory', 'hard', { hasFlashcard: true }),
          item('dr-5', 'Seq2Seq with Bahdanau Attention', 'theory', 'hard', { hasFlashcard: true, hasCode: true }),
          item('dr-6', 'Bidirectional RNNs & Stacked LSTMs', 'theory', 'medium', { hasCode: true }),
          item('dr-7', 'Time Series Forecasting with LSTM', 'project', 'medium', { hasCode: true }),
          item('dr-8', 'RNN vs Transformer — When to Use Which', 'interview', 'medium', { hasInterview: true }),
        ],
      },
      {
        id: 'dl-advanced',
        title: 'Advanced Architectures',
        items: [
          item('da-1', 'GANs — Generator & Discriminator Training Dynamics', 'theory', 'hard', { hasCode: true }),
          item('da-2', 'VAE — Variational Autoencoders & Reparameterization', 'theory', 'hard', { hasCode: true }),
          item('da-3', 'Denoising Diffusion Probabilistic Models (DDPM)', 'theory', 'hard', { hasFlashcard: true }),
          item('da-4', 'Self-Supervised Learning — MAE, DINO, SimCLR', 'theory', 'hard', { hasFlashcard: true }),
          item('da-5', 'Contrastive Learning — SimCLR, MoCo, BYOL', 'theory', 'hard', { hasFlashcard: true }),
          item('da-6', 'Graph Neural Networks — GCN, GAT, GraphSAGE', 'theory', 'hard', { hasCode: true }),
        ],
      },
    ],
  },

  // ─── TRACK 4: MACHINE LEARNING ───────────────────────────────────────────
  {
    id: 'ml',
    title: 'Machine Learning',
    description: 'Core Algorithms, Model Evaluation, Feature Engineering, Statistics & Ensemble Methods',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    bar: 'bg-green-500',
    icon: '📊',
    sections: [
      {
        id: 'ml-algorithms',
        title: 'Core ML Algorithms',
        items: [
          item('ma-1', 'Linear Regression — OLS, Ridge, Lasso', 'theory', 'easy', { hasFlashcard: true, hasCode: true }),
          item('ma-2', 'Logistic Regression & Decision Boundary', 'theory', 'easy', { hasFlashcard: true, hasCode: true }),
          item('ma-3', 'Decision Trees — ID3, C4.5, CART', 'theory', 'medium', { hasFlashcard: true, hasCode: true }),
          item('ma-4', 'Random Forests & Feature Importance', 'theory', 'medium', { hasFlashcard: true, hasCode: true }),
          item('ma-5', 'Gradient Boosting — XGBoost, LightGBM, CatBoost', 'theory', 'hard', { hasFlashcard: true, hasCode: true }),
          item('ma-6', 'Support Vector Machines & Kernel Trick', 'theory', 'hard', { hasFlashcard: true, hasCode: true }),
          item('ma-7', 'Naive Bayes — Gaussian, Multinomial, Bernoulli', 'theory', 'easy', { hasCode: true }),
          item('ma-8', 'K-Nearest Neighbors & Distance Metrics', 'theory', 'easy', { hasCode: true }),
          item('ma-9', 'K-Means & DBSCAN Clustering', 'theory', 'medium', { hasFlashcard: true, hasCode: true }),
          item('ma-10', 'PCA & t-SNE for Dimensionality Reduction', 'theory', 'medium', { hasFlashcard: true, hasCode: true }),
          item('ma-11', 'Implement Gradient Boosting from Scratch', 'code', 'hard', { hasCode: true }),
          item('ma-12', 'Core ML Algorithms Interview Q&A', 'interview', 'medium', { hasInterview: true, hasQuiz: true }),
        ],
      },
      {
        id: 'ml-evaluation',
        title: 'Model Evaluation & Validation',
        items: [
          item('me-1', 'Bias-Variance Tradeoff', 'theory', 'medium', { hasFlashcard: true, hasQuiz: true }),
          item('me-2', 'Overfitting, Underfitting & Regularization', 'theory', 'easy', { hasFlashcard: true }),
          item('me-3', 'K-Fold & Stratified Cross-Validation', 'theory', 'medium', { hasCode: true }),
          item('me-4', 'Precision, Recall, F1-Score, ROC-AUC', 'theory', 'medium', { hasFlashcard: true, hasCode: true }),
          item('me-5', 'Confusion Matrix, Type I & Type II Errors', 'theory', 'easy', { hasCode: true }),
          item('me-6', 'NDCG, MAP & Ranking Evaluation Metrics', 'theory', 'hard', { hasCode: true }),
          item('me-7', 'Class Imbalance — SMOTE, Focal Loss, Class Weights', 'theory', 'hard', { hasCode: true }),
          item('me-8', 'Model Calibration — Platt Scaling & Reliability Diagrams', 'theory', 'hard', { hasCode: true }),
        ],
      },
      {
        id: 'ml-features',
        title: 'Feature Engineering',
        items: [
          item('mf-1', 'Missing Data — Imputation Strategies', 'theory', 'medium', { hasCode: true }),
          item('mf-2', 'Feature Scaling — Standard, MinMax, Robust', 'theory', 'easy', { hasCode: true }),
          item('mf-3', 'Encoding — One-Hot, Target, Ordinal, Embeddings', 'theory', 'medium', { hasCode: true }),
          item('mf-4', 'Feature Selection — Filter, Wrapper, Embedded Methods', 'theory', 'hard', { hasCode: true }),
          item('mf-5', 'Time Series Feature Engineering (Lags, Windows, FFT)', 'theory', 'hard', { hasCode: true }),
          item('mf-6', 'Text Features — TF-IDF, n-grams, Word Embeddings', 'theory', 'medium', { hasCode: true }),
          item('mf-7', 'EDA Best Practices & Statistical Visualization', 'theory', 'easy', { hasCode: true }),
          item('mf-8', 'Build an End-to-End Feature Pipeline with sklearn', 'project', 'medium', { hasCode: true }),
        ],
      },
      {
        id: 'ml-statistics',
        title: 'Statistics & Probability',
        items: [
          item('ms-1', 'Probability Distributions for ML (Gaussian, Bernoulli, Poisson)', 'theory', 'medium', { hasFlashcard: true }),
          item('ms-2', 'Bayesian Thinking & Bayes Theorem', 'theory', 'hard', { hasFlashcard: true, hasCode: true }),
          item('ms-3', 'Hypothesis Testing — t-test, chi-square, ANOVA', 'theory', 'hard', { hasCode: true }),
          item('ms-4', 'A/B Testing & Statistical Power', 'theory', 'medium', { hasCode: true }),
          item('ms-5', 'Central Limit Theorem & Sampling Distributions', 'theory', 'medium', { hasFlashcard: true }),
          item('ms-6', 'Covariance, Correlation & Causation', 'theory', 'medium', { hasCode: true }),
          item('ms-7', 'MLE & MAP Estimation', 'theory', 'hard', { hasFlashcard: true }),
          item('ms-8', 'Statistics for ML Interviews', 'interview', 'medium', { hasInterview: true, hasQuiz: true }),
        ],
      },
    ],
  },

  // ─── TRACK 5: MLOPS ──────────────────────────────────────────────────────
  {
    id: 'mlops',
    title: 'MLOps',
    description: 'Model Serving, Experiment Tracking, Feature Pipelines, Monitoring & Cloud Infrastructure',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    bar: 'bg-teal-500',
    icon: '⚙️',
    sections: [
      {
        id: 'mo-serving',
        title: 'Model Serving & Deployment',
        items: [
          item('mos-1', 'REST API for ML — FastAPI + Pydantic', 'theory', 'medium', { topic: 'mlops', hasCode: true }),
          item('mos-2', 'NVIDIA Triton Inference Server', 'theory', 'hard', { topic: 'mlops' }),
          item('mos-3', 'vLLM for Production LLM Serving', 'theory', 'hard', { topic: 'mlops', hasFlashcard: true }),
          item('mos-4', 'Batch vs Online vs Streaming Inference', 'theory', 'medium', { topic: 'mlops', hasFlashcard: true }),
          item('mos-5', 'Blue-Green Deployment & Canary Releases', 'theory', 'hard', { topic: 'mlops', hasFlashcard: true }),
          item('mos-6', 'Model Versioning, Registry & Rollback', 'theory', 'medium', { topic: 'mlops', hasFlashcard: true }),
          item('mos-7', 'Shadow Mode & A/B Testing for ML', 'theory', 'hard', { topic: 'mlops' }),
          item('mos-8', 'Deploy ML Model as FastAPI Service (Hands-On)', 'project', 'medium', { hasCode: true }),
        ],
      },
      {
        id: 'mo-experiments',
        title: 'Experiment Tracking & Reproducibility',
        items: [
          item('moe-1', 'MLflow — Experiments, Runs, Models & Registry', 'theory', 'medium', { topic: 'mlops', hasCode: true }),
          item('moe-2', 'Weights & Biases (W&B) for DL Training', 'theory', 'medium', { topic: 'mlops', hasCode: true }),
          item('moe-3', 'Hyperparameter Tuning — Optuna & Ray Tune', 'theory', 'hard', { hasCode: true }),
          item('moe-4', 'Data Versioning with DVC', 'theory', 'medium', { topic: 'mlops', hasFlashcard: true }),
          item('moe-5', 'Reproducible ML — Seeds, Environments & Configs', 'theory', 'medium', { topic: 'mlops' }),
          item('moe-6', 'Track LLM Experiments with MLflow', 'project', 'medium', { hasCode: true }),
        ],
      },
      {
        id: 'mo-pipelines',
        title: 'Data & ML Pipelines',
        items: [
          item('mop-1', 'Feature Stores — Feast, Tecton, Hopsworks', 'theory', 'hard', { topic: 'mlops', hasFlashcard: true }),
          item('mop-2', 'Pipeline Orchestration — Airflow & Prefect', 'theory', 'medium', { topic: 'mlops' }),
          item('mop-3', 'CI/CD for Machine Learning — GitHub Actions', 'theory', 'hard', { topic: 'mlops', hasFlashcard: true }),
          item('mop-4', 'Data Quality & Validation — Great Expectations', 'theory', 'medium', { topic: 'mlops' }),
          item('mop-5', 'Data Drift Detection (PSI, KS Test)', 'theory', 'hard', { topic: 'mlops', hasFlashcard: true }),
          item('mop-6', 'Model Drift & Automated Retraining Triggers', 'theory', 'hard', { topic: 'mlops', hasFlashcard: true }),
          item('mop-7', 'Production Monitoring — Evidently, Arize', 'theory', 'hard', { topic: 'mlops' }),
          item('mop-8', 'Build an End-to-End ML Pipeline', 'project', 'hard', { hasCode: true }),
        ],
      },
      {
        id: 'mo-infra',
        title: 'Infrastructure & Scale',
        items: [
          item('moi-1', 'Docker for ML — Images, Containers & Multi-Stage Builds', 'theory', 'medium', { hasCode: true }),
          item('moi-2', 'Kubernetes for ML Workloads', 'theory', 'hard', { hasCode: true }),
          item('moi-3', 'GPU Cloud — AWS SageMaker, GCP Vertex AI, Azure ML', 'theory', 'medium', { topic: 'mlops' }),
          item('moi-4', 'CUDA & GPU Memory Optimization', 'theory', 'hard', { hasCode: true }),
          item('moi-5', 'Distributed Training Setup (DDP + FSDP)', 'theory', 'hard', { hasFlashcard: true }),
          item('moi-6', 'LLM Cost Optimization in Production', 'theory', 'medium', { topic: 'mlops', hasInterview: true }),
        ],
      },
    ],
  },

  // ─── TRACK 6: SYSTEM DESIGN ──────────────────────────────────────────────
  {
    id: 'sysdesign',
    title: 'System Design',
    description: 'LLM Infrastructure Design, ML System Design & Real Company Interview Problems',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    bar: 'bg-red-500',
    icon: '🏗️',
    sections: [
      {
        id: 'sd-llm',
        title: 'LLM System Design',
        items: [
          item('sdl-1', 'Design LLM Serving at Scale (10K+ RPS)', 'theory', 'hard', { topic: 'system-design', hasInterview: true }),
          item('sdl-2', 'Design a RAG System (End-to-End Architecture)', 'theory', 'hard', { topic: 'system-design', hasInterview: true }),
          item('sdl-3', 'Design Multi-Tenant LLM API Gateway', 'theory', 'hard', { topic: 'system-design', hasInterview: true }),
          item('sdl-4', 'Caching Strategies for LLM Responses', 'theory', 'hard', { topic: 'system-design' }),
          item('sdl-5', 'Design a ChatGPT-like Product', 'interview', 'hard', { hasInterview: true }),
        ],
      },
      {
        id: 'sd-ml',
        title: 'ML System Design',
        items: [
          item('sdm-1', 'Design Recommendation System — Two-Tower Model', 'theory', 'hard', { topic: 'system-design', hasFlashcard: true, hasInterview: true }),
          item('sdm-2', 'Design Real-Time Fraud Detection System', 'theory', 'hard', { topic: 'system-design', hasInterview: true }),
          item('sdm-3', 'Design Search Ranking with Learning to Rank', 'theory', 'hard', { topic: 'system-design', hasInterview: true }),
          item('sdm-4', 'Design Ads CTR Prediction Pipeline', 'theory', 'hard', { topic: 'system-design', hasInterview: true }),
          item('sdm-5', 'Design Real-Time Feature Pipeline', 'theory', 'hard', { topic: 'system-design' }),
        ],
      },
      {
        id: 'sd-cases',
        title: 'Real Company Design Problems',
        items: [
          item('sdc-1', 'Design Google Search Personalization', 'interview', 'hard', { hasInterview: true }),
          item('sdc-2', 'Design YouTube Video Recommendation', 'interview', 'hard', { hasInterview: true }),
          item('sdc-3', 'Design Uber ETA Prediction System', 'interview', 'hard', { hasInterview: true }),
          item('sdc-4', 'Design Content Moderation at Scale', 'interview', 'hard', { hasInterview: true }),
          item('sdc-5', 'Design Spotify Song Discovery Engine', 'interview', 'hard', { hasInterview: true }),
        ],
      },
      {
        id: 'sd-interview',
        title: 'ML Interview Preparation',
        items: [
          item('sdi-1', 'FAANG ML Interview Process Overview', 'theory', 'medium', { hasInterview: true }),
          item('sdi-2', 'ML Coding Round Patterns & Techniques', 'theory', 'medium', { hasCode: true, hasInterview: true }),
          item('sdi-3', 'Behavioral Interviews for AI/ML Engineers', 'theory', 'easy', { topic: 'behavioral', hasInterview: true }),
          item('sdi-4', 'Take-Home ML Project Best Practices', 'theory', 'medium', { hasInterview: true }),
          item('sdi-5', 'Salary Negotiation for AI/ML Roles', 'theory', 'easy', { hasInterview: true }),
        ],
      },
    ],
  },
]

export function getTotalItems(): number {
  return SHEET_TRACKS.reduce(
    (sum, track) => sum + track.sections.reduce((s, sec) => s + sec.items.length, 0),
    0
  )
}
