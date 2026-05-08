export default function SeriesLoading() {
  return (
    <div className="pt-20 pb-16 px-4 max-w-6xl mx-auto animate-pulse">
      <div className="h-10 w-40 bg-zinc-800 rounded-xl mx-auto mb-3" />
      <div className="h-4 w-64 bg-zinc-800 rounded mx-auto mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="aspect-video bg-zinc-800" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-5 bg-zinc-800 rounded w-3/4" />
              <div className="h-4 bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
