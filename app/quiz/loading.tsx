export default function QuizLoading() {
  return (
    <div className="pt-20 pb-16 px-4 max-w-2xl mx-auto animate-pulse">
      <div className="h-10 w-56 bg-zinc-800 rounded-xl mx-auto mb-3" />
      <div className="h-4 w-72 bg-zinc-800 rounded mx-auto mb-10" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
        <div className="h-8 bg-zinc-800 rounded-xl w-3/4" />
        <div className="flex gap-3">
          <div className="h-10 flex-1 bg-zinc-800 rounded-xl" />
          <div className="h-10 flex-1 bg-zinc-800 rounded-xl" />
          <div className="h-10 flex-1 bg-zinc-800 rounded-xl" />
        </div>
        <div className="h-12 bg-zinc-800 rounded-xl" />
      </div>
    </div>
  )
}
