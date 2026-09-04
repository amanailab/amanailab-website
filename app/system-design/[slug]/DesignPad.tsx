'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, Save, Sparkles, CheckCircle, Circle, AlertCircle, Loader2,
  Eye, PenLine, X, RefreshCw, Play, Pause, RotateCcw, Building2, BookOpen,
  ListChecks, Cpu, Lightbulb, Target, Award, Bold, Heading2, Heading3,
  List, Minus, Plus, Code2, ChevronRight, ChevronLeft, GripVertical,
  Trophy, Hash, Maximize2, Crown, LogIn, ShieldCheck, Zap, Star, FileText, Briefcase,
  Copy, ClipboardCheck, FlaskConical, MessageSquare, Download, Undo2, Redo2,
} from 'lucide-react'
import { serializeDiagram } from './diagram-utils'
import { exportDesignPdf } from '@/lib/sd-pdf'
import type { SDProblem } from '@/lib/system-design-problems'
import { DESIGN_TEMPLATE, SYSTEM_DESIGN_PROBLEMS } from '@/lib/system-design-problems'
import LoginPromptModal from '@/components/ui/LoginPromptModal'

// ── Dynamic imports ────────────────────────────────────────────────────────────
const SystemCanvas = dynamic(() => import('./SystemCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-0 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center">
      <Loader2 size={14} className="animate-spin text-zinc-600" />
    </div>
  ),
})

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-0 bg-zinc-900/30 flex items-center justify-center">
      <Loader2 size={14} className="animate-spin text-zinc-600" />
    </div>
  ),
})

// ── Types ──────────────────────────────────────────────────────────────────────
type MobilePane = 'problem' | 'canvas' | 'answer'
type RightTab   = 'write' | 'code' | 'preview'
type LeftTab    = 'problem' | 'framework' | 'components'
type CodeLang   = 'sql' | 'python' | 'typescript' | 'yaml' | 'plaintext'

interface CodeSnippet { id: string; name: string; language: CodeLang; code: string }

interface ReviewResult {
  overallScore: number
  grade: string
  summary: string
  strengths: string[]
  gaps: string[]
  sectionScores: Record<string, number | null>
  codeQuality: { score: number; notes: string } | null
  topSuggestion: string
  interviewerNote: string
  followUps?: { question: string; whatStrongAnswersCover: string }[]
}

type PlanType = 'free' | 'sd_pro' | 'full_bundle'

interface CodeCheckResult {
  correct: boolean
  grade: string
  complexity: { time: string; space: string }
  issues: string[]
  suggestions: string[]
  summary: string
}

interface ReferenceSolution {
  overview: string
  architecture: { title: string; detail: string }[]
  dataModel: string
  scaling: string[]
  tradeoffs: { title: string; detail: string }[]
  walkthrough: string
}

interface ProStatus {
  authenticated: boolean
  userId?: string
  isSubscribed?: boolean
  plan?: PlanType
  subscribedUntil?: string
  dailyUsed?: number
  dailyLimit?: number
  freeUsed?: number
  freeLimit?: number
}

// ── Storage ────────────────────────────────────────────────────────────────────
const STORAGE_PREFIX    = 'sd_design_v2_'
const CANVAS_PREFIX     = 'sd_canvas_v1_'
const CODE_PREFIX       = 'sd_code_v1_'
const COMPLETION_PREFIX = 'sd_best_v1_'
const HISTORY_PREFIX    = 'sd_history_v2_'
const REVIEWLOG_PREFIX  = 'sd_reviewlog_v1_'   // full past AI reviews (last 5)

const CODE_LANGS: { id: CodeLang; label: string }[] = [
  { id: 'sql',        label: 'SQL'        },
  { id: 'python',     label: 'Python'     },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'yaml',       label: 'YAML'       },
  { id: 'plaintext',  label: 'Pseudocode' },
]

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  A: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Interview-Ready' },
  B: { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',       label: 'Strong Answer'  },
  C: { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',   label: 'Needs Work'     },
  D: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         label: 'Major Gaps'     },
}

const SECTION_LABELS: Record<string, string> = {
  requirements: 'Requirements',
  architecture: 'Architecture',
  scalability:  'Scalability',
  dataModel:    'Data Model',
  tradeoffs:    'Trade-offs',
}

const SECTION_TIPS: Record<string, { low: string; mid: string }> = {
  requirements: {
    low: 'State 3+ functional requirements, define your SLA (latency, availability), and explicitly say what you are NOT building.',
    mid: 'Add specific numbers to non-functional requirements — e.g. P99 ≤ 200ms, 99.9% uptime, 5M DAU.',
  },
  architecture: {
    low: 'Describe all major components with data flow. Name each service and justify your database choice.',
    mid: 'Add API contracts between services. Justify every component — why this queue, why this cache technology?',
  },
  scalability: {
    low: 'Identify your main bottleneck. Add at least one of: caching strategy, sharding, or horizontal scaling.',
    mid: 'Specify cache TTL, shard key strategy, replication factor, and auto-scaling triggers.',
  },
  dataModel: {
    low: 'Define your schema with field types. Justify SQL vs NoSQL and show key indexes.',
    mid: 'Model read/write query patterns explicitly. Add partition key reasoning for distributed storage.',
  },
  tradeoffs: {
    low: 'Compare your choices to at least one alternative. Explain why you rejected other approaches.',
    mid: 'Quantify trade-offs — latency vs cost, consistency vs availability, complexity vs simplicity.',
  },
}

interface Phase { step: number; name: string; shortName: string; color: string; bg: string; time: string; tip: string }

const PHASES: Phase[] = [
  { step: 1, name: 'Clarify Requirements', shortName: 'Clarify',      color: 'text-blue-400',   bg: 'bg-blue-500',   time: '0–3m',   tip: 'State 3 core requirements, scale, SLA, and what you\'re NOT building.' },
  { step: 2, name: 'Capacity Estimation',  shortName: 'Estimate',     color: 'text-cyan-400',   bg: 'bg-cyan-500',   time: '3–6m',   tip: 'DAU → QPS → storage → bandwidth. Quick math, then move on.' },
  { step: 3, name: 'High-Level Design',    shortName: 'Architecture', color: 'text-green-400',  bg: 'bg-green-500',  time: '6–21m',  tip: 'Draw main components, name each service, choose DB, explain data flow.' },
  { step: 4, name: 'Deep Dive',            shortName: 'Deep Dive',    color: 'text-violet-400', bg: 'bg-violet-500', time: '21–41m', tip: 'Pick 2–3 critical components. Go deep: schema, API, algorithms, trade-offs.' },
  { step: 5, name: 'Trade-offs & Scale',   shortName: 'Trade-offs',   color: 'text-orange-400', bg: 'bg-orange-500', time: '41–45m', tip: 'What did you trade off? How would you handle 10× load? What would you change?' },
]

function getPhase(timerSec: number, started: boolean): Phase | null {
  if (!started) return null
  const elapsed = 45 * 60 - timerSec
  if (elapsed < 3 * 60)  return PHASES[0]
  if (elapsed < 6 * 60)  return PHASES[1]
  if (elapsed < 21 * 60) return PHASES[2]
  if (elapsed < 41 * 60) return PHASES[3]
  return PHASES[4]
}

const ARCH_COMPONENTS = [
  { label: 'Load Balancer',    icon: '⚖️', snippet: '**Load Balancer** (nginx / AWS ALB)\n- Distributes requests across N app-server instances\n- Health checks every 30s, sticky sessions optional\n- Algorithm: round-robin / least-connections\n' },
  { label: 'API Gateway',      icon: '🚪', snippet: '**API Gateway** (Kong / AWS API GW)\n- Rate limiting: token bucket (__ req/s per user)\n- Auth (JWT / OAuth 2), routing, logging\n- Target overhead: < 2ms P99\n' },
  { label: 'Cache (Redis)',     icon: '⚡', snippet: '**Cache** (Redis Cluster)\n- Strategy: Cache-aside / Write-through\n- TTL: __ s, Eviction: LRU\n- Hit-rate target: __%, Storage: __ GB\n' },
  { label: 'SQL Database',     icon: '🗄️', snippet: '**SQL Database** (PostgreSQL / MySQL)\n- 1 primary + N read replicas\n- Sharding by `user_id` (range / consistent hash)\n- Key indexes: `(user_id)`, `(created_at)`\n' },
  { label: 'NoSQL Database',   icon: '📦', snippet: '**NoSQL** (DynamoDB / Cassandra)\n- Partition key: `__`, Sort key: `__`\n- Consistency: eventual / strong\n- Throughput: __ RCU / __ WCU\n' },
  { label: 'Message Queue',    icon: '📨', snippet: '**Message Queue** (Kafka / SQS)\n- Topics: __, Partitions: __ (parallelism)\n- Consumer groups: __, Retention: __ days\n- Throughput: __ msg/s; at-least-once delivery\n' },
  { label: 'CDN',              icon: '🌐', snippet: '**CDN** (CloudFront / Cloudflare)\n- Caches static assets at PoP edges\n- Cache-Control: `max-age=__`\n- Origin fallback on cache miss\n' },
  { label: 'Vector Database',  icon: '🔢', snippet: '**Vector DB** (Qdrant / Pinecone)\n- Index: HNSW, Dimensions: __, ef_construction: __\n- Metric: cosine / dot / L2\n- P99 search latency: __ ms at __% recall@10\n' },
  { label: 'ML Model Server',  icon: '🤖', snippet: '**Model Server** (vLLM / Triton)\n- Model: __, Quantisation: FP16 / INT8 / AWQ\n- Hardware: __ × A100/H100 GPU\n- Throughput: __ req/s, P99 TTFT: __ ms\n' },
  { label: 'Stream Processor', icon: '🌊', snippet: '**Stream Processor** (Flink / Spark Streaming)\n- Window: tumbling __ / sliding __ / session\n- Watermark: __ s for late data\n- Throughput: __ events/s, Latency: __ ms\n' },
  { label: 'Feature Store',    icon: '🏪', snippet: '**Feature Store** (Feast / Tecton)\n- Online store: Redis → __ ms serving latency\n- Offline store: S3 / BigQuery → batch training\n- Point-in-time joins for training set generation\n' },
  { label: 'Object Storage',   icon: '🗂️', snippet: '**Object Storage** (S3 / GCS)\n- Stores: models, logs, datasets, embeddings\n- Lifecycle: Glacier after __ days\n- Versioning enabled; signed URLs for secure access\n' },
]

const CODE_TEMPLATES: { label: string; language: CodeLang; icon: string; desc: string; code: string }[] = [
  {
    label: 'LRU Cache', language: 'python', icon: '⚡', desc: 'O(1) get/put',
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap   = capacity
        self.cache = OrderedDict()  # preserves insertion order

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)   # mark as recently used
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)  # evict LRU (first item)

# Time: O(1) get/put  |  Space: O(capacity)`,
  },
  {
    label: 'Token Bucket', language: 'python', icon: '🪣', desc: 'Rate limiting',
    code: `import time

class TokenBucket:
    """Token-bucket rate limiter — allows bursting up to capacity."""
    def __init__(self, capacity: int, refill_rate: float):
        # refill_rate = tokens added per second
        self.capacity    = capacity
        self.refill_rate = refill_rate
        self.tokens      = float(capacity)
        self.last_refill = time.monotonic()

    def _refill(self) -> None:
        now   = time.monotonic()
        delta = now - self.last_refill
        self.tokens      = min(self.capacity, self.tokens + delta * self.refill_rate)
        self.last_refill = now

    def allow(self, cost: int = 1) -> bool:
        self._refill()
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False  # rate-limited

# Time: O(1)  |  Space: O(1) per user`,
  },
  {
    label: 'Consistent Hashing', language: 'python', icon: '🔄', desc: 'Distributed routing',
    code: `import hashlib
from bisect import bisect_right, insort

class ConsistentHashRing:
    def __init__(self, replicas: int = 150):
        self.replicas    = replicas  # virtual nodes per server
        self.ring        = {}        # hash -> server name
        self.sorted_keys: list[int] = []

    def _hash(self, key: str) -> int:
        return int(hashlib.md5(key.encode()).hexdigest(), 16)

    def add_server(self, server: str) -> None:
        for i in range(self.replicas):
            h = self._hash(f"{server}#{i}")
            self.ring[h] = server
            insort(self.sorted_keys, h)

    def remove_server(self, server: str) -> None:
        for i in range(self.replicas):
            h = self._hash(f"{server}#{i}")
            self.ring.pop(h, None)
            self.sorted_keys.remove(h)

    def get_server(self, key: str) -> str:
        if not self.ring:
            raise ValueError("No servers in ring")
        h   = self._hash(key)
        idx = bisect_right(self.sorted_keys, h) % len(self.sorted_keys)
        return self.ring[self.sorted_keys[idx]]

# Time: O(log n) lookup  |  Space: O(n × replicas)`,
  },
  {
    label: 'Sliding Window', language: 'python', icon: '🪟', desc: 'Accurate rate limiting',
    code: `from collections import deque
import time

class SlidingWindowRateLimiter:
    """Accurate sliding-log rate limiter."""
    def __init__(self, limit: int, window_sec: float):
        self.limit      = limit
        self.window_sec = window_sec
        # In production: use Redis sorted set per user_id
        self.requests: deque[float] = deque()

    def allow(self) -> bool:
        now    = time.monotonic()
        cutoff = now - self.window_sec
        while self.requests and self.requests[0] < cutoff:
            self.requests.popleft()           # evict expired
        if len(self.requests) < self.limit:
            self.requests.append(now)
            return True
        return False                          # rate-limited

# Time: O(n) worst case  |  Space: O(limit)
# Trade-off: accurate but memory-heavy → use fixed-window for high throughput`,
  },
  {
    label: 'Bloom Filter', language: 'python', icon: '🌸', desc: 'Probabilistic membership',
    code: `import hashlib, math

class BloomFilter:
    """Probabilistic set — no false negatives, ~fp_rate false positives."""
    def __init__(self, n: int, fp_rate: float = 0.01):
        m = int(-n * math.log(fp_rate) / math.log(2) ** 2)
        k = int((m / n) * math.log(2))
        self.size = max(m, 1)
        self.k    = max(k, 1)
        self.bits = bytearray(self.size)

    def _hashes(self, item: str):
        for i in range(self.k):
            h = hashlib.sha256(f"{item}:{i}".encode()).hexdigest()
            yield int(h, 16) % self.size

    def add(self, item: str) -> None:
        for idx in self._hashes(item):
            self.bits[idx] = 1

    def might_contain(self, item: str) -> bool:
        return all(self.bits[idx] for idx in self._hashes(item))

# Time: O(k) add/lookup  |  Space: O(m) ≈ much less than a set
# Use case: cache stampede prevention, dedup in pipelines`,
  },
  {
    label: 'Min-Heap Top-K', language: 'python', icon: '📊', desc: 'Streaming top-K',
    code: `import heapq
from dataclasses import dataclass, field
from typing import Any

@dataclass(order=True)
class Item:
    score: float
    value: Any = field(compare=False)

class TopKTracker:
    """Maintain top-K items from an unbounded stream."""
    def __init__(self, k: int):
        self.k    = k
        self.heap: list[Item] = []  # min-heap (smallest score at root)

    def add(self, value: Any, score: float) -> None:
        item = Item(score, value)
        if len(self.heap) < self.k:
            heapq.heappush(self.heap, item)
        elif score > self.heap[0].score:   # better than current minimum
            heapq.heapreplace(self.heap, item)

    def top_k(self) -> list[Any]:
        return [i.value for i in sorted(self.heap, reverse=True)]

# Time: O(n log k)  |  Space: O(k)
# Use case: leaderboards, trending items, recommendation systems`,
  },
]

const FRAMEWORK_STEPS = [
  { num: '01', time: '2–3 min',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/25',   title: 'Clarify Requirements',       tips: ['What are the 3 core functional requirements?', 'What scale? (users, QPS, data volume)', 'Latency SLA? Availability SLA?', 'State what you are NOT building'] },
  { num: '02', time: '2–3 min',   color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/25',   title: 'Capacity Estimation',         tips: ['DAU → QPS: divide by 86,400', 'Storage: record_size × daily_writes × retention', 'Bandwidth: avg_request_size × QPS', "Move on quickly — don't over-engineer this step"] },
  { num: '03', time: '10–15 min', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/25', title: 'High-Level Architecture',     tips: ['Draw main components + data flow on the canvas (not the editor)', 'Choose SQL vs NoSQL — justify why', 'Identify stateless vs stateful services', 'The AI review reads your canvas for architecture'] },
  { num: '04', time: '15–20 min', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25',title: 'Deep Dive (2–3 Components)',  tips: ['Pick the most critical or risky components', 'Detail schemas, APIs, key algorithms', "Discuss trade-offs — don't just describe", 'Cover failure modes and edge cases'] },
  { num: '05', time: '5–10 min',  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25',title: 'Scale & Trade-offs',          tips: ["Identify your design's bottlenecks", 'How would you handle 10× traffic?', 'What did you trade off and why?', 'What would you change with more time?'] },
]

const SECTION_JUMPS = [
  { label: 'Req',   heading: '## 1. Requirements Clarification' },
  { label: 'Cap',   heading: '## 2. Capacity Estimation' },
  { label: 'Arch',  heading: '## 3. High-Level Architecture' },
  { label: 'Dive',  heading: '## 4. Core Component Design' },
  { label: 'Trade', heading: '## 9. Trade-offs & Alternatives Considered' },
]

const SECTION_PROGRESS = [
  { num: 1, label: 'Req',     fullLabel: 'Requirements', partialH: '## 1.', jumpH: '## 1. Requirements Clarification',           dot: 'bg-blue-500' },
  { num: 2, label: 'Cap',     fullLabel: 'Capacity',     partialH: '## 2.', jumpH: '## 2. Capacity Estimation',                  dot: 'bg-cyan-500' },
  { num: 3, label: 'Arch',    fullLabel: 'Architecture', partialH: '## 3.', jumpH: '## 3. High-Level Architecture',              dot: 'bg-green-500' },
  { num: 4, label: 'Design',  fullLabel: 'Core Design',  partialH: '## 4.', jumpH: '## 4. Core Component Design',               dot: 'bg-violet-500' },
  { num: 5, label: 'Data',    fullLabel: 'Data Model',   partialH: '## 5.', jumpH: '## 5. Data Model & Storage',                dot: 'bg-indigo-500' },
  { num: 6, label: 'API',     fullLabel: 'API Design',   partialH: '## 6.', jumpH: '## 6. API Design',                         dot: 'bg-teal-500' },
  { num: 7, label: 'Scale',   fullLabel: 'Scalability',  partialH: '## 7.', jumpH: '## 7. Scalability & Performance',           dot: 'bg-yellow-500' },
  { num: 8, label: 'Monitor', fullLabel: 'Monitoring',   partialH: '## 8.', jumpH: '## 8. Monitoring & Reliability',            dot: 'bg-orange-500' },
  { num: 9, label: 'Trade',   fullLabel: 'Trade-offs',   partialH: '## 9.', jumpH: '## 9. Trade-offs & Alternatives Considered', dot: 'bg-red-500' },
]

// ── Improved Markdown → HTML ───────────────────────────────────────────────────
function mdToHtml(md: string): string {
  let out = md.replace(/<!--[\s\S]*?-->/g, '')

  // Escape HTML
  out = out.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Fenced code blocks — styled dark box
  out = out.replace(/```[\w]*\n?([\s\S]*?)```/g,
    '<pre class="my-3 rounded-xl border border-zinc-800 bg-[#0d0d0f] overflow-x-auto"><div class="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/60"><span class="w-2.5 h-2.5 rounded-full bg-red-500/60"></span><span class="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span><span class="w-2.5 h-2.5 rounded-full bg-green-500/60"></span></div><code class="block px-4 py-3 text-[12.5px] font-mono leading-6 text-orange-200 whitespace-pre">$1</code></pre>')

  // Inline code
  out = out.replace(/`([^`\n]+)`/g,
    '<code class="px-1.5 py-0.5 rounded-md bg-zinc-800 text-orange-300 text-[12px] font-mono border border-zinc-700/60">$1</code>')

  // Bold + italic
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-semibold text-zinc-100">$1</strong>')
  out = out.replace(/\*([^*\n]+)\*/g, '<em class="text-zinc-300 not-italic font-medium">$1</em>')

  // H2 — section header with left accent + top border
  out = out.replace(/^## (.+)$/gm,
    '<h2 class="flex items-center gap-2.5 text-[13px] font-extrabold text-orange-400 uppercase tracking-widest mt-6 mb-3 pt-5 border-t border-zinc-800/70 first:mt-0 first:pt-0 first:border-0"><span class="w-1 h-4 rounded-full bg-orange-500 flex-shrink-0"></span>$1</h2>')

  // H3 — sub-section
  out = out.replace(/^### (.+)$/gm,
    '<h3 class="text-[12.5px] font-bold text-zinc-200 mt-4 mb-2 flex items-center gap-1.5"><span class="text-orange-500/60 font-mono text-[10px]">###</span> $1</h3>')

  // H1
  out = out.replace(/^# (.+)$/gm,
    '<h1 class="text-base font-extrabold text-zinc-100 mt-5 mb-2.5">$1</h1>')

  // HR
  out = out.replace(/^---$/gm, '<hr class="border-zinc-800 my-4" />')

  // Ordered list items
  out = out.replace(/^(\d+)\. (.+)$/gm,
    '<li class="flex items-start gap-2.5 text-zinc-300 mb-1.5 text-sm leading-relaxed"><span class="text-orange-400/70 font-bold font-mono text-[11px] flex-shrink-0 mt-0.5 min-w-[18px] text-right">$1.</span><span>$2</span></li>')

  // Unordered list items
  out = out.replace(/^- (.+)$/gm,
    '<li class="flex items-start gap-2 text-zinc-300 mb-1.5 text-sm leading-relaxed"><span class="text-orange-400 flex-shrink-0 mt-[5px] text-[8px]">◆</span><span>$1</span></li>')

  // Wrap consecutive <li> blocks
  out = out.replace(/(<li[\s\S]*?<\/li>\n?)+/g,
    m => `<ul class="space-y-0 my-2 pl-1">${m}</ul>`)

  // Paragraphs
  out = out.split(/\n\n+/).map(block => {
    const t = block.trim()
    if (!t) return ''
    if (t.startsWith('<')) return t
    return `<p class="mb-2.5 text-zinc-300 text-sm leading-[1.75]">${t.replace(/\n/g, ' ')}</p>`
  }).join('\n')

  return out
}

function makeSnippet(name = 'Schema', lang: CodeLang = 'sql'): CodeSnippet {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID() : `s_${Date.now()}_${Math.random()}`
  return { id, name, language: lang, code: '' }
}

// ── Load Razorpay script dynamically ─────────────────────────────────────────
function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve(false)
    if ((window as Record<string, unknown>).Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DesignPad({ problem }: { problem: SDProblem }) {

  const [mobilePane, setMobilePane]     = useState<MobilePane>('canvas')
  const [rightTab, setRightTab]         = useState<RightTab>('write')
  const [leftTab, setLeftTab]           = useState<LeftTab>('problem')
  const [leftOpen, setLeftOpen]         = useState(true)
  const [rightWidth, setRightWidth]     = useState(420)

  const [design, setDesign]             = useState('')
  const [snippets, setSnippets]         = useState<CodeSnippet[]>([])
  const [activeId, setActiveId]         = useState('')
  const [checklist, setChecklist]       = useState<Record<string, boolean>>({})
  const [savedAt, setSavedAt]           = useState<Date | null>(null)
  const [diagramNodes, setDiagramNodes] = useState(0)

  const [renamingId, setRenamingId]     = useState<string | null>(null)
  const [renameVal, setRenameVal]       = useState('')

  const [timerSec, setTimerSec]         = useState(45 * 60)
  const [timerOn, setTimerOn]           = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)

  const [reviewing, setReviewing]       = useState(false)
  const [review, setReview]             = useState<ReviewResult | null>(null)
  const [reviewError, setReviewError]   = useState('')
  const [reviewOpen, setReviewOpen]     = useState(false)

  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [bestScore, setBestScore] = useState<{ score: number; grade: string } | null>(null)
  const [scoreHistory, setScoreHistory] = useState<{ score: number; grade: string; ts: number }[]>([])
  const [reviewLog, setReviewLog]   = useState<{ ts: number; review: ReviewResult }[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showExpert, setShowExpert]     = useState(false)
  const [showHints, setShowHints]       = useState(false)

  const [reference, setReference]       = useState<ReferenceSolution | null>(null)
  const [refLoading, setRefLoading]     = useState(false)
  const [refOpen, setRefOpen]           = useState(false)
  const [refError, setRefError]         = useState('')
  const [openFollowUp, setOpenFollowUp] = useState<number | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  const [codeCheck, setCodeCheck]               = useState<CodeCheckResult | null>(null)
  const [checkingCode, setCheckingCode]         = useState(false)
  const [codeCheckOpen, setCodeCheckOpen]       = useState(false)
  const [showCodeTemplates, setShowCodeTemplates] = useState(false)
  const [codeCopied, setCodeCopied]             = useState(false)
  const [problemExpanded, setProblemExpanded] = useState(false)

  // ── Pro state ──────────────────────────────────────────────────────────────
  const [proStatus, setProStatus]         = useState<ProStatus | null>(null)
  const [showPaywall, setShowPaywall]     = useState(false)
  const [showDailyLimit, setShowDailyLimit] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showCanvasNudge, setShowCanvasNudge] = useState(false)
  const [purchasing, setPurchasing]       = useState(false)
  const [selectedPlan, setSelectedPlan]   = useState<'sd_pro' | 'full_bundle'>('full_bundle')
  const [paywallError, setPaywallError]   = useState('')
  const [showReset, setShowReset]         = useState(false)
  const [canvasResetKey, setCanvasResetKey] = useState(0)
  const [isDesktop, setIsDesktop]         = useState(false)
  const [dailyCountdown, setDailyCountdown] = useState('')


  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const saveTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoEditorRef = useRef<any>(null)
  const timerInterval  = useRef<ReturnType<typeof setInterval> | null>(null)
  const diagramTextRef = useRef('')
  const startedRef     = useRef(false)
  const resizingRef    = useRef(false)
  const resizeStartX   = useRef(0)
  const resizeStartW   = useRef(0)
  const authedRef      = useRef(false)
  const cloudTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cloudPulledRef = useRef(false)

  const snap = useRef({ design, checklist, snippets, activeId })
  snap.current = { design, checklist, snippets, activeId }

  // Storage is scoped PER USER so different accounts on the same browser never
  // see each other's work. Keys stay empty until we know who is logged in
  // (proStatus resolved) — this prevents loading the wrong account's data during
  // the brief auth-loading window. Signed-out users keep the legacy slug-only keys.
  const storageReady = proStatus !== null
  const keySuffix    = proStatus?.authenticated && proStatus.userId
    ? `${proStatus.userId}_${problem.slug}`
    : problem.slug
  const storageKey    = storageReady ? STORAGE_PREFIX    + keySuffix : ''
  const canvasKey     = storageReady ? CANVAS_PREFIX     + keySuffix : ''
  const codeKey       = storageReady ? CODE_PREFIX       + keySuffix : ''
  const completionKey = storageReady ? COMPLETION_PREFIX + keySuffix : ''
  const historyKey    = storageReady ? HISTORY_PREFIX    + keySuffix : ''
  const reviewLogKey  = storageReady ? REVIEWLOG_PREFIX  + keySuffix : ''

  // ── Per-section word counts for write-tab progress strip ─────────────────────
  const sectionWords = useMemo(() => {
    const counts: Record<number, number> = {}
    let currentNum = 0; let words = 0
    for (const line of design.split('\n')) {
      const m = line.match(/^## (\d+)\./)
      if (m) {
        if (currentNum) counts[currentNum] = words
        currentNum = +m[1]; words = 0
      } else if (currentNum) {
        words += line.split(/\s+/).filter(Boolean).length
      }
    }
    if (currentNum) counts[currentNum] = words
    return counts
  }, [design])

  // ── Fetch pro status on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/sd-pro/status')
      .then(r => r.json())
      .then((d: ProStatus) => setProStatus(d))
      .catch(() => setProStatus({ authenticated: false })) // fail-safe: treat as logged out
  }, [])

  const refreshStatus = useCallback(() => {
    fetch('/api/sd-pro/status')
      .then(r => r.json())
      .then((d: ProStatus) => setProStatus(d))
      .catch(() => {})
  }, [])

  // ── Desktop breakpoint detector (for right-panel inline width) ────────────
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1280)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Live countdown for daily-limit modal ──────────────────────────────────
  useEffect(() => {
    if (!showDailyLimit) return
    const compute = () => {
      const IST_MS      = 5.5 * 60 * 60 * 1000
      const nowIST      = new Date(Date.now() + IST_MS)
      const midnightIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate() + 1) - IST_MS)
      const diff        = midnightIST.getTime() - Date.now()
      const hrs         = Math.floor(diff / (3_600_000))
      const mins        = Math.floor((diff % 3_600_000) / 60_000)
      setDailyCountdown(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`)
    }
    compute()
    const id = setInterval(compute, 60_000)
    return () => clearInterval(id)
  }, [showDailyLimit])

  // ── Cloud save (resume across devices for logged-in users) ─────────────────
  const scheduleCloudSync = useCallback(() => {
    if (!authedRef.current) return
    if (cloudTimer.current) clearTimeout(cloudTimer.current)
    cloudTimer.current = setTimeout(() => {
      let canvas: unknown = {}
      try { const raw = localStorage.getItem(canvasKey); if (raw) canvas = JSON.parse(raw) } catch {}
      const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current
      void fetch('/api/system-design/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: problem.slug, design: d, checklist: cl, code: { snippets: snips, activeId: aid }, canvas }),
      }).catch(() => {})
    }, 1200)
  }, [canvasKey, problem.slug])

  // Pull the cloud copy once we know the user is authenticated; apply it only
  // when it's newer than the local copy (last-write-wins across devices).
  useEffect(() => {
    authedRef.current = !!proStatus?.authenticated
    if (!proStatus?.authenticated || cloudPulledRef.current) return
    cloudPulledRef.current = true

    ;(async () => {
      try {
        const res = await fetch(`/api/system-design/design?slug=${encodeURIComponent(problem.slug)}`)
        if (!res.ok) return
        const { design: row } = await res.json()
        if (!row) return

        const cloudMs = row.updated_at ? new Date(row.updated_at).getTime() : 0
        const localMs = savedAt ? savedAt.getTime() : 0
        if (cloudMs <= localMs) return // local is newer or same — keep it

        if (typeof row.design === 'string' && row.design.trim()) setDesign(row.design)
        if (row.checklist && typeof row.checklist === 'object') setChecklist(row.checklist)

        const snips = Array.isArray(row.code?.snippets) && row.code.snippets.length ? row.code.snippets as CodeSnippet[] : null
        if (snips) {
          setSnippets(snips)
          const aid = typeof row.code?.activeId === 'string' ? row.code.activeId : snips[0].id
          setActiveId(aid)
          const active = snips.find(s => s.id === aid) ?? snips[0]
          setTimeout(() => monacoEditorRef.current?.setValue?.(active.code ?? ''), 60)
          try { localStorage.setItem(codeKey, JSON.stringify({ snippets: snips, activeId: aid })) } catch {}
        }

        if (row.canvas && Array.isArray(row.canvas.nodes)) {
          try { localStorage.setItem(canvasKey, JSON.stringify(row.canvas)) } catch {}
          diagramTextRef.current = serializeDiagram(row.canvas.nodes, row.canvas.edges ?? [])
          setDiagramNodes(row.canvas.nodes.length)
          setCanvasResetKey(k => k + 1)
        }

        if (typeof row.design === 'string') {
          try { localStorage.setItem(storageKey, JSON.stringify({ design: row.design, savedAt: row.updated_at, checklist: row.checklist ?? {} })) } catch {}
        }
        setSavedAt(new Date(cloudMs))
      } catch { /* offline / not-configured — local copy stays */ }
    })()
  }, [proStatus?.authenticated, problem.slug, savedAt, canvasKey, codeKey, storageKey])

  // ── Razorpay purchase ─────────────────────────────────────────────────────
  const WA_PAYMENT_URL = (plan: 'sd_pro' | 'full_bundle') => {
    const label = plan === 'full_bundle' ? 'Interview Prep Kit (₹1499)' : 'System Design Pro (₹999)'
    return `https://wa.me/919997600372?text=${encodeURIComponent(`Hi Aman! I want to buy ${label} but payment isn't working. Can you help me complete the purchase?`)}`
  }

  const handlePurchase = useCallback(async (plan: 'sd_pro' | 'full_bundle') => {
    setSelectedPlan(plan)
    setPaywallError('')
    setPurchasing(true)
    try {
      const ok = await loadRazorpay()
      if (!ok) {
        setPaywallError('Payment gateway failed to load. Use WhatsApp below to complete your purchase.')
        return
      }

      const endpoint    = plan === 'full_bundle' ? '/api/sd-pro/create-bundle-order' : '/api/sd-pro/create-order'
      const res         = await fetch(endpoint, { method: 'POST' })
      const od          = await res.json()
      if (!res.ok) {
        if (res.status === 401) { setShowPaywall(false); setShowLoginPrompt(true) }
        else setPaywallError(od.error ?? 'Could not create order. Use WhatsApp below.')
        return
      }

      const description = plan === 'full_bundle' ? 'Interview Prep Kit — 30 Days' : 'System Design Pro — 30 Days'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key:      od.key,
        amount:   od.amount,
        currency: od.currency,
        order_id: od.id,
        name:     'AmanAI Lab',
        description,
        theme:    { color: '#f97316' },
        handler:  async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const vr = await fetch('/api/sd-pro/verify-payment', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              paymentId: resp.razorpay_payment_id,
              orderId:   resp.razorpay_order_id,
              signature: resp.razorpay_signature,
              plan,
            }),
          })
          const vd = await vr.json()
          if (vr.ok) {
            setShowPaywall(false)
            setPaywallError('')
            setPurchasing(false)
            // Optimistically mark as subscribed so the Crown badge appears instantly
            setProStatus(prev => prev ? {
              ...prev, isSubscribed: true,
              plan: (vd.plan ?? plan) as PlanType,
              dailyUsed: 0, dailyLimit: 15,
            } : prev)
            refreshStatus()
          } else {
            setPaywallError(vd.error ?? 'Payment received but activation failed. WhatsApp Aman with your payment ID.')
          }
        },
        modal: { ondismiss: () => setPurchasing(false) },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on('payment.failed', (resp: any) => {
        setPaywallError(resp?.error?.description ?? 'Payment failed. Use WhatsApp below to complete your purchase.')
        setPurchasing(false)
      })
      rzp.open()
    } catch {
      setPaywallError('Something went wrong. Use WhatsApp below to complete your purchase.')
    } finally {
      setPurchasing(false)
    }
  }, [refreshStatus])

  // ── Panel resize ──────────────────────────────────────────────────────────
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current  = true
    resizeStartX.current = e.clientX
    resizeStartW.current = rightWidth
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      setRightWidth(Math.max(340, Math.min(740, resizeStartW.current + (resizeStartX.current - ev.clientX))))
    }
    const onUp = () => { resizingRef.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [rightWidth])

  const autoStartTimer = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setTimerOn(true)
    setTimerStarted(true)
  }, [])

  const handleCanvasChange = useCallback((text: string, count: number) => {
    diagramTextRef.current = text; setDiagramNodes(count)
    scheduleCloudSync()
  }, [scheduleCloudSync])

  // ── Load saved state (only once we know which account is active) ─────────────
  useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) { const p = JSON.parse(raw); setDesign(p.design ?? DESIGN_TEMPLATE); setSavedAt(p.savedAt ? new Date(p.savedAt) : null); setChecklist(p.checklist ?? {}) }
      else setDesign(DESIGN_TEMPLATE)
    } catch { setDesign(DESIGN_TEMPLATE) }

    try {
      const raw = localStorage.getItem(codeKey)
      if (raw) { const p = JSON.parse(raw); const snips: CodeSnippet[] = Array.isArray(p.snippets) && p.snippets.length ? p.snippets : [makeSnippet()]; setSnippets(snips); setActiveId(p.activeId ?? snips[0].id) }
      else { const s = makeSnippet(); setSnippets([s]); setActiveId(s.id) }
    } catch { const s = makeSnippet(); setSnippets([s]); setActiveId(s.id) }

    try {
      const raw = localStorage.getItem(canvasKey)
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.nodes) && p.nodes.length) { diagramTextRef.current = serializeDiagram(p.nodes, p.edges ?? []); setDiagramNodes(p.nodes.length) } }
    } catch {}

    try { const raw = localStorage.getItem(completionKey); if (raw) setBestScore(JSON.parse(raw)) } catch {}
    try { const raw = localStorage.getItem(historyKey);    if (raw) setScoreHistory(JSON.parse(raw)) } catch {}
    try { const raw = localStorage.getItem(reviewLogKey);  if (raw) setReviewLog(JSON.parse(raw)) } catch {}
  }, [storageKey, codeKey, canvasKey, completionKey, historyKey, reviewLogKey])

  // ── Timer tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerOn) {
      timerInterval.current = setInterval(() => {
        setTimerSec(s => { if (s <= 1) { clearInterval(timerInterval.current!); setTimerOn(false); return 0 } return s - 1 })
      }, 1000)
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current) }
  }, [timerOn])

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (timerInterval.current) clearInterval(timerInterval.current)
    if (cloudTimer.current) clearTimeout(cloudTimer.current)
  }, [])

  // Focus Monaco whenever user switches to the Code tab
  useEffect(() => {
    if (rightTab === 'code') {
      const t = setTimeout(() => monacoEditorRef.current?.focus?.(), 80)
      return () => clearTimeout(t)
    }
  }, [rightTab])

  // ── Persist ────────────────────────────────────────────────────────────────
  const persist = useCallback((d: string, cl: Record<string, boolean>, snips: CodeSnippet[], aid: string) => {
    if (!storageKey) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ design: d, savedAt: new Date().toISOString(), checklist: cl }))
        localStorage.setItem(codeKey, JSON.stringify({ snippets: snips, activeId: aid }))
        setSavedAt(new Date())
      } catch {
        setReviewError('Could not save your work — storage is full or blocked. Your work is only in memory.')
      }
      scheduleCloudSync()
    }, 700)
  }, [storageKey, codeKey, scheduleCloudSync])

  const handleDesignChange = (val: string) => { autoStartTimer(); recordUndo(snap.current.design); setDesign(val); const { checklist: cl, snippets: snips, activeId: aid } = snap.current; persist(val, cl, snips, aid) }
  const handleCodeChange   = (code: string) => { autoStartTimer(); const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current; const next = snips.map(s => s.id === aid ? { ...s, code } : s); setSnippets(next); persist(d, cl, next, aid) }
  const handleLangChange   = (lang: CodeLang) => { const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current; const next = snips.map(s => s.id === aid ? { ...s, language: lang } : s); setSnippets(next); persist(d, cl, next, aid) }

  const addSnippet = () => { const { design: d, checklist: cl, snippets: snips } = snap.current; const s = makeSnippet('New Snippet', 'python'); const next = [...snips, s]; setSnippets(next); setActiveId(s.id); persist(d, cl, next, s.id) }
  const deleteSnippet = (id: string) => { const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current; if (snips.length <= 1) return; const next = snips.filter(s => s.id !== id); const newAid = id === aid ? next[0].id : aid; setSnippets(next); setActiveId(newAid); persist(d, cl, next, newAid) }
  const commitRename  = (id: string) => { if (!renameVal.trim()) { setRenamingId(null); return } const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current; const next = snips.map(s => s.id === id ? { ...s, name: renameVal.trim() } : s); setSnippets(next); setRenamingId(null); persist(d, cl, next, aid) }
  const toggleCheck   = (area: string) => { const { design: d, snippets: snips, activeId: aid } = snap.current; const next = { ...checklist, [area]: !checklist[area] }; setChecklist(next); persist(d, next, snips, aid) }

  // ── Undo / redo history for the writing editor ────────────────────────────
  // A controlled <textarea> loses the browser's native undo stack on every
  // React re-render, so we keep our own snapshot history of the design text.
  const undoStack = useRef<string[]>([])
  const redoStack = useRef<string[]>([])

  // Record the value BEFORE a change. No time-coalescing — every distinct value
  // is a step, so a bulk delete is always a single, reliable undo.
  const recordUndo = useCallback((prev: string) => {
    const stack = undoStack.current
    if (stack.length && stack[stack.length - 1] === prev) return  // skip no-op
    stack.push(prev)
    if (stack.length > 500) stack.shift()
    redoStack.current = []
  }, [])

  const undoEdit = useCallback(() => {
    if (!undoStack.current.length) return
    const cur = snap.current.design
    const prev = undoStack.current.pop() as string
    redoStack.current.push(cur)
    const { checklist: cl, snippets: snips, activeId: aid } = snap.current
    setDesign(prev); persist(prev, cl, snips, aid)
    const el = textareaRef.current
    requestAnimationFrame(() => { if (el) { el.focus(); const p = Math.min(el.selectionStart || prev.length, prev.length); el.setSelectionRange(p, p) } })
  }, [persist])

  const redoEdit = useCallback(() => {
    if (!redoStack.current.length) return
    const cur = snap.current.design
    const next = redoStack.current.pop() as string
    undoStack.current.push(cur)
    const { checklist: cl, snippets: snips, activeId: aid } = snap.current
    setDesign(next); persist(next, cl, snips, aid)
    const el = textareaRef.current
    requestAnimationFrame(() => { if (el) { el.focus(); const p = Math.min(el.selectionStart || next.length, next.length); el.setSelectionRange(p, p) } })
  }, [persist])

  // Global Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y for the writing editor, so undo works
  // even if focus drifted off the textarea (onto the canvas, a button, etc.).
  // Skips when a different text field / Monaco code editor is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k !== 'z' && k !== 'y') return
      const ae = document.activeElement as HTMLElement | null
      // Textarea focused → its own onKeyDown handles it (avoid double-undo).
      if (ae === textareaRef.current) return
      // Don't hijack undo inside other inputs / the Monaco code editor.
      if (ae) {
        const tag = ae.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || ae.isContentEditable || ae.closest('.monaco-editor')) return
      }
      e.preventDefault()
      if (k === 'y' || e.shiftKey) redoEdit(); else undoEdit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undoEdit, redoEdit])

  const insertAt = useCallback((text: string) => {
    const el = textareaRef.current; if (!el) return
    autoStartTimer()
    const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current
    recordUndo(d)
    const s = el.selectionStart, e = el.selectionEnd
    const next = d.slice(0, s) + text + d.slice(e)
    setDesign(next); persist(next, cl, snips, aid)
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + text.length; el.focus() })
  }, [persist, autoStartTimer, recordUndo])

  const wrap = useCallback((before: string, after = '') => {
    const el = textareaRef.current; if (!el) return
    autoStartTimer()
    const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current
    recordUndo(d)
    const s = el.selectionStart, e = el.selectionEnd
    const sel = d.slice(s, e)
    const next = d.slice(0, s) + before + sel + after + d.slice(e)
    setDesign(next); persist(next, cl, snips, aid)
    requestAnimationFrame(() => { el.selectionStart = s + before.length; el.selectionEnd = s + before.length + sel.length; el.focus() })
  }, [persist, autoStartTimer, recordUndo])

  const handleWriteKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    // Undo / redo — primary handler (fires while the textarea is focused).
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault(); if (e.shiftKey) redoEdit(); else undoEdit(); return
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault(); redoEdit(); return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current
      recordUndo(d)
      const s = el.selectionStart, end = el.selectionEnd
      const next = d.slice(0, s) + '  ' + d.slice(end)
      setDesign(next); persist(next, cl, snips, aid)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2 })
    }
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); wrap('**', '**') }
    if (e.key === 'i' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); wrap('*', '*') }
  }, [wrap, persist, recordUndo, undoEdit, redoEdit])

  const jumpToSection = useCallback((heading: string) => {
    const el = textareaRef.current; if (!el) return
    setRightTab('write')
    if (mobilePane !== 'answer') setMobilePane('answer')
    const idx = el.value.indexOf(heading)
    if (idx >= 0) { const linesBefore = el.value.substring(0, idx).split('\n').length; el.scrollTop = Math.max(0, (linesBefore - 2) * 22); el.focus(); el.setSelectionRange(idx + heading.length, idx + heading.length) }
    else insertAt('\n' + heading + '\n\n')
  }, [mobilePane, insertAt])

  const handleResetSession = () => {
    try { localStorage.removeItem(storageKey) }    catch {}
    try { localStorage.removeItem(codeKey) }        catch {}
    try { localStorage.removeItem(canvasKey) }      catch {}
    try { localStorage.removeItem(completionKey) }  catch {}
    try { localStorage.removeItem(historyKey) }     catch {}
    try { localStorage.removeItem(reviewLogKey) }   catch {}
    const fresh = makeSnippet()
    setDesign(DESIGN_TEMPLATE)
    setSnippets([fresh])
    setActiveId(fresh.id)
    setChecklist({})
    setTimerSec(45 * 60)
    setTimerOn(false)
    setTimerStarted(false)
    startedRef.current = false
    setHintsRevealed(0)
    setBestScore(null)
    setScoreHistory([])
    setReviewLog([])
    setReview(null)
    setReviewError('')
    setReviewOpen(false)
    setShowReset(false)
    setDiagramNodes(0)
    diagramTextRef.current = ''
    setCanvasResetKey(k => k + 1)   // signals SystemCanvas to reload (from empty storage)
    monacoEditorRef.current?.setValue?.('')
    setSavedAt(null)

    // Also clear the cloud copy so the reset survives a reload on any device
    if (authedRef.current) {
      if (cloudTimer.current) clearTimeout(cloudTimer.current)
      void fetch('/api/system-design/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: problem.slug, design: '', checklist: {}, code: { snippets: [fresh], activeId: fresh.id }, canvas: {} }),
      }).catch(() => {})
    }
  }

  const fmt       = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const tClr      = timerSec <= 300 ? 'text-red-400' : timerSec <= 600 ? 'text-orange-400' : 'text-zinc-200'
  const resetTimer = () => { setTimerOn(false); setTimerSec(45 * 60); setTimerStarted(false); startedRef.current = false }
  const startTimer = () => { startedRef.current = true; setTimerOn(true); setTimerStarted(true) }

  const downloadMd = () => {
    const blob = new Blob([design], { type: 'text/markdown;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${problem.slug}-design.md` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleCheckCode = async () => {
    const active = snippets.find(s => s.id === activeId)
    const currentCode = monacoEditorRef.current?.getValue?.() ?? active?.code ?? ''
    if (!currentCode.trim()) return
    setCheckingCode(true); setCodeCheck(null); setCodeCheckOpen(false)
    try {
      const res  = await fetch('/api/system-design/check-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: problem.problem, language: active?.language ?? 'python', code: currentCode }),
      })
      const data = await res.json()
      if (res.status === 401) { setShowLoginPrompt(true); return }
      if (!res.ok) throw new Error(data.error ?? 'Code check failed')
      setCodeCheck(data); setCodeCheckOpen(true)
    } catch (err) {
      setReviewError((err instanceof Error ? err.message : '') || 'Code check failed. Try again.')
    }
    finally { setCheckingCode(false) }
  }

  const insertTemplate = (t: typeof CODE_TEMPLATES[0]) => {
    const { design: d, checklist: cl, snippets: snips, activeId: aid } = snap.current
    const next = snips.map(s => s.id === aid ? { ...s, code: t.code, language: t.language, name: t.label } : s)
    setSnippets(next); persist(d, cl, next, aid); setShowCodeTemplates(false)
    // Push code into the uncontrolled editor directly (we use defaultValue, not value)
    monacoEditorRef.current?.setValue?.(t.code)
    setTimeout(() => monacoEditorRef.current?.focus?.(), 50)
  }

  const copyCode = () => {
    const code = monacoEditorRef.current?.getValue?.() ?? snippets.find(s => s.id === activeId)?.code ?? ''
    if (!code) return
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000)
    }).catch(() => {})
  }

  // ── AI review ─────────────────────────────────────────────────────────────
  const handleReview = async (opts?: { skipCanvasNudge?: boolean }) => {
    const skipCanvasNudge = opts?.skipCanvasNudge === true
    // Gate 0: status still loading — never allow through
    if (proStatus === null) return

    // Gate 1: not signed in → login prompt immediately
    if (!proStatus.authenticated) { setShowLoginPrompt(true); return }

    // Gate 2: free user exhausted lifetime limit → upgrade paywall immediately
    if (!proStatus.isSubscribed) {
      const used  = proStatus.freeUsed  ?? 0
      const limit = proStatus.freeLimit ?? 2
      if (used >= limit) { setPaywallError(''); setShowPaywall(true); return }
    }

    // Gate 3: paid user exhausted today's limit → daily limit modal immediately
    if (proStatus.isSubscribed) {
      const used  = proStatus.dailyUsed  ?? 0
      const limit = proStatus.dailyLimit ?? 15
      if (used >= limit) { setShowDailyLimit(true); return }
    }

    const { snippets: snips } = snap.current
    const hasText    = design.trim().length >= 100
    const hasDiagram = diagramNodes >= 2
    const hasCode    = snips.some(s => s.code.trim().length > 0)
    if (!hasText && !hasDiagram && !hasCode) {
      setReviewError('Add more content first — write a few paragraphs, draw 2+ diagram components, or add code.')
      return
    }
    // Nudge: architecture is graded from the canvas — warn if it's empty but they have written content.
    if (!hasDiagram && (hasText || hasCode) && skipCanvasNudge !== true) {
      setShowCanvasNudge(true)
      return
    }
    setShowCanvasNudge(false)
    setReviewing(true); setReviewError(''); setReview(null)
    try {
      const res = await fetch('/api/system-design/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug:         problem.slug,
          problem:      problem.problem,
          category:     problem.category,
          keyAreas:     problem.keyAreas,
          design:       design.trim(),
          diagram:      diagramTextRef.current.trim(),
          codeSnippets: snips.filter(s => s.code.trim()).map(s => ({ name: s.name, language: s.language, code: s.code })),
        }),
      })
      const data = await res.json()

      if (res.status === 401) { setShowLoginPrompt(true); return }
      if (res.status === 402) { setShowPaywall(true); return }
      if (res.status === 429) {
        // DAILY_LIMIT = paid user hit 15/day; anything else = parallel-click guard
        if (data.code === 'DAILY_LIMIT') { setShowDailyLimit(true) }
        else setReviewError(data.error ?? 'A review is already running — give it a few seconds.')
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Review failed')

      setReview(data.review)
      setReviewOpen(true)

      // Optimistically increment local count so gates work instantly on next click
      setProStatus(prev => {
        if (!prev) return prev
        if (prev.isSubscribed) return { ...prev, dailyUsed: (prev.dailyUsed ?? 0) + 1 }
        return { ...prev, freeUsed: (prev.freeUsed ?? 0) + 1 }
      })
      refreshStatus() // sync accurate count from server in the background

      if (!bestScore || data.review.overallScore > bestScore.score) {
        const next = { score: data.review.overallScore, grade: data.review.grade }
        setBestScore(next)
        try { localStorage.setItem(completionKey, JSON.stringify(next)) } catch {}
      }
      const ts         = Date.now()
      const entry      = { score: data.review.overallScore, grade: data.review.grade, ts }
      const nextHistory = [...scoreHistory, entry].slice(-5)
      setScoreHistory(nextHistory)
      try { localStorage.setItem(historyKey, JSON.stringify(nextHistory)) } catch {}

      // Keep the full text of the last 5 reviews so they can be reopened later
      const nextLog = [{ ts, review: data.review }, ...reviewLog].slice(0, 5)
      setReviewLog(nextLog)
      try { localStorage.setItem(reviewLogKey, JSON.stringify(nextLog)) } catch {}
    } catch (e: unknown) {
      setReviewError((e instanceof Error ? e.message : '') || 'Review failed. Try again.')
    } finally { setReviewing(false) }
  }

  // ── Reference solution (Pro) ────────────────────────────────────────────────
  const loadReference = async () => {
    if (reference) { setRefOpen(o => !o); return }
    setRefLoading(true); setRefError('')
    try {
      const res  = await fetch('/api/system-design/reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: problem.slug }),
      })
      const data = await res.json()
      if (res.status === 401) { setShowLoginPrompt(true); return }
      if (res.status === 402) { setShowPaywall(true); return }
      if (!res.ok) throw new Error(data.error ?? 'Could not load the reference solution.')
      setReference(data.reference)
      setRefOpen(true)
    } catch (e: unknown) {
      setRefError((e instanceof Error ? e.message : '') || 'Could not load the reference solution.')
    } finally { setRefLoading(false) }
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      const { snippets: snips } = snap.current
      await exportDesignPdf({
        problemTitle: problem.title,
        category:     problem.category,
        design:       snap.current.design,
        diagramText:  diagramTextRef.current,
        snippets:     snips.map(s => ({ name: s.name, language: s.language, code: s.code })),
        review,
      })
    } catch (e) {
      setReviewError((e instanceof Error ? e.message : '') || 'Could not export PDF.')
    } finally { setExportingPdf(false) }
  }

  const phase        = getPhase(timerSec, timerStarted)
  const coveredCount = Object.values(checklist).filter(Boolean).length
  const wordCount    = design.split(/\s+/).filter(Boolean).length
  const codeLines    = snippets.reduce((a, s) => a + s.code.split('\n').filter(Boolean).length, 0)
  const activeSnippet = snippets.find(s => s.id === activeId) ?? snippets[0]
  const RING_C       = 2 * Math.PI * 42
  const gradeColor: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#eab308', D: '#ef4444' }

  // ── Usage badge helper ────────────────────────────────────────────────────
  const UsageBadge = () => {
    if (!proStatus) return null

    if (!proStatus.authenticated) {
      return (
        <button onClick={() => setShowLoginPrompt(true)}
          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
          <LogIn size={10} />
          <span className="hidden sm:inline">Sign in for free reviews</span>
        </button>
      )
    }

    if (proStatus.isSubscribed) {
      const used  = proStatus.dailyUsed  ?? 0
      const limit = proStatus.dailyLimit ?? 15
      const pct   = Math.round((used / limit) * 100)
      const planLabel = proStatus.plan === 'full_bundle' ? 'Prep Kit' : 'SD Pro'
      return (
        <div className="flex items-center gap-1.5 text-[10px] flex-shrink-0">
          <Crown size={10} className="text-orange-400" />
          <span className="text-orange-400/70 font-semibold hidden sm:inline">{planLabel}</span>
          <span className={`font-semibold tabular-nums ${used >= limit ? 'text-red-400' : 'text-zinc-300'}`}>{used}/{limit}</span>
          <span className="text-zinc-600 hidden sm:inline">today</span>
          <div className="hidden sm:block w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )
    }

    const used      = proStatus.freeUsed  ?? 0
    const limit     = proStatus.freeLimit ?? 2
    const remaining = limit - used
    return (
      <div className="flex items-center gap-1.5 text-[10px] flex-shrink-0">
        <span className={`tabular-nums font-semibold ${remaining <= 1 ? 'text-orange-400' : 'text-zinc-500'}`}>{used}/{limit}</span>
        <span className="text-zinc-600 hidden sm:inline">free</span>
        <button onClick={() => { setPaywallError(''); setShowPaywall(true) }}
          className={`font-semibold transition-colors ${remaining <= 1 ? 'text-orange-400 hover:text-orange-300' : 'text-zinc-600 hover:text-zinc-400'}`}>
          Upgrade
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="h-14 flex-shrink-0 flex items-center gap-2 px-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur z-30">

        <Link href="/system-design"
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-200 text-xs transition-colors flex-shrink-0">
          <ArrowLeft size={13} /><span className="hidden sm:inline">Problems</span>
        </Link>
        <span className="text-zinc-700 hidden sm:inline text-sm">›</span>
        <span className="text-sm font-semibold text-zinc-100 truncate max-w-[130px] sm:max-w-[240px] lg:max-w-none">{problem.title}</span>

        <span className={`hidden md:inline flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-bold ${
          problem.difficulty === 'Hard' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
        }`}>{problem.difficulty}</span>

        {/* Phase timeline */}
        <div className="hidden lg:flex items-center gap-1 ml-2 flex-shrink-0">
          {PHASES.map((p, i) => {
            const isCurrent = phase?.step === p.step
            const isPast    = (phase?.step ?? 0) > p.step
            return (
              <div key={p.step} className="flex items-center gap-0.5">
                <div title={`${p.name} · ${p.time}`}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all text-[10px] font-semibold cursor-default ${
                    isCurrent ? `${p.color} bg-zinc-800 ring-1 ring-inset ring-zinc-700` : isPast ? 'text-zinc-700' : 'text-zinc-800'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${isCurrent ? `${p.bg} shadow-sm` : isPast ? 'bg-zinc-700' : 'bg-zinc-800'}`} />
                  {p.shortName}
                </div>
                {i < PHASES.length - 1 && <span className="text-zinc-800 text-xs">›</span>}
              </div>
            )
          })}
        </div>

        {bestScore && (
          <div className={`hidden lg:flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold ${GRADE_CONFIG[bestScore.grade]?.color ?? 'text-zinc-400'} ${GRADE_CONFIG[bestScore.grade]?.bg ?? 'bg-zinc-800 border-zinc-700'}`}>
            <Trophy size={10} />{bestScore.score}/10
          </div>
        )}

        <div className="flex-1" />

        <UsageBadge />

        {/* Timer */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-sm font-mono font-bold tabular-nums ${tClr}`}>{fmt(timerSec)}</span>
          {!timerStarted ? (
            <button onClick={startTimer} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors font-semibold">
              <Play size={10} /><span className="hidden sm:inline">Start</span>
            </button>
          ) : (
            <>
              <button onClick={() => setTimerOn(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                {timerOn ? <Pause size={11} /> : <Play size={11} />}
              </button>
              <button onClick={resetTimer} className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                <RotateCcw size={10} />
              </button>
            </>
          )}
        </div>

        <button onClick={() => setShowReset(true)} title="New Session — reset all work on this problem"
          className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
          <Plus size={13} />
        </button>

        <button onClick={downloadMd} title="Download as Markdown"
          className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0">
          <Save size={13} />
        </button>

        {reviewLog.length > 0 && (
          <button onClick={() => setShowHistory(true)} title="Past AI reviews"
            className="flex items-center gap-1 px-2 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0 text-[11px] font-semibold">
            <BookOpen size={13} />
            <span className="hidden md:inline">Past reviews</span>
            <span className="px-1 rounded bg-zinc-700 text-zinc-300 text-[10px]">{reviewLog.length}</span>
          </button>
        )}

        {(() => {
          const statusLoading = proStatus === null
          const atLimit = !statusLoading && proStatus && !proStatus.isSubscribed &&
            (proStatus.freeUsed ?? 0) >= (proStatus.freeLimit ?? 2)
          return (
            <button onClick={() => handleReview()} disabled={reviewing || statusLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-60 flex-shrink-0 shadow-lg ${
                atLimit
                  ? 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700 shadow-violet-500/20'
                  : 'bg-orange-500 hover:bg-orange-400 active:bg-orange-600 shadow-orange-500/20'
              }`}>
              {reviewing || statusLoading ? <Loader2 size={13} className="animate-spin" /> : atLimit ? <Crown size={13} /> : <Sparkles size={13} />}
              <span className="hidden sm:inline">
                {reviewing ? 'Reviewing…' : statusLoading ? 'Loading…' : atLimit ? 'Upgrade to Continue' : 'AI Review'}
              </span>
              <span className="sm:hidden">{reviewing ? '…' : statusLoading ? '…' : atLimit ? 'Upgrade' : 'Review'}</span>
            </button>
          )
        })()}
      </header>

      {/* Phase tip bar */}
      {phase && timerStarted && (
        <div className={`hidden lg:flex flex-shrink-0 items-center gap-2 px-4 py-1.5 border-b border-zinc-900/80 text-[11px] ${phase.color}`}
          style={{ background: 'rgba(9,9,11,0.95)' }}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${phase.bg} animate-pulse`} />
          <span className="font-bold">{phase.name}</span>
          <span className="text-zinc-700 mx-0.5">·</span>
          <span className="text-zinc-500">{phase.tip}</span>
        </div>
      )}

      {/* ═══ MOBILE TAB BAR ══════════════════════════════════════════════════ */}
      <div className="xl:hidden flex-shrink-0 flex border-b border-zinc-800 bg-zinc-950">
        {([
          { id: 'problem' as MobilePane, icon: <ListChecks size={12} />, label: 'Problem' },
          { id: 'canvas'  as MobilePane, icon: <Code2 size={12} />,      label: 'Diagram' },
          { id: 'answer'  as MobilePane, icon: <PenLine size={12} />,    label: 'Write'   },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setMobilePane(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all border-b-2 ${
              mobilePane === tab.id ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ═══ MAIN BODY ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
        <aside className={`${mobilePane === 'problem' ? 'flex' : 'hidden'} ${leftOpen ? 'xl:flex xl:w-[340px]' : 'xl:hidden'} flex-col w-full xl:flex-shrink-0 border-r border-zinc-800 bg-zinc-950 min-h-0`}>

          <div className="flex items-center gap-0.5 p-1.5 border-b border-zinc-800 flex-shrink-0">
            {([
              { id: 'problem'    as LeftTab, icon: <ListChecks size={12} />, label: 'Problem'   },
              { id: 'framework'  as LeftTab, icon: <BookOpen size={12} />,   label: 'Framework' },
              { id: 'components' as LeftTab, icon: <Cpu size={12} />,        label: 'Snippets'  },
            ]).map(t => (
              <button key={t.id} onClick={() => setLeftTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  leftTab === t.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}>
                {t.icon}<span className="hidden xl:inline">{t.label}</span>
              </button>
            ))}
            <button onClick={() => setLeftOpen(false)} title="Collapse"
              className="hidden xl:flex w-7 h-7 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all flex-shrink-0">
              <ChevronLeft size={13} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-2.5 space-y-2.5">

            {/* ─── PROBLEM TAB ─── */}
            {leftTab === 'problem' && (
              <>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-zinc-800/70 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">The Problem</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${
                      problem.category === 'LLM Infrastructure' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20'
                      : problem.category === 'ML Systems' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                      : 'text-green-400 bg-green-500/10 border-green-500/20'
                    }`}>{problem.category}</span>
                    <button onClick={() => setProblemExpanded(true)} title="Read full problem"
                      className="ml-auto w-6 h-6 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0">
                      <Maximize2 size={11} />
                    </button>
                  </div>
                  <div className="px-3 py-3 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: mdToHtml(problem.problem) }} />
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-zinc-800/70">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Scale &amp; Constraints</span>
                  </div>
                  <ul className="px-3 py-2.5 space-y-1.5">
                    {problem.constraints.map(c => (
                      <li key={c} className="flex items-start gap-1.5 text-xs text-zinc-400">
                        <span className="text-orange-400/80 flex-shrink-0 mt-0.5 text-[10px]">▸</span>
                        <span className="leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-zinc-800/70 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Must Cover</span>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${(coveredCount / Math.max(problem.keyAreas.length, 1)) * 100}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums flex-shrink-0 ${coveredCount === problem.keyAreas.length ? 'text-emerald-400' : 'text-zinc-600'}`}>{coveredCount}/{problem.keyAreas.length}</span>
                  </div>
                  <div className="px-3 py-2.5 space-y-2">
                    {problem.keyAreas.map(area => (
                      <button key={area} onClick={() => toggleCheck(area)} className="w-full flex items-start gap-2.5 text-left group">
                        {checklist[area]
                          ? <CheckCircle size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          : <Circle size={13} className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0 mt-0.5" />}
                        <span className={`text-xs leading-snug transition-colors ${checklist[area] ? 'line-through text-zinc-700' : 'text-zinc-300 group-hover:text-zinc-100'}`}>{area}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-zinc-800/70 flex items-center gap-1.5">
                    <Lightbulb size={11} className="text-yellow-400 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hints</span>
                    {hintsRevealed > 0 && <span className="ml-auto text-[10px] text-zinc-600 tabular-nums">{hintsRevealed}/{problem.hints.length}</span>}
                  </div>
                  <div className="px-3 py-2.5 space-y-2.5">
                    {hintsRevealed === 0 ? (
                      <p className="text-[11px] text-zinc-600 italic">Try on your own first. Reveal hints only when stuck.</p>
                    ) : (
                      problem.hints.slice(0, hintsRevealed).map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                          <span className="text-yellow-400/80 flex-shrink-0 font-bold mt-0.5 text-[10px]">{i + 1}.</span>
                          <span>{h}</span>
                        </div>
                      ))
                    )}
                    {hintsRevealed < problem.hints.length && (
                      <button onClick={() => setHintsRevealed(n => n + 1)}
                        className="w-full flex items-center gap-1.5 justify-center text-[11px] px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors font-semibold">
                        <Lightbulb size={11} />{hintsRevealed === 0 ? 'Show first hint' : 'Show next hint'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ─── FRAMEWORK TAB ─── */}
            {leftTab === 'framework' && (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-600 px-0.5 pb-0.5">FAANG interview structure · 45 min total</p>
                {timerStarted && (
                  <div className="flex gap-1 px-0.5 mb-3">
                    {PHASES.map(p => (
                      <div key={p.step} title={p.name}
                        className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${(phase?.step ?? 0) >= p.step ? p.bg : 'bg-zinc-800'}`} />
                    ))}
                  </div>
                )}
                {FRAMEWORK_STEPS.map((step, i) => (
                  <div key={step.num} className={`border rounded-xl transition-all ${step.bg} ${phase?.step === i + 1 ? 'shadow-lg' : ''}`}>
                    <div className="px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xl font-extrabold opacity-20 ${step.color} tabular-nums leading-none`}>{step.num}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${step.color}`}>{step.title}</p>
                          <p className="text-[10px] text-zinc-600">{step.time}</p>
                        </div>
                        {phase?.step === i + 1 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-300 font-bold flex-shrink-0">NOW</span>}
                      </div>
                      <ul className="space-y-1">
                        {step.tips.map(tip => (
                          <li key={tip} className="flex items-start gap-1.5 text-[11px] text-zinc-400 leading-snug">
                            <span className={`${step.color} mt-0.5 flex-shrink-0 text-[9px]`}>→</span>{tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── COMPONENTS TAB ─── */}
            {leftTab === 'components' && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-600 px-0.5 pb-1">Click a component to insert its template into your written answer.</p>
                {ARCH_COMPONENTS.map(c => (
                  <button key={c.label}
                    onClick={() => { insertAt('\n' + c.snippet); setRightTab('write'); if (mobilePane !== 'answer') setMobilePane('answer') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/70 transition-all text-left group">
                    <span className="text-base leading-none flex-shrink-0">{c.icon}</span>
                    <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-100 transition-colors flex-1 min-w-0">{c.label}</span>
                    <ChevronRight size={11} className="text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            )}

          </div>
        </aside>

        {/* Collapsed sidebar expander */}
        {!leftOpen && (
          <button onClick={() => setLeftOpen(true)} title="Open problem panel"
            className="hidden xl:flex w-8 flex-shrink-0 border-r border-zinc-800 flex-col items-center justify-center gap-2 hover:bg-zinc-900 transition-colors cursor-pointer group">
            <ListChecks size={13} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            <ChevronRight size={12} className="text-zinc-800 group-hover:text-zinc-500 transition-colors" />
          </button>
        )}

        {/* ═══ CANVAS ══════════════════════════════════════════════════════ */}
        <main className={`${mobilePane === 'canvas' ? 'flex' : 'hidden'} xl:flex flex-1 min-w-0 min-h-0 flex-col p-2`}>
          <SystemCanvas fill storageKey={canvasKey} resetKey={canvasResetKey} onChange={handleCanvasChange} onInteract={autoStartTimer} />
        </main>

        {/* Resize handle */}
        <div onMouseDown={onResizeStart}
          className="hidden xl:flex w-1.5 flex-shrink-0 cursor-col-resize items-center justify-center group relative z-10 hover:bg-orange-500/20 transition-colors"
          title="Drag to resize">
          <GripVertical size={12} className="text-zinc-700 group-hover:text-orange-400 transition-colors" />
        </div>

        {/* ═══ RIGHT PANEL ═════════════════════════════════════════════════ */}
        <aside style={isDesktop ? { width: rightWidth } : {}}
          className={`${mobilePane === 'answer' ? 'flex' : 'hidden'} xl:flex flex-col w-full xl:flex-shrink-0 border-l border-zinc-800 bg-zinc-950 min-h-0`}>

          {/* Tab bar */}
          <div className="h-11 flex items-center gap-2 px-2 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              {([
                { id: 'write'   as RightTab, icon: <PenLine size={11} />, label: 'Write'   },
                { id: 'code'    as RightTab, icon: <Code2 size={11} />,   label: 'Code'    },
                { id: 'preview' as RightTab, icon: <Eye size={11} />,     label: 'Preview' },
              ]).map(t => (
                <button key={t.id} onClick={() => setRightTab(t.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    rightTab === t.id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            {savedAt && (
              <span className="ml-auto text-[10px] text-zinc-700 flex items-center gap-1">
                <Save size={9} />{proStatus?.authenticated ? 'saved to account' : 'saved'}
              </span>
            )}
          </div>

          {/* ── WRITE TAB ──────────────────────────────────────────────────── */}
          {rightTab === 'write' && (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/60 overflow-x-auto">
                <div className="flex items-center gap-0.5 border-r border-zinc-800 pr-2 mr-1">
                  <button onClick={undoEdit} title="Undo (Ctrl+Z)"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all flex-shrink-0">
                    <Undo2 size={12} />
                  </button>
                  <button onClick={redoEdit} title="Redo (Ctrl+Shift+Z)"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all flex-shrink-0">
                    <Redo2 size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-0.5 border-r border-zinc-800 pr-2 mr-1">
                  {[
                    { icon: <Heading2 size={12} />, label: 'H2',      action: () => insertAt('\n## ')          },
                    { icon: <Heading3 size={12} />, label: 'H3',      action: () => insertAt('\n### ')         },
                    { icon: <Bold size={12} />,     label: 'Bold',    action: () => wrap('**', '**')           },
                    { icon: <List size={12} />,     label: 'List',    action: () => insertAt('\n- ')           },
                    { icon: <Minus size={12} />,    label: 'Divider', action: () => insertAt('\n\n---\n\n')    },
                    { icon: <Code2 size={12} />,    label: 'Code',    action: () => insertAt('\n```sql\n\n```\n') },
                  ].map(({ icon, label, action }) => (
                    <button key={label} onClick={action} title={label}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all flex-shrink-0">
                      {icon}
                    </button>
                  ))}
                </div>

                {/* Section jump */}
                {SECTION_JUMPS.map(s => (
                  <button key={s.label} onClick={() => jumpToSection(s.heading)} title={`Jump to ${s.label}`}
                    className="flex items-center gap-0.5 px-1.5 h-7 rounded-md text-[10px] text-zinc-600 hover:text-orange-400 hover:bg-zinc-800 transition-all font-semibold flex-shrink-0">
                    <Hash size={8} />{s.label}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-2 flex-shrink-0 pl-1">
                  <span className="text-[10px] text-zinc-700 tabular-nums font-mono">{wordCount}w</span>
                  {problem.hints && problem.hints.length > 0 && (
                    <button onClick={() => setShowHints(v => !v)} title="Toggle hints panel"
                      className={`flex items-center gap-1 px-2 h-7 rounded-md text-[10px] font-semibold transition-all flex-shrink-0 ${showHints ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-orange-400 hover:bg-zinc-800'}`}>
                      <Lightbulb size={11} />Hints
                    </button>
                  )}
                </div>
              </div>

              {/* ── Section progress strip ────────────────────────────────── */}
              <div className="flex items-end gap-1 px-3 py-2 border-b border-zinc-800/60 flex-shrink-0 bg-zinc-900/20 overflow-x-auto scrollbar-none">
                {SECTION_PROGRESS.map(s => {
                  const words = sectionWords[s.num] ?? 0
                  const level = words > 80 ? 2 : words > 25 ? 1 : 0
                  return (
                    <button key={s.num}
                      onClick={() => jumpToSection(s.partialH)}
                      title={`${s.fullLabel} · ${words} words`}
                      className="flex flex-col items-center gap-0.5 min-w-0 flex-1 group cursor-pointer">
                      <span className={`text-[8px] font-semibold transition-colors whitespace-nowrap leading-none ${
                        level === 2 ? 'text-zinc-400' : level === 1 ? 'text-zinc-600' : 'text-zinc-700'
                      } group-hover:text-zinc-400`}>{words > 0 ? words : ''}</span>
                      <div
                        className="h-[3px] rounded-full w-full transition-all duration-300"
                        style={{ opacity: level === 0 ? 1 : 1 }}
                        data-level={level}
                      >
                        <div className={`h-full rounded-full transition-all duration-300 ${level > 0 ? s.dot : 'bg-zinc-800'}`}
                          style={{ opacity: level === 1 ? 0.35 : 1 }} />
                      </div>
                      <span className={`text-[8.5px] font-medium transition-colors whitespace-nowrap ${
                        level === 2 ? 'text-zinc-400' : 'text-zinc-600'
                      } group-hover:text-zinc-300`}>{s.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* ── Quick-start guide (auto-hides once user starts writing) ── */}
              {wordCount < 20 && (
                <div className="flex-shrink-0 border-b border-zinc-800/60 bg-zinc-900/30 px-3 py-2.5">
                  <p className="text-[10px] text-zinc-500 mb-2 font-semibold uppercase tracking-wide">What to write in each section — click to jump</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { heading: '## 1. Requirements Clarification',         label: 'Requirements', hint: '3 functional reqs · latency SLA · scale · out-of-scope' },
                      { heading: '## 2. Capacity Estimation',                label: 'Capacity',     hint: 'DAU → QPS (÷86,400) → storage/day → bandwidth' },
                      { heading: '## 3. High-Level Architecture',            label: 'Architecture', hint: 'Components · data flow · DB choice · justification' },
                      { heading: '## 4. Core Component Design',              label: 'Core Design',  hint: 'Deep dive 2-3 components · schemas · APIs · failure modes' },
                      { heading: '## 7. Scalability & Performance',          label: 'Scalability',  hint: 'Bottlenecks · caching · sharding · 10× load plan' },
                      { heading: '## 9. Trade-offs & Alternatives Considered', label: 'Trade-offs', hint: "Alternatives rejected · CAP trade-off · what you'd change" },
                    ].map(s => (
                      <button key={s.heading} onClick={() => jumpToSection(s.heading)}
                        className="flex flex-col gap-0.5 px-2.5 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-lg text-left transition-all group">
                        <span className="text-[10px] font-bold text-zinc-300 group-hover:text-zinc-100 transition-colors">{s.label}</span>
                        <span className="text-[9px] text-zinc-600 leading-tight group-hover:text-zinc-500 transition-colors">{s.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Hints panel ───────────────────────────────────────────── */}
              {showHints && problem.hints && problem.hints.length > 0 && (
                <div className="border-b border-zinc-800 bg-zinc-900/40 flex-shrink-0 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 sticky top-0 bg-zinc-900/90 backdrop-blur-sm">
                    <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1.5">
                      <Lightbulb size={11} /> Key Areas to Cover
                    </span>
                    <button onClick={() => setShowHints(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors"><X size={12} /></button>
                  </div>
                  <div className="px-3 py-2.5 space-y-1.5">
                    {problem.hints.map((hint, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-orange-400/60 font-bold text-[10px] tabular-nums mt-0.5 flex-shrink-0">{i + 1}.</span>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{hint}</p>
                      </div>
                    ))}
                    {problem.keyAreas && problem.keyAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800/60 mt-2">
                        {problem.keyAreas.map((area, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500">{area}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Improved textarea ─────────────────────────────────────── */}
              <textarea
                ref={textareaRef}
                value={design}
                onChange={e => handleDesignChange(e.target.value)}
                onKeyDown={handleWriteKeyDown}
                spellCheck={false}
                placeholder="Start writing your system design…"
                className="flex-1 min-h-0 w-full bg-zinc-950 px-5 py-4 text-[13.5px] text-zinc-100 font-mono leading-7 resize-none outline-none placeholder-zinc-700 selection:bg-orange-500/25"
                style={{ tabSize: 2, fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace' }}
              />
            </>
          )}

          {/* ── CODE TAB ───────────────────────────────────────────────────── */}
          {rightTab === 'code' && (
            <div className="flex flex-col flex-1 min-h-0 relative">

              {/* Snippet tab bar */}
              <div className="flex items-center border-b border-zinc-800 bg-zinc-900/40 flex-shrink-0 overflow-x-auto">
                {snippets.map(s => (
                  <div key={s.id}
                    className={`flex items-center flex-shrink-0 border-r border-zinc-800 transition-colors ${activeId === s.id ? 'bg-zinc-950' : 'hover:bg-zinc-900/60'}`}
                    style={activeId === s.id ? { borderBottom: '2px solid #f97316' } : {}}>
                    {renamingId === s.id ? (
                      <input autoFocus value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onBlur={() => commitRename(s.id)}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(s.id); if (e.key === 'Escape') setRenamingId(null) }}
                        className="px-3 py-2 bg-transparent text-xs text-zinc-200 outline-none w-28"
                      />
                    ) : (
                      <button onClick={() => setActiveId(s.id)} onDoubleClick={() => { setRenamingId(s.id); setRenameVal(s.name) }}
                        title="Double-click to rename"
                        className={`px-3 py-2 text-[11px] font-medium transition-colors ${activeId === s.id ? 'text-zinc-100' : 'text-zinc-500'}`}>
                        {s.name}
                      </button>
                    )}
                    {snippets.length > 1 && (
                      <button onClick={() => deleteSnippet(s.id)} className="pr-2 pl-0 text-zinc-700 hover:text-red-400 transition-colors">
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addSnippet} title="New snippet"
                  className="flex items-center gap-1 px-2.5 py-2 text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0">
                  <Plus size={11} />
                </button>

                {activeSnippet && (
                  <div className="ml-auto flex items-center gap-1 px-2 flex-shrink-0">
                    {/* Templates button */}
                    <button onClick={() => setShowCodeTemplates(v => !v)} title="Starter templates"
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${showCodeTemplates ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}>
                      <FlaskConical size={10} /> Templates
                    </button>
                    {/* Copy button */}
                    <button onClick={copyCode} title="Copy code"
                      className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                      {codeCopied ? <ClipboardCheck size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                    {/* Language select */}
                    <select value={activeSnippet.language} onChange={e => handleLangChange(e.target.value as CodeLang)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] rounded-md px-2 py-0.5 outline-none cursor-pointer">
                      {CODE_LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Editor area — absolute inner div so height="100%" resolves reliably */}
              {activeSnippet && (
                <div className="flex-1 min-h-0 relative" style={{ minHeight: 200 }}>
                  <div className="absolute inset-0">
                  <MonacoEditor
                    key={activeId}
                    height="100%"
                    language={activeSnippet.language}
                    defaultValue={activeSnippet.code}
                    onChange={val => handleCodeChange(val ?? '')}
                    onMount={(editor, monaco) => {
                      monacoEditorRef.current = editor
                      setTimeout(() => editor.focus(), 60)
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                        document.getElementById('sd-check-code-btn')?.click()
                      })
                    }}
                    theme="vs-dark"
                    options={{
                      fontSize: 13,
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      lineNumbers: 'on' as const,
                      readOnly: false,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'off' as const,
                      padding: { top: 14, bottom: 14 },
                      lineHeight: 22,
                      glyphMargin: false,
                      folding: true,
                      foldingHighlight: true,
                      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6, alwaysConsumeMouseWheel: false },
                      tabSize: 4,
                      insertSpaces: true,
                      detectIndentation: false,
                      autoIndent: 'full' as const,
                      formatOnType: false,
                      formatOnPaste: true,
                      tabCompletion: 'on' as const,
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: { other: true, comments: false, strings: false },
                      acceptSuggestionOnEnter: 'smart' as const,
                      acceptSuggestionOnCommitCharacter: false,
                      renderWhitespace: 'selection' as const,
                      bracketPairColorization: { enabled: true },
                      guides: { indentation: true, bracketPairs: true },
                      cursorBlinking: 'smooth' as const,
                      cursorSmoothCaretAnimation: 'on' as const,
                      smoothScrolling: true,
                    }}
                  />
                  </div>

                  {/* Templates panel — slides in over the editor */}
                  {showCodeTemplates && (
                    <div className="absolute inset-0 flex z-10">
                      <div className="flex-1" onClick={() => setShowCodeTemplates(false)} />
                      <div className="w-64 bg-zinc-900 border-l border-zinc-700 flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800 flex-shrink-0">
                          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                            <FlaskConical size={12} className="text-orange-400" /> Starter Templates
                          </span>
                          <button onClick={() => setShowCodeTemplates(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                          {CODE_TEMPLATES.map(t => (
                            <button key={t.label} onClick={() => insertTemplate(t)}
                              className="w-full flex items-start gap-2.5 px-3 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl text-left transition-all group">
                              <span className="text-lg leading-none mt-0.5 flex-shrink-0">{t.icon}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">{t.label}</p>
                                <p className="text-[10px] text-zinc-600 mt-0.5">{t.desc} · {t.language}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="px-3 py-2 border-t border-zinc-800 flex-shrink-0">
                          <p className="text-[10px] text-zinc-700">Click a template to replace current snippet</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Code check results panel */}
              {codeCheckOpen && codeCheck && (
                <div className="border-t border-zinc-800 bg-zinc-900/60 flex-shrink-0 max-h-52 overflow-y-auto">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${GRADE_CONFIG[codeCheck.grade]?.bg ?? 'bg-zinc-800 border-zinc-700'} ${GRADE_CONFIG[codeCheck.grade]?.color ?? 'text-zinc-400'}`}>
                        {codeCheck.correct ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
                        Grade {codeCheck.grade} · {codeCheck.correct ? 'Correct' : 'Has Issues'}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        Time {codeCheck.complexity.time} · Space {codeCheck.complexity.space}
                      </span>
                    </div>
                    <button onClick={() => setCodeCheckOpen(false)} className="text-zinc-700 hover:text-zinc-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="px-3 py-2.5 space-y-2.5">
                    {codeCheck.summary && (
                      <p className="text-xs text-zinc-400 leading-relaxed">{codeCheck.summary}</p>
                    )}
                    {codeCheck.issues.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><AlertCircle size={9} />Issues</p>
                        <ul className="space-y-1">
                          {codeCheck.issues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-400 leading-snug">
                              <span className="text-red-400 shrink-0 mt-0.5">→</span>{issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {codeCheck.suggestions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><CheckCircle size={9} />Suggestions</p>
                        <ul className="space-y-1">
                          {codeCheck.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-400 leading-snug">
                              <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status bar */}
              <div className="flex items-center px-3 py-1.5 border-t border-zinc-800 flex-shrink-0 text-[10px] text-zinc-600 gap-2">
                <span className="tabular-nums">{snippets.length} snippet{snippets.length !== 1 ? 's' : ''} · {codeLines} lines</span>
                <span className="text-zinc-800">·</span>
                <span className="text-zinc-700">Dbl-click tab to rename</span>
                <button id="sd-check-code-btn" onClick={handleCheckCode}
                  disabled={checkingCode || !activeSnippet?.code.trim()}
                  title="Check Code (Ctrl+Enter)"
                  className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold transition-all shadow-sm shadow-orange-500/25">
                  {checkingCode
                    ? <><Loader2 size={10} className="animate-spin" /> Checking…</>
                    : <><Sparkles size={10} /> Check Code</>}
                </button>
              </div>
            </div>
          )}

          {/* ── PREVIEW TAB ────────────────────────────────────────────────── */}
          {rightTab === 'preview' && (
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 max-w-[680px]">
              {design.trim()
                ? <div className="prose-custom leading-7 text-[14px]" dangerouslySetInnerHTML={{ __html: mdToHtml(design) }} />
                : <p className="text-zinc-600 italic text-sm">Nothing written yet.</p>}

              {snippets.some(s => s.code.trim()) && (
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 size={11} />Code Snippets
                  </p>
                  {snippets.filter(s => s.code.trim()).map(s => (
                    <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800">
                        <span className="text-[11px] font-semibold text-zinc-300">{s.name}</span>
                        <span className="text-[10px] text-zinc-600 uppercase font-mono">{s.language}</span>
                      </div>
                      <pre className="px-4 py-3 text-[12.5px] text-orange-200 font-mono overflow-x-auto leading-6 whitespace-pre">{s.code}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status bar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-zinc-800 flex-shrink-0 text-[10px] text-zinc-600">
            <span className="tabular-nums">{wordCount}w</span>
            <span className="text-zinc-800">·</span>
            <span className="tabular-nums">{diagramNodes} nodes</span>
            {codeLines > 0 && <><span className="text-zinc-800">·</span><span className="tabular-nums">{codeLines} lines</span></>}
            <span className="text-zinc-800">·</span>
            <span className={coveredCount === problem.keyAreas.length ? 'text-emerald-500 font-semibold' : ''}>{coveredCount}/{problem.keyAreas.length} covered</span>
            {bestScore && <><span className="text-zinc-800">·</span><span className={`font-semibold ${GRADE_CONFIG[bestScore.grade]?.color ?? ''}`}>Best {bestScore.score}/10</span></>}
            <span className="ml-auto flex items-center gap-1 text-orange-500/40"><Sparkles size={8} />AI reads all three</span>
          </div>
        </aside>
      </div>

      {/* ═══ PROBLEM EXPAND MODAL ══════════════════════════════════════════ */}
      {problemExpanded && (
        <>
          <div onClick={() => setProblemExpanded(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm z-40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl max-h-[88vh] flex flex-col bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-800 flex-shrink-0">
              <div>
                <p className="text-sm font-bold text-zinc-100">{problem.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${problem.difficulty === 'Hard' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'}`}>{problem.difficulty}</span>
                  <span className="text-[10px] text-zinc-600">Asked at: {problem.companies.slice(0, 4).join(', ')}</span>
                </div>
              </div>
              <button onClick={() => setProblemExpanded(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex-shrink-0"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: mdToHtml(problem.problem) }} />
              <div className="px-6 pb-6">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Scale &amp; Constraints</p>
                <ul className="space-y-2">
                  {problem.constraints.map(c => (
                    <li key={c} className="flex items-start gap-2 text-sm text-zinc-400 leading-snug">
                      <span className="text-orange-400/80 flex-shrink-0 mt-0.5">▸</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-zinc-800 flex-shrink-0">
              <button onClick={() => setProblemExpanded(false)} className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors">Back to Editor</button>
            </div>
          </div>
        </>
      )}

      {/* ═══ AI REVIEW DRAWER ═══════════════════════════════════════════════ */}
      {reviewOpen && review && (
        <>
          <div onClick={() => setReviewOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl">
            <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 flex-shrink-0">
              <span className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Sparkles size={14} className="text-orange-400" />AI Review
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={handleExportPdf} disabled={exportingPdf}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors disabled:opacity-60"
                  title="Download this graded design as a PDF">
                  {exportingPdf ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  PDF
                </button>
                <button onClick={() => setReviewOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"><X size={15} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-5 flex items-center gap-5 border-b border-zinc-800 bg-gradient-to-b from-zinc-900/50 to-transparent">
                <div className="relative w-[88px] h-[88px] flex-shrink-0">
                  <svg width="88" height="88" viewBox="0 0 100 100" className="-rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="9" />
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={gradeColor[review.grade] ?? '#eab308'} strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - review.overallScore / 10)} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-zinc-100 leading-none">{review.overallScore}</span>
                    <span className="text-[10px] text-zinc-500 font-bold">/10</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${GRADE_CONFIG[review.grade]?.color ?? ''} ${GRADE_CONFIG[review.grade]?.bg ?? ''}`}>
                      <Award size={12} />Grade {review.grade} · {GRADE_CONFIG[review.grade]?.label ?? ''}
                    </span>
                    {scoreHistory.length >= 2 && (() => {
                      const prev  = scoreHistory[scoreHistory.length - 2].score
                      const delta = review.overallScore - prev
                      if (delta === 0) return null
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-bold ${delta > 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}>
                          {delta > 0 ? '↑' : '↓'} {prev} → {review.overallScore}
                        </span>
                      )
                    })()}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed mt-2.5">{review.summary}</p>
                </div>
              </div>

              {/* Score history */}
              {scoreHistory.length > 1 && (
                <div className="px-5 py-3 border-b border-zinc-800">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Your Attempts</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {scoreHistory.map((h, i) => {
                      const gc = GRADE_CONFIG[h.grade]
                      return (
                        <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${gc?.bg ?? 'bg-zinc-800 border-zinc-700'} ${gc?.color ?? 'text-zinc-400'}`}>
                          <span className="text-zinc-600 text-[10px] font-normal">#{i + 1}</span>
                          {h.score}/10
                        </div>
                      )
                    })}
                    <span className="text-[10px] text-zinc-700 ml-1">{scoreHistory.length >= 2 ? (scoreHistory[scoreHistory.length - 1].score > scoreHistory[0].score ? '↑ improving' : scoreHistory[scoreHistory.length - 1].score < scoreHistory[0].score ? '↓ dropped' : '→ same') : ''}</span>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-5">
                {Object.entries(review.sectionScores).some(([, v]) => v !== null) && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Section Scores</p>
                    <div className="space-y-3">
                      {Object.entries(review.sectionScores).map(([key, score]) => {
                        if (score === null) return null
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-zinc-400 w-24 flex-shrink-0">{SECTION_LABELS[key] ?? key}</span>
                              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${score * 10}%` }} />
                              </div>
                              <span className={`text-[11px] font-bold w-8 text-right tabular-nums ${score >= 8 ? 'text-emerald-400' : score >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>{score}/10</span>
                            </div>
                            {score < 8 && SECTION_TIPS[key] && (
                              <p className="text-[10px] text-zinc-500 ml-[108px] leading-snug italic">→ {score < 5 ? SECTION_TIPS[key].low : SECTION_TIPS[key].mid}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {review.codeQuality && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Code2 size={11} />Code Quality</p>
                      <span className={`text-xs font-bold ${review.codeQuality.score >= 8 ? 'text-emerald-400' : review.codeQuality.score >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>{review.codeQuality.score}/10</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-2.5">
                      <div className={`h-full rounded-full ${review.codeQuality.score >= 8 ? 'bg-emerald-500' : review.codeQuality.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${review.codeQuality.score * 10}%` }} />
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{review.codeQuality.notes}</p>
                  </div>
                )}

                {review.strengths.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><CheckCircle size={11} />Strengths</p>
                    <ul className="space-y-2">
                      {review.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-snug"><CheckCircle size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {review.gaps.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><AlertCircle size={11} />Gaps to Fix</p>
                    <ul className="space-y-2">
                      {review.gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-snug"><AlertCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl px-4 py-3.5">
                  <p className="text-[10px] font-bold text-orange-400 mb-2 flex items-center gap-1.5"><Target size={11} />Top Priority Improvement</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">{review.topSuggestion}</p>
                </div>

                {review.interviewerNote && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3.5">
                    <p className="text-[10px] font-bold text-zinc-500 mb-2 flex items-center gap-1.5"><Building2 size={10} />What the interviewer would say</p>
                    <p className="text-sm text-zinc-400 italic leading-relaxed">&ldquo;{review.interviewerNote}&rdquo;</p>
                  </div>
                )}

                {/* ── Interviewer follow-up questions ──────────────────────── */}
                {review.followUps && review.followUps.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <MessageSquare size={11} />Interviewer would ask next
                    </p>
                    <div className="space-y-2">
                      {review.followUps.map((f, i) => (
                        <div key={i} className="bg-blue-500/5 border border-blue-500/20 rounded-xl overflow-hidden">
                          <button onClick={() => setOpenFollowUp(openFollowUp === i ? null : i)}
                            className="w-full flex items-start gap-2.5 px-3.5 py-3 text-left hover:bg-blue-500/5 transition-colors">
                            <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">Q{i + 1}</span>
                            <span className="flex-1 text-sm text-zinc-200 leading-snug font-medium">{f.question}</span>
                            {f.whatStrongAnswersCover && (
                              <ChevronRight size={13} className={`text-zinc-600 shrink-0 mt-0.5 transition-transform duration-200 ${openFollowUp === i ? 'rotate-90' : ''}`} />
                            )}
                          </button>
                          {openFollowUp === i && f.whatStrongAnswersCover && (
                            <div className="px-3.5 pb-3 pl-11">
                              <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider mb-1">A strong answer covers</p>
                              <p className="text-xs text-zinc-400 leading-relaxed">{f.whatStrongAnswersCover}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expert approach spoiler */}
                {problem.keyAreas.length > 0 && (
                  <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl overflow-hidden">
                    <button onClick={() => setShowExpert(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800/50 transition-colors">
                      <span className="flex items-center gap-2">
                        <BookOpen size={14} className="text-orange-400" />
                        See expert approach
                      </span>
                      <ChevronRight size={14} className={`transition-transform duration-200 text-zinc-600 ${showExpert ? 'rotate-90' : ''}`} />
                    </button>
                    {showExpert && (
                      <div className="px-4 pb-4 border-t border-zinc-800 space-y-3">
                        <p className="text-[10px] text-zinc-600 pt-3 italic">Key areas a senior engineer would cover:</p>
                        <div className="space-y-2">
                          {problem.keyAreas.map((area, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              <span className="text-xs text-zinc-300 leading-relaxed">{area}</span>
                            </div>
                          ))}
                        </div>
                        {problem.hints.length > 0 && (
                          <>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pt-1">Key considerations</p>
                            <ul className="space-y-1.5">
                              {problem.hints.map((h, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-snug">
                                  <span className="text-yellow-400/70 font-bold shrink-0 mt-0.5">→</span>{h}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button onClick={() => handleReview()} disabled={reviewing || proStatus === null}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors disabled:opacity-60">
                  {reviewing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {reviewing ? 'Reviewing…' : 'Re-run Review'}
                </button>

                {/* ── Reference solution — Pro sees it, free users get a locked teaser ── */}
                {proStatus?.isSubscribed ? (
                  <div className="bg-zinc-900/50 border border-violet-500/25 rounded-xl overflow-hidden">
                    <button onClick={loadReference} disabled={refLoading}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800/50 transition-colors disabled:opacity-60">
                      <span className="flex items-center gap-2">
                        {refLoading ? <Loader2 size={14} className="animate-spin text-violet-400" /> : <Award size={14} className="text-violet-400" />}
                        {refLoading ? 'Generating model answer…' : reference ? 'Reference Solution' : 'View Reference Solution'}
                      </span>
                      {reference && <ChevronRight size={14} className={`transition-transform duration-200 text-zinc-600 ${refOpen ? 'rotate-90' : ''}`} />}
                    </button>
                    {refError && <p className="px-4 pb-3 text-xs text-red-400">{refError}</p>}
                    {reference && refOpen && (
                      <div className="px-4 pb-4 border-t border-zinc-800 space-y-4">
                        <p className="text-[10px] text-violet-400/80 pt-3 font-bold uppercase tracking-wider">Staff-engineer model answer</p>

                        {reference.overview && (
                          <p className="text-sm text-zinc-300 leading-relaxed">{reference.overview}</p>
                        )}

                        {reference.architecture.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Architecture</p>
                            <div className="space-y-2">
                              {reference.architecture.map((a, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-md bg-violet-500/15 text-violet-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                  <p className="text-xs text-zinc-300 leading-relaxed"><span className="font-bold text-zinc-100">{a.title}</span>{a.detail ? ` — ${a.detail}` : ''}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {reference.dataModel && (
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Data Model</p>
                            <p className="text-xs text-zinc-300 leading-relaxed">{reference.dataModel}</p>
                          </div>
                        )}

                        {reference.scaling.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Scaling & Bottlenecks</p>
                            <ul className="space-y-1.5">
                              {reference.scaling.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-snug">
                                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">↑</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {reference.tradeoffs.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Key Trade-offs</p>
                            <div className="space-y-2">
                              {reference.tradeoffs.map((t, i) => (
                                <div key={i} className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg px-3 py-2">
                                  <p className="text-xs font-semibold text-zinc-200">{t.title}</p>
                                  {t.detail && <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{t.detail}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {reference.walkthrough && (
                          <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2.5">
                            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1.5">How to present it</p>
                            <p className="text-xs text-zinc-300 leading-relaxed">{reference.walkthrough}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : proStatus?.authenticated ? (
                  <button onClick={() => setShowPaywall(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-700 hover:border-violet-500/40 text-sm font-semibold text-zinc-300 transition-colors group">
                    <span className="flex items-center gap-2">
                      <Award size={14} className="text-violet-400" /> Reference Solution
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/25 px-2 py-0.5 rounded-full">
                      <Crown size={10} /> PRO
                    </span>
                  </button>
                ) : null}

                {/* ── Pro upsell — free users only, right when motivation is highest ── */}
                {proStatus?.authenticated && !proStatus.isSubscribed && (
                  <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/5 border border-orange-500/25 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown size={13} className="text-orange-400" />
                      <p className="text-xs font-bold text-orange-300">
                        {(proStatus.freeUsed ?? 0) >= (proStatus.freeLimit ?? 2)
                          ? 'That was your last free review'
                          : `${(proStatus.freeLimit ?? 2) - (proStatus.freeUsed ?? 0)} free review${(proStatus.freeLimit ?? 2) - (proStatus.freeUsed ?? 0) !== 1 ? 's' : ''} left`}
                      </p>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {['15 AI reviews every day', 'Staff-engineer reference solution for every problem', 'Track score improvement across attempts'].map(t => (
                        <li key={t} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <CheckCircle size={10} className="text-emerald-400 shrink-0" /> {t}
                        </li>
                      ))}
                    </ul>
                    <Link href="/upgrade"
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition-colors">
                      <Zap size={12} /> Upgrade to Pro — ₹999/30 days
                    </Link>
                  </div>
                )}

                {/* ── Practice More recommendations ──────────────────────── */}
                {(() => {
                  const related = SYSTEM_DESIGN_PROBLEMS
                    .filter(p => p.slug !== problem.slug && p.category === problem.category)
                    .slice(0, 3)
                  if (!related.length) return null
                  return (
                    <div className="border-t border-zinc-800 pt-4 space-y-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase size={10} />Practice More · {problem.category}
                      </p>
                      {related.map(p => (
                        <Link key={p.slug} href={`/system-design/${p.slug}`}
                          className="flex items-center justify-between gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all group">
                          <p className="text-[11px] font-semibold text-zinc-400 group-hover:text-zinc-200 leading-snug truncate transition-colors">{p.title}</p>
                          <ChevronRight size={11} className="text-zinc-700 group-hover:text-zinc-500 flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )
                })()}

              </div>
            </div>
          </aside>
        </>
      )}


      {/* ═══ PAYWALL MODAL ══════════════════════════════════════════════════ */}
      {showPaywall && (
        <>
          <div onClick={() => { setShowPaywall(false); setPaywallError('') }} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">

            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                  <Crown size={18} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-100">Unlock AI Reviews</p>
                  <p className="text-[11px] text-zinc-500">You&apos;ve used all {proStatus?.freeLimit ?? 2} free reviews — pick a plan to continue</p>
                </div>
                <button onClick={() => { setShowPaywall(false); setPaywallError('') }} className="ml-auto text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

                {/* SD Pro card */}
                <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={15} className="text-orange-400" />
                    <span className="text-sm font-bold text-zinc-100">System Design Pro</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <span className="text-2xl font-extrabold text-zinc-100">₹999</span>
                    <span className="text-zinc-500 text-xs">/ 30 days</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 mb-4">One-time · No auto-renewal</p>
                  <ul className="space-y-2 mb-5 flex-1">
                    {[
                      { icon: <Zap size={11} className="text-orange-400" />,           text: '15 AI Reviews / day' },
                      { icon: <ShieldCheck size={11} className="text-emerald-400" />,  text: 'Section scores & strengths/gaps' },
                      { icon: <RefreshCw size={11} className="text-blue-400" />,       text: 'Re-run after fixing your answer' },
                      { icon: <Sparkles size={11} className="text-violet-400" />,      text: 'Interviewer perspective note' },
                    ].map(({ icon, text }) => (
                      <li key={text} className="flex items-start gap-2 text-[11.5px] text-zinc-300">
                        <span className="flex-shrink-0 mt-0.5">{icon}</span>
                        <span className="leading-snug">{text}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePurchase('sd_pro')}
                    disabled={purchasing}
                    className="w-full py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-zinc-100 font-semibold text-xs transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {purchasing && selectedPlan === 'sd_pro'
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Crown size={13} />}
                    {purchasing && selectedPlan === 'sd_pro' ? 'Opening payment…' : 'Get SD Pro — ₹999'}
                  </button>
                </div>

                {/* Full Bundle card */}
                <div className="relative rounded-xl border border-orange-500/60 bg-orange-500/5 p-5 flex flex-col">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full tracking-wide">BEST VALUE</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 mt-1">
                    <Star size={15} className="text-orange-400" />
                    <span className="text-sm font-bold text-zinc-100">Interview Prep Kit</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <span className="text-2xl font-extrabold text-orange-400">₹1499</span>
                    <span className="text-zinc-500 text-xs">/ 30 days</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 mb-4">One-time · No auto-renewal</p>
                  <ul className="space-y-2 mb-5 flex-1">
                    {[
                      { icon: <Zap size={11} className="text-orange-400" />,          text: 'Everything in SD Pro' },
                      { icon: <FileText size={11} className="text-sky-400" />,         text: 'Resume Analyzer — unlimited' },
                      { icon: <Sparkles size={11} className="text-violet-400" />,      text: 'Cover Letter Generator — unlimited' },
                      { icon: <Briefcase size={11} className="text-emerald-400" />,    text: 'LinkedIn Optimizer — unlimited' },
                      { icon: <Star size={11} className="text-yellow-400" />,          text: 'Mock Interviews — unlimited' },
                      { icon: <ShieldCheck size={11} className="text-teal-400" />,     text: 'All Career AI Tools — unlimited' },
                    ].map(({ icon, text }) => (
                      <li key={text} className="flex items-start gap-2 text-[11.5px] text-zinc-200">
                        <span className="flex-shrink-0 mt-0.5">{icon}</span>
                        <span className="leading-snug">{text}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePurchase('full_bundle')}
                    disabled={purchasing}
                    className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-bold text-xs transition-all disabled:opacity-60 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    {purchasing && selectedPlan === 'full_bundle'
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Star size={13} />}
                    {purchasing && selectedPlan === 'full_bundle' ? 'Opening payment…' : 'Get Interview Prep Kit — ₹1499'}
                  </button>
                </div>
              </div>

              {paywallError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                  <p className="text-[11px] text-red-300 mb-2.5">{paywallError}</p>
                  <a
                    href={WA_PAYMENT_URL(selectedPlan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
                  >
                    <MessageSquare size={13} /> Pay via WhatsApp instead
                  </a>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-600">
                <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-zinc-700" /> Secure · Razorpay</span>
                <span>·</span>
                <span>Instant activation</span>
                <span>·</span>
                <a
                  href="https://wa.me/919997600372?text=Hi%20Aman!%20I%20need%20help%20with%20a%20payment%20for%20the%20system%20design%20platform."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5"
                >
                  <MessageSquare size={10} /> Need help?
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ DAILY LIMIT MODAL ══════════════════════════════════════════════ */}
      {showDailyLimit && (() => {
        const isFullBundle = proStatus?.plan === 'full_bundle'
        return (
          <>
            <div onClick={() => setShowDailyLimit(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-orange-400" />
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <Crown size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">Daily Limit Reached</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        You&apos;ve used all 15 AI reviews today
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowDailyLimit(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0 mt-0.5">
                    <X size={16} />
                  </button>
                </div>

                {/* Countdown */}
                <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-zinc-800/60 border border-zinc-700">
                  <div className="text-center min-w-[56px]">
                    <p className="text-2xl font-extrabold text-zinc-100 tabular-nums leading-none">{dailyCountdown}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">until reset</p>
                  </div>
                  <div className="w-px h-10 bg-zinc-700 flex-shrink-0" />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Your 15 reviews reset every day at <span className="text-zinc-200 font-semibold">midnight IST (12:00 AM India time)</span>. Come back then for a fresh set.
                  </p>
                </div>

                {isFullBundle ? (
                  // Highest plan — no upgrade, just close
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                      <p className="text-[11px] text-emerald-300">You&apos;re on our best plan — Interview Prep Kit. Nothing to upgrade!</p>
                    </div>
                    <button onClick={() => setShowDailyLimit(false)}
                      className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition-colors">
                      Got it, see you tomorrow
                    </button>
                  </div>
                ) : (
                  // SD Pro — upsell to Interview Prep Kit for career tools
                  <div className="space-y-3">
                    <p className="text-[11px] text-zinc-500">
                      While you wait, unlock all career tools with Interview Prep Kit:
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        { icon: <FileText size={11} className="text-sky-400" />,        text: 'Resume Analyzer — unlimited' },
                        { icon: <Sparkles size={11} className="text-violet-400" />,     text: 'Cover Letter Generator — unlimited' },
                        { icon: <Briefcase size={11} className="text-emerald-400" />,   text: 'LinkedIn Optimizer — unlimited' },
                        { icon: <Star size={11} className="text-yellow-400" />,         text: 'Mock Interviews — unlimited' },
                      ].map(({ icon, text }) => (
                        <li key={text} className="flex items-center gap-2 text-[11px] text-zinc-300">
                          <span className="flex-shrink-0">{icon}</span>{text}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setShowDailyLimit(false); handlePurchase('full_bundle') }}
                        className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5">
                        <Star size={12} /> Upgrade to Prep Kit — ₹1499
                      </button>
                      <button onClick={() => setShowDailyLimit(false)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold text-xs transition-colors">
                        Later
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      })()}

      {/* ═══ EMPTY CANVAS NUDGE ═════════════════════════════════════════════ */}
      {showCanvasNudge && (
        <>
          <div onClick={() => setShowCanvasNudge(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-orange-500 via-violet-500 to-blue-400" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                    <PenLine size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100">Your architecture canvas is empty</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">The AI grades architecture from your diagram</p>
                  </div>
                </div>
                <button onClick={() => setShowCanvasNudge(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0 mt-0.5">
                  <X size={16} />
                </button>
              </div>
              <p className="text-[12px] text-zinc-400 leading-relaxed mb-5">
                Drag components onto the canvas and connect them to show your design&apos;s data flow. Without a diagram, your <span className="text-orange-300 font-semibold">Architecture</span> score will be blank and the review will be less useful.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowCanvasNudge(false)}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5">
                  <PenLine size={12} /> Let me draw it first
                </button>
                <button onClick={() => handleReview({ skipCanvasNudge: true })}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold text-xs transition-colors">
                  Review anyway
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ PAST REVIEWS HISTORY ═══════════════════════════════════════════ */}
      {showHistory && (
        <>
          <div onClick={() => setShowHistory(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-orange-500 via-violet-500 to-blue-400" />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100">Past AI Reviews</p>
                    <p className="text-[11px] text-zinc-500">Your last {reviewLog.length} review{reviewLog.length === 1 ? '' : 's'} for this problem</p>
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"><X size={16} /></button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {reviewLog.map((entry, i) => {
                  const gc = GRADE_CONFIG[entry.review.grade]
                  return (
                    <button key={entry.ts}
                      onClick={() => { setReview(entry.review); setReviewOpen(true); setShowHistory(false) }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 transition-colors text-left">
                      <div className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center flex-shrink-0 border ${gc?.bg ?? 'bg-zinc-800 border-zinc-700'}`}>
                        <span className={`text-sm font-bold leading-none ${gc?.color ?? 'text-zinc-300'}`}>{entry.review.overallScore}</span>
                        <span className="text-[8px] text-zinc-500 leading-none mt-0.5">/10</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${gc?.color ?? 'text-zinc-300'}`}>Grade {entry.review.grade}</span>
                          {i === 0 && <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 text-[9px] font-semibold">Latest</span>}
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{entry.review.summary}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(entry.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                      <ChevronRight size={15} className="text-zinc-600 flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ NEW SESSION CONFIRM MODAL ══════════════════════════════════════ */}
      {showReset && (
        <>
          <div onClick={() => setShowReset(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <RotateCcw size={18} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-100">Start a New Session?</p>
                  <p className="text-[11px] text-zinc-500">Clears everything for this problem — fresh start</p>
                </div>
                <button onClick={() => setShowReset(false)} className="ml-auto text-zinc-600 hover:text-zinc-300 transition-colors">
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-1.5 mb-5 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700">
                {[
                  'Your written design answer',
                  'Architecture diagram (canvas)',
                  'All code snippets',
                  'Checklist progress',
                  'Timer & score history',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-600 mb-4">Only resets this problem. Other problems are not affected.</p>
              <div className="flex gap-2">
                <button onClick={handleResetSession}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-sm transition-colors">
                  Yes, reset everything
                </button>
                <button onClick={() => setShowReset(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-colors">
                  Keep my work
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ LOGIN PROMPT MODAL ══════════════════════════════════════════════ */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        feature="use AI Review"
        returnPath={`/system-design/${problem.slug}`}
      />

      {/* Error toast */}
      {reviewError && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-start gap-2 px-4 py-3 bg-red-500/15 border border-red-500/40 rounded-xl text-sm text-red-200 shadow-xl max-w-sm w-[calc(100%-2rem)]">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1">{reviewError}</span>
          <button onClick={() => setReviewError('')} className="text-red-300 hover:text-red-100 flex-shrink-0"><X size={14} /></button>
        </div>
      )}
    </div>
  )
}
