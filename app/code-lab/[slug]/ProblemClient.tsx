"use client"

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Play, Send, CheckCircle2, XCircle, Loader2,
  Lightbulb, ChevronDown, ChevronUp, ArrowLeft,
  Clock, Trophy, AlertCircle, Code2,
} from 'lucide-react'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  { ssr: false, loading: () => <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center"><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div> }
)

interface TestCase {
  id: number; function_call: string; expected_output: string
  is_hidden: boolean; description: string
}

interface Problem {
  id: string; title: string; slug: string; difficulty: string
  topic: string; tags: string[]; description: string
  starter_code: string; hints: string[]; companies: string[]
  test_cases: TestCase[]
}

interface TestResult {
  id: number; description: string; passed: boolean
  input: string; expected: string; got: string
  runtime_ms?: number; is_hidden?: boolean
}

interface SubmitResult {
  status: string; passed_tests: number; total_tests: number
  runtime_ms: number; results: TestResult[]
}

const DIFF_COLOR = {
  Easy:   'text-green-400 bg-green-500/10 border-green-500/25',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
  Hard:   'text-red-400 bg-red-500/10 border-red-500/25',
}

function MarkdownDesc({ text }: { text: string }) {
  const lines = text.split('\n')
  const els: React.ReactNode[] = []
  let inCode = false, codeLines: string[] = [], k = 0

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) { inCode = true; codeLines = [] }
      else {
        els.push(<pre key={k++} className="bg-zinc-950 border border-zinc-700 rounded-lg p-3 my-2 overflow-x-auto text-xs text-zinc-300 font-mono">{codeLines.join('\n')}</pre>)
        inCode = false
      }
      continue
    }
    if (inCode) { codeLines.push(line); continue }
    if (line.startsWith('## '))      els.push(<h2 key={k++} className="text-sm font-bold text-zinc-100 mt-4 mb-2">{line.slice(3)}</h2>)
    else if (line.startsWith('### '))els.push(<h3 key={k++} className="text-xs font-bold text-zinc-300 mt-3 mb-1">{line.slice(4)}</h3>)
    else if (line.startsWith('`') && line.endsWith('`') && line.length > 2)
      els.push(<code key={k++} className="block bg-zinc-800 text-orange-300 px-2 py-1 rounded text-xs font-mono my-1">{line.slice(1,-1)}</code>)
    else if (line.trim() === '')  els.push(<div key={k++} className="h-2" />)
    else els.push(<p key={k++} className="text-xs text-zinc-400 leading-relaxed">{line}</p>)
  }
  return <div className="flex flex-col gap-0.5">{els}</div>
}

export default function ProblemClient({ problem }: { problem: Problem }) {
  const [code, setCode]             = useState(problem.starter_code)
  const [tab, setTab]               = useState<'description' | 'hints'>('description')
  const [running,  setRunning]      = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [runResults, setRunResults] = useState<TestResult[] | null>(null)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const [showHints, setShowHints]   = useState<number[]>([])
  const [resultTab, setResultTab]   = useState<'results' | 'submit'>('results')

  const visibleTests = problem.test_cases.filter(tc => !tc.is_hidden)

  const handleRun = useCallback(async () => {
    if (running || !code.trim()) return
    setRunning(true)
    setRunResults(null)
    setSubmitResult(null)
    setResultTab('results')
    try {
      const res = await fetch('/api/code-lab/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: problem.slug, code }),
      })
      const data = await res.json()
      setRunResults(data.results ?? [])
    } catch {
      setRunResults([])
    } finally {
      setRunning(false)
    }
  }, [code, running, problem.slug])

  const handleSubmit = useCallback(async () => {
    if (submitting || !code.trim()) return
    setSubmitting(true)
    setRunResults(null)
    setSubmitResult(null)
    setResultTab('submit')
    try {
      const res = await fetch('/api/code-lab/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: problem.slug, code }),
      })
      const data = await res.json()
      setSubmitResult(data)
    } catch {
      setSubmitResult(null)
    } finally {
      setSubmitting(false)
    }
  }, [code, submitting, problem.slug])

  const toggleHint = (i: number) =>
    setShowHints(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])

  const accepted = submitResult?.status === 'Accepted'

  return (
    <div className="h-screen flex flex-col bg-zinc-950 pt-16 overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/code-lab" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Problems
          </Link>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-100">{problem.title}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFF_COLOR[problem.difficulty as keyof typeof DIFF_COLOR] ?? ''}`}>
              {problem.difficulty}
            </span>
            <span className="text-xs text-zinc-600">{problem.topic}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRun} disabled={running || submitting}
            className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-green-400" />}
            Run
          </button>
          <button onClick={handleSubmit} disabled={running || submitting}
            className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit
          </button>
        </div>
      </div>

      {/* ── Main split pane ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: description ── */}
        <div className="w-[42%] shrink-0 flex flex-col border-r border-zinc-800 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-900 shrink-0">
            {(['description', 'hints'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 ${
                  tab === t ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}>
                {t === 'hints' ? `Hints (${problem.hints.length})` : t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-zinc-950">
            {tab === 'description' && (
              <div>
                {/* Visible test cases */}
                <MarkdownDesc text={problem.description} />
                <div className="mt-6 pt-5 border-t border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                    Test Cases ({visibleTests.length} visible · {problem.test_cases.filter(t=>t.is_hidden).length} hidden)
                  </p>
                  {visibleTests.map((tc, i) => (
                    <div key={tc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-2">
                      <p className="text-[10px] text-zinc-600 mb-1">Case {i+1}: {tc.description}</p>
                      <p className="text-xs text-zinc-500 font-mono mb-0.5">Input: <span className="text-zinc-300">{tc.function_call}</span></p>
                      <p className="text-xs text-zinc-500 font-mono">Expected: <span className="text-green-400">{tc.expected_output}</span></p>
                    </div>
                  ))}
                </div>
                {problem.companies.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {problem.companies.map(c => (
                      <span key={c} className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'hints' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-zinc-600 mb-2">Click to reveal hints one at a time.</p>
                {problem.hints.map((hint, i) => (
                  <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden">
                    <button onClick={() => toggleHint(i)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-xs font-semibold text-zinc-300">Hint {i + 1}</span>
                      </div>
                      {showHints.includes(i) ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
                    </button>
                    {showHints.includes(i) && (
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

        {/* ── Right: editor + results ── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Monaco editor */}
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={v => setCode(v ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontLigatures: true,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 4,
                renderLineHighlight: 'all',
                bracketPairColorization: { enabled: true },
                padding: { top: 12, bottom: 12 },
                scrollbar: { verticalScrollbarSize: 6 },
              }}
            />
          </div>

          {/* ── Results panel ── */}
          <div className="h-56 border-t border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden shrink-0">

            {/* Result tabs */}
            <div className="flex items-center border-b border-zinc-800 shrink-0">
              <button onClick={() => setResultTab('results')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${resultTab === 'results' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500'}`}>
                Test Results
              </button>
              <button onClick={() => setResultTab('submit')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${resultTab === 'submit' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500'}`}>
                Submission
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">

              {/* Loading states */}
              {(running || submitting) && (
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  {running ? 'Running test cases…' : 'Submitting solution…'}
                </div>
              )}

              {/* Run results */}
              {resultTab === 'results' && runResults && !running && (
                <div className="flex flex-col gap-2">
                  {runResults.length === 0
                    ? <p className="text-xs text-zinc-600">No results</p>
                    : runResults.map(r => (
                      <div key={r.id} className={`rounded-xl border p-2.5 ${r.passed ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {r.passed
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                            : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                          <span className={`text-xs font-semibold ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                            {r.passed ? 'Passed' : 'Failed'} — {r.description}
                          </span>
                          {r.runtime_ms && <span className="text-[10px] text-zinc-600 ml-auto flex items-center gap-1"><Clock className="w-3 h-3" />{r.runtime_ms}ms</span>}
                        </div>
                        {!r.passed && (
                          <div className="font-mono text-[10px] flex flex-col gap-0.5 pl-5">
                            <span className="text-zinc-500">Input:    <span className="text-zinc-300">{r.input}</span></span>
                            <span className="text-zinc-500">Expected: <span className="text-green-400">{r.expected}</span></span>
                            <span className="text-zinc-500">Got:      <span className="text-red-400">{r.got}</span></span>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}

              {/* Submit results */}
              {resultTab === 'submit' && submitResult && !submitting && (
                <div>
                  {/* Status banner */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border mb-3 ${accepted ? 'bg-green-500/10 border-green-500/25' : 'bg-red-500/10 border-red-500/25'}`}>
                    {accepted
                      ? <Trophy className="w-5 h-5 text-green-400 shrink-0" />
                      : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                    <div>
                      <p className={`text-sm font-extrabold ${accepted ? 'text-green-400' : 'text-red-400'}`}>
                        {submitResult.status}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {submitResult.passed_tests}/{submitResult.total_tests} test cases passed · {submitResult.runtime_ms}ms
                      </p>
                    </div>
                  </div>

                  {/* Per-test breakdown */}
                  <div className="flex flex-col gap-1.5">
                    {submitResult.results.map(r => (
                      <div key={r.id} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${r.passed ? 'border-green-500/15 bg-green-500/5' : 'border-red-500/15 bg-red-500/5'}`}>
                        {r.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <span className={r.passed ? 'text-green-400' : 'text-red-400'}>
                            Case {r.id} {r.is_hidden ? '(hidden)' : ''}: {r.description}
                          </span>
                          {!r.passed && !r.is_hidden && (
                            <div className="font-mono text-[10px] mt-0.5 text-zinc-500">
                              Expected: <span className="text-green-400">{r.expected}</span> · Got: <span className="text-red-400">{r.got}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Initial state */}
              {!running && !submitting && !runResults && !submitResult && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Code2 className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                    <p className="text-xs text-zinc-600">Click <strong className="text-zinc-500">Run</strong> to test visible cases or <strong className="text-zinc-500">Submit</strong> to check all cases.</p>
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
