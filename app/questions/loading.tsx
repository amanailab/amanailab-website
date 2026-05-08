import { QuestionCardSkeleton } from '@/components/ui/SkeletonCard'

export default function QuestionsLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-64 bg-zinc-800 rounded-xl animate-pulse mb-6" />
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
          <div className="h-10 bg-zinc-800 rounded-xl animate-pulse mb-3" />
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="h-8 w-24 bg-zinc-800 rounded-lg animate-pulse" />)}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 10 }).map((_, i) => <QuestionCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )
}
