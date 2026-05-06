'use client'

import { useState } from 'react'
import { Brain, CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight, Sparkles } from 'lucide-react'

const TOPICS = ['LLM', 'RAG', 'Agents', 'Fine-Tuning', 'MLOps', 'Transformers', 'System Design', 'Python', 'Vector DB']
const LEVELS = ['Fresher', 'Mid', 'Senior']
const COUNTS = [5, 7, 10]

interface Question {
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

type Phase = 'setup' | 'quiz' | 'results'

export default function SkillQuiz() {
  const [topic, setTopic] = useState(TOPICS[0])
  const [level, setLevel] = useState(LEVELS[0])
  const [count, setCount] = useState(5)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<Phase>('setup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)

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

  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length

  if (phase === 'setup') {
    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="relative py-20 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              <Brain className="w-3.5 h-3.5" /> Skill Assessment
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Test Your AI/ML Skills</h1>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              AI-generated MCQ quiz tailored to your level. Get instant explanations for every answer.
            </p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-24">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Topic</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button key={t} onClick={() => setTopic(t)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      topic === t ? 'bg-green-500 border-green-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Level</label>
              <div className="flex gap-2">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => setLevel(l)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                      level === l ? 'bg-green-500 border-green-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >{l}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Number of Questions</label>
              <div className="flex gap-2">
                {COUNTS.map((c) => (
                  <button key={c} onClick={() => setCount(c)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                      count === c ? 'bg-green-500 border-green-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >{c} Qs</button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={startQuiz}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20"
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

  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[current]
    const chosen = answers[current]
    const isCorrect = chosen === q.correctIndex

    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50 py-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Question {current + 1} of {questions.length}
            </span>
            <span className="text-xs font-semibold text-green-400">{score} correct</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-8">
            <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>

          {/* Topic + Level badges */}
          <div className="flex gap-2 mb-6">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{topic}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{level}</span>
          </div>

          {/* Question */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
            <p className="text-zinc-100 font-medium text-base leading-relaxed">{q.question}</p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 mb-5">
            {q.options.map((opt, idx) => {
              let cls = 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
              if (chosen !== null) {
                if (idx === q.correctIndex) cls = 'bg-green-500/10 border-green-500/40 text-green-300'
                else if (idx === chosen && !isCorrect) cls = 'bg-red-500/10 border-red-500/40 text-red-300'
                else cls = 'bg-zinc-900 border border-zinc-800 text-zinc-500'
              }
              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(idx)}
                  disabled={chosen !== null}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm font-medium disabled:cursor-default ${cls}`}
                >
                  <span className="w-6 h-6 shrink-0 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                  {chosen !== null && idx === q.correctIndex && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto shrink-0" />}
                  {chosen !== null && idx === chosen && !isCorrect && <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`rounded-2xl p-5 mb-5 ${isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: isCorrect ? '#4ade80' : '#f87171' }}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">{q.explanation}</p>
            </div>
          )}

          {chosen !== null && (
            <button
              onClick={next}
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20"
            >
              {current < questions.length - 1 ? <><ChevronRight className="w-4 h-4" /> Next Question</> : <><Trophy className="w-4 h-4" /> See Results</>}
            </button>
          )}
        </div>
      </section>
    )
  }

  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100)
    const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F'
    const gradeColors: Record<string, string> = { A: 'text-green-400', B: 'text-blue-400', C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400' }

    return (
      <section className="min-h-screen bg-zinc-950 text-zinc-50 py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold mb-2">Quiz Complete!</h2>
            <p className="text-zinc-400">{topic} · {level}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center mb-6">
            <div className={`text-7xl font-extrabold mb-2 ${gradeColors[grade]}`}>{grade}</div>
            <p className="text-zinc-400 text-lg mb-4">{score} / {questions.length} correct ({pct}%)</p>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Per-question review */}
          <div className="flex flex-col gap-3 mb-8">
            {questions.map((q, i) => {
              const correct = answers[i] === q.correctIndex
              return (
                <div key={q.id} className={`bg-zinc-900 border rounded-xl p-4 ${correct ? 'border-green-500/20' : 'border-red-500/20'}`}>
                  <div className="flex items-start gap-3">
                    {correct ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium text-zinc-200 mb-1">{q.question}</p>
                      {!correct && answers[i] !== null && (
                        <p className="text-xs text-red-400">Your answer: {q.options[answers[i]!]}</p>
                      )}
                      <p className="text-xs text-green-400">Correct: {q.options[q.correctIndex]}</p>
                      <p className="text-xs text-zinc-500 mt-1">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={restart}
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Take Another Quiz
          </button>
        </div>
      </section>
    )
  }

  return null
}
