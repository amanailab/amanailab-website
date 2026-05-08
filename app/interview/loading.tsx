export default function InterviewLoading() {
  return (
    <div className="pt-20 pb-16 px-4 max-w-5xl mx-auto animate-pulse">
      <div className="h-10 w-64 bg-zinc-800 rounded-xl mx-auto mb-3" />
      <div className="h-4 w-80 bg-zinc-800 rounded mx-auto mb-10" />
      <div className="flex gap-2 mb-8">
        {[1,2,3].map(i => <div key={i} className="h-10 w-28 bg-zinc-800 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-zinc-800 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-zinc-800 rounded-2xl" />
    </div>
  )
}
