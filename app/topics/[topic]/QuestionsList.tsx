'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

interface Q { id: string; question: string; answer: string; level: string; company?: string; companySlug?: string }

function QuestionItem({ question, answer, level, company }: Q) {
  return (
    <details className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <summary className="flex items-start gap-3 p-4 cursor-pointer list-none hover:bg-zinc-800/30 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">{level}</span>
            {company && <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">{company}</span>}
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{question}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5 group-open:hidden" />
        <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5 hidden group-open:block" />
      </summary>
      <div className="px-4 pb-4 border-t border-zinc-800">
        <div className="flex items-start gap-2 mt-3">
          <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1.5">Model Answer</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{answer}</p>
          </div>
        </div>
      </div>
    </details>
  )
}

const PAGE_SIZE = 20

export default function QuestionsList({ questions }: { questions: Q[] }) {
  const [shown, setShown] = useState(PAGE_SIZE)
  const visible = questions.slice(0, shown)
  const hasMore = shown < questions.length

  return (
    <div className="flex flex-col gap-2.5">
      {visible.map(q => <QuestionItem key={q.id} {...q} />)}
      {hasMore && (
        <button
          onClick={() => setShown(s => s + PAGE_SIZE)}
          className="mt-2 w-full py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-sm font-semibold rounded-xl transition-colors"
        >
          Show more ({questions.length - shown} remaining)
        </button>
      )}
    </div>
  )
}
