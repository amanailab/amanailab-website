'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, Download, MessageCircle, CreditCard,
  CheckCircle, Users, Clock, BookOpen, Mic, FileText,
  Briefcase, Video, Flame, Star, ArrowRight, Loader2, X,
} from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '24', label: 'Live Sessions' },
  { value: '9',  label: 'Modules' },
  { value: '160+', label: 'Topics Covered' },
  { value: '1:1', label: 'Mock Session' },
]

const SESSION_STEPS = [
  { n: '1', title: 'Theory', desc: 'Core concept explained simply, with examples and diagrams' },
  { n: '2', title: 'Quick Revision', desc: 'Key points, comparisons and formulas recapped fast' },
  { n: '3', title: 'Production Lens', desc: 'How the concept is actually used in real systems' },
  { n: '4', title: 'Interview Discussion', desc: 'Real questions on the topic solved and discussed live' },
]

const BENEFITS = [
  { icon: Mic,       label: 'Free 1-on-1 Mock Interview',    desc: 'A personal mock interview scheduled just for you, with direct feedback on your answers and delivery.' },
  { icon: FileText,  label: 'Personal Resume Review',         desc: 'Your resume reviewed live and 1-on-1 for GenAI/Agentic AI roles — projects, keywords, and ATS readiness.' },
  { icon: Users,     label: '1-on-1 Personal Discussion',     desc: 'A dedicated personal session with Aman to discuss your background, target roles, and preparation gaps.' },
  { icon: Briefcase, label: 'Job Referral Support',           desc: "Referrals shared with the cohort whenever relevant openings come up in Aman's network." },
  { icon: Video,     label: '30-Day Recording Access',        desc: 'Revisit every session for a full month — never lose a concept because you missed a live class.' },
  { icon: BookOpen,  label: 'Complete PDF Notes Bundle',      desc: 'Branded, structured notes for every module so you revise without rewatching entire sessions.' },
]

const MODULES = [
  {
    n: 1, title: 'NLP & Deep Learning Foundations', tag: 'FOUNDATIONS',
    sessions: [
      { id: 'S1', title: 'Tokenization & Text Representation', desc: 'Word / subword / character tokenization, BPE, WordPiece, SentencePiece, vocabulary trade-offs, tokenizer cost impact at scale' },
      { id: 'S2', title: 'Embeddings', desc: 'Word2Vec, GloVe, FastText, static vs contextual embeddings, similarity measures, dimensionality vs storage cost' },
      { id: 'S3', title: 'RNN', desc: 'Sequential modeling, hidden states, backpropagation through time, vanishing/exploding gradients' },
      { id: 'S4', title: 'LSTM & GRU', desc: 'Gating mechanisms, cell state, LSTM vs GRU vs RNN, Seq2Seq encoder-decoder architecture' },
    ],
  },
  {
    n: 2, title: 'Transformers & Foundation Models', tag: 'CORE ARCHITECTURE',
    sessions: [
      { id: 'S5', title: 'Attention Mechanism', desc: 'Bahdanau & Luong attention, self-attention, Query-Key-Value, scaled dot-product attention' },
      { id: 'S6', title: 'Transformer Architecture', desc: 'Multi-head attention, positional encoding, encoder-decoder designs, BERT vs GPT vs T5' },
      { id: 'S7', title: 'LLM Training Pipeline', desc: 'Pretraining, instruction tuning, RLHF, DPO, major model families (GPT, Claude, Gemini, Llama)' },
    ],
  },
  {
    n: 3, title: 'Prompt Engineering & Guardrails', tag: 'APPLICATION LAYER',
    sessions: [
      { id: 'S8', title: 'Prompt Engineering', desc: 'Zero-shot, few-shot, Chain-of-Thought, ReAct prompting, prompt versioning in production' },
      { id: 'S9', title: 'Structured Outputs & Safety', desc: 'Function calling, JSON mode, guardrails, jailbreak defenses, bias mitigation, content moderation layers' },
    ],
  },
  {
    n: 4, title: 'RAG Systems', tag: 'MOST ASKED IN 2026',
    sessions: [
      { id: 'S10', title: 'RAG Fundamentals', desc: 'Retriever-generator architecture, chunking strategies, chunk size/overlap trade-offs, preprocessing pipelines' },
      { id: 'S11', title: 'Vector Search & Databases', desc: 'FAISS, Pinecone, Weaviate, Chroma, approximate nearest neighbor search, indexing strategies (HNSW, IVF)' },
      { id: 'S12', title: 'Advanced RAG', desc: 'Hybrid search (dense + sparse/BM25), reranking, query rewriting/expansion, GraphRAG, multi-hop retrieval' },
      { id: 'S13', title: 'RAG Evaluation & Production', desc: 'Faithfulness/groundedness metrics, common failure modes, monitoring retrieval quality in production' },
    ],
  },
  {
    n: 5, title: 'Fine-tuning & Evaluation', tag: 'MODEL ADAPTATION',
    sessions: [
      { id: 'S14', title: 'Fine-tuning Techniques', desc: 'Full fine-tuning vs PEFT, LoRA, QLoRA, adapters, prefix tuning, cost comparison' },
      { id: 'S15', title: 'LLM Evaluation & Compliance', desc: 'Perplexity, BLEU/ROUGE, human eval, LLM-as-judge, hallucination detection, data privacy in regulated industries' },
    ],
  },
  {
    n: 6, title: 'LLMOps & Production Engineering', tag: 'SYSTEM DESIGN ROUNDS',
    sessions: [
      { id: 'S16', title: 'Deployment & Observability', desc: 'Model serving, latency optimization, caching, semantic caching, logging/tracing, cost monitoring at scale' },
      { id: 'S17', title: 'Security & Red-Teaming', desc: 'Prompt injection attacks, data exfiltration risks, adversarial testing, PII handling in LLM pipelines' },
    ],
  },
  {
    n: 7, title: 'Advanced Topics & Emerging Trends', tag: 'STAND OUT ROUND',
    sessions: [
      { id: 'S18', title: 'Model Optimization & Efficient Inference', desc: 'Quantization (INT8, GPTQ, AWQ), knowledge distillation, pruning, KV cache, speculative decoding, batching strategies, MoE architecture' },
      { id: 'S19', title: 'Long Context & Multimodal AI', desc: 'Context window management, RoPE scaling, sliding window attention, vision-language models, multimodal LLMs' },
      { id: 'S20', title: 'Frameworks, Evaluation Tooling & Data', desc: 'LangChain vs LlamaIndex vs Haystack, RAGAS, TruLens, DeepEval, synthetic data generation, open-weight models' },
      { id: 'S21', title: 'Responsible AI & Governance', desc: 'Bias & fairness in LLMs, explainability, AI governance frameworks, model cards, audit trails for regulated deployments' },
    ],
  },
  {
    n: 8, title: 'Agentic AI', tag: 'FASTEST GROWING AREA',
    sessions: [
      { id: 'S22', title: 'Agent Fundamentals', desc: 'Agent architecture — planning, memory, tools, orchestration; ReAct pattern; agent vs simple LLM call' },
      { id: 'S23', title: 'Agentic RAG & Memory', desc: 'Multi-step reasoning agents, short/long-term memory types, LangGraph state graphs' },
      { id: 'S24', title: 'Multi-Agent Systems', desc: 'CrewAI, AutoGen, Model Context Protocol (MCP), Agent-to-Agent (A2A) protocol, orchestrator patterns' },
      { id: 'S25', title: 'Agents in Production', desc: 'Cost/latency optimization, safety guardrails, Computer-Using Agents, agentic coding, human-in-the-loop design, failure recovery' },
    ],
  },
  {
    n: 9, title: 'System Design & Career Readiness', tag: 'FINAL ROUND PREP',
    sessions: [
      { id: 'S26', title: 'End-to-End System Design + Career Prep', desc: 'Designing a production RAG pipeline and a multi-agent pipeline; system design framework; resume & portfolio positioning; job referral discussion' },
    ],
  },
]

const QUESTIONS = [
  { topic: 'Tokenization, Embeddings & Sequence Models', count: 12, qs: [
    'Why does GPT use Byte Pair Encoding instead of word-level tokenization?',
    'What is the difference between Word2Vec and GloVe?',
    'Why do static embeddings fail compared to contextual embeddings?',
    'Explain cosine similarity vs Euclidean distance for embeddings.',
    'Why do RNNs struggle with long sequences?',
  ]},
  { topic: 'Attention & Transformer Architecture', count: 12, qs: [
    'Explain self-attention in simple terms.',
    'What are Query, Key and Value vectors in attention?',
    'Why use multi-head attention instead of single-head?',
    'Compare BERT and GPT architectures.',
    'What is RLHF and why is it needed?',
  ]},
  { topic: 'Prompt Engineering & Guardrails', count: 10, qs: [
    'What is Chain-of-Thought prompting and when does it help?',
    'What is the ReAct prompting pattern?',
    'How do you design prompts for structured JSON outputs?',
    'What is prompt injection and how do you defend against it?',
    'How do you version and test prompts in production?',
  ]},
  { topic: 'RAG & Vector Search', count: 14, qs: [
    'Why use RAG instead of fine-tuning?',
    'How do you decide chunk size and overlap for a document set?',
    'What are the common failure modes of a naive RAG pipeline?',
    'What is HNSW indexing and why is it used?',
    'Explain GraphRAG and how it differs from standard RAG.',
  ]},
  { topic: 'Fine-tuning & Evaluation', count: 12, qs: [
    'Explain LoRA in simple terms.',
    'When would you fine-tune instead of using RAG?',
    'What is LLM-as-judge evaluation and when is it useful?',
    'How do you measure hallucination in an LLM\'s output?',
    'How do you ensure HIPAA/financial compliance in a GenAI system?',
  ]},
  { topic: 'Agentic AI & Multi-Agent Systems', count: 16, qs: [
    'What is agentic AI and how is it different from a chatbot?',
    'Explain the ReAct pattern for agents.',
    'What is the difference between short-term and long-term agent memory?',
    'What is the Model Context Protocol (MCP) and why does it matter?',
    'How do you prevent an agent from taking harmful or unintended actions?',
  ]},
  { topic: 'System Design & Scenario-Based', count: 12, qs: [
    'Design a production RAG pipeline for a customer support system.',
    'Design an agentic pipeline for a research assistant use case.',
    'How would you scale a GenAI system from 100 to 100,000 users?',
    'When does fine-tuning beat prompting in a real project?',
    'How would you design human-in-the-loop checkpoints for a critical agent workflow?',
  ]},
]

const TAG_COLORS: Record<string, string> = {
  'FOUNDATIONS':          'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'CORE ARCHITECTURE':    'bg-violet-500/15 text-violet-400 border-violet-500/25',
  'APPLICATION LAYER':    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'MOST ASKED IN 2026':   'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'MODEL ADAPTATION':     'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  'SYSTEM DESIGN ROUNDS': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  'STAND OUT ROUND':      'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'FASTEST GROWING AREA': 'bg-pink-500/15 text-pink-400 border-pink-500/25',
  'FINAL ROUND PREP':     'bg-teal-500/15 text-teal-400 border-teal-500/25',
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MasterclassPage() {
  const [rzpReady, setRzpReady]   = useState(false)
  const [enrolled, setEnrolled]   = useState(false)
  const [openModule, setOpenModule]   = useState<number | null>(null)
  const [openTopic, setOpenTopic]     = useState<string | null>(null)
  const [formData, setFormData]       = useState({ name: '', email: '', whatsapp: '', tier: 'early' })
  const [formState, setFormState]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [payState, setPayState]       = useState<'idle' | 'loading'>('idle')
  const [successMsg, setSuccessMsg]   = useState('')

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay"]')) { setRzpReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true; s.onload = () => setRzpReady(true)
    document.body.appendChild(s)
  }, [])

  useEffect(() => {
    fetch('/api/masterclass/my-enrollment')
      .then(r => r.json())
      .then(d => { if (d.enrolled) setEnrolled(true) })
      .catch(() => {})
  }, [])

  async function submitInterest(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.email) return
    setFormState('loading')
    try {
      const res = await fetch('/api/masterclass/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) { setFormState('done'); setSuccessMsg("You're on the list! Aman will reach out on WhatsApp/email.") }
      else        { setFormState('error') }
    } catch { setFormState('error') }
  }

  async function pay(tier: 'early' | 'regular') {
    if (!rzpReady) { alert('Payment is loading, please try again in a moment.'); return }
    setPayState('loading')
    try {
      const res  = await fetch('/api/masterclass/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) { setPayState('idle'); alert(data.error ?? 'Something went wrong.'); return }

      const rzp = new window.Razorpay({
        key:         data.key,
        amount:      data.amount,
        currency:    data.currency,
        name:        'AmanAI Lab',
        description: 'GenAI & Agentic AI Interview Masterclass',
        order_id:    data.id,
        prefill:     { name: formData.name, email: formData.email, contact: formData.whatsapp },
        theme:       { color: '#f97316' },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const vRes = await fetch('/api/masterclass/verify-payment', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, tier, name: formData.name, email: formData.email, whatsapp: formData.whatsapp }),
          })
          if (vRes.ok) {
            setFormState('done')
            setSuccessMsg('Payment confirmed! Your seat is reserved. Aman will reach out within 24 hours.')
          } else {
            alert('Payment verification failed. Please contact Aman on WhatsApp.')
          }
          setPayState('idle')
        },
      })
      rzp.on('payment.failed', () => setPayState('idle'))
      rzp.open()
    } catch { setPayState('idle'); alert('Payment failed to load. Try again.') }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Hero ── */}
      <section className="relative px-4 pt-16 pb-16 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Star className="w-3 h-3" /> Live Cohort Program
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
            GenAI & Agentic AI<br />
            <span className="text-orange-500">Interview Masterclass</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            24 live sessions to take you from core NLP foundations to production-grade GenAI and Agentic AI systems — theory, real production practice, and live interview Q&A, session by session.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {STATS.map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-black text-orange-400">{s.value}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap justify-center gap-3">
            {enrolled ? (
              <a href="https://chat.whatsapp.com/DjiaMTHaWDrG3mmZdDlbxN"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bb5a] text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg">
                <CheckCircle className="w-4 h-4" /> You&apos;re Enrolled — Join WhatsApp Group
              </a>
            ) : (
              <button onClick={() => pay('early')}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:-translate-y-0.5">
                <CreditCard className="w-4 h-4" /> Reserve My Seat — ₹7,999
              </button>
            )}
            <a href="/pdfs/masterclass-syllabus.pdf"
              download target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 font-bold px-6 py-3 rounded-xl transition-all">
              <Download className="w-4 h-4" /> Download Syllabus PDF
            </a>
          </div>

          {/* Included pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Free 1-on-1 Mock Interview', 'Personal Resume Review', '1-on-1 Personal Discussion', 'Job Referral Support'].map(t => (
              <span key={t} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-3 py-1.5 rounded-full">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Session Structure ── */}
      <section className="px-4 py-12 border-t border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center mb-6">Every session follows this structure</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SESSION_STEPS.map((s, i) => (
              <div key={s.n} className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                {i < SESSION_STEPS.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 z-10" />
                )}
                <div className="w-7 h-7 bg-orange-500/15 border border-orange-500/25 rounded-lg flex items-center justify-center text-xs font-black text-orange-400 mb-3">{s.n}</div>
                <p className="font-bold text-zinc-100 text-sm mb-1">{s.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-400" /> 90 min per session</span>
            <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-400" /> 4 days per week</span>
            <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-orange-400" /> 30-day recording access</span>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="px-4 py-12 border-t border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center mb-2">Program Benefits</p>
          <h2 className="text-2xl font-black text-center mb-8">Everything included, no extra cost</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(b => (
              <div key={b.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center mb-3">
                  <b.icon className="w-4 h-4 text-orange-400" />
                </div>
                <p className="font-bold text-zinc-100 text-sm mb-1.5">{b.label}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Curriculum ── */}
      <section className="px-4 py-12 border-t border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center mb-2">Full Curriculum</p>
          <h2 className="text-2xl font-black text-center mb-8">9 Modules · 26 Sessions</h2>
          <div className="space-y-2">
            {MODULES.map(mod => (
              <div key={mod.n} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenModule(openModule === mod.n ? null : mod.n)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zinc-800/40 transition-colors">
                  <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-sm font-black text-orange-400 shrink-0">
                    {mod.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-zinc-100 text-sm">{mod.title}</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${TAG_COLORS[mod.tag] ?? 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                        {mod.tag}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5">{mod.sessions.length} session{mod.sessions.length !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${openModule === mod.n ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {openModule === mod.n && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-5 pb-4 space-y-2 border-t border-zinc-800">
                        {mod.sessions.map(s => (
                          <div key={s.id} className="flex gap-3 pt-3">
                            <div className="w-8 h-6 bg-violet-500/15 border border-violet-500/25 rounded-md flex items-center justify-center text-[10px] font-black text-violet-400 shrink-0 mt-0.5">
                              {s.id}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-200">{s.title}</p>
                              <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{s.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interview Question Bank ── */}
      <section className="px-4 py-12 border-t border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center mb-2">Interview Question Bank</p>
          <h2 className="text-2xl font-black text-center mb-2">160+ questions discussed live</h2>
          <p className="text-zinc-500 text-sm text-center mb-8">A sample of the questions solved across all 24 sessions, grouped by topic</p>
          <div className="space-y-3">
            {QUESTIONS.map(q => (
              <div key={q.topic} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenTopic(openTopic === q.topic ? null : q.topic)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-zinc-200 text-sm">{q.topic}</p>
                    <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">{q.count} Qs</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${openTopic === q.topic ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openTopic === q.topic && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                      <div className="px-5 pb-4 border-t border-zinc-800 space-y-2 pt-3">
                        {q.qs.map((question, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="w-4 h-4 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-400 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">Q</span>
                            <p className="text-sm text-zinc-400">{question}</p>
                          </div>
                        ))}
                        <p className="text-xs text-zinc-600 pt-1">+ {q.count - q.qs.length} more questions covered live in the session</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-4 py-12 border-t border-zinc-800/60">
        <div className="max-w-lg mx-auto">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center mb-2">Reserve Your Seat</p>
          <h2 className="text-2xl font-black text-center mb-2">24 live sessions · 4 days a week</h2>
          <p className="text-zinc-500 text-sm text-center mb-8">Everything included — mock interview, resume review, PDF notes & more</p>

          {/* Single pricing card */}
          <div className="relative bg-zinc-900 border-2 border-orange-500/40 rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

            <div className="p-7">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-5">
                <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Early Bird — Limited Seats
                </span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 mb-1">
                <span className="text-5xl font-black text-white">₹7,999</span>
                <span className="text-zinc-600 text-sm line-through mb-2">₹9,999</span>
                <span className="text-emerald-400 text-xs font-bold mb-2">Save ₹2,000</span>
              </div>
              <p className="text-xs text-zinc-500 mb-7">One-time payment · Instant seat confirmation</p>

              {/* Included list — 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-7">
                {[
                  '24 Live Sessions (90 min each)',
                  'Session recordings — 30 days',
                  'Complete PDF Notes Bundle',
                  'WhatsApp doubt-solving group',
                  'Free 1-on-1 Resume Review',
                  'Free 1-on-1 Mock Interview',
                  '1-on-1 Personal Discussion',
                  'Job Referral Support',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {item}
                  </div>
                ))}
              </div>

              {/* CTA — enrolled vs not enrolled */}
              {enrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold py-3.5 rounded-xl">
                    <CheckCircle className="w-5 h-5" /> You&apos;re Enrolled — Seat Confirmed
                  </div>
                  <a href="https://chat.whatsapp.com/DjiaMTHaWDrG3mmZdDlbxN"
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bb5a] text-white text-sm font-black py-3.5 rounded-xl transition-all">
                    <MessageCircle className="w-5 h-5" /> Join WhatsApp Group
                  </a>
                </div>
              ) : (
                <>
                  <button onClick={() => pay('early')} disabled={payState === 'loading'}
                    className="w-full flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white text-base font-black py-4 rounded-xl transition-all shadow-xl shadow-orange-500/25 hover:-translate-y-0.5">
                    {payState === 'loading'
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <CreditCard className="w-5 h-5" />}
                    Pay ₹7,999 — Reserve My Seat
                  </button>
                  <p className="text-center text-xs text-zinc-600 mt-3">
                    Secure payment via Razorpay · UPI, cards, netbanking accepted
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Download syllabus */}
          <div className="flex justify-center mt-5">
            <a href="/pdfs/masterclass-syllabus.pdf"
              download target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
              <Download className="w-4 h-4" /> Download detailed syllabus PDF
            </a>
          </div>
        </div>
      </section>

      {/* ── Interest / Waitlist Form ── */}
      <section className="px-4 py-12 border-t border-zinc-800/60">
        <div className="max-w-lg mx-auto">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center mb-2">Register Interest</p>
          <h2 className="text-2xl font-black text-center mb-2">Not ready to pay yet?</h2>
          <p className="text-zinc-500 text-sm text-center mb-8">Drop your details — Aman will reach out on WhatsApp with batch dates and any questions you have.</p>

          {formState === 'done' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="font-bold text-emerald-300 mb-1">You&apos;re on the list!</p>
              <p className="text-sm text-zinc-400">{successMsg}</p>
            </motion.div>
          ) : (
            <form onSubmit={submitInterest} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1.5 block">Your Name *</label>
                <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Aman Chauhan" required
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1.5 block">Email Address *</label>
                <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com" required
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1.5 block">WhatsApp Number</label>
                <input type="tel" value={formData.whatsapp} onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600" />
              </div>
              {formState === 'error' && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">Something went wrong. Please try WhatsApp instead.</p>
              )}
              <button type="submit" disabled={formState === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 text-white font-bold py-3 rounded-xl transition-all">
                {formState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Register Interest
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer note ── */}
      <div className="text-center text-xs text-zinc-700 pb-16 px-4">
        AmanAI Lab · GenAI & Agentic AI Interview Masterclass · amanailab.com
      </div>

      {/* ── Sticky WhatsApp button ── */}
      <a href="https://wa.me/917827383287?text=Hi%20Aman%2C%20I%27m%20interested%20in%20the%20GenAI%20%26%20Agentic%20AI%20Interview%20Masterclass"
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20bb5a] text-white font-bold px-4 py-3 rounded-full shadow-xl shadow-black/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl">
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm">Chat on WhatsApp</span>
      </a>
    </div>
  )
}
