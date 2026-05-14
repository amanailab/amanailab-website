"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import {
  Sparkles, Bug, Zap, BarChart2, HelpCircle, Wand2,
  Copy, Check, ChevronDown, ChevronUp, ExternalLink,
  Search, X, Play, Loader2, ChevronRight, Download, Share2,
} from 'lucide-react'
import { TEMPLATES, CATEGORIES, type Template } from './templates'
import { useUser } from '@/hooks/useUser'
import LoginPromptModal from '@/components/ui/LoginPromptModal'

// Lazy-load Monaco — it's ~2MB, don't block initial render
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading editor…</p>
        </div>
      </div>
    ),
  }
)

// ─── Types ────────────────────────────────────────────────────────────────────

type Action = 'explain' | 'debug' | 'improve' | 'complexity' | 'interview' | 'generate'

const ACTIONS: { id: Action; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { id: 'explain',    label: 'Explain',     icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-blue-400   hover:bg-blue-500/10   border-blue-500/20',   desc: 'Line-by-line explanation' },
  { id: 'debug',      label: 'Debug & Fix', icon: <Bug className="w-3.5 h-3.5" />,      color: 'text-red-400    hover:bg-red-500/10    border-red-500/20',     desc: 'Find and fix all bugs' },
  { id: 'improve',    label: 'Improve',     icon: <Zap className="w-3.5 h-3.5" />,      color: 'text-yellow-400 hover:bg-yellow-500/10 border-yellow-500/20',  desc: 'Refactor and optimize' },
  { id: 'complexity', label: 'Complexity',  icon: <BarChart2 className="w-3.5 h-3.5" />,color: 'text-purple-400 hover:bg-purple-500/10 border-purple-500/20',  desc: 'Time & space analysis' },
  { id: 'interview',  label: 'Interview Qs',icon: <HelpCircle className="w-3.5 h-3.5" />,color: 'text-green-400 hover:bg-green-500/10  border-green-500/20',   desc: 'Generate interview questions' },
  { id: 'generate',   label: 'Generate',    icon: <Wand2 className="w-3.5 h-3.5" />,    color: 'text-orange-400 hover:bg-orange-500/10 border-orange-500/20', desc: 'Write code from description' },
]

// ─── Markdown-ish renderer (bold, code blocks, headers) ──────────────────────

function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCode = false
  let codeLines: string[] = []
  let codeLang = ''
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLang = line.slice(3).trim()
        codeLines = []
      } else {
        elements.push(
          <pre key={key++} className="bg-zinc-950 border border-zinc-700 rounded-lg p-3 my-2 overflow-x-auto text-xs text-zinc-300 font-mono leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        )
        inCode = false
        codeLines = []
      }
      continue
    }

    if (inCode) { codeLines.push(line); continue }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-sm font-bold text-zinc-100 mt-4 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-base font-bold text-zinc-100 mt-5 mb-2">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="text-lg font-bold text-orange-400 mt-2 mb-3">{line.slice(2)}</h1>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={key++} className="text-xs text-zinc-300 ml-4 leading-relaxed list-disc">
          <InlineFormat text={line.slice(2)} />
        </li>
      )
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li key={key++} className="text-xs text-zinc-300 ml-4 leading-relaxed list-decimal">
          <InlineFormat text={line.replace(/^\d+\.\s/, '')} />
        </li>
      )
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(<p key={key++} className="text-sm font-bold text-zinc-200 mt-3 mb-1">{line.slice(2, -2)}</p>)
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1" />)
    } else {
      elements.push(
        <p key={key++} className="text-xs text-zinc-300 leading-relaxed">
          <InlineFormat text={line} />
        </p>
      )
    }
  }
  return <div className="flex flex-col gap-0.5">{elements}</div>
}

function InlineFormat({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} className="bg-zinc-800 text-orange-300 px-1 py-0.5 rounded text-[11px] font-mono">{part.slice(1, -1)}</code>
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} className="font-bold text-zinc-100">{part.slice(2, -2)}</strong>
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// ─── localStorage key helper ─────────────────────────────────────────────────

const SAVE_KEY = (label: string) => `playground_code_${label.replace(/\s+/g, '_').toLowerCase()}`

// ─── Export as .py ───────────────────────────────────────────────────────────

function exportCode(code: string, filename: string) {
  const blob = new Blob([code], { type: 'text/x-python' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename.replace(/\s+/g, '_').toLowerCase()}.py`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Share URL helpers ────────────────────────────────────────────────────────

function getShareUrl(code: string): string {
  try {
    const encoded = btoa(unescape(encodeURIComponent(code)))
    return `${window.location.origin}/playground#code=${encoded}`
  } catch { return window.location.href }
}

function loadFromHash(): string | null {
  try {
    const hash = window.location.hash
    if (!hash.startsWith('#code=')) return null
    const encoded = hash.slice(6)
    return decodeURIComponent(escape(atob(encoded)))
  } catch { return null }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlaygroundClient() {
  const user     = useUser()
  const pathname = usePathname()
  const [authModal, setAuthModal]           = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<Template>(TEMPLATES[0])
  const [code, setCode]                     = useState(TEMPLATES[0].code)
  const [category, setCategory]             = useState('All')
  const [search, setSearch]                 = useState('')
  const [aiResult, setAiResult]             = useState('')
  const [aiAction, setAiAction]             = useState<Action | null>(null)
  const [loading, setLoading]               = useState(false)
  const [panelOpen, setPanelOpen]           = useState(false)
  const [generateDesc, setGenerateDesc]     = useState('')
  const [copied, setCopied]                 = useState(false)
  const [sidebarOpen, setSidebarOpen]       = useState(true)
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [shareCopied, setShareCopied]       = useState(false)
  const editorRef   = useRef<unknown>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Filter templates
  const filtered = TEMPLATES.filter(t => {
    const matchCat = category === 'All' || t.category === category
    const matchSearch = !search || t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  // On mount: load code from URL hash if present
  useEffect(() => {
    const shared = loadFromHash()
    if (shared) {
      setCode(shared)
      history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // Auto-save code to localStorage after 800ms of inactivity
  useEffect(() => {
    if (!activeTemplate) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try { localStorage.setItem(SAVE_KEY(activeTemplate.label), code) } catch {}
      setSavedIndicator(true)
      setTimeout(() => setSavedIndicator(false), 1500)
    }, 800)
    return () => clearTimeout(saveTimerRef.current)
  }, [code, activeTemplate])

  // Load a template (restore saved code if available)
  const loadTemplate = useCallback((t: Template) => {
    setActiveTemplate(t)
    try {
      const saved = localStorage.getItem(SAVE_KEY(t.label))
      setCode(saved ?? t.code)
    } catch {
      setCode(t.code)
    }
    setAiResult('')
    setAiAction(null)
    setPanelOpen(false)
  }, [])

  // Call AI assistant
  const callAI = useCallback(async (action: Action) => {
    if (user === null) { setAuthModal(true); return }
    if (action !== 'generate' && !code.trim()) return
    if (action === 'generate' && !generateDesc.trim()) return

    setLoading(true)
    setAiAction(action)
    setAiResult('')
    setPanelOpen(true)

    try {
      const res = await fetch('/api/playground/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, action, description: generateDesc }),
      })
      if (res.status === 429) {
        setAiResult('**Rate limit reached** — you can make 10 requests per minute. Please wait a moment and try again.')
        return
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setAiResult(`Something went wrong: ${(errData as { error?: string }).error ?? 'Please try again.'}`)
        return
      }
      const data = await res.json()
      setAiResult(data.result ?? 'No response.')

      // If generate returned code, load it into editor
      if (action === 'generate') {
        const codeMatch = data.result.match(/```(?:python)?\n([\s\S]*?)```/)
        if (codeMatch) {
          setCode(codeMatch[1])
          setGenerateDesc('')
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('network')) {
        setAiResult('**Network error** — check your connection and try again.')
      } else {
        setAiResult('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [code, generateDesc])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const openColab = useCallback(() => {
    window.open('https://colab.research.google.com/#create=true', '_blank')
  }, [])

  const actionInfo = ACTIONS.find(a => a.id === aiAction)

  const tagColors: Record<string, string> = {
    RAG: 'text-blue-400 bg-blue-500/10', Agents: 'text-orange-400 bg-orange-500/10',
    'Fine-Tuning': 'text-yellow-400 bg-yellow-500/10', Transformers: 'text-teal-400 bg-teal-500/10',
    'Vector DB': 'text-pink-400 bg-pink-500/10', MLOps: 'text-green-400 bg-green-500/10',
    'Classical ML': 'text-purple-400 bg-purple-500/10',
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 flex flex-col">
      <LoginPromptModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        feature="use AI tools"
        returnPath={pathname}
      />

      {/* ── Top header bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Toggle templates"
          >
            <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100 leading-none">AI/ML Playground</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{activeTemplate.emoji} {activeTemplate.label}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language badge */}
          <span className="text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg">
            Python
          </span>

          {/* Auto-save indicator */}
          {savedIndicator && (
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}

          {/* Reset to template */}
          {code !== activeTemplate?.code && (
            <button
              onClick={() => {
                setCode(activeTemplate?.code ?? '')
                try { localStorage.removeItem(SAVE_KEY(activeTemplate?.label ?? '')) } catch {}
              }}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
              title="Reset to template default"
            >
              Reset
            </button>
          )}

          {/* Download as .py */}
          <button
            onClick={() => exportCode(code, activeTemplate?.label ?? 'code')}
            title="Download as .py"
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            <Download className="w-3 h-3" /> .py
          </button>

          {/* Share */}
          <button
            onClick={async () => {
              const url = getShareUrl(code)
              try { await navigator.clipboard.writeText(url) } catch {
                const ta = document.createElement('textarea')
                ta.value = url
                ta.style.cssText = 'position:fixed;opacity:0'
                document.body.appendChild(ta)
                ta.select()
                document.execCommand('copy')
                document.body.removeChild(ta)
              }
              setShareCopied(true)
              setTimeout(() => setShareCopied(false), 2000)
            }}
            title="Copy shareable link"
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            {shareCopied
              ? <><Check className="w-3 h-3 text-green-400" /> Copied!</>
              : <><Share2 className="w-3 h-3" /> Share</>}
          </button>

          {/* Copy */}
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          {/* Open in Colab */}
          <button
            onClick={openColab}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Colab
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar: templates ── */}
        {sidebarOpen && (
          <div className="w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">

            {/* Search */}
            <div className="p-3 border-b border-zinc-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search templates…"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-500 outline-none focus:border-orange-500/50"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-zinc-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1 p-3 border-b border-zinc-800">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    category === cat
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/50 transition-colors ${
                    activeTemplate.id === t.id
                      ? 'bg-orange-500/10 border-l-2 border-l-orange-500'
                      : 'hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base leading-none">{t.emoji}</span>
                    <span className={`text-xs font-semibold ${activeTemplate.id === t.id ? 'text-orange-300' : 'text-zinc-200'}`}>
                      {t.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-tight pl-6">{t.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5 pl-6">
                    {t.tags.slice(0, 2).map(tag => (
                      <span key={tag} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${tagColors[tag] ?? 'text-zinc-500 bg-zinc-800'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-8">No templates found</p>
              )}
            </div>
          </div>
        )}

        {/* ── Center: Monaco Editor + AI panel ── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Editor */}
          <div className={`flex-1 min-h-0 transition-all duration-300 ${panelOpen ? 'max-h-[55vh]' : ''}`}>
            <MonacoEditor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={(val) => setCode(val ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                lineNumbers: 'on',
                minimap: { enabled: true, scale: 0.7 },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 4,
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                padding: { top: 12, bottom: 12 },
                suggest: { showKeywords: true },
                quickSuggestions: { other: true, comments: false, strings: false },
                overviewRulerBorder: false,
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              }}
              onMount={(editor) => { editorRef.current = editor }}
            />
          </div>

          {/* ── AI action bar ── */}
          <div className="bg-zinc-900 border-t border-zinc-800 px-3 py-2 shrink-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mr-1">AI:</span>
              {ACTIONS.filter(a => a.id !== 'generate').map(action => (
                <button
                  key={action.id}
                  onClick={() => callAI(action.id)}
                  disabled={loading}
                  title={action.desc}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${action.color}`}
                >
                  {loading && aiAction === action.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : action.icon
                  }
                  {action.label}
                </button>
              ))}

              {/* Generate input */}
              <div className="flex items-center gap-1.5 ml-auto flex-1 max-w-xs">
                <input
                  value={generateDesc}
                  onChange={e => setGenerateDesc(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && generateDesc.trim()) callAI('generate') }}
                  placeholder="Describe code to generate…"
                  className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-500 outline-none transition-colors min-w-0"
                />
                <button
                  onClick={() => callAI('generate')}
                  disabled={loading || !generateDesc.trim()}
                  className="flex items-center gap-1 text-xs font-semibold bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  {loading && aiAction === 'generate'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Wand2 className="w-3.5 h-3.5" />
                  }
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* ── AI result panel ── */}
          {(panelOpen || loading) && (
            <div className={`bg-zinc-900 border-t border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 ${panelOpen ? 'h-64' : 'h-12'}`}>

              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                  {actionInfo && (
                    <span className={`flex items-center gap-1 text-xs font-bold ${actionInfo.color.split(' ')[0]}`}>
                      {actionInfo.icon} {actionInfo.label}
                    </span>
                  )}
                  {loading && (
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                    </span>
                  )}
                </div>
                <button onClick={() => setPanelOpen(false)} className="p-1 hover:bg-zinc-800 rounded transition-colors">
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {loading && !aiResult && (
                  <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    AI is analyzing your code…
                  </div>
                )}
                {aiResult && <RenderMarkdown text={aiResult} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom info bar ── */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-2 flex items-center justify-between text-[10px] text-zinc-600 shrink-0">
        <div className="flex items-center gap-4">
          <span>Python 3.11</span>
          <span>{code.split('\n').length} lines</span>
          <span>{code.length} chars</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-700">AI powered by Groq · Llama 3.3 70B</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            Ready
          </span>
        </div>
      </div>

    </div>
  )
}
