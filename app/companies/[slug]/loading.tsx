export default function CompanyLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16 px-4 animate-pulse">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl" />
          <div>
            <div className="h-8 w-40 bg-zinc-800 rounded-xl mb-2" />
            <div className="h-4 w-56 bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-2xl" />)}
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
