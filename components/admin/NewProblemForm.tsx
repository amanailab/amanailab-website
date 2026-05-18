"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const inp = "w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"

const TOPICS = [
  'Math', 'NLP', 'Transformers', 'LLM', 'RAG',
  'Vector DB', 'Deep Learning', 'Classical ML',
  'Computer Vision', 'Statistics', 'Agents',
] as const

interface TestCaseRow {
  function_call: string
  expected_output: string
  description: string
  is_hidden: boolean
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">{children}</label>
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export default function NewProblemForm({ defaultOrderIndex }: { defaultOrderIndex: number }) {
  const router = useRouter()

  // Core fields
  const [title, setTitle]           = useState('')
  const [slug, setSlug]             = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy')
  const [topic, setTopic]           = useState<string>(TOPICS[0])
  const [description, setDesc]      = useState('')
  const [starterCode, setCode]      = useState('')
  const [orderIndex, setOrderIndex] = useState(defaultOrderIndex)

  // Arrays
  const [tags, setTags]         = useState<string[]>([''])
  const [companies, setCompanies] = useState<string[]>([''])
  const [hints, setHints]       = useState<string[]>([''])
  const [testCases, setTestCases] = useState<TestCaseRow[]>([
    { function_call: '', expected_output: '', description: '', is_hidden: false },
  ])

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState('')
  const [error, setError]           = useState('')

  // Title → auto-slug
  const handleTitleChange = useCallback((v: string) => {
    setTitle(v)
    if (!slugEdited) setSlug(slugify(v))
  }, [slugEdited])

  const handleSlugChange = (v: string) => {
    setSlugEdited(true)
    setSlug(slugify(v))
  }

  // Generic list helpers
  function addItem<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, blank: T, max: number, list: T[]) {
    if (list.length < max) setter(prev => [...prev, blank])
  }
  function removeItem<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, idx: number) {
    setter(prev => prev.filter((_, i) => i !== idx))
  }
  function updateItem<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, idx: number, val: T) {
    setter(prev => prev.map((item, i) => i === idx ? val : item))
  }

  // Test case helpers
  function addTestCase() {
    setTestCases(prev => [...prev, { function_call: '', expected_output: '', description: '', is_hidden: false }])
  }
  function removeTestCase(idx: number) {
    if (testCases.length <= 1) return
    setTestCases(prev => prev.filter((_, i) => i !== idx))
  }
  function updateTestCase(idx: number, field: keyof TestCaseRow, val: string | boolean) {
    setTestCases(prev => prev.map((tc, i) => i === idx ? { ...tc, [field]: val } : tc))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Client-side validation
    if (!title.trim()) { setError('Title is required'); return }
    if (!slug.trim())  { setError('Slug is required'); return }
    if (!description.trim()) { setError('Description is required'); return }
    if (!starterCode.trim()) { setError('Starter code is required'); return }
    const validTestCases = testCases.filter(tc => tc.function_call.trim() && tc.expected_output.trim())
    if (validTestCases.length === 0) {
      setError('At least one test case with function_call and expected_output is required')
      return
    }

    const payload = {
      title: title.trim(),
      slug:  slug.trim(),
      difficulty,
      topic,
      tags:         tags.map(t => t.trim()).filter(Boolean),
      companies:    companies.map(c => c.trim()).filter(Boolean),
      description:  description.trim(),
      starter_code: starterCode.trim(),
      test_cases:   validTestCases.map((tc, i) => ({
        id:              i + 1,
        function_call:   tc.function_call.trim(),
        expected_output: tc.expected_output.trim(),
        description:     tc.description.trim(),
        is_hidden:       tc.is_hidden,
      })),
      hints:       hints.map(h => h.trim()).filter(Boolean),
      order_index: orderIndex,
    }

    setSubmitting(true)
    try {
      const res  = await fetch('/api/admin/code-problems/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Problem created successfully! Redirecting…')
        setTimeout(() => router.push('/admin/code-problems'), 1200)
      } else {
        setError(data.error ?? 'Failed to create problem')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Banner */}
      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── BASIC INFO ─────────────────────────────────────────────── */}
      <SectionCard>
        <h2 className="text-sm font-bold text-zinc-200 mb-4">Basic Info</h2>
        <div className="space-y-4">

          {/* Title */}
          <div>
            <Label>Title *</Label>
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g. Softmax Function"
              className={inp}
              required
            />
          </div>

          {/* Slug */}
          <div>
            <Label>Slug *</Label>
            <input
              type="text"
              value={slug}
              onChange={e => handleSlugChange(e.target.value)}
              placeholder="auto-generated from title"
              className={inp}
              required
            />
            <p className="text-[11px] text-zinc-600 mt-1">URL: /code-lab/{slug || '…'}</p>
          </div>

          {/* Difficulty + Topic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Difficulty *</Label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className={inp}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <Label>Topic *</Label>
              <select
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className={inp}
              >
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Order Index */}
          <div className="w-40">
            <Label>Order Index</Label>
            <input
              type="number"
              value={orderIndex}
              onChange={e => setOrderIndex(Number(e.target.value))}
              min={1}
              className={inp}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── TAGS ────────────────────────────────────────────────────── */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-200">Tags <span className="text-zinc-600 font-normal">(up to 8)</span></h2>
          <button type="button" onClick={() => addItem(setTags, '', 8, tags)}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Tag
          </button>
        </div>
        <div className="space-y-2">
          {tags.map((tag, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={tag}
                onChange={e => updateItem(setTags, i, e.target.value)}
                placeholder={`Tag ${i + 1}`}
                className={inp}
              />
              {tags.length > 1 && (
                <button type="button" onClick={() => removeItem(setTags, i)}
                  className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── COMPANIES ───────────────────────────────────────────────── */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-200">Companies <span className="text-zinc-600 font-normal">(up to 5)</span></h2>
          <button type="button" onClick={() => addItem(setCompanies, '', 5, companies)}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Company
          </button>
        </div>
        <div className="space-y-2">
          {companies.map((co, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={co}
                onChange={e => updateItem(setCompanies, i, e.target.value)}
                placeholder={`e.g. Google, OpenAI`}
                className={inp}
              />
              {companies.length > 1 && (
                <button type="button" onClick={() => removeItem(setCompanies, i)}
                  className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── DESCRIPTION ─────────────────────────────────────────────── */}
      <SectionCard>
        <h2 className="text-sm font-bold text-zinc-200 mb-4">Description *</h2>
        <textarea
          value={description}
          onChange={e => setDesc(e.target.value)}
          rows={12}
          placeholder={`Markdown supported. Start with a heading:\n\n## Problem Title\n\nExplain what the function should do.\n\n### Example\n\`\`\`\nInput: [1, 2, 3]\nOutput: ...\n\`\`\``}
          className={`${inp} font-mono text-xs leading-relaxed resize-y`}
          required
        />
        <p className="text-[11px] text-zinc-600 mt-1.5">Markdown is rendered on the problem page. Use ## headings, code blocks, and bold text.</p>
      </SectionCard>

      {/* ── STARTER CODE ────────────────────────────────────────────── */}
      <SectionCard>
        <h2 className="text-sm font-bold text-zinc-200 mb-4">Starter Code * <span className="text-zinc-600 font-normal">(Python)</span></h2>
        <textarea
          value={starterCode}
          onChange={e => setCode(e.target.value)}
          rows={10}
          placeholder={`def solution(nums: list[float]) -> list[float]:\n    # your code here\n    pass`}
          className={`${inp} font-mono text-xs leading-relaxed resize-y`}
          spellCheck={false}
          required
        />
      </SectionCard>

      {/* ── TEST CASES ──────────────────────────────────────────────── */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Test Cases *</h2>
            <p className="text-[11px] text-zinc-600 mt-0.5">At least 1 visible test case is required</p>
          </div>
          <button type="button" onClick={addTestCase}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Test Case
          </button>
        </div>

        <div className="space-y-4">
          {testCases.map((tc, i) => (
            <div key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Test Case {i + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={tc.is_hidden}
                      onChange={e => updateTestCase(i, 'is_hidden', e.target.checked)}
                      className="accent-orange-500 w-3.5 h-3.5"
                    />
                    Hidden
                  </label>
                  {testCases.length > 1 && (
                    <button type="button" onClick={() => removeTestCase(i)}
                      className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label>Function Call *</Label>
                <input
                  type="text"
                  value={tc.function_call}
                  onChange={e => updateTestCase(i, 'function_call', e.target.value)}
                  placeholder="solution([1, 2, 3])"
                  className={`${inp} font-mono text-xs`}
                />
              </div>
              <div>
                <Label>Expected Output *</Label>
                <input
                  type="text"
                  value={tc.expected_output}
                  onChange={e => updateTestCase(i, 'expected_output', e.target.value)}
                  placeholder="[0.09003, 0.24473, 0.66524]"
                  className={`${inp} font-mono text-xs`}
                />
              </div>
              <div>
                <Label>Description</Label>
                <input
                  type="text"
                  value={tc.description}
                  onChange={e => updateTestCase(i, 'description', e.target.value)}
                  placeholder="Short description of what this test checks"
                  className={inp}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── HINTS ───────────────────────────────────────────────────── */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-200">Hints <span className="text-zinc-600 font-normal">(up to 5, optional)</span></h2>
          <button type="button" onClick={() => addItem(setHints, '', 5, hints)}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Hint
          </button>
        </div>
        <div className="space-y-2">
          {hints.map((hint, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={hint}
                onChange={e => updateItem(setHints, i, e.target.value)}
                placeholder={`Hint ${i + 1} — a nudge without giving away the answer`}
                className={inp}
              />
              {hints.length > 1 && (
                <button type="button" onClick={() => removeItem(setHints, i)}
                  className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── SUBMIT ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.push('/admin/code-problems')}
          className="px-5 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
            : <><CheckCircle2 className="w-4 h-4" /> Create Problem</>
          }
        </button>
      </div>
    </form>
  )
}
