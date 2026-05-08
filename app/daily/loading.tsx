export default function DailyLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 animate-pulse">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-6 w-32 bg-zinc-800 rounded-full" />
          <div className="h-9 w-64 bg-zinc-800 rounded-xl" />
          <div className="h-4 w-48 bg-zinc-800 rounded" />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-20 bg-zinc-800 rounded-full" />
            <div className="h-6 w-16 bg-zinc-800 rounded-full" />
          </div>
          <div className="h-5 bg-zinc-800 rounded w-full mb-2" />
          <div className="h-5 bg-zinc-800 rounded w-4/5" />
        </div>
        <div className="h-36 bg-zinc-900 border border-zinc-800 rounded-2xl" />
      </div>
    </div>
  )
}
