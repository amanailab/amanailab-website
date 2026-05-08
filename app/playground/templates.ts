export interface Template {
  id: string
  label: string
  emoji: string
  category: string
  description: string
  tags: string[]
  code: string
}

export const CATEGORIES = ['All', 'RAG', 'Agents', 'Fine-Tuning', 'Transformers', 'Vector DB', 'MLOps', 'Classical ML']

export const TEMPLATES: Template[] = [
  {
    id: 'rag-pipeline',
    label: 'RAG Pipeline',
    emoji: '📦',
    category: 'RAG',
    description: 'Full RAG pipeline with chunking, embeddings and retrieval',
    tags: ['RAG', 'LangChain', 'ChromaDB', 'OpenAI'],
    code: `# ── RAG Pipeline (Retrieval-Augmented Generation) ──────────────────────
# Key interview topics: chunking strategies, embedding models,
# MMR retrieval, context window management, hallucination reduction
#
# pip install langchain langchain-openai chromadb pypdf

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# ── 1. Load documents ─────────────────────────────────────────────────────────
loader = PyPDFLoader("document.pdf")
documents = loader.load()
print(f"Loaded {len(documents)} pages")

# ── 2. Chunk documents ────────────────────────────────────────────────────────
# RecursiveCharacterTextSplitter respects sentence/paragraph boundaries
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,       # characters per chunk
    chunk_overlap=200,     # overlap preserves context at chunk boundaries
    separators=["\\n\\n", "\\n", ". ", " ", ""],
)
chunks = splitter.split_documents(documents)
print(f"Created {len(chunks)} chunks from {len(documents)} pages")

# ── 3. Embed and store ────────────────────────────────────────────────────────
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db",
)

# ── 4. Build retriever ────────────────────────────────────────────────────────
retriever = vectorstore.as_retriever(
    search_type="mmr",              # Maximal Marginal Relevance — reduces redundancy
    search_kwargs={
        "k": 5,                     # return top-5 chunks
        "fetch_k": 20,              # fetch 20, then re-rank to k=5
        "lambda_mult": 0.7,         # 1.0 = pure relevance, 0.0 = pure diversity
    }
)

# ── 5. Custom RAG prompt ──────────────────────────────────────────────────────
PROMPT = PromptTemplate(
    template="""Use only the context below to answer the question.
If the answer is not in the context, say "I don't have that information."

Context:
{context}

Question: {question}

Answer:""",
    input_variables=["context", "question"]
)

# ── 6. Build QA chain ─────────────────────────────────────────────────────────
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",             # stuff = concat all chunks into one prompt
    retriever=retriever,
    chain_type_kwargs={"prompt": PROMPT},
    return_source_documents=True,
)

# ── 7. Query ──────────────────────────────────────────────────────────────────
result = qa_chain.invoke({"query": "What are the main findings?"})
print(f"\\nAnswer: {result['result']}")
print(f"\\nRetrieved {len(result['source_documents'])} source chunks:")
for i, doc in enumerate(result['source_documents']):
    print(f"  [{i+1}] Page {doc.metadata.get('page', '?')}: {doc.page_content[:80]}...")

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: What is the difference between "stuff", "map_reduce", and "refine" chains?
# Q: Why do we use chunk_overlap? What happens if it's 0?
# Q: When would you choose MMR retrieval over cosine similarity?
# Q: How do you handle documents that exceed the LLM context window?
`,
  },

  {
    id: 'langchain-agent',
    label: 'ReAct Agent',
    emoji: '🤖',
    category: 'Agents',
    description: 'LangChain ReAct agent with custom tools and memory',
    tags: ['Agents', 'LangChain', 'ReAct', 'Tool Use'],
    code: `# ── LangChain ReAct Agent ────────────────────────────────────────────────────
# Key interview topics: ReAct loop (Reason+Act), tool design,
# agent memory, stopping conditions, prompt engineering for agents
#
# pip install langchain langchain-openai duckduckgo-search

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import tool
from langchain.memory import ConversationBufferWindowMemory
from langchain import hub
import requests

# ── 1. Define custom tools ────────────────────────────────────────────────────
@tool
def search_web(query: str) -> str:
    """Search the web for current information. Use for facts, news, and recent data."""
    # In production: use DuckDuckGo, Serper, or Brave Search API
    return f"Search results for '{query}': [mock results — replace with real API]"

@tool
def calculate(expression: str) -> str:
    """Evaluate a mathematical expression. Input must be a valid Python math expression."""
    try:
        # SECURITY: In production, use a safe eval library
        allowed = {k: v for k, v in __import__('math').__dict__.items() if not k.startswith('_')}
        result = eval(expression, {"__builtins__": {}}, allowed)
        return str(result)
    except Exception as e:
        return f"Error: {e}"

@tool
def get_stock_price(ticker: str) -> str:
    """Get current stock price for a given ticker symbol (e.g., AAPL, GOOGL)."""
    # Replace with real financial API (yfinance, Alpha Vantage, etc.)
    return f"Mock price for {ticker.upper()}: $150.00 (replace with real API)"

# ── 2. Set up LLM and memory ──────────────────────────────────────────────────
llm = ChatOpenAI(model="gpt-4o", temperature=0)
memory = ConversationBufferWindowMemory(
    memory_key="chat_history",
    return_messages=True,
    k=10,                    # keep last 10 turns
)

tools = [search_web, calculate, get_stock_price]

# ── 3. Load ReAct prompt from LangChain Hub ───────────────────────────────────
# ReAct = Reason + Act: the agent thinks step-by-step before each action
prompt = hub.pull("hwchase17/react-chat")

# ── 4. Create agent ───────────────────────────────────────────────────────────
agent = create_react_agent(
    llm=llm,
    tools=tools,
    prompt=prompt,
)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True,            # prints Thought/Action/Observation steps
    max_iterations=10,       # prevent infinite loops
    handle_parsing_errors=True,
)

# ── 5. Run agent ──────────────────────────────────────────────────────────────
response = agent_executor.invoke({
    "input": "What is 25% of Apple's current stock price? Search for it first."
})
print(f"Final answer: {response['output']}")

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: Explain the ReAct loop. What are Thought, Action, and Observation?
# Q: How does an agent decide which tool to use?
# Q: What is max_iterations and why is it important?
# Q: How would you add error recovery when a tool fails?
# Q: Compare ReAct vs. Plan-and-Execute vs. OpenAI Function Calling agents.
`,
  },

  {
    id: 'lora-finetuning',
    label: 'LoRA Fine-Tuning',
    emoji: '🔧',
    category: 'Fine-Tuning',
    description: 'Fine-tune an LLM with LoRA using PEFT and HuggingFace Trainer',
    tags: ['Fine-Tuning', 'LoRA', 'PEFT', 'HuggingFace'],
    code: `# ── LoRA Fine-Tuning with PEFT ───────────────────────────────────────────────
# Key interview topics: LoRA rank, alpha, target modules,
# VRAM reduction vs full fine-tuning, catastrophic forgetting,
# when to fine-tune vs RAG vs few-shot prompting
#
# pip install transformers peft datasets accelerate bitsandbytes trl
# Requires: GPU with ≥16GB VRAM (or use Google Colab A100)

from transformers import (
    AutoModelForCausalLM, AutoTokenizer,
    TrainingArguments, BitsAndBytesConfig,
)
from peft import LoraConfig, get_peft_model, TaskType, prepare_model_for_kbit_training
from trl import SFTTrainer
from datasets import load_dataset
import torch

MODEL_ID = "meta-llama/Llama-3.2-3B-Instruct"   # or mistralai/Mistral-7B-v0.1

# ── 1. Load model in 4-bit quantization ──────────────────────────────────────
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # NormalFloat4 — best quality
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,     # nested quantization saves memory
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)
model = prepare_model_for_kbit_training(model)

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

# ── 2. Configure LoRA ─────────────────────────────────────────────────────────
# LoRA injects trainable low-rank matrices A and B into attention layers
# Only trains (r * d_in + r * d_out) params instead of (d_in * d_out)
lora_config = LoraConfig(
    r=16,                               # rank — higher = more capacity, more VRAM
    lora_alpha=32,                      # scaling: effective_lr = alpha/r * lr
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# Expected: ~1-2% of total parameters — that's the power of LoRA

# ── 3. Load and format dataset ────────────────────────────────────────────────
dataset = load_dataset("tatsu-lab/alpaca", split="train[:1000]")   # small subset

def format_prompt(sample):
    """Format as instruction-following template."""
    if sample["input"]:
        return f"### Instruction:\\n{sample['instruction']}\\n\\n### Input:\\n{sample['input']}\\n\\n### Response:\\n{sample['output']}"
    return f"### Instruction:\\n{sample['instruction']}\\n\\n### Response:\\n{sample['output']}"

# ── 4. Training arguments ─────────────────────────────────────────────────────
training_args = TrainingArguments(
    output_dir="./lora-output",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,       # effective batch = 4 * 4 = 16
    gradient_checkpointing=True,         # trades compute for VRAM
    learning_rate=2e-4,
    fp16=False,
    bf16=True,
    max_grad_norm=0.3,
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    logging_steps=25,
    save_strategy="epoch",
    evaluation_strategy="no",
)

# ── 5. Train ──────────────────────────────────────────────────────────────────
trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    formatting_func=format_prompt,
    max_seq_length=512,
    peft_config=lora_config,
)
trainer.train()

# ── 6. Save adapter ───────────────────────────────────────────────────────────
model.save_pretrained("./lora-adapter")
tokenizer.save_pretrained("./lora-adapter")
# Note: only saves the LoRA weights (~10MB), not the full model (~7GB)

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: What does LoRA rank (r) control? What's the tradeoff?
# Q: Why do we target q_proj and v_proj specifically?
# Q: When would you prefer fine-tuning over RAG?
# Q: What is catastrophic forgetting and how does LoRA help?
# Q: Explain QLoRA vs LoRA. What does 4-bit quantization sacrifice?
`,
  },

  {
    id: 'self-attention',
    label: 'Attention Mechanism',
    emoji: '🧠',
    category: 'Transformers',
    description: 'Multi-head self-attention built from scratch in PyTorch',
    tags: ['Transformers', 'Attention', 'PyTorch', 'Architecture'],
    code: `# ── Multi-Head Self-Attention from Scratch ───────────────────────────────────
# Key interview topics: Q/K/V matrices, why scale by sqrt(d_k),
# masked attention, multi-head purpose, positional encoding
#
# pip install torch
# Runs on CPU for small dimensions

import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class MultiHeadSelfAttention(nn.Module):
    """
    Multi-Head Self-Attention as described in 'Attention Is All You Need'.

    Each head learns different relationship patterns:
    - Some heads track syntactic dependencies
    - Some heads track semantic similarity
    - Some heads handle positional relationships
    """

    def __init__(self, d_model: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % num_heads == 0, "d_model must be divisible by num_heads"

        self.d_model    = d_model
        self.num_heads  = num_heads
        self.d_k        = d_model // num_heads  # dimension per head

        # Single projection matrix for all heads (more efficient than separate)
        self.W_q = nn.Linear(d_model, d_model, bias=False)  # Query projection
        self.W_k = nn.Linear(d_model, d_model, bias=False)  # Key projection
        self.W_v = nn.Linear(d_model, d_model, bias=False)  # Value projection
        self.W_o = nn.Linear(d_model, d_model, bias=False)  # Output projection

        self.dropout = nn.Dropout(dropout)
        self.scale = math.sqrt(self.d_k)  # prevents vanishing gradients in softmax

    def split_heads(self, x: torch.Tensor) -> torch.Tensor:
        """Reshape (batch, seq, d_model) → (batch, heads, seq, d_k)"""
        B, S, _ = x.shape
        return x.view(B, S, self.num_heads, self.d_k).transpose(1, 2)

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        B, S, _ = x.shape

        # Project to Q, K, V and split into heads
        Q = self.split_heads(self.W_q(x))  # (B, heads, S, d_k)
        K = self.split_heads(self.W_k(x))
        V = self.split_heads(self.W_v(x))

        # Scaled dot-product attention: softmax(QK^T / sqrt(d_k)) * V
        scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale  # (B, heads, S, S)

        # Apply mask (used in decoder to prevent attending to future tokens)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        attn_weights = self.dropout(F.softmax(scores, dim=-1))

        # Weighted sum of values
        context = torch.matmul(attn_weights, V)          # (B, heads, S, d_k)

        # Concatenate heads and project
        context = context.transpose(1, 2).contiguous().view(B, S, self.d_model)
        return self.W_o(context), attn_weights


class TransformerBlock(nn.Module):
    """One transformer encoder layer = attention + FFN + layer norms."""

    def __init__(self, d_model: int, num_heads: int, d_ff: int, dropout: float = 0.1):
        super().__init__()
        self.attention = MultiHeadSelfAttention(d_model, num_heads, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        # FFN: expand to d_ff then project back — captures non-linear patterns
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),               # GELU vs ReLU: smoother gradient flow
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        # Pre-norm architecture (more stable than original post-norm)
        attn_out, weights = self.attention(self.norm1(x), mask)
        x = x + self.dropout(attn_out)           # residual connection
        x = x + self.dropout(self.ffn(self.norm2(x)))
        return x, weights


# ── Test with random input ────────────────────────────────────────────────────
d_model, num_heads, seq_len, batch = 512, 8, 64, 2
block = TransformerBlock(d_model=d_model, num_heads=num_heads, d_ff=2048)
x = torch.randn(batch, seq_len, d_model)

output, attn = block(x)
print(f"Input:  {x.shape}")        # (2, 64, 512)
print(f"Output: {output.shape}")   # (2, 64, 512)
print(f"Attn weights: {attn.shape}")  # (2, 8, 64, 64) — one matrix per head

# Total parameters in one block:
total = sum(p.numel() for p in block.parameters())
print(f"Parameters: {total:,}")

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: Why do we scale by sqrt(d_k) before softmax?
# Q: What is the purpose of multi-head attention vs single-head?
# Q: Explain the residual connections — what problem do they solve?
# Q: What is the difference between encoder-only, decoder-only, and encoder-decoder?
# Q: Why does the FFN use d_ff = 4 * d_model typically?
`,
  },

  {
    id: 'vector-search',
    label: 'Vector Search',
    emoji: '🔍',
    category: 'Vector DB',
    description: 'FAISS vector similarity search with embedding comparison',
    tags: ['Vector DB', 'FAISS', 'Embeddings', 'Similarity'],
    code: `# ── Vector Similarity Search with FAISS ──────────────────────────────────────
# Key interview topics: cosine vs dot product vs L2 distance,
# IVF (Inverted File Index), HNSW, ANN vs exact search,
# index types, dimensionality reduction
#
# pip install faiss-cpu sentence-transformers numpy

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import time

# ── 1. Sample knowledge base ──────────────────────────────────────────────────
documents = [
    "RAG combines retrieval with generation to reduce hallucinations",
    "Transformers use self-attention to capture long-range dependencies",
    "LoRA reduces fine-tuning parameters by injecting low-rank matrices",
    "Vector databases store embeddings for fast similarity search",
    "RLHF aligns language models with human preferences",
    "Chain-of-thought prompting improves reasoning in LLMs",
    "Quantization reduces model size by lowering numerical precision",
    "Flash Attention reduces memory complexity from O(n²) to O(n)",
    "Mixture of Experts routes tokens to specialized sub-networks",
    "Constitutional AI uses AI feedback to improve safety",
]

# ── 2. Generate embeddings ────────────────────────────────────────────────────
model = SentenceTransformer("all-MiniLM-L6-v2")  # 384-dim, fast and good
embeddings = model.encode(documents, normalize_embeddings=True)  # L2-normalize for cosine
print(f"Embedding shape: {embeddings.shape}")   # (10, 384)

# ── 3. Build FAISS index ──────────────────────────────────────────────────────
d = embeddings.shape[1]  # 384

# Index types:
# IndexFlatL2       — exact search, L2 distance (good for < 1M vectors)
# IndexFlatIP       — exact search, inner product (cosine if normalized)
# IndexIVFFlat      — approximate, clusters with inverted list (faster, ~1M+)
# IndexHNSWFlat     — approximate, graph-based (best recall/speed tradeoff)

# Flat (exact) index for cosine similarity (inner product on normalized vectors)
index = faiss.IndexFlatIP(d)
index.add(embeddings.astype(np.float32))
print(f"Index contains {index.ntotal} vectors")

# For production (millions of vectors), use IVF:
# quantizer = faiss.IndexFlatIP(d)
# index = faiss.IndexIVFFlat(quantizer, d, 100)   # 100 clusters
# index.train(embeddings)
# index.add(embeddings)
# index.nprobe = 10   # search 10 clusters (recall vs speed tradeoff)

# ── 4. Search ─────────────────────────────────────────────────────────────────
def search(query: str, top_k: int = 3) -> list[dict]:
    query_embedding = model.encode([query], normalize_embeddings=True)
    distances, indices = index.search(query_embedding.astype(np.float32), top_k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        results.append({
            "document": documents[idx],
            "score": float(dist),      # cosine similarity (0-1, higher = more similar)
            "index": int(idx),
        })
    return results

# ── 5. Test queries ───────────────────────────────────────────────────────────
queries = [
    "How do transformers process sequences?",
    "What techniques make LLMs more efficient?",
    "How do vector databases work?",
]

for query in queries:
    start = time.time()
    results = search(query, top_k=3)
    elapsed = (time.time() - start) * 1000

    print(f"\\nQuery: '{query}' ({elapsed:.1f}ms)")
    for i, r in enumerate(results):
        print(f"  [{i+1}] score={r['score']:.3f} — {r['document'][:60]}...")

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: When would you use cosine similarity vs L2 (Euclidean) distance?
# Q: What is the tradeoff between IndexFlatIP and IndexIVFFlat?
# Q: Why do we L2-normalize embeddings before dot product search?
# Q: What is HNSW and why is it preferred in production?
# Q: How does chunking strategy affect retrieval quality?
`,
  },

  {
    id: 'tool-calling',
    label: 'Tool / Function Calling',
    emoji: '⚙️',
    category: 'Agents',
    description: 'OpenAI function calling with structured tool definitions',
    tags: ['Agents', 'Tool Use', 'OpenAI', 'Function Calling'],
    code: `# ── OpenAI Tool / Function Calling ───────────────────────────────────────────
# Key interview topics: tool schemas (JSON Schema), parallel tool calls,
# how the model decides which tool to call, structured outputs,
# difference from ReAct agents
#
# pip install openai

import json
from openai import OpenAI

client = OpenAI()

# ── 1. Define tools as JSON Schema ────────────────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a city. Use when user asks about weather.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "City name, e.g. 'San Francisco, CA'"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Temperature unit"
                    }
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_arxiv",
            "description": "Search arXiv for AI/ML research papers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "max_results": {"type": "integer", "default": 3}
                },
                "required": ["query"],
            },
        },
    },
]

# ── 2. Mock tool implementations ──────────────────────────────────────────────
def get_weather(city: str, unit: str = "celsius") -> dict:
    """Replace with real weather API (OpenWeatherMap, etc.)"""
    return {"city": city, "temp": 22, "unit": unit, "condition": "Sunny"}

def search_arxiv(query: str, max_results: int = 3) -> dict:
    """Replace with real arXiv API call."""
    return {"papers": [{"title": f"Paper about {query}", "authors": ["Smith et al."]}]}

TOOL_MAP = {"get_weather": get_weather, "search_arxiv": search_arxiv}

# ── 3. Tool-calling loop ──────────────────────────────────────────────────────
def run_with_tools(user_message: str) -> str:
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",   # "auto" | "none" | {"type": "function", "function": {"name": "..."}}
        )

        choice = response.choices[0]
        messages.append(choice.message)   # always append assistant message

        # If no tool call → final answer
        if choice.finish_reason == "stop":
            return choice.message.content

        # Execute all tool calls (OpenAI may call multiple tools in parallel)
        for tool_call in choice.message.tool_calls:
            fn_name = tool_call.function.name
            fn_args = json.loads(tool_call.function.arguments)

            print(f"  → Calling {fn_name}({fn_args})")
            result = TOOL_MAP[fn_name](**fn_args)

            messages.append({
                "role": "tool",
                "content": json.dumps(result),
                "tool_call_id": tool_call.id,
            })

# ── 4. Test ───────────────────────────────────────────────────────────────────
answer = run_with_tools(
    "What's the weather in Tokyo? Also search for recent papers on RAG."
)
print(f"\\nFinal answer: {answer}")

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: How does the model decide whether to call a tool or answer directly?
# Q: What is parallel tool calling? When does GPT-4 use it?
# Q: How is function calling different from a ReAct agent?
# Q: What happens if a tool returns an error? How do you handle it?
# Q: When would you use tool_choice="required" vs "auto"?
`,
  },

  {
    id: 'llm-evaluation',
    label: 'LLM Evaluation',
    emoji: '📊',
    category: 'MLOps',
    description: 'Evaluate LLM outputs with RAGAS, G-Eval, and custom metrics',
    tags: ['MLOps', 'Evaluation', 'RAGAS', 'Metrics'],
    code: `# ── LLM Evaluation Framework ──────────────────────────────────────────────────
# Key interview topics: faithfulness vs answer relevancy, hallucination detection,
# G-Eval, RAGAS metrics, human vs automatic evaluation, LLM-as-judge
#
# pip install ragas langchain-openai datasets

from ragas import evaluate
from ragas.metrics import (
    faithfulness,        # Is the answer grounded in the retrieved context?
    answer_relevancy,    # Does the answer address the question?
    context_recall,      # How much of the ground truth is covered by context?
    context_precision,   # Are retrieved chunks actually relevant?
)
from datasets import Dataset
from openai import OpenAI
import json

# ── 1. Sample RAG outputs to evaluate ────────────────────────────────────────
eval_data = [
    {
        "question": "What is LoRA used for?",
        "answer": "LoRA is used to fine-tune large language models with very few trainable parameters by injecting low-rank decomposition matrices.",
        "contexts": [
            "LoRA (Low-Rank Adaptation) reduces the number of trainable parameters by adding pairs of rank decomposition matrices.",
            "PEFT methods like LoRA allow fine-tuning at a fraction of the memory cost.",
        ],
        "ground_truth": "LoRA fine-tunes LLMs efficiently using low-rank matrices.",
    },
    {
        "question": "What is RAG?",
        "answer": "RAG stands for Retrieval-Augmented Generation. It combines a retriever with a generator to ground LLM responses in external knowledge.",
        "contexts": [
            "RAG (Retrieval-Augmented Generation) retrieves relevant documents and provides them as context to the LLM.",
        ],
        "ground_truth": "RAG retrieves relevant documents to augment LLM generation.",
    },
]

# ── 2. Run RAGAS evaluation ───────────────────────────────────────────────────
dataset = Dataset.from_list(eval_data)
results = evaluate(
    dataset=dataset,
    metrics=[faithfulness, answer_relevancy, context_recall, context_precision],
)
print("RAGAS Scores:")
print(results)

# ── 3. Custom LLM-as-Judge evaluation (G-Eval style) ─────────────────────────
client = OpenAI()

def llm_judge(question: str, answer: str, criterion: str) -> dict:
    """Use GPT-4 to score an answer on a given criterion (0-10)."""
    prompt = f"""You are an expert evaluator. Score the following answer strictly.

Question: {question}
Answer: {answer}
Criterion: {criterion}

Score from 0-10 (10=perfect) and give a one-sentence justification.
Return JSON: {{"score": int, "reason": "..."}}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
    )
    return json.loads(response.choices[0].message.content)

# Evaluate on multiple criteria
criteria = ["correctness", "completeness", "conciseness"]
sample = eval_data[0]

print(f"\\nLLM-as-Judge for: '{sample['question']}'")
for criterion in criteria:
    result = llm_judge(sample["question"], sample["answer"], criterion)
    print(f"  {criterion}: {result['score']}/10 — {result['reason']}")

# ── 4. Hallucination detection ────────────────────────────────────────────────
def detect_hallucination(answer: str, context: list[str]) -> bool:
    """Check if answer contains claims not supported by context."""
    context_text = "\\n".join(context)
    prompt = f"""Does the answer contain any claims NOT supported by the context?
Context: {context_text}
Answer: {answer}
Reply with only "YES" (hallucination found) or "NO" (fully grounded)."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return response.choices[0].message.content.strip() == "YES"

for item in eval_data:
    hallucinated = detect_hallucination(item["answer"], item["contexts"])
    print(f"\\n'{item['question'][:40]}...' → Hallucination: {hallucinated}")

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: What is the difference between faithfulness and answer relevancy?
# Q: Why is automatic evaluation with LLM-as-judge preferred over human eval at scale?
# Q: What are the weaknesses of RAGAS metrics?
# Q: How would you build an evaluation pipeline for a production RAG system?
# Q: What is G-Eval and how does it differ from RAGAS?
`,
  },

  {
    id: 'multi-agent',
    label: 'Multi-Agent System',
    emoji: '🤝',
    category: 'Agents',
    description: 'Build a multi-agent pipeline with LangGraph',
    tags: ['Agents', 'LangGraph', 'Multi-Agent', 'Workflow'],
    code: `# ── Multi-Agent System with LangGraph ────────────────────────────────────────
# Key interview topics: agent orchestration, state machines, supervisor patterns,
# when multi-agent > single agent, communication protocols
#
# pip install langchain langgraph langchain-openai

from typing import TypedDict, Annotated, Sequence
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain.tools import tool
import operator

# ── 1. Define shared state ────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]   # messages accumulate
    task: str
    research_output: str
    code_output: str
    final_answer: str
    next_agent: str

# ── 2. Define specialized agents ──────────────────────────────────────────────
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

def research_agent(state: AgentState) -> AgentState:
    """Specialized agent for researching information."""
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a research specialist. Find relevant information for the task."),
        ("human", "Task: {task}\\nResearch the key concepts and return a detailed summary."),
    ])
    chain = prompt | llm
    result = chain.invoke({"task": state["task"]})
    return {
        **state,
        "research_output": result.content,
        "next_agent": "code_agent",
    }

def code_agent(state: AgentState) -> AgentState:
    """Specialized agent for writing code based on research."""
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a code generation specialist. Write clean, well-commented Python code."),
        ("human", "Task: {task}\\nResearch context: {research}\\nWrite the implementation."),
    ])
    chain = prompt | llm
    result = chain.invoke({
        "task": state["task"],
        "research": state["research_output"],
    })
    return {
        **state,
        "code_output": result.content,
        "next_agent": "review_agent",
    }

def review_agent(state: AgentState) -> AgentState:
    """Specialized agent for reviewing and improving the code."""
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a code reviewer. Improve code quality, add error handling, suggest optimizations."),
        ("human", "Review and improve this code:\\n{code}"),
    ])
    chain = prompt | llm
    result = chain.invoke({"code": state["code_output"]})
    return {
        **state,
        "final_answer": result.content,
        "next_agent": END,
    }

def route(state: AgentState) -> str:
    """Router: determines which agent runs next."""
    return state.get("next_agent", END)

# ── 3. Build graph ────────────────────────────────────────────────────────────
workflow = StateGraph(AgentState)

workflow.add_node("research_agent", research_agent)
workflow.add_node("code_agent",     code_agent)
workflow.add_node("review_agent",   review_agent)

workflow.set_entry_point("research_agent")

workflow.add_conditional_edges("research_agent", route)
workflow.add_conditional_edges("code_agent",     route)
workflow.add_conditional_edges("review_agent",   route)

app = workflow.compile()

# ── 4. Run the multi-agent pipeline ───────────────────────────────────────────
initial_state = AgentState(
    messages=[],
    task="Build a function that computes cosine similarity between two text strings using embeddings",
    research_output="",
    code_output="",
    final_answer="",
    next_agent="research_agent",
)

result = app.invoke(initial_state)
print("=== RESEARCH OUTPUT ===")
print(result["research_output"][:300])
print("\\n=== FINAL CODE ===")
print(result["final_answer"][:500])

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: When does a multi-agent architecture outperform a single agent?
# Q: How do agents in LangGraph communicate with each other?
# Q: What is a supervisor agent pattern?
# Q: How do you prevent agents from going into infinite loops?
# Q: Compare LangGraph vs AutoGen vs CrewAI.
`,
  },

  {
    id: 'sklearn-pipeline',
    label: 'ML Pipeline (sklearn)',
    emoji: '📈',
    category: 'Classical ML',
    description: 'End-to-end sklearn pipeline with preprocessing and evaluation',
    tags: ['Sklearn', 'Classical ML', 'Pipeline', 'Feature Engineering'],
    code: `# ── Scikit-learn ML Pipeline ─────────────────────────────────────────────────
# Key interview topics: pipeline vs manual preprocessing, data leakage,
# cross-validation, feature importance, hyperparameter tuning
#
# pip install scikit-learn pandas numpy matplotlib
# This code runs in Pyodide — click RUN to execute it live!

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report, roc_auc_score
import warnings
warnings.filterwarnings('ignore')

# ── 1. Generate synthetic dataset ─────────────────────────────────────────────
X, y = make_classification(
    n_samples=1000, n_features=20, n_informative=10,
    n_redundant=5, random_state=42,
)
# Introduce some missing values (realistic)
rng = np.random.RandomState(42)
mask = rng.random(X.shape) < 0.05
X[mask] = np.nan

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"Train: {X_train.shape}, Test: {X_test.shape}")
print(f"Class balance: {np.bincount(y_train) / len(y_train)}")

# ── 2. Build pipeline ─────────────────────────────────────────────────────────
# Pipeline prevents data leakage — fit only on training data
pipeline = Pipeline([
    ("imputer",    SimpleImputer(strategy="median")),     # handle NaN
    ("scaler",     StandardScaler()),                     # zero mean, unit variance
    ("selector",   SelectKBest(f_classif, k=10)),         # keep top 10 features
    ("classifier", GradientBoostingClassifier(random_state=42)),
])

# ── 3. Cross-validation ───────────────────────────────────────────────────────
cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="roc_auc")
print(f"\\nCV ROC-AUC: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# ── 4. Hyperparameter tuning with GridSearchCV ────────────────────────────────
param_grid = {
    "classifier__n_estimators": [50, 100],
    "classifier__max_depth": [3, 5],
    "classifier__learning_rate": [0.05, 0.1],
}
grid_search = GridSearchCV(pipeline, param_grid, cv=3, scoring="roc_auc", n_jobs=-1, verbose=0)
grid_search.fit(X_train, y_train)
print(f"Best params: {grid_search.best_params_}")
print(f"Best CV score: {grid_search.best_score_:.3f}")

# ── 5. Final evaluation ───────────────────────────────────────────────────────
best_model = grid_search.best_estimator_
y_pred     = best_model.predict(X_test)
y_proba    = best_model.predict_proba(X_test)[:, 1]

print(f"\\nTest ROC-AUC: {roc_auc_score(y_test, y_proba):.3f}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))

# ── 6. Feature importance ─────────────────────────────────────────────────────
clf = best_model.named_steps["classifier"]
importances = clf.feature_importances_
print(f"\\nTop 3 feature importances: {sorted(importances, reverse=True)[:3]}")

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: What is data leakage and how does Pipeline prevent it?
# Q: When should you use cross_val_score vs a single train/test split?
# Q: Compare Random Forest vs Gradient Boosting — when do you use each?
# Q: What is stratify=y in train_test_split and why use it?
# Q: How do you handle class imbalance in classification?
`,
  },

  {
    id: 'streaming-llm',
    label: 'Streaming LLM',
    emoji: '⚡',
    category: 'MLOps',
    description: 'Streaming LLM responses with token callbacks and usage tracking',
    tags: ['Streaming', 'OpenAI', 'Callbacks', 'Production'],
    code: `# ── Streaming LLM Responses ───────────────────────────────────────────────────
# Key interview topics: why streaming matters for UX, token-by-token generation,
# server-sent events (SSE), handling partial responses, usage tracking
#
# pip install openai anthropic asyncio

import asyncio
from openai import OpenAI, AsyncOpenAI
from anthropic import Anthropic
import time

# ── 1. OpenAI synchronous streaming ──────────────────────────────────────────
def stream_openai(prompt: str, model: str = "gpt-4o-mini") -> str:
    client = OpenAI()
    full_response = ""
    token_count = 0
    start = time.time()

    with client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    ) as stream:
        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                print(delta.content, end="", flush=True)  # stream to console
                full_response += delta.content
                token_count += 1

    elapsed = time.time() - start
    print(f"\\n\\n[{token_count} tokens in {elapsed:.1f}s = {token_count/elapsed:.0f} tok/s]")
    return full_response

# ── 2. Async streaming (for web servers / FastAPI) ────────────────────────────
async def stream_openai_async(prompt: str):
    client = AsyncOpenAI()

    async with client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    ) as stream:
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content  # yield to caller

# FastAPI endpoint pattern:
# @app.get("/stream")
# async def stream_endpoint(query: str):
#     from fastapi.responses import StreamingResponse
#     return StreamingResponse(
#         stream_openai_async(query),
#         media_type="text/event-stream",
#     )

# ── 3. Anthropic streaming ────────────────────────────────────────────────────
def stream_anthropic(prompt: str) -> str:
    client = Anthropic()
    full_text = ""
    input_tokens = output_tokens = 0

    with client.messages.stream(
        model="claude-3-haiku-20240307",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_text += text

        # Final message has usage stats
        final = stream.get_final_message()
        input_tokens  = final.usage.input_tokens
        output_tokens = final.usage.output_tokens

    cost = (input_tokens * 0.00025 + output_tokens * 0.00125) / 1000
    print(f"\\n\\n[Usage: {input_tokens}->{output_tokens} tokens | cost: \${cost:.6f}]")
    return full_text

# ── 4. Simulated streaming for testing (no API key needed) ───────────────────
def mock_stream(text: str, delay_ms: int = 30):
    """Simulate streaming for UI testing without API calls."""
    tokens = text.split()
    for token in tokens:
        print(token + " ", end="", flush=True)
        time.sleep(delay_ms / 1000)
    print()

print("=== Mock streaming demo ===")
mock_stream("Streaming LLMs improves perceived latency by showing tokens as they generate.")

# ── 5. Usage tracking and cost estimation ────────────────────────────────────
PRICING = {
    "gpt-4o":       {"input": 2.50,  "output": 10.00},  # per 1M tokens
    "gpt-4o-mini":  {"input": 0.15,  "output": 0.60},
    "claude-3-opus": {"input": 15.00, "output": 75.00},
}

def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    p = PRICING.get(model, PRICING["gpt-4o-mini"])
    return (input_tokens * p["input"] + output_tokens * p["output"]) / 1_000_000

print(f"\\n1000 queries (100 in + 200 out tokens each):")
for model in PRICING:
    cost = estimate_cost(model, 100, 200) * 1000
    print(f"  {model}: \${cost:.2f}/1k queries")

# ── Interview Questions ───────────────────────────────────────────────────────
# Q: How do you implement streaming in a FastAPI/NextJS application?
# Q: What is Server-Sent Events (SSE) and how is it used for LLM streaming?
# Q: How do you handle errors mid-stream?
# Q: What's the difference between streaming and non-streaming in terms of UX?
`,
  },
]
