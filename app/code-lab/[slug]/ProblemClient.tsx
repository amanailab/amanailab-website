"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Play, Send, CheckCircle2, XCircle, Loader2, Lightbulb,
  ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Clock, Trophy,
  AlertCircle, Code2, Cpu, History, RotateCcw, CalendarDays,
  Bug, BarChart2, HelpCircle, BookOpen, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Copy, Check, Sparkles,
  ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import LoginPromptModal from '@/components/ui/LoginPromptModal'
import { useToast } from '@/components/ui/Toast'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  { ssr: false, loading: () => <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center"><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div> }
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestCase { id: number; function_call: string; expected_output: string; is_hidden: boolean; description: string }
interface Problem { id: string; title: string; slug: string; difficulty: string; topic: string; tags: string[]; description: string; starter_code: string; hints: string[]; companies: string[]; test_cases: TestCase[]; order_index: number }
interface AdjacentProblem { slug: string; title: string; difficulty: string }
interface TestResult { id: number; description: string; passed: boolean; input: string; expected: string; got: string; runtime_ms: number; is_hidden?: boolean }
interface SubmitResult { status: string; passed_tests: number; total_tests: number; runtime_ms: number; results: TestResult[] }
interface Submission { id: string; status: string; passed_tests: number; total_tests: number; runtime_ms: number; created_at: string; code: string }
interface ComplexityResult { time_complexity: string; time_explanation: string; space_complexity: string; space_explanation: string; interview_ready: boolean; interview_note: string; improvements: string[]; edge_cases_missed: string[] }

const DIFF_COLOR = { Easy: 'text-green-400 bg-green-500/10 border-green-500/25', Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25', Hard: 'text-red-400 bg-red-500/10 border-red-500/25' }

const TOPIC_SLUGS: Record<string, string> = {
  'LLM': 'llm', 'RAG': 'rag', 'Agents': 'agents', 'Fine-Tuning': 'fine-tuning',
  'MLOps': 'mlops', 'Transformers': 'transformers', 'System Design': 'system-design',
  'Python': 'python', 'Vector DB': 'vector-db', 'NLP': 'nlp', 'Classical ML': 'statistics',
}

// ─── Pyodide ──────────────────────────────────────────────────────────────────

declare global { interface Window { loadPyodide?: (opts: object) => Promise<unknown> } }
let _pyodidePromise: Promise<unknown> | null = null
function getPyodide(): Promise<unknown> {
  if (_pyodidePromise) return _pyodidePromise
  _pyodidePromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('pyodide-script')
    const finish = () => {
      window.loadPyodide!({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/', stdout: () => {}, stderr: () => {} })
        .then(resolve).catch((e: unknown) => { _pyodidePromise = null; reject(e) })
    }
    if (existing) { finish(); return }
    const s = document.createElement('script')
    s.id = 'pyodide-script'; s.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js'
    s.onload = finish; s.onerror = (e) => { _pyodidePromise = null; reject(e) }
    document.head.appendChild(s)
  })
  return _pyodidePromise
}

function buildTestCode(userCode: string, functionCall: string): string {
  return `import math, sys\n${userCode}\ndef _fmt(v,d=5):\n    if isinstance(v,float):return round(v,d)\n    if isinstance(v,(list,tuple)):return [_fmt(x,d) for x in v]\n    return v\ntry:\n    _r=${functionCall}\n    print(_fmt(_r))\nexcept Exception as _e:\n    print(str(_e),file=sys.stderr)`.trim()
}

async function runWithPyodide(code: string): Promise<{ stdout: string; stderr: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pyodide: any = await getPyodide()
  let stdout = ''; let stderr = ''
  pyodide.setStdout({ batched: (s: string) => { stdout += s + '\n' } })
  pyodide.setStderr({ batched: (s: string) => { stderr += s + '\n' } })
  try { await pyodide.runPythonAsync(code) } catch (e: unknown) { stderr += String(e) }
  return { stdout: stdout.trim(), stderr: stderr.trim() }
}

function normalise(s: string) { return s.trim().replace(/\s+/g, ' ') }
function match(a: string, b: string) { return normalise(a) === normalise(b) }

// ─── Diff highlight ───────────────────────────────────────────────────────────

function DiffHighlight({ a, b, colorA }: { a: string; b: string; colorA: string }) {
  if (a === b || !b) return <span className={colorA}>{a}</span>
  let i = 0
  while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++
  return (
    <>
      <span className={colorA}>{a.slice(0, i)}</span>
      <span className={`${colorA} underline decoration-2 font-bold bg-current/10 rounded px-0.5`}>{a.slice(i)}</span>
    </>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProblemClient({
  problem, prevProblem, nextProblem, totalProblems,
}: {
  problem: Problem; prevProblem: AdjacentProblem | null; nextProblem: AdjacentProblem | null; totalProblems: number
}) {
  const user      = useUser()
  const pathname  = usePathname()
  const { toast } = useToast()

  // Layout
  const containerRef   = useRef<HTMLDivElement>(null)
  const [leftWidth, setLeftWidth]       = useState(42)
  const [isFullEditor, setIsFullEditor] = useState(false)
  const dragging   = useRef(false)
  const dragStart  = useRef({ x: 0, w: 42 })

  // Code
  const [code, setCode]       = useState(problem.starter_code)
  const [fontSize, setFontSize] = useState(13)
  const [copied, setCopied]   = useState(false)

  // Auth & Python
  const [authModal, setAuthModal]   = useState(false)
  const [pyStatus, setPyStatus]     = useState<'idle'|'loading'|'ready'|'error'>('idle')

  // Execution
  const [running, setRunning]         = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [runResults, setRunResults]   = useState<TestResult[]|null>(null)
  const [submitResult, setSubmitResult] = useState<SubmitResult|null>(null)

  // Panels
  const [resultTab, setResultTab] = useState<'results'|'submit'|'history'|'ai'>('results')
  const [tab, setTab]             = useState<'description'|'hints'>('description')
  const [shownHints, setShownHints] = useState<number[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)

  // AI assist
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiMode, setAiMode]           = useState<'debug'|'complexity'|'approach'|null>(null)
  const [aiDebug, setAiDebug]         = useState('')
  const [aiComplexity, setAiComplexity] = useState<ComplexityResult|null>(null)
  const [aiHint, setAiHint]           = useState('')

  // Post-solve
  const [firstSolve, setFirstSolve] = useState(false)
  const [solvedCount, setSolvedCount] = useState(0)

  const visibleTests = problem.test_cases.filter(t => !t.is_hidden)
  const topicSlug    = TOPIC_SLUGS[problem.topic]

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])
  const mins = Math.floor(elapsed / 60); const secs = elapsed % 60
  const timeDisplay = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`
  const timerColor = elapsed < 1200 ? 'text-green-400' : elapsed < 2400 ? 'text-yellow-400' : 'text-red-400'
  const timerBg    = elapsed < 1200 ? 'bg-green-500/10 border-green-500/25' : elapsed < 2400 ? 'bg-yellow-500/10 border-yellow-500/25' : 'bg-red-500/10 border-red-500/25'

  // Pyodide
  useEffect(() => {
    setPyStatus('loading')
    getPyodide().then(() => setPyStatus('ready')).catch(() => setPyStatus('error'))
  }, [])

  // History
  useEffect(() => {
    if (resultTab !== 'history' || submissions.length > 0 || user === null || user === 'loading') return
    setLoadingHistory(true)
    fetch(`/api/code-lab/submissions/${problem.slug}`).then(r => r.json())
      .then(d => setSubmissions(d.submissions ?? [])).catch(() => {}).finally(() => setLoadingHistory(false))
  }, [resultTab, problem.slug, user, submissions.length])

  // Solved count
  useEffect(() => {
    if (user === null || user === 'loading') return
    fetch('/api/code-lab/progress').then(r => r.json()).then(d => setSolvedCount((d.solved ?? []).length)).catch(() => {})
  }, [user])

  // Resizable pane
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = true
    dragStart.current = { x: e.clientX, w: leftWidth }
    function onMove(ev: MouseEvent) {
      if (!dragging.current || !containerRef.current) return
      const cw = containerRef.current.getBoundingClientRect().width
      const d  = ((ev.clientX - dragStart.current.x) / cw) * 100
      setLeftWidth(Math.min(Math.max(dragStart.current.w + d, 22), 68))
    }
    function onUp() { dragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }, [leftWidth])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey||e.metaKey) && e.shiftKey && e.key === 'Enter') { e.preventDefault(); handleSubmit() }
      else if ((e.ctrlKey||e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Run tests
  const runTests = useCallback(async (tests: TestCase[]): Promise<TestResult[]> => {
    const results: TestResult[] = []
    for (const tc of tests) {
      const t0 = Date.now()
      const { stdout, stderr } = await runWithPyodide(buildTestCode(code, tc.function_call))
      const passed = !stderr && match(stdout, tc.expected_output)
      results.push({ id: tc.id, description: tc.description, passed, input: tc.function_call, expected: tc.expected_output, got: stderr ? `Error: ${stderr}` : stdout, runtime_ms: Date.now() - t0, is_hidden: tc.is_hidden })
    }
    return results
  }, [code])

  const handleRun = useCallback(async () => {
    if (user === null) { setAuthModal(true); return }
    if (running || pyStatus === 'error') return
    setRunning(true); setRunResults(null); setSubmitResult(null); setResultTab('results')
    try {
      if (pyStatus !== 'ready') { setPyStatus('loading'); await getPyodide(); setPyStatus('ready') }
      setRunResults(await runTests(visibleTests))
    } catch { setRunResults([]) } finally { setRunning(false) }
  }, [user, running, pyStatus, runTests, visibleTests])

  const handleSubmit = useCallback(async () => {
    if (user === null) { setAuthModal(true); return }
    if (submitting || pyStatus === 'error') return
    setSubmitting(true); setRunResults(null); setSubmitResult(null); setResultTab('submit')
    const t0 = Date.now()
    try {
      if (pyStatus !== 'ready') { setPyStatus('loading'); await getPyodide(); setPyStatus('ready') }
      const res  = await fetch(`/api/code-lab/problems/${problem.slug}`); const data = await res.json()
      const results = await runTests(data.test_cases ?? [])
      const passed = results.filter(r => r.passed).length; const total = results.length
      const status = passed === total ? 'Accepted' : 'Wrong Answer'
      const runtime = Date.now() - t0
      if (status === 'Accepted') {
        import('canvas-confetti').then(({ default: c }) => {
          const colors = ['#4ade80','#22c55e','#f97316','#fbbf24']
          c({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors })
          setTimeout(() => c({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors }), 150)
        })
        setFirstSolve(submissions.filter(s => s.status === 'Accepted').length === 0)
        setSolvedCount(c => c + 1)
      }
      setSubmitResult({ status, passed_tests: passed, total_tests: total, runtime_ms: runtime,
        results: results.map(r => ({ ...r, expected: r.is_hidden&&r.passed ? '(hidden)' : r.expected, got: r.is_hidden&&r.passed ? '(hidden)' : r.got })) })
      setSubmissions([])
      fetch('/api/code-lab/save-submission', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_id: data.id, code, status, passed_tests: passed, total_tests: total, runtime_ms: runtime }) })
    } catch { setSubmitResult(null) } finally { setSubmitting(false) }
  }, [user, submitting, pyStatus, runTests, problem.slug, code, submissions])

  // AI assist
  const callAI = useCallback(async (mode: 'debug'|'complexity'|'approach') => {
    if (user === null) { setAuthModal(true); return }
    setAiLoading(true); setAiMode(mode); setResultTab('ai')
    const failedCases = runResults?.filter(r => !r.passed).slice(0, 3).map(r => ({ input: r.input, expected: r.expected, got: r.got })) ?? []
    try {
      const res = await fetch('/api/code-lab/ai-assist', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, code, problem_title: problem.title, problem_description: problem.description, failed_cases: failedCases }) })
      const data = await res.json()
      if (mode === 'complexity') setAiComplexity(data.result as ComplexityResult)
      else if (mode === 'debug') setAiDebug(data.result as string)
      else setAiHint(data.result as string)
    } catch { toast('AI assist failed. Try again.', 'error') }
    finally { setAiLoading(false) }
  }, [user, code, problem.title, problem.description, runResults, toast])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code); setCopied(true); toast('Code copied!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }, [code, toast])

  const accepted = submitResult?.status === 'Accepted'

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">
      <LoginPromptModal isOpen={authModal} onClose={() => setAuthModal(false)} feature="run & submit code" returnPath={pathname} />

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0 gap-2">

        {/* Left */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Link href="/code-lab" className="p-1 hover:bg-zinc-800 rounded transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
          </Link>
          {prevProblem && (
            <Link href={`/code-lab/${prevProblem.slug}`} title={prevProblem.title}
              className="p-1 hover:bg-zinc-800 rounded transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
            </Link>
          )}
          {nextProblem && (
            <Link href={`/code-lab/${nextProblem.slug}`} title={nextProblem.title}
              className="p-1 hover:bg-zinc-800 rounded transition-colors">
              <ChevronRightIcon className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
            </Link>
          )}
          <div className="h-3 w-px bg-zinc-700 mx-0.5 shrink-0" />
          <span className="text-sm font-bold text-zinc-100 truncate">{problem.title}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${DIFF_COLOR[problem.difficulty as keyof typeof DIFF_COLOR] ?? ''}`}>
            {problem.difficulty}
          </span>
          {solvedCount > 0 && (
            <span className="hidden md:flex items-center gap-0.5 text-[10px] text-orange-400/70 shrink-0">
              <Trophy className="w-3 h-3" />{solvedCount}/{totalProblems}
            </span>
          )}
        </div>

        {/* Center: BIG prominent timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-extrabold text-lg leading-none tracking-widest transition-colors shrink-0 ${timerColor} ${timerBg}`}>
          <Clock className="w-4 h-4" />
          {timeDisplay}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
            <Cpu className="w-3 h-3 text-zinc-500" />
            {pyStatus === 'loading' && <><div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" /><span className="text-zinc-500">Loading…</span></>}
            {pyStatus === 'ready'   && <><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-zinc-500">Ready</span></>}
            {pyStatus === 'error'   && <span className="text-red-400">Error</span>}
          </div>

          <button onClick={() => setIsFullEditor(v => !v)} title="Toggle full editor"
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-300">
            {isFullEditor ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button onClick={handleRun} disabled={running||submitting||pyStatus==='error'} title="Run (⌘↵)"
            className="flex items-center gap-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-green-400" />}
            Run <kbd className="hidden md:block text-[8px] text-zinc-600 font-mono">⌘↵</kbd>
          </button>

          <button onClick={handleSubmit} disabled={running||submitting||pyStatus==='error'} title="Submit (⌘⇧↵)"
            className="flex items-center gap-1 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit
          </button>
        </div>
      </div>

      {/* ── SPLIT PANE ── */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden" style={{ userSelect: 'none' }}>

        {/* Left panel */}
        {!isFullEditor && (
          <div style={{ width: `${leftWidth}%` }} className="flex flex-col border-r border-zinc-800 overflow-hidden shrink-0 min-w-0">
            <div className="flex border-b border-zinc-800 bg-zinc-900 shrink-0">
              {(['description','hints'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors ${tab===t ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                  {t === 'hints' ? `Hints (${problem.hints.length})` : t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 bg-zinc-950" style={{ userSelect: 'text' }}>
              {tab === 'description' && (
                <div className="flex flex-col gap-4">
                  <MarkdownDesc text={problem.description} />

                  {topicSlug && (
                    <Link href={`/topics/${topicSlug}`}
                      className="flex items-center gap-2 bg-blue-500/8 border border-blue-500/20 rounded-xl px-3.5 py-2.5 text-xs text-blue-400 hover:bg-blue-500/15 transition-colors group">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1">Deep dive: {problem.topic} concepts</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                  )}

                  <div className="border-t border-zinc-800 pt-4">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2.5">
                      Test Cases ({visibleTests.length} visible · {problem.test_cases.filter(t => t.is_hidden).length} hidden)
                    </p>
                    {visibleTests.map((tc, i) => (
                      <div key={tc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-2">
                        <p className="text-[10px] text-zinc-600 mb-1">Case {i+1}: {tc.description}</p>
                        <p className="text-xs text-zinc-500 font-mono mb-0.5 break-all">Input: <span className="text-zinc-300">{tc.function_call}</span></p>
                        <p className="text-xs text-zinc-500 font-mono break-all">Expected: <span className="text-green-400">{tc.expected_output}</span></p>
                      </div>
                    ))}
                  </div>

                  {problem.companies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {problem.companies.map(c => (
                        <Link key={c} href={`/companies/${c.toLowerCase()}`}
                          className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 hover:text-orange-400 hover:border-orange-500/30 transition-colors">
                          {c}
                        </Link>
                      ))}
                    </div>
                  )}

                  {elapsed > 900 && !submitResult && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3.5">
                      <p className="text-xs font-semibold text-yellow-400 mb-1">Still working? 💡</p>
                      <p className="text-[10px] text-zinc-500 mb-2">Get a Socratic hint that guides without revealing the answer.</p>
                      <button onClick={() => callAI('approach')} disabled={aiLoading}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 text-yellow-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        {aiLoading&&aiMode==='approach' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Get Approach Hint
                      </button>
                    </div>
                  )}
                </div>
              )}

              {tab === 'hints' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-zinc-600">Reveal one at a time.</p>
                  {problem.hints.map((hint, i) => (
                    <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden">
                      <button onClick={() => setShownHints(p => p.includes(i) ? p.filter(x => x!==i) : [...p,i])}
                        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800 transition-colors">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="text-xs font-semibold text-zinc-300">Hint {i+1}</span>
                        </div>
                        {shownHints.includes(i) ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
                      </button>
                      {shownHints.includes(i) && (
                        <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800">
                          <p className="text-xs text-zinc-400 leading-relaxed">{hint}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drag handle */}
        {!isFullEditor && (
          <div onMouseDown={onDragStart}
            className="w-1 bg-zinc-800 hover:bg-orange-500/60 active:bg-orange-500 cursor-col-resize shrink-0 transition-colors"
            title="Drag to resize" />
        )}

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Code action bar */}
          <div className="flex items-center justify-between px-3 py-1 bg-zinc-900/50 border-b border-zinc-800/50 shrink-0">
            <span className="text-[10px] text-zinc-600">Python 3.11 · Pyodide</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setFontSize(s => Math.max(10,s-1))} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-300"><ZoomOut className="w-3 h-3" /></button>
              <span className="text-[10px] text-zinc-600 w-5 text-center tabular-nums">{fontSize}</span>
              <button onClick={() => setFontSize(s => Math.min(20,s+1))} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-300"><ZoomIn className="w-3 h-3" /></button>
              <div className="w-px h-3 bg-zinc-700 mx-1" />
              <button onClick={() => { setCode(problem.starter_code); toast('Reset to starter','info') }} title="Reset to starter" className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-300"><RotateCcw className="w-3 h-3" /></button>
              <button onClick={copyCode} title="Copy" className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-300">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Monaco */}
          <div className="flex-1 min-h-0">
            <MonacoEditor height="100%" defaultLanguage="python" value={code}
              onChange={v => setCode(v??'')} theme="vs-dark"
              options={{ fontSize, fontFamily:"'JetBrains Mono','Fira Code',monospace", fontLigatures:true, lineNumbers:'on', minimap:{enabled:false}, scrollBeyondLastLine:false, wordWrap:'on', tabSize:4, renderLineHighlight:'all', bracketPairColorization:{enabled:true}, padding:{top:10,bottom:10}, scrollbar:{verticalScrollbarSize:5}, cursorBlinking:'smooth', smoothScrolling:true }} />
          </div>

          {/* AI action bar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/50 border-t border-zinc-800/50 shrink-0 flex-wrap">
            <span className="text-[10px] font-bold text-zinc-600 mr-0.5">AI:</span>
            <button onClick={() => callAI('debug')} disabled={aiLoading||!runResults?.some(r=>!r.passed)||running}
              title="AI identifies bugs without revealing the answer (run first)"
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 text-red-400 ${aiMode==='debug'&&!aiLoading?'bg-red-500/15 border-red-500/30':'bg-zinc-800/60 border-zinc-700/50 hover:bg-red-500/10 hover:border-red-500/30'}`}>
              {aiLoading&&aiMode==='debug'?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Bug className="w-3.5 h-3.5"/>}
              Debug
            </button>
            <button onClick={() => callAI('complexity')} disabled={aiLoading||!code.trim()||running}
              title="Analyze time & space complexity"
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 text-purple-400 ${aiMode==='complexity'&&!aiLoading?'bg-purple-500/15 border-purple-500/30':'bg-zinc-800/60 border-zinc-700/50 hover:bg-purple-500/10 hover:border-purple-500/30'}`}>
              {aiLoading&&aiMode==='complexity'?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<BarChart2 className="w-3.5 h-3.5"/>}
              Complexity
            </button>
            <button onClick={() => callAI('approach')} disabled={aiLoading||running}
              title="Get a Socratic hint — not the answer"
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 text-yellow-400 ${aiMode==='approach'&&!aiLoading?'bg-yellow-500/15 border-yellow-500/30':'bg-zinc-800/60 border-zinc-700/50 hover:bg-yellow-500/10 hover:border-yellow-500/30'}`}>
              {aiLoading&&aiMode==='approach'?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<HelpCircle className="w-3.5 h-3.5"/>}
              Hint
            </button>
            {runResults && (
              <span className="text-[10px] text-zinc-600 ml-auto">
                {runResults.filter(r=>!r.passed).length>0 ? `${runResults.filter(r=>!r.passed).length} failing` : '✓ Visible tests pass'}
              </span>
            )}
          </div>

          {/* Results panel */}
          <div className="h-56 border-t border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden shrink-0">
            <div className="flex items-center border-b border-zinc-800 shrink-0">
              {([{id:'results',label:'Test Results'},{id:'submit',label:'Submission'},{id:'history',label:'History'},{id:'ai',label:'✨ AI'}] as const).map(t => (
                <button key={t.id} onClick={() => setResultTab(t.id)}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${resultTab===t.id?'border-orange-500 text-orange-400':'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2.5">

              {(running||submitting||(aiLoading&&resultTab==='ai')) && (
                <div className="flex items-center gap-2 text-zinc-500 text-xs py-1">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  {aiLoading?`AI ${aiMode==='debug'?'debugging':aiMode==='complexity'?'analyzing':'generating hint'}…`:running?'Running…':'Submitting…'}
                </div>
              )}

              {resultTab==='results' && runResults && !running && (
                <div className="flex flex-col gap-1.5">
                  {runResults.map(r => (
                    <div key={r.id} className={`rounded-xl border p-2.5 ${r.passed?'bg-green-500/5 border-green-500/20':'bg-red-500/5 border-red-500/20'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {r.passed?<CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0"/>:<XCircle className="w-3.5 h-3.5 text-red-400 shrink-0"/>}
                        <span className={`text-xs font-semibold ${r.passed?'text-green-400':'text-red-400'}`}>{r.passed?'Passed':'Failed'} — {r.description}</span>
                        <span className="text-[10px] text-zinc-600 ml-auto">{r.runtime_ms}ms</span>
                      </div>
                      {!r.passed && (
                        <div className="font-mono text-[10px] flex flex-col gap-0.5 pl-5">
                          <span className="text-zinc-500">Input: <span className="text-zinc-300">{r.input}</span></span>
                          <span className="text-zinc-500">Expected: <DiffHighlight a={r.expected} b={r.got||''} colorA="text-green-400" /></span>
                          <span className="text-zinc-500">Got: <span className="text-red-400">{!r.got||r.got==='None'?'None — add return statement':r.got}</span></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {resultTab==='submit' && submitResult && !submitting && (
                <div>
                  <div className={`flex items-center gap-3 p-3 rounded-xl border mb-3 ${accepted?'bg-green-500/10 border-green-500/25':'bg-red-500/10 border-red-500/25'}`}>
                    {accepted?<Trophy className="w-5 h-5 text-green-400 shrink-0"/>:<AlertCircle className="w-5 h-5 text-red-400 shrink-0"/>}
                    <div className="flex-1">
                      <p className={`text-sm font-extrabold ${accepted?'text-green-400':'text-red-400'}`}>{submitResult.status}</p>
                      <p className="text-xs text-zinc-500">{submitResult.passed_tests}/{submitResult.total_tests} tests · {submitResult.runtime_ms}ms</p>
                    </div>
                    {accepted&&firstSolve&&<div className="text-right text-xs"><p className="text-orange-400 font-bold">First Solve! 🎉</p><p className="text-zinc-600">{timeDisplay}</p></div>}
                    {accepted&&nextProblem&&(
                      <Link href={`/code-lab/${nextProblem.slug}`}
                        className="flex items-center gap-1 text-xs font-semibold bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 text-green-400 px-2.5 py-1.5 rounded-lg transition-colors shrink-0">
                        Next <ArrowRight className="w-3 h-3"/>
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {submitResult.results.map(r => (
                      <div key={r.id} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${r.passed?'border-green-500/15 bg-green-500/5':'border-red-500/15 bg-red-500/5'}`}>
                        {r.passed?<CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0"/>:<XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0"/>}
                        <div className="flex-1 min-w-0">
                          <span className={r.passed?'text-green-400':'text-red-400'}>Case {r.id}{r.is_hidden?' (hidden)':''}: {r.description}</span>
                          {!r.passed&&r.expected!=='(hidden)'&&(
                            <div className="font-mono text-[10px] mt-0.5 text-zinc-500">
                              Expected: <DiffHighlight a={r.expected} b={r.got||''} colorA="text-green-400"/>
                              {' · '}Got: <span className="text-red-400">{!r.got||r.got==='None'?'None (add return)':r.got}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resultTab==='history' && (
                loadingHistory ? <div className="flex items-center gap-2 text-zinc-500 text-xs py-3"><Loader2 className="w-4 h-4 animate-spin text-orange-400"/>Loading…</div>
                : user===null ? <p className="text-xs text-zinc-600 text-center py-4">Sign in to see history</p>
                : submissions.length===0 ? <p className="text-xs text-zinc-600 text-center py-4">No submissions yet</p>
                : (
                  <div className="flex flex-col gap-1.5">
                    {submissions.map((s,i) => (
                      <div key={s.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${s.status==='Accepted'?'bg-green-500/5 border-green-500/20':'bg-red-500/5 border-red-500/20'}`}>
                        {s.status==='Accepted'?<CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0"/>:<XCircle className="w-3.5 h-3.5 text-red-400 shrink-0"/>}
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-semibold ${s.status==='Accepted'?'text-green-400':'text-red-400'}`}>{s.status}</span>
                          <span className="text-[10px] text-zinc-600 ml-1.5">{s.passed_tests}/{s.total_tests}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 shrink-0">
                          <Clock className="w-3 h-3"/>{s.runtime_ms}ms
                          <CalendarDays className="w-3 h-3 ml-1"/>{new Date(s.created_at).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
                        </div>
                        {i===0&&<button onClick={() => {setCode(s.code);toast('Code restored','success')}} title="Restore" className="p-1 hover:bg-zinc-700 rounded shrink-0"><RotateCcw className="w-3 h-3 text-zinc-500"/></button>}
                      </div>
                    ))}
                  </div>
                )
              )}

              {resultTab==='ai' && (
                aiLoading ? <div className="flex items-center gap-2 text-zinc-500 text-xs py-3"><Loader2 className="w-4 h-4 animate-spin text-orange-400"/>AI analyzing…</div>
                : aiMode==='complexity'&&aiComplexity ? (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Time Complexity</p>
                        <p className="text-lg font-extrabold text-blue-400 font-mono leading-tight">{aiComplexity.time_complexity}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{aiComplexity.time_explanation}</p>
                      </div>
                      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Space Complexity</p>
                        <p className="text-lg font-extrabold text-purple-400 font-mono leading-tight">{aiComplexity.space_complexity}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{aiComplexity.space_explanation}</p>
                      </div>
                    </div>
                    <div className={`flex items-start gap-2 px-3 py-2 rounded-xl border ${aiComplexity.interview_ready?'bg-green-500/8 border-green-500/20':'bg-yellow-500/8 border-yellow-500/20'}`}>
                      {aiComplexity.interview_ready?<CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0"/>:<AlertCircle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0"/>}
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Interview Ready: {aiComplexity.interview_ready?'Yes ✓':'Needs work'}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{aiComplexity.interview_note}</p>
                      </div>
                    </div>
                    {[...aiComplexity.improvements??[],...aiComplexity.edge_cases_missed??[]].length>0 && (
                      <div className="flex flex-col gap-1">
                        {(aiComplexity.improvements??[]).map((imp,i) => <p key={i} className="text-[10px] text-zinc-400 flex items-start gap-1"><span className="text-blue-400">→</span>{imp}</p>)}
                        {(aiComplexity.edge_cases_missed??[]).map((ec,i) => <p key={i} className="text-[10px] text-yellow-400/80 flex items-start gap-1"><span>⚠</span>{ec}</p>)}
                      </div>
                    )}
                  </div>
                )
                : aiMode==='debug'&&aiDebug ? (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-2"><Bug className="w-4 h-4 text-red-400"/><p className="text-xs font-bold text-red-400">Debug Analysis (no spoilers)</p></div>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{aiDebug}</p>
                  </div>
                )
                : aiMode==='approach'&&aiHint ? (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-2"><HelpCircle className="w-4 h-4 text-yellow-400"/><p className="text-xs font-bold text-yellow-400">Approach Hint</p></div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{aiHint}</p>
                  </div>
                ) : (
                  <div className="py-2 flex flex-col gap-1.5">
                    <p className="text-[10px] text-zinc-600 mb-1">Use the AI action buttons above ↑</p>
                    <p className="text-[10px] text-zinc-600"><span className="text-red-400 font-semibold">🐛 Debug</span> — finds what's wrong (run first to see failing tests)</p>
                    <p className="text-[10px] text-zinc-600"><span className="text-purple-400 font-semibold">📊 Complexity</span> — Big-O time & space analysis of your code</p>
                    <p className="text-[10px] text-zinc-600"><span className="text-yellow-400 font-semibold">💡 Hint</span> — Socratic guidance without giving the answer</p>
                  </div>
                )
              )}

              {resultTab!=='history'&&resultTab!=='ai'&&!running&&!submitting&&!runResults&&!submitResult&&(
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Code2 className="w-7 h-7 text-zinc-800 mx-auto mb-2"/>
                    <p className="text-xs text-zinc-600">
                      <kbd className="bg-zinc-800 border border-zinc-700 px-1 py-0.5 rounded text-[9px] font-mono">⌘↵</kbd> Run ·{' '}
                      <kbd className="bg-zinc-800 border border-zinc-700 px-1 py-0.5 rounded text-[9px] font-mono">⌘⇧↵</kbd> Submit
                    </p>
                    {pyStatus==='loading'&&<p className="text-[10px] text-zinc-700 mt-1 flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/>Loading Python…</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function MarkdownDesc({ text }: { text: string }) {
  const lines = text.split('\n'); const els: React.ReactNode[] = []
  let inCode = false; let codeLines: string[] = []; let k = 0
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) { inCode = true; codeLines = [] }
      else { els.push(<pre key={k++} className="bg-zinc-950 border border-zinc-700 rounded-lg p-3 my-2 overflow-x-auto text-xs text-zinc-300 font-mono">{codeLines.join('\n')}</pre>); inCode = false }
      continue
    }
    if (inCode) { codeLines.push(line); continue }
    if (line.startsWith('## '))       els.push(<h2 key={k++} className="text-sm font-bold text-zinc-100 mt-4 mb-2">{line.slice(3)}</h2>)
    else if (line.startsWith('### ')) els.push(<h3 key={k++} className="text-xs font-bold text-zinc-300 mt-3 mb-1">{line.slice(4)}</h3>)
    else if (line.startsWith('`')&&line.endsWith('`')&&line.length>2)
      els.push(<code key={k++} className="block bg-zinc-800 text-orange-300 px-2 py-1 rounded text-xs font-mono my-1">{line.slice(1,-1)}</code>)
    else if (line.trim()==='') els.push(<div key={k++} className="h-2"/>)
    else els.push(<p key={k++} className="text-xs text-zinc-400 leading-relaxed">{line}</p>)
  }
  return <div className="flex flex-col gap-0.5">{els}</div>
}
