'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, Download, MessageCircle, CheckCircle, Loader2, Flame,
  Users, Layers, Rocket, ShieldCheck, Briefcase, FileText, PenLine, Wrench,
} from 'lucide-react'
import { DIWALI } from '@/lib/diwali-config'

// ── Data ──────────────────────────────────────────────────────────────────────

const WEEKS = [
  { n: 1, title: 'LLM Foundations & Prompt Engineering',
    topics: ['Tokenization, attention, KV cache, sampling', 'Prompt patterns, structured outputs, function calling', 'Pretraining vs SFT vs RLHF vs DPO, hallucination', 'Async Python, Pydantic, FastAPI'],
    lab: 'Text-to-JSON extractor with validation and retries',
    interview: 'How LLMs work, hallucination, prompting vs fine-tuning',
    design: 'Prompt-to-JSON service with validation and versioned prompts' },
  { n: 2, title: 'Embeddings, Vector Search & RAG',
    topics: ['Embeddings, vector DBs (FAISS, Chroma, pgvector)', 'Chunking strategies, ingestion, citations', 'HNSW / IVF trade-offs, parsing PDFs and tables', 'RAG vs fine-tuning vs long context'],
    lab: 'Working RAG app over real documents with citations',
    interview: 'Embeddings, chunking, vector search trade-offs',
    design: 'Document Q&A system: ingestion, index, retrieval, generation' },
  { n: 3, title: 'Advanced RAG & Evaluation',
    topics: ['Hybrid search (BM25 + dense), rerankers', 'Query rewriting, multi-query, HyDE', 'recall@k, MRR, faithfulness, LLM-as-judge', 'Golden sets, context compression, caching'],
    lab: 'Evaluation set and measured before/after improvements',
    interview: 'Improving retrieval, evaluating RAG, latency and cost',
    design: 'Scaling RAG to millions of documents with access control' },
  { n: 4, title: 'Agentic AI with LangGraph',
    topics: ['Agent vs workflow, ReAct, plan-and-execute', 'LangGraph state, nodes, edges, checkpoints', 'Tool design, retries, timeouts', 'Memory and human-in-the-loop'],
    lab: 'Single agent with 3+ tools and persistent state',
    interview: 'Agent patterns, tool design, loops and memory',
    design: 'Agent service with state, approvals and cost limits' },
  { n: 5, title: 'Multi-Agent Systems, Guardrails & Security',
    topics: ['Supervisor, hierarchical and swarm patterns', 'Guardrails, PII handling, tracing', 'Prompt injection, OWASP LLM Top 10', 'Evaluating agent trajectories'],
    lab: 'Supervisor + specialists with guardrails and tracing',
    interview: 'Single vs multi-agent, prompt injection, guardrails',
    design: 'Secure multi-agent platform with least-privilege tools' },
  { n: 6, title: 'MCP & A2A',
    topics: ['MCP: host, client, server, tools, resources, prompts', 'Transports and MCP security', 'A2A: agent cards, tasks, handoffs, streaming', 'MCP vs A2A vs function calling'],
    lab: 'Your own MCP server plus an A2A handoff between two agents',
    interview: 'MCP vs A2A vs function calling, protocol security',
    design: 'Organisation-wide tool catalogue and agent interoperability' },
  { n: 7, title: 'Fine-tuning, Serving & LLMOps',
    topics: ['When to fine-tune, SFT data, LoRA / QLoRA', 'Quantization and vLLM serving', 'Semantic caching and model routing', 'Monitoring, CI/CD for prompts, cost dashboards'],
    lab: 'LoRA fine-tune of a small model, benchmarked against prompting',
    interview: 'LoRA, quantization, serving, cutting inference cost',
    design: 'LLM gateway: routing, caching, rate limits, observability' },
  { n: 8, title: 'GenAI System Design & Career Sprint',
    topics: ['System design framework for GenAI', 'Estimating tokens, QPS and cost', 'Reliability, fallbacks, rate limits', 'Resume, LinkedIn, portfolio, demo day'],
    lab: 'Design and present 3 full systems end to end',
    interview: 'Project deep-dives, behavioural stories, offers',
    design: 'Walk-throughs of 8 GenAI case studies' },
]

const BONUS_PDFS = [
  'LLM & GenAI Cheat Sheet', 'Prompt Engineering Cheat Sheet', 'Transformer Architecture Deep Dive',
  'Python for AI / ML Cheat Sheet', 'RAG Complete Guide', 'Agentic AI Guide',
  'Fine-Tuning Guide 2026', 'MLOps & LLMOps Guide', 'LLM System Design Guide',
  'GenAI & Agentic AI Interview Masterclass Syllabus',
]

const BONUS_TOOLS = [
  'AI Mock Interview', 'AI/ML Code Lab', 'Question Bank (500+)', 'Skill Gap Analyzer', 'AI Resume Analyzer',
  'Cover Letter Review', 'LinkedIn Optimizer', 'JD to Questions', 'Company Prep', 'Career Roadmap',
  'Flashcards', 'Topic Guides', 'Skill Quiz', 'Paper Explainer', 'Code Playground',
  'System Design Practice', 'Job Tracker', 'Daily Challenge', 'AI News',
]

const INCLUDED = [
  '8 weeks (+ Week 0 onboarding) of live 1:1 mentoring with Aman',
  'Personalized learning roadmap and diagnostic',
  'Full syllabus: GenAI, RAG, Agentic AI, MCP, A2A, fine-tuning, LLMOps, safety',
  '2 end-to-end projects with architecture and code reviews',
  'Weekly interview and system design discussion',
  'GenAI system design framework and 8 case studies',
  'Resume, LinkedIn and portfolio optimisation',
  'Chat support between sessions',
  'Lifetime access to project resources',
  'AmanAI Lab mentorship certificate',
]

const FAQ = [
  { q: "I'm a beginner. Is this for me?", a: 'If you know basic Python, yes. Week 0 and Week 1 build the foundations.' },
  { q: 'Is it recorded or live?', a: 'Live 1:1 sessions with Aman each week, plus supporting material.' },
  { q: 'What if I miss a session?', a: 'Sessions are rescheduled within the week based on your availability.' },
  { q: 'Do I need to pay for APIs or GPUs?', a: 'Small API usage is needed. You will be guided to keep costs low, with free and open-source options and free GPU tiers for the fine-tuning lab.' },
  { q: 'Is a job guaranteed?', a: 'No. What you get is mentoring, two real projects and interview preparation. Results depend on your effort and the market.' },
  { q: 'How does selection work?', a: 'You apply, Aman reviews it and holds a short fit call, then you pay a seat deposit to confirm.' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const inr = (n: number) => '₹' + n.toLocaleString('en-IN')

function useCountdown(deadline: string) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    const end = new Date(deadline).getTime()
    const tick = () => setLeft(Math.max(0, end - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline])
  if (left === null) return null
  return {
    d: Math.floor(left / 86_400_000),
    h: Math.floor((left % 86_400_000) / 3_600_000),
    m: Math.floor((left % 3_600_000) / 60_000),
    s: Math.floor((left % 60_000) / 1000),
  }
}

const scrollToApply = () => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })

// ── Form ──────────────────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-zinc-900 border border-zinc-700 focus:border-orange-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500'

function ApplyForm({ closed }: { closed: boolean }) {
  const [form, setForm] = useState({
    name: '', email: '', whatsapp: '', role: '', experience: '', pythonLevel: '', goal: '', why: '',
  })
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setState('sending')
    try {
      const res = await fetch('/api/diwali/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setState('idle')
        return
      }
      setState('done')
    } catch {
      setError('Network error. Please try again.')
      setState('idle')
    }
  }

  if (closed) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-lg font-bold text-zinc-100">Applications are closed for this cohort</p>
        <p className="text-sm text-zinc-400 mt-2">Message Aman on WhatsApp to ask about the next batch.</p>
      </div>
    )
  }

  if (state === 'done') {
    const msg = encodeURIComponent(`Hi Aman! I just applied for the Diwali AI Accelerator 2026. My name is ${form.name}.`)
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <p className="text-xl font-black text-zinc-100">Application received!</p>
        <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
          Aman will review it and contact you on WhatsApp to schedule a short fit call. You can also message now to speed things up.
        </p>
        <a
          href={`https://wa.me/${DIWALI.whatsapp}?text=${msg}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-5 bg-[#25D366] hover:bg-[#1ebe5a] text-black font-bold px-6 py-3 rounded-xl text-sm"
        >
          <MessageCircle className="w-4 h-4" /> Message Aman on WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <input required className={inputCls} placeholder="Full name *" value={form.name} onChange={set('name')} maxLength={100} />
        <input required type="email" className={inputCls} placeholder="Email *" value={form.email} onChange={set('email')} maxLength={200} />
        <input required type="tel" className={inputCls} placeholder="WhatsApp number (with country code) *" value={form.whatsapp} onChange={set('whatsapp')} maxLength={20} />
        <input className={inputCls} placeholder="Current role / college" value={form.role} onChange={set('role')} maxLength={120} />
        <select className={inputCls} value={form.experience} onChange={set('experience')}>
          <option value="">Years of experience</option>
          <option>Student / Fresher</option><option>0-2 years</option><option>2-5 years</option>
          <option>5-10 years</option><option>10+ years</option>
        </select>
        <select className={inputCls} value={form.pythonLevel} onChange={set('pythonLevel')}>
          <option value="">Python level</option>
          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
        </select>
      </div>
      <textarea className={inputCls} rows={3} placeholder="Your goal (e.g. switch to a GenAI engineer role)" value={form.goal} onChange={set('goal')} maxLength={600} />
      <textarea className={inputCls} rows={3} placeholder="Why do you want to join this cohort?" value={form.why} onChange={set('why')} maxLength={1000} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit" disabled={state === 'sending'}
        className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-black font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
      >
        {state === 'sending' ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Apply for the Diwali AI Accelerator'}
      </button>
      <p className="text-xs text-zinc-500 text-center">No payment now. If selected, you pay a {inr(DIWALI.deposit)} deposit after a short call with Aman.</p>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiwaliContent({ seatsLeft, closed }: { seatsLeft: number; closed: boolean }) {
  const cd = useCountdown(DIWALI.deadline)
  const [openWeek, setOpenWeek] = useState<number | null>(1)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const full = seatsLeft === 0

  return (
    <main className="bg-zinc-950 text-zinc-100 pb-24 sm:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-28 pb-14 sm:pt-36">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Flame className="w-3.5 h-3.5" /> Diwali Special Cohort 2026
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight">
            Diwali AI <span className="text-orange-500">Accelerator</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto">
            Personalized 1:1 mentoring to become a job-ready Generative AI &amp; Agentic AI engineer.
            Learn it. Build it. Get interview-ready.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            GenAI &bull; RAG &bull; Agentic AI &bull; LangGraph &bull; MCP &bull; A2A &bull; Fine-tuning &bull; LLMOps &bull; System Design
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[['3', 'Seats only'], ['8', 'Weeks'], ['1:1', 'Mentoring'], ['2', 'Real projects']].map(([v, l]) => (
              <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-xl py-4">
                <p className="text-2xl font-black text-orange-400">{v}</p>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 mt-1">{l}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={scrollToApply} className="bg-orange-500 hover:bg-orange-400 text-black font-black px-8 py-3.5 rounded-xl text-sm w-full sm:w-auto">
              {closed ? 'Applications closed' : full ? 'Join the waitlist' : `Apply now — ${seatsLeft} of ${DIWALI.totalSeats} seats left`}
            </button>
            <a href={DIWALI.pdf} download className="flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-semibold px-6 py-3.5 rounded-xl text-sm w-full sm:w-auto">
              <Download className="w-4 h-4" /> Download brochure (PDF)
            </a>
          </div>

          {!closed && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Applications close {DIWALI.deadlineLabel}</p>
              <div className="flex justify-center gap-3">
                {(cd ? [['d', 'Days'], ['h', 'Hours'], ['m', 'Min'], ['s', 'Sec']] as const : []).map(([k, l]) => (
                  <div key={k} className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg py-2">
                    <p className="text-xl font-black tabular-nums">{String(cd![k]).padStart(2, '0')}</p>
                    <p className="text-[10px] uppercase text-zinc-500">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Price */}
      <section className="px-4 py-10">
        <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 text-black p-8 sm:p-10 text-center">
          <p className="text-xs font-black uppercase tracking-widest opacity-80">Diwali cohort price</p>
          <p className="mt-2 text-5xl sm:text-6xl font-black">{inr(DIWALI.price)}</p>
          <p className="mt-1 font-semibold">per learner &middot; Regular 1:1 mentorship: <span className="line-through">{inr(DIWALI.regularPrice)}</span></p>
          <p className="mt-3 text-sm font-bold">Only {DIWALI.totalSeats} seats &middot; Cohort starts {DIWALI.startLabel.toLowerCase()}</p>
        </div>
      </section>

      {/* Why */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-center">Built for one outcome: you clear the interview</h2>
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Layers, t: '1. Learn', d: 'GenAI, RAG, Agentic AI, MCP, A2A, fine-tuning, LLMOps, safety and evaluation. Depth, not just demos.' },
            { icon: Rocket, t: '2. Build', d: 'Two end-to-end projects built week by week, each with an architecture review and a code review.' },
            { icon: Briefcase, t: '3. Interview', d: 'Interview and system design discussion every week, plus resume and LinkedIn polish.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <Icon className="w-6 h-6 text-orange-400 mb-3" />
              <p className="font-bold">{t}</p>
              <p className="text-sm text-zinc-400 mt-1.5">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum */}
      <section className="px-4 py-12 max-w-4xl mx-auto">
        <p className="text-xs font-black uppercase tracking-widest text-orange-500 text-center">Detailed curriculum</p>
        <h2 className="text-2xl sm:text-3xl font-black text-center mt-1">Week-by-week syllabus</h2>
        <p className="text-sm text-zinc-400 text-center mt-2">Week 0 onboarding (Python for AI, ML essentials, diagnostic) comes first. Each week ends with a deliverable, a code review and an interview + system design discussion.</p>
        <div className="mt-8 space-y-3">
          {WEEKS.map(w => {
            const open = openWeek === w.n
            return (
              <div key={w.n} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenWeek(open ? null : w.n)} className="w-full flex items-center gap-4 p-4 text-left">
                  <span className="shrink-0 w-14 text-center bg-orange-500 text-black text-xs font-black rounded-lg py-2">WEEK {w.n}</span>
                  <span className="flex-1 font-bold text-sm sm:text-base">{w.title}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="px-4 pb-5 grid gap-4 sm:grid-cols-2">
                    <ul className="space-y-1.5 text-sm text-zinc-300 sm:col-span-2">
                      {w.topics.map(t => <li key={t} className="flex gap-2"><span className="text-orange-500">&bull;</span>{t}</li>)}
                    </ul>
                    <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 sm:col-span-2">
                      <p className="text-[11px] font-black uppercase text-orange-400">Hands-on lab</p>
                      <p className="text-sm text-zinc-300 mt-0.5">{w.lab}</p>
                    </div>
                    <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3">
                      <p className="text-[11px] font-black uppercase text-teal-400">Interview discussion</p>
                      <p className="text-sm text-zinc-300 mt-0.5">{w.interview}</p>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                      <p className="text-[11px] font-black uppercase text-amber-400">System design discussion</p>
                      <p className="text-sm text-zinc-300 mt-0.5">{w.design}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Projects */}
      <section className="px-4 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-center">Two projects you can show in any interview</h2>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <FileText className="w-6 h-6 text-orange-400 mb-3" />
            <p className="font-bold">Enterprise Knowledge Assistant</p>
            <p className="text-sm text-zinc-400 mt-1.5">Cited question answering over company documents: ingestion, hybrid retrieval and reranking, evaluation harness and deployment.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <Users className="w-6 h-6 text-orange-400 mb-3" />
            <p className="font-bold">Multi-Agent AI Assistant</p>
            <p className="text-sm text-zinc-400 mt-1.5">A supervisor with specialist agents, tools over MCP, A2A handoffs, guardrails and a human approval step.</p>
          </div>
        </div>
      </section>

      {/* System design */}
      <section className="px-4 py-12 max-w-4xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
          <PenLine className="w-6 h-6 text-orange-400 mb-3" />
          <h2 className="text-xl sm:text-2xl font-black">GenAI system design, the round that decides senior offers</h2>
          <p className="text-sm text-zinc-400 mt-2">A 7-step framework and 8 case studies designed together: enterprise RAG for 1M documents, customer-support copilot, AI coding assistant, document processing, multi-agent research assistant, e-commerce semantic search, LLM gateway and a real-time voice agent.</p>
        </div>
      </section>

      {/* Free bonuses */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <p className="text-xs font-black uppercase tracking-widest text-orange-500 text-center">Free bonus access</p>
        <h2 className="text-2xl sm:text-3xl font-black text-center mt-1">Your complete interview toolkit, free on AmanAI Lab</h2>
        <p className="text-sm text-zinc-400 text-center mt-2 max-w-2xl mx-auto">Free with a free account. Aman tells you exactly which one to use each week.</p>
        <div className="mt-8 grid lg:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-orange-400" /> 10 free PDF guides</p>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-400">{BONUS_PDFS.map(p => <li key={p}>&bull; {p}</li>)}</ul>
            <Link href="/notes" className="inline-block mt-4 text-sm text-orange-400 hover:underline">Browse notes &rarr;</Link>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-orange-400" /> Free system design practice</p>
            <p className="mt-3 text-sm text-zinc-400">18 GenAI &amp; ML system design problems with company tags, difficulty levels and AI feedback on your design.</p>
            <Link href="/system-design" className="inline-block mt-4 text-sm text-orange-400 hover:underline">Practice now &rarr;</Link>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="font-bold flex items-center gap-2"><Wrench className="w-4 h-4 text-orange-400" /> 19+ free AI tools</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {BONUS_TOOLS.map(t => <span key={t} className="text-xs bg-zinc-800 text-zinc-300 rounded-full px-2.5 py-1">{t}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* Included */}
      <section className="px-4 py-12 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-center">What&apos;s included</h2>
        <ul className="mt-6 space-y-2.5">
          {INCLUDED.map(i => (
            <li key={i} className="flex gap-3 text-sm text-zinc-300"><CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />{i}</li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-zinc-500 text-center">No one can guarantee a job. This program guarantees a mentor&apos;s full attention, two real projects and serious interview preparation.</p>
      </section>

      {/* Apply */}
      <section id="apply" className="px-4 py-14 max-w-2xl mx-auto scroll-mt-20">
        <h2 className="text-2xl sm:text-3xl font-black text-center">Apply for your seat</h2>
        <p className="text-sm text-zinc-400 text-center mt-2 mb-6">
          {closed ? 'Applications are closed.' : full ? 'All seats are currently taken. Apply to join the waitlist.' : `${seatsLeft} of ${DIWALI.totalSeats} seats left. Closes ${DIWALI.deadlineLabel}.`}
        </p>
        <ApplyForm closed={closed} />
        <div className="mt-6 grid sm:grid-cols-4 gap-3 text-center">
          {['Apply', 'Fit call', `Pay ${inr(DIWALI.deposit)}`, 'Start'].map((s, i) => (
            <div key={s} className="bg-zinc-900 border border-zinc-800 rounded-xl py-3">
              <p className="text-orange-400 font-black">{i + 1}</p><p className="text-xs text-zinc-300">{s}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <a
            href={`https://wa.me/${DIWALI.whatsapp}?text=${encodeURIComponent('Hi Aman! I have a question about the Diwali AI Accelerator 2026.')}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#25D366] font-semibold text-sm hover:underline"
          >
            <MessageCircle className="w-4 h-4" /> Questions? Chat with Aman on WhatsApp
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-center">Frequently asked questions</h2>
        <div className="mt-6 space-y-2">
          {FAQ.map((f, i) => (
            <div key={f.q} className="bg-zinc-900 border border-zinc-800 rounded-xl">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex justify-between items-center gap-3 p-4 text-left text-sm font-semibold">
                {f.q}<ChevronDown className={`w-4 h-4 shrink-0 text-zinc-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && <p className="px-4 pb-4 text-sm text-zinc-400">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Sticky mobile CTA */}
      {!closed && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 p-3">
          <button onClick={scrollToApply} className="w-full bg-orange-500 text-black font-black py-3 rounded-xl text-sm">
            {full ? 'Join the waitlist' : `Apply now — ${seatsLeft} seats left`}
          </button>
        </div>
      )}
    </main>
  )
}
