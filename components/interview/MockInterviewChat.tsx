'use client'

import { useState, useRef, useEffect } from 'react'
import { BrainCircuit, Send, RotateCcw, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

const TOPICS = ['LLM', 'RAG', 'Agents', 'Fine-Tuning', 'MLOps', 'Transformers', 'System Design', 'Python', 'Vector DB']
const LEVELS = ['Fresher', 'Mid', 'Senior']

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface FinalFeedback {
  score: number
  strengths: string[]
  improvements: string[]
}

type Phase = 'setup' | 'chat' | 'done'

const MAX_TURNS = 5

function scoreColor(s: number) {
  if (s >= 8) return 'text-green-400'
  if (s >= 5) return 'text-yellow-400'
  return 'text-red-400'
}

export default function MockInterviewChat() {
  const [topic, setTopic] = useState(TOPICS[0])
  const [level, setLevel] = useState(LEVELS[0])
  const [phase, setPhase] = useState<Phase>('setup')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnCount, setTurnCount] = useState(0)
  const [finalFeedback, setFinalFeedback] = useState<FinalFeedback | null>(null)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function startChat() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], topic, level, turnCount: 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start interview.')
      setMessages([{ role: 'assistant', content: data.reply }])
      setTurnCount(1)
      setPhase('chat')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    const nextTurn = turnCount + 1
    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, topic, level, turnCount: nextTurn }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to get response.')
      const aiMsg: Message = { role: 'assistant', content: data.reply }
      setMessages([...updated, aiMsg])
      setTurnCount(nextTurn)
      if (data.finalFeedback) {
        setFinalFeedback(data.finalFeedback)
        setPhase('done')
        // Save session to DB so it appears in the leaderboard, profile, and dashboard
        const score = data.finalFeedback.score ?? 0
        const grade = score >= 9 ? 'A+' : score >= 8 ? 'A' : score >= 7 ? 'B' : score >= 5 ? 'C' : 'D'
        fetch('/api/user/save-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            level,
            question_count: MAX_TURNS,
            avg_score: score,
            grade,
            entries: null,
          }),
        }).catch(() => { /* fire-and-forget — UI already shows result */ })
      } else if (data.feedbackParseError) {
        setError('Could not parse final score. Your interview is complete — click Restart to try again.')
        setPhase('done')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function restart() {
    setPhase('setup')
    setMessages([])
    setInput('')
    setTurnCount(0)
    setFinalFeedback(null)
    setError('')
  }

  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-1">Chat-Based Mock Interview</h2>
            <p className="text-zinc-500 text-sm">AI acts as your interviewer — asks questions, gives follow-ups, and scores you at the end. {MAX_TURNS} exchange session.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Topic</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors"
            >
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Level</label>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                    level === l ? 'bg-orange-500 border-orange-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >{l}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={startChat}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Starting…</>
              : <><ArrowRight className="w-4 h-4" /> Start Chat Interview</>
            }
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-semibold text-zinc-200">{topic} Interview · {level}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Turn {Math.min(turnCount, MAX_TURNS)}/{MAX_TURNS}</span>
          <button onClick={restart} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Restart
          </button>
        </div>
      </div>

      {/* Progress */}
      <div
        className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-6"
        role="progressbar"
        aria-valuenow={Math.min(turnCount, MAX_TURNS)}
        aria-valuemin={0}
        aria-valuemax={MAX_TURNS}
        aria-label={`Interview progress: turn ${Math.min(turnCount, MAX_TURNS)} of ${MAX_TURNS}`}
      >
        <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${(Math.min(turnCount, MAX_TURNS) / MAX_TURNS) * 100}%` }} />
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-4 mb-4 max-h-[500px] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-orange-500 text-white rounded-tr-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-line">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Final Feedback */}
      {phase === 'done' && finalFeedback && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Interview Score</span>
            <span className={`text-3xl font-extrabold tabular-nums ${scoreColor(finalFeedback.score)}`}>
              {finalFeedback.score}<span className="text-lg text-zinc-500">/10</span>
            </span>
          </div>
          {finalFeedback.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Strengths</p>
              <ul className="flex flex-col gap-1.5">
                {finalFeedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {finalFeedback.improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Areas to Improve</p>
              <ul className="flex flex-col gap-1.5">
                {finalFeedback.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-orange-400 shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={restart} className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-all mt-2">
            <RotateCcw className="w-4 h-4" /> Start New Interview
          </button>
        </div>
      )}

      {/* Input */}
      {phase === 'chat' && (
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Type your answer… (Enter to send, Shift+Enter for newline)"
            rows={3}
            disabled={loading}
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="self-end flex items-center justify-center w-11 h-11 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/40 disabled:cursor-not-allowed text-white rounded-xl transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
