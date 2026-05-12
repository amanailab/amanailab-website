'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Brain, CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight,
  Sparkles, Copy, Check, Clock, Share2, BookOpen, Zap, Target, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { EmailGateInline, isCaptured } from '@/components/shared/EmailGateModal'

const TOPICS = [
  'LLM', 'RAG', 'Agents', 'Fine-Tuning', 'MLOps',
  'Transformers', 'System Design', 'Python', 'Vector DB',
  'NLP', 'Computer Vision', 'Statistics', 'Behavioral',
]
const LEVELS  = ['Fresher', 'Mid', 'Senior']
const COUNTS  = [5, 7, 10, 15]

const NEXT_STUDY: Record<string, string> = {
  LLM: '/topics/llm', RAG: '/topics/rag', Agents: '/topics/agents',
  'Fine-Tuning': '/topics/fine-tuning', MLOps: '/topics/mlops',
  Transformers: '/topics/transformers', 'System Design': '/topics/system-design',
  Python: '/topics/python', 'Vector DB': '/topics/vector-db',
  NLP: '/flashcards', 'Computer Vision': '/flashcards',
  Statistics: '/flashcards', Behavioral: '/topics/behavioral',
}

const GRADE_INFO: Record<string, { label: string; msg: string; color: string; bg: string }> = {
  A: { label: 'Excellent!',      msg: "Interview-ready. Try a harder level or tougher topic.",      color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
  B: { label: 'Good Job!',       msg: "Solid foundation. Review the questions you missed.",          color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30'  },
  C: { label: 'Getting There',   msg: "Practice more on this topic before your interviews.",         color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  D: { label: 'Keep Studying',   msg: "Start with flashcards to build a stronger foundation.",       color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  F: { label: 'Needs Work',      msg: "Don't worry — review the topic guide and try again!",         color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30'    },
}

interface Question {
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

type Phase = 'setup' | 'quiz' | 'results'

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800 transition-colors"
    >
      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> {label}</>}
    </button>
  )
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

export default function SkillQuiz() {
  const [topic,           setTopic]           = useState(TOPICS[0])
  const [level,           setLevel]           = useState(LEVELS[0])
  const [count,           setCount]           = useState(5)
  const [questions,       setQuestions]       = useState<Question[]>([])
  const [answers,         setAnswers]         = useState<(number | null)[]>([])
  const [current,         setCurrent]         = useState(0)
  const [phase,           setPhase]           = useState<Phase>('setup')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [elapsed,         setElapsed]         = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (phase === 'quiz') {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  async function startQuiz() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate quiz.')
      setQuestions(data.questions)
      setAnswers(new Array(data.questions.length).fill(null))
      setCurrent(0)
      setShowExplanation(false)
      setPhase('quiz')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function selectAnswer(idx: number) {
    if (answers[current] !== null) return
    const updated = [...answers]
    updated[current] = idx
    setAnswers(updated)
    setShowExplanation(true)
  }

  function next() {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
      setShowExplanation(false)
    } else {
      setPhase('results')
    }
  }

  function restart() {
    setPhase('setup')
    setQuestions([])
    setAnswers([])
    setCurrent(0)
    setShowExplanation(false)
  }

  async function retakeSameTopic() {
    setQuestions([])
    setAnswers([])
    setCurrent(0)
    setShowExplanation(false)
    await startQuiz()
  }

  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length

  // ── SETUP ──────────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="relative py-20 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              <Brain className="w-3.5 h-3.5" /> Skill Assessment Quiz
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Test Your AI/ML Knowledge
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              AI-generated MCQs tailored to your level. Instant explanations. Know exactly where you stand.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 13 topics</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-500" /> Instant feedback</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> 5–15 questions</span>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 pb-24">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-7">

            {/* Topic */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Topic</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button key={t} onClick={() => setTopic(t)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      topic === t
                        ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-green-500/40 hover:text-zinc-200'
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => setLevel(l)}
                    className={`py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                      level === l
                        ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-green-500/40 hover:text-zinc-200'
                    }`}
                  >{l}</button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {COUNTS.map((c) => (
                  <button key={c} onClick={() => setCount(c)}
                    className={`py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                      count === c
                        ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-green-500/40 hover:text-zinc-200'
                    }`}
                  >{c} Qs</button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 text-xs text-zinc-400">
              <span>📚 {topic} · {level} · {count} questions</span>
              <span>≈ {Math.round(count * 0.8)}–{Math.round(count * 1.5)} min</span>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

            <button onClick={startQuiz} disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-semibold px-4 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating Quiz…</>
                : <><Sparkles className="w-4 h-4" /> Start Quiz</>
              }
            </button>
          </div>
        </div>
      </section>
    )
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────────
  if (phase === 'quiz' && questions.length > 0) {
    const q        = questions[current]
    const chosen   = answers[current]
    const isCorrect = chosen === q.correctIndex
    const answered  = answers.filter(a => a !== null).length

    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50 py-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {topic} · {level}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="w-3.5 h-3.5" /> {formatTime(elapsed)}
              </span>
              <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                {score} / {answered} correct
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${((current + (chosen !== null ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-zinc-500 shrink-0">
              {current + 1}/{questions.length}
            </span>
          </div>

          {/* Question dots */}
          <div className="flex gap-1 mb-6 flex-wrap">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                i < current ? (answers[i] === questions[i].correctIndex ? 'bg-green-500' : 'bg-red-500')
                : i === current ? 'bg-green-400 animate-pulse'
                : 'bg-zinc-800'
              }`} />
            ))}
          </div>

          {/* Question */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
            <p className="text-zinc-100 font-semibold text-base leading-relaxed">{q.question}</p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 mb-5">
            {q.options.map((opt, idx) => {
              let cls = 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-green-500/40 hover:bg-green-500/5 hover:text-zinc-100'
              if (chosen !== null) {
                if (idx === q.correctIndex)            cls = 'bg-green-500/10 border-green-500/50 text-green-300'
                else if (idx === chosen && !isCorrect) cls = 'bg-red-500/10 border-red-500/50 text-red-300'
                else                                   cls = 'bg-zinc-900 border border-zinc-800 text-zinc-600'
              }
              return (
                <button key={idx} onClick={() => selectAnswer(idx)} disabled={chosen !== null}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm font-medium disabled:cursor-default ${cls}`}
                >
                  <span className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold ${
                    chosen !== null && idx === q.correctIndex ? 'border-green-500 bg-green-500/20 text-green-300'
                    : chosen !== null && idx === chosen && !isCorrect ? 'border-red-500 bg-red-500/20 text-red-300'
                    : 'border-current'
                  }`}>
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span className="flex-1">{opt.replace(/^[A-D]\.\s*/, '')}</span>
                  {chosen !== null && idx === q.correctIndex && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                  {chosen !== null && idx === chosen && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`rounded-2xl p-5 mb-5 border ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isCorrect ? 'text-green-400' : 'text-amber-400'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Not quite — here\'s why:'}
              </p>
              <p className="text-sm text-zinc-200 leading-relaxed">{q.explanation}</p>
            </div>
          )}

          {chosen !== null && (
            <button onClick={next}
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20"
            >
              {current < questions.length - 1
                ? <><ChevronRight className="w-4 h-4" /> Next Question</>
                : <><Trophy className="w-4 h-4" /> See My Results</>
              }
            </button>
          )}
        </div>
      </section>
    )
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const pct     = Math.round((score / questions.length) * 100)
    const grade   = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F'
    const info    = GRADE_INFO[grade]
    const missed  = questions.filter((_, i) => answers[i] !== questions[i].correctIndex)

    const shareText = `I scored ${pct}% (Grade ${grade}) on the ${topic} ${level} AI/ML quiz on AmanAI Lab! 🧠\n\nTest your skills: https://amanailab.com/quiz`

    const reviewText = questions.map((q, i) => {
      const correct = answers[i] === q.correctIndex
      return `Q${i + 1}: ${q.question}\n${correct ? '✓' : '✗'} ${q.options[q.correctIndex].replace(/^[A-D]\.\s*/, '')}\n${q.explanation}`
    }).join('\n\n')

    const barColor = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'

    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50 py-20 px-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">

          {/* Grade card */}
          <div className={`rounded-2xl p-7 border ${info.bg} text-center`}>
            <Trophy className={`w-12 h-12 mx-auto mb-3 ${pct >= 75 ? 'text-yellow-400' : 'text-zinc-500'}`} />
            <div className={`text-6xl font-black mb-1 ${info.color}`}>{grade}</div>
            <p className={`text-lg font-bold mb-1 ${info.color}`}>{info.label}</p>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto">{info.msg}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Score',    value: `${pct}%`,              sub: `${score}/${questions.length} correct`  },
              { label: 'Time',     value: formatTime(elapsed),     sub: `${Math.round(elapsed/questions.length)}s avg`     },
              { label: 'Accuracy', value: `${missed.length === 0 ? 'Perfect' : missed.length + ' missed'}`, sub: topic      },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-lg font-extrabold text-zinc-100">{s.value}</p>
                <p className="text-xs text-zinc-600 mt-0.5 truncate">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Overall Performance</span>
              <span className={`text-sm font-bold ${info.color}`}>{pct}%</span>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-zinc-600">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* What to study next */}
          {NEXT_STUDY[topic] && (
            <div className="flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Study {topic}</p>
                  <p className="text-xs text-zinc-500">Deepen your understanding with our topic guide</p>
                </div>
              </div>
              <Link href={NEXT_STUDY[topic]}
                className="flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 shrink-0 transition-colors"
              >
                Study <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Share / copy */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Share Your Score</span>
              </div>
              <CopyBtn text={shareText} label="Copy" />
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{shareText}</p>
          </div>

          {/* Per-question review */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-zinc-100">Question Review</p>
              <CopyBtn text={reviewText} label="Copy All" />
            </div>
            <div className="flex flex-col gap-2.5">
              {questions.map((q, i) => {
                const correct = answers[i] === q.correctIndex
                return (
                  <div key={q.id} className={`bg-zinc-900 border rounded-xl p-4 ${correct ? 'border-green-500/20' : 'border-red-500/20'}`}>
                    <div className="flex items-start gap-3">
                      {correct
                        ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 mb-1.5 leading-snug">{q.question}</p>
                        {!correct && answers[i] !== null && (
                          <p className="text-xs text-red-400 mb-1">
                            Your answer: {q.options[answers[i]!]?.replace(/^[A-D]\.\s*/, '')}
                          </p>
                        )}
                        <p className="text-xs text-green-400 mb-1.5">
                          ✓ {q.options[q.correctIndex]?.replace(/^[A-D]\.\s*/, '')}
                        </p>
                        <p className="text-xs text-zinc-500 leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          {isCaptured() ? (
            <div className="flex flex-col gap-2.5">
              <button onClick={retakeSameTopic} disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                {loading ? 'Generating…' : `Retake: ${topic} · ${level}`}
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={restart}
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
                >
                  Change Topic
                </button>
                <Link href="/interview"
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-3 rounded-xl transition-all text-sm"
                >
                  <Target className="w-4 h-4" /> Practice Interview
                </Link>
              </div>
            </div>
          ) : (
            <EmailGateInline
              onSuccess={restart}
              source="skill_quiz"
              title="Unlock unlimited quizzes"
              subtitle="Enter your email to retake, try harder levels, and get weekly AI interview tips."
              benefit="Unlimited quizzes + weekly tips"
              emoji="🧠"
            />
          )}
        </div>
      </section>
    )
  }

  return null
}
