export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
          <div className="flex justify-between items-start">
            <div>
              <div className="h-7 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-3 w-36 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="h-10 w-36 bg-zinc-800 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="h-6 w-12 bg-zinc-800 rounded animate-pulse mx-auto mb-1.5" />
              <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mb-2" />
                <div className="h-3 w-48 bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
