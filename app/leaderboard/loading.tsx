export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="h-6 w-32 bg-zinc-800 rounded-full animate-pulse mx-auto mb-4" />
          <div className="h-8 w-40 bg-zinc-800 rounded animate-pulse mx-auto mb-2" />
          <div className="h-4 w-56 bg-zinc-800 rounded animate-pulse mx-auto" />
        </div>
        <div className="h-12 w-full bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse mb-6" />
        <div className="flex flex-col gap-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 animate-pulse shrink-0" />
              <div className="w-9 h-9 rounded-full bg-zinc-800 animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse mb-1.5" />
                <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="h-5 w-8 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-10 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
