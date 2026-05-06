'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic, MicOff, Volume2, VolumeX, SkipForward, ArrowRight,
  CheckCircle2, XCircle, RotateCcw, Trophy, Clock,
  BrainCircuit, Lightbulb, ChevronRight, Sparkles, Save, TrendingUp,
} from 'lucide-react'
import EmailGateModal, { isCaptured } from '@/components/shared/EmailGateModal'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Evaluation {
  score: number
  grade: string
  verdict: string
  correct: string[]
  missing: string[]
  modelAnswer: string
  tip: string
  confidence: string
}

interface SessionEntry {
  question: string
  answer: string
  evaluation: Evaluation | null
  timeUsed: number
}

type Phase = 'setup' | 'generating' | 'countdown' | 'question' | 'evaluating' | 'feedback' | 'summary'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOPICS = [
  { label: 'LLM', value: 'LLM', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { label: 'RAG', value: 'RAG', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { label: 'Agents', value: 'Agents', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { label: 'Fine-Tuning', value: 'Fine-Tuning', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { label: 'MLOps', value: 'MLOps', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { label: 'Transformers', value: 'Transformers', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { label: 'System Design', value: 'System Design', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { label: 'Python', value: 'Python', color: 'bg-lime-500/20 text-lime-300 border-lime-500/30' },
  { label: 'Vector DB', value: 'Vector DB', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
]

const LEVELS = ['Fresher', 'Mid', 'Senior']
const Q_COUNTS = [3, 5, 7]
const TIME_PER_Q = 120 // seconds

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeColor(g: string) {
  return g === 'A' ? 'text-green-400' : g === 'B' ? 'text-blue-400' : g === 'C' ? 'text-yellow-400' : 'text-red-400'
}

function scoreBgColor(s: number) {
  if (s >= 8) return 'from-green-500/10 to-green-500/5 border-green-500/20'
  if (s >= 6) return 'from-blue-500/10 to-blue-500/5 border-blue-500/20'
  if (s >= 4) return 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20'
  return 'from-red-500/10 to-red-500/5 border-red-500/20'
}

function avgScore(entries: SessionEntry[]) {
  const scored = entries.filter((e) => e.evaluation)
  if (scored.length === 0) return 0
  return scored.reduce((acc, e) => acc + (e.evaluation?.score ?? 0), 0) / scored.length
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Voice hook ───────────────────────────────────────────────────────────────

function useTTS() {
  const [speaking, setSpeaking] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.92
    utt.pitch = 1.0
    utt.volume = 1
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(
      (v) => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.includes('Alex')
    )
    if (preferred) utt.voice = preferred
    utt.onstart = () => setSpeaking(true)
    utt.onend = () => { setSpeaking(false); onEnd?.() }
    utt.onerror = () => setSpeaking(false)
    utterRef.current = utt
    window.speechSynthesis.speak(utt)
  }, [])

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [])

  return { speak, cancel, speaking }
}

// ─── Mic Waveform ─────────────────────────────────────────────────────────────

function MicWaveform({ active }: { active: boolean }) {
  const bars = 5
  return (
    <div className="flex items-center justify-center gap-0.5 h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-100 ${active ? 'bg-red-400' : 'bg-zinc-600'}`}
          style={{
            height: active ? `${12 + Math.random() * 20}px` : '6px',
            animation: active ? `wave ${0.4 + i * 0.1}s ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
      <style>{`@keyframes wave { from { height: 6px } to { height: 28px } }`}</style>
    </div>
  )
}

// ─── Score Arc ────────────────────────────────────────────────────────────────

function ScoreArc({ score }: { score: number }) {
  const pct = score / 10
  const radius = 54
  const circ = 2 * Math.PI * radius
  const dash = circ * pct
  const color = score >= 8 ? '#4ade80' : score >= 6 ? '#60a5fa' : score >= 4 ? '#facc15' : '#f87171'

  return (
    <svg width="140" height="80" viewBox="0 0 140 80">
      <path
        d="M 15 75 A 55 55 0 0 1 125 75"
        fill="none" stroke="#27272a" strokeWidth="10" strokeLinecap="round"
      />
      <path
        d="M 15 75 A 55 55 0 0 1 125 75"
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${dash * 0.85} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x="70" y="68" textAnchor="middle" fill={color} fontSize="22" fontWeight="800">{score}</text>
      <text x="70" y="82" textAnchor="middle" fill="#71717a" fontSize="9">/10</text>
    </svg>
  )
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function CountdownScreen({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count === 0) { onDone(); return }
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, onDone])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">Interview starting in</p>
      <div
        key={count}
        className="text-8xl font-extrabold text-orange-400 tabular-nums"
        style={{ animation: 'pop 0.3s cubic-bezier(.4,0,.2,1)' }}
      >
        {count === 0 ? 'Go!' : count}
      </div>
      <p className="text-zinc-600 text-xs">Take a breath. You've got this.</p>
      <style>{`@keyframes pop { from { transform: scale(1.4); opacity:0 } to { transform: scale(1); opacity:1 } }`}</style>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AISimulator() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [topic, setTopic] = useState(TOPICS[0].value)
  const [level, setLevel] = useState(LEVELS[1])
  const [qCount, setQCount] = useState(5)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [sttEnabled, setSttEnabled] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [session, setSession] = useState<SessionEntry[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [error, setError] = useState('')
  const [showEmailGate, setShowEmailGate] = useState(false)
  const [emailUnlocked, setEmailUnlocked] = useState(false)
  const [feedbackTab, setFeedbackTab] = useState<'feedback' | 'model'>('feedback')
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  const [sessionSaved, setSessionSaved] = useState(false)

  const { speak, cancel, speaking } = useTTS()
  const recognitionRef = useRef<{ stop: () => void } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentQ = questions[currentIdx] ?? ''
  const topicMeta = TOPICS.find((t) => t.value === topic)!
  const currentEntry = session[currentIdx]

  // ── Check auth state ──
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedInUser(user?.email ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setLoggedInUser(sess?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Auto-save session when summary is reached ──
  async function saveSession(completedSession: SessionEntry[]) {
    if (!loggedInUser) return
    const scored = completedSession.filter((e) => e.evaluation)
    if (scored.length === 0) return
    const avg = scored.reduce((a, e) => a + (e.evaluation?.score ?? 0), 0) / scored.length
    const overallGrade = avg >= 9 ? 'A+' : avg >= 8 ? 'A' : avg >= 7 ? 'B' : avg >= 6 ? 'C' : avg >= 4 ? 'D' : 'F'
    try {
      await fetch('/api/user/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          level,
          question_count: completedSession.length,
          avg_score: Math.round(avg * 100) / 100,
          grade: overallGrade,
          entries: completedSession.map((e) => ({
            question: e.question,
            score: e.evaluation?.score ?? null,
            grade: e.evaluation?.grade ?? null,
            timeUsed: e.timeUsed,
          })),
        }),
      })
      setSessionSaved(true)
    } catch {
      // silent — saving is non-critical
    }
  }

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'question') { clearInterval(timerRef.current); return }
    setTimeLeft(TIME_PER_Q)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, currentIdx])

  // ── Auto-speak question ──
  useEffect(() => {
    if (phase === 'question' && ttsEnabled && currentQ) {
      speak(currentQ)
    }
    return () => { if (phase !== 'question') cancel() }
  }, [phase, currentIdx])

  // ── Merge transcript into answer ──
  useEffect(() => {
    if (transcript) setAnswer(transcript)
  }, [transcript])

  // ── STT setup ──
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    cancel()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-US'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t + ' '
        else interim += t
      }
      setTranscript(final + interim)
    }
    r.onend = () => setIsListening(false)
    r.onerror = () => setIsListening(false)
    recognitionRef.current = r
    r.start()
    setIsListening(true)
  }, [cancel])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  function toggleMic() {
    if (isListening) stopListening()
    else startListening()
  }

  // ── Generate session ──
  async function generateSession() {
    setError('')
    setPhase('generating')
    try {
      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level, count: qCount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate questions.')
      setQuestions(data.questions)
      setSession(data.questions.map((q: string) => ({ question: q, answer: '', evaluation: null, timeUsed: 0 })))
      setCurrentIdx(0)
      setAnswer('')
      setTranscript('')
      setPhase('countdown')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setPhase('setup')
    }
  }

  // ── Submit answer ──
  async function handleSubmit() {
    clearInterval(timerRef.current)
    const finalAnswer = answer.trim() || transcript.trim()
    const timeUsed = TIME_PER_Q - timeLeft
    stopListening()
    cancel()

    setSession((prev) => {
      const updated = [...prev]
      updated[currentIdx] = { ...updated[currentIdx], answer: finalAnswer, timeUsed }
      return updated
    })

    if (!finalAnswer) {
      // skipped — no evaluation
      setPhase('feedback')
      return
    }

    setPhase('evaluating')
    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ, answer: finalAnswer, topic, level }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to evaluate.')
      setSession((prev) => {
        const updated = [...prev]
        updated[currentIdx] = { ...updated[currentIdx], evaluation: data, answer: finalAnswer, timeUsed }
        return updated
      })
    } catch {
      // still move to feedback even if eval fails
    }
    setFeedbackTab('feedback')
    setPhase('feedback')
  }

  // ── Next question ── (email gate after Q1 if not captured)
  function nextQuestion() {
    const next = currentIdx + 1
    if (currentIdx === 0 && !isCaptured() && !emailUnlocked) {
      setShowEmailGate(true)
      return
    }
    if (next >= questions.length) {
      setPhase('summary')
      saveSession(session)
    } else {
      setCurrentIdx(next)
      setAnswer('')
      setTranscript('')
      setIsListening(false)
      setPhase('question')
    }
  }

  function handleEmailSuccess() {
    setEmailUnlocked(true)
    setShowEmailGate(false)
    const next = currentIdx + 1
    if (next >= questions.length) {
      setPhase('summary')
      saveSession(session)
    } else {
      setCurrentIdx(next)
      setAnswer('')
      setTranscript('')
      setIsListening(false)
      setPhase('question')
    }
  }

  // ── Reset ──
  function reset() {
    cancel()
    stopListening()
    clearInterval(timerRef.current)
    setPhase('setup')
    setQuestions([])
    setSession([])
    setCurrentIdx(0)
    setAnswer('')
    setTranscript('')
    setError('')
    setSessionSaved(false)
  }

  const timerPct = (timeLeft / TIME_PER_Q) * 100
  const timerColor = timeLeft > 60 ? 'stroke-green-500' : timeLeft > 30 ? 'stroke-yellow-500' : 'stroke-red-500'

  // ════════════════════════════════════════════════════════════════
  // SETUP
  // ════════════════════════════════════════════════════════════════
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-7">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-1">AI Interview Simulator</h2>
            <p className="text-zinc-500 text-sm">Practice real AI/ML questions with voice support. Get detailed AI feedback instantly.</p>
          </div>

          {/* Topic */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Topic</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTopic(t.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    topic === t.value ? t.color : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Experience Level</label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`py-3 text-sm font-semibold rounded-xl border transition-all ${
                    level === l
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Number of Questions</label>
            <div className="grid grid-cols-3 gap-2">
              {Q_COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setQCount(c)}
                  className={`py-3 text-sm font-semibold rounded-xl border transition-all ${
                    qCount === c
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {c} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Voice settings */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Voice Settings</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  ttsEnabled ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}
              >
                {ttsEnabled ? <Volume2 className="w-5 h-5 shrink-0" /> : <VolumeX className="w-5 h-5 shrink-0" />}
                <div>
                  <p className="text-xs font-semibold">AI Voice</p>
                  <p className="text-xs opacity-70">AI reads questions aloud</p>
                </div>
              </button>

              <button
                onClick={() => setSttEnabled(!sttEnabled)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  sttEnabled ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}
              >
                {sttEnabled ? <Mic className="w-5 h-5 shrink-0" /> : <MicOff className="w-5 h-5 shrink-0" />}
                <div>
                  <p className="text-xs font-semibold">Voice Answer</p>
                  <p className="text-xs opacity-70">Speak your answers</p>
                </div>
              </button>
            </div>
            <p className="text-xs text-zinc-600">Voice features use your browser&apos;s built-in speech engine — no data sent externally.</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={generateSession}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            <Sparkles className="w-4 h-4" /> Start Interview Session
          </button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // GENERATING
  // ════════════════════════════════════════════════════════════════
  if (phase === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 py-10">
        <div className="relative w-16 h-16">
          <span className="absolute inset-0 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
          <BrainCircuit className="absolute inset-0 m-auto w-7 h-7 text-orange-400" />
        </div>
        <div className="text-center">
          <p className="text-zinc-200 font-semibold mb-1">Preparing your interview…</p>
          <p className="text-zinc-500 text-sm">Generating {qCount} {level.toLowerCase()}-level {topic} questions</p>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // COUNTDOWN
  // ════════════════════════════════════════════════════════════════
  if (phase === 'countdown') {
    return (
      <CountdownScreen onDone={() => setPhase('question')} />
    )
  }

  // ════════════════════════════════════════════════════════════════
  // QUESTION
  // ════════════════════════════════════════════════════════════════
  if (phase === 'question') {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${topicMeta.color}`}>{topic}</span>
            <span className="text-xs text-zinc-500 font-semibold">{level}</span>
          </div>
          <div className="flex items-center gap-3">
            {ttsEnabled && (
              <button
                onClick={() => speaking ? cancel() : speak(currentQ)}
                className={`p-2 rounded-lg border transition-colors ${speaking ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                title={speaking ? 'Stop speaking' : 'Read question aloud'}
              >
                {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            <button onClick={handleSubmit} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <SkipForward className="w-3.5 h-3.5" /> Skip
            </button>
          </div>
        </div>

        {/* Progress + Timer */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Circular timer */}
            <svg width="36" height="36" viewBox="0 0 36 36" className="rotate-[-90deg]">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#27272a" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 15}`}
                strokeDashoffset={`${2 * Math.PI * 15 * (1 - timerPct / 100)}`}
                className={`${timerColor} transition-all duration-1000`}
              />
            </svg>
            <span className={`text-sm font-bold tabular-nums ${timeLeft <= 30 ? 'text-red-400' : 'text-zinc-300'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-xs text-zinc-500 shrink-0">{currentIdx + 1}/{questions.length}</span>
        </div>

        {/* Question card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Question {currentIdx + 1}</p>
          <p className="text-zinc-100 text-base font-medium leading-relaxed">{currentQ}</p>
          {speaking && (
            <div className="flex items-center gap-2 mt-4 text-blue-400">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-xs">Reading question…</span>
            </div>
          )}
        </div>

        {/* Answer area */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
          {sttEnabled ? (
            <div className="flex flex-col gap-4">
              {/* Mic button */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={toggleMic}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-500 shadow-xl shadow-red-500/40'
                      : 'bg-zinc-800 border-2 border-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-zinc-300" />
                  )}
                  {isListening && (
                    <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-60" />
                  )}
                </button>
                <MicWaveform active={isListening} />
                <p className="text-xs text-zinc-500">
                  {isListening ? 'Listening… tap to stop' : 'Tap mic to speak your answer'}
                </p>
              </div>

              {/* Live transcript */}
              {(transcript || answer) && (
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Your Answer</p>
                  <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{transcript || answer}</p>
                </div>
              )}

              {/* Also allow typing */}
              {!isListening && (
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={(e) => { setAnswer(e.target.value); setTranscript('') }}
                  placeholder="Or type your answer here…"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
                />
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here…"
              rows={8}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none resize-none"
            />
          )}
        </div>

        {/* Word count + Submit */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600">
            {(answer || transcript).trim().split(/\s+/).filter(Boolean).length} words
          </span>
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() && !transcript.trim()}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            Submit Answer <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // EVALUATING
  // ════════════════════════════════════════════════════════════════
  if (phase === 'evaluating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 py-10">
        <div className="relative w-14 h-14">
          <span className="absolute inset-0 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
          <BrainCircuit className="absolute inset-0 m-auto w-6 h-6 text-orange-400" />
        </div>
        <div className="text-center">
          <p className="text-zinc-200 font-semibold mb-1">Evaluating your answer…</p>
          <p className="text-zinc-500 text-sm">AI interviewer is scoring your response</p>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // FEEDBACK
  // ════════════════════════════════════════════════════════════════
  if (phase === 'feedback') {
    const ev = currentEntry?.evaluation
    const skipped = !currentEntry?.answer

    return (
      <>
      <EmailGateModal
        open={showEmailGate}
        onSuccess={handleEmailSuccess}
        source="interview_simulator"
        title="Great job on Question 1! 🎉"
        subtitle="Enter your email to unlock your full interview session. We'll also send you 50 curated AI/ML questions straight to your inbox — free."
        benefit="Unlock remaining questions + 50 bonus Q&As"
        emoji="🎯"
      />
      <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col gap-5">
        {/* Question recap */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Question {currentIdx + 1}</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{currentQ}</p>
        </div>

        {skipped || !ev ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <p className="text-zinc-400">No answer submitted — question skipped.</p>
          </div>
        ) : (
          <>
            {/* Score arc */}
            <div className={`bg-gradient-to-br ${scoreBgColor(ev.score)} border rounded-2xl p-6 flex items-center gap-6`}>
              <ScoreArc score={ev.score} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-2xl font-extrabold ${gradeColor(ev.grade)}`}>{ev.grade}</span>
                  <span className="text-zinc-300 font-semibold text-sm">{ev.verdict}</span>
                </div>
                <p className="text-xs text-zinc-500">Time used: {formatTime(currentEntry.timeUsed)}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Confidence: {ev.confidence}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-zinc-800">
              <button
                onClick={() => setFeedbackTab('feedback')}
                className={`pb-2 text-sm font-semibold transition-colors ${feedbackTab === 'feedback' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Feedback
              </button>
              <button
                onClick={() => setFeedbackTab('model')}
                className={`pb-2 text-sm font-semibold transition-colors ${feedbackTab === 'model' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Model Answer
              </button>
            </div>

            {feedbackTab === 'feedback' && (
              <>
                {ev.correct.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-3">What You Got Right</p>
                    <ul className="flex flex-col gap-2">
                      {ev.correct.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ev.missing.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">What Was Missing</p>
                    <ul className="flex flex-col gap-2">
                      {ev.missing.map((m, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ev.tip && (
                  <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                    <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">Pro Tip</p>
                      <p className="text-sm text-zinc-300">{ev.tip}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {feedbackTab === 'model' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Ideal Answer</p>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{ev.modelAnswer}</p>
              </div>
            )}
          </>
        )}

        {/* Next */}
        <button
          onClick={nextQuestion}
          className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
        >
          {currentIdx + 1 < questions.length ? (
            <><ChevronRight className="w-4 h-4" /> Next Question</>
          ) : (
            <><Trophy className="w-4 h-4" /> See Session Results</>
          )}
        </button>
      </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════
  if (phase === 'summary') {
    const avg = avgScore(session)
    const answered = session.filter((e) => e.answer).length
    const totalTime = session.reduce((a, e) => a + e.timeUsed, 0)
    const overallGrade = avg >= 9 ? 'A+' : avg >= 8 ? 'A' : avg >= 7 ? 'B' : avg >= 6 ? 'C' : avg >= 4 ? 'D' : 'F'
    const gradeMsg = avg >= 8 ? 'Excellent performance!' : avg >= 6 ? 'Good work — keep practicing.' : 'Keep studying and try again.'

    return (
      <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col gap-6">
        {/* Hero score */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-zinc-100 mb-1">Session Complete</h2>
          <p className="text-zinc-500 text-sm mb-6">{topic} · {level} · {questions.length} Questions</p>
          <div className="flex items-center justify-center gap-8">
            <div>
              <ScoreArc score={Math.round(avg * 10) / 10} />
              <p className="text-xs text-zinc-500 mt-1">Avg Score</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className={`text-5xl font-extrabold ${gradeColor(overallGrade)}`}>{overallGrade}</span>
              <p className="text-xs text-zinc-400">{gradeMsg}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Answered', value: `${answered}/${questions.length}` },
            { label: 'Avg Score', value: `${avg.toFixed(1)}/10` },
            { label: 'Total Time', value: formatTime(totalTime) },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-zinc-100">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Per-question breakdown */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Question Breakdown</p>
          {session.map((entry, i) => {
            const ev = entry.evaluation
            const skipped = !entry.answer
            return (
              <div key={i} className={`bg-zinc-900 border rounded-xl p-4 ${skipped ? 'border-zinc-800' : ev ? (ev.score >= 7 ? 'border-green-500/20' : ev.score >= 4 ? 'border-yellow-500/20' : 'border-red-500/20') : 'border-zinc-800'}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs text-zinc-400 flex-1 line-clamp-2">{entry.question}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {skipped ? (
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">Skipped</span>
                    ) : ev ? (
                      <>
                        <span className={`text-sm font-bold ${gradeColor(ev.grade)}`}>{ev.grade}</span>
                        <span className="text-xs text-zinc-500">{ev.score}/10</span>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-500">No eval</span>
                    )}
                    <span className="flex items-center gap-0.5 text-xs text-zinc-600">
                      <Clock className="w-3 h-3" />{formatTime(entry.timeUsed)}
                    </span>
                  </div>
                </div>
                {ev && ev.tip && (
                  <p className="text-xs text-zinc-600 flex items-start gap-1.5">
                    <Lightbulb className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />{ev.tip}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Save progress banner */}
        {loggedInUser ? (
          <div className={`flex items-center gap-3 rounded-2xl p-4 border ${sessionSaved ? 'bg-green-500/10 border-green-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
            <Save className={`w-4 h-4 shrink-0 ${sessionSaved ? 'text-green-400' : 'text-zinc-500'}`} />
            <p className="text-sm text-zinc-300">
              {sessionSaved ? 'Session saved to your progress dashboard.' : 'Saving session…'}
            </p>
            {sessionSaved && (
              <a href="/dashboard" className="ml-auto text-xs text-orange-400 hover:text-orange-300 font-semibold shrink-0 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> View Progress
              </a>
            )}
          </div>
        ) : (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 font-semibold">Save your progress</p>
              <p className="text-xs text-zinc-500">Create a free account to track improvement over time.</p>
            </div>
            <a
              href="/signup"
              className="text-xs bg-orange-500 hover:bg-orange-400 text-white font-semibold px-3 py-2 rounded-lg transition-colors shrink-0"
            >
              Sign up free
            </a>
          </div>
        )}

        {/* Retry */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-3.5 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> New Session
          </button>
          <button
            onClick={generateSession}
            className="flex items-center justify-center gap-2 flex-1 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            <Sparkles className="w-4 h-4" /> Retry Same Settings
          </button>
        </div>
      </div>
    )
  }

  return null
}
