export default function CodeLabLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16 px-4 animate-pulse">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-zinc-800 rounded-xl" />
          <div>
            <div className="h-7 w-40 bg-zinc-800 rounded-xl mb-1" />
            <div className="h-3 w-56 bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="flex gap-2 mb-5">
          {[1,2,3,4].map(i => <div key={i} className="h-8 w-20 bg-zinc-800 rounded-lg" />)}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_100px_120px] gap-4 px-5 py-3 border-b border-zinc-800">
            {[1,2,3,4].map(i => <div key={i} className="h-3 bg-zinc-800 rounded" />)}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[40px_1fr_100px_120px] gap-4 px-5 py-4 border-b border-zinc-800/50 items-center">
              <div className="h-4 bg-zinc-800 rounded" />
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-5 bg-zinc-800 rounded-full w-16" />
              <div className="h-4 bg-zinc-800 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
