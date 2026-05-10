// Homepage loading — shows while YouTube API fetches data
export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero skeleton */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto px-4 animate-pulse">
          <div className="h-5 w-40 bg-zinc-800 rounded-full mx-auto mb-8" />
          <div className="h-14 w-3/4 bg-zinc-800 rounded-xl mx-auto mb-3" />
          <div className="h-14 w-1/2 bg-zinc-800 rounded-xl mx-auto mb-6" />
          <div className="h-5 w-2/3 bg-zinc-800 rounded mx-auto mb-2" />
          <div className="h-5 w-1/2 bg-zinc-800 rounded mx-auto mb-10" />
          <div className="flex gap-4 justify-center">
            <div className="h-12 w-44 bg-zinc-800 rounded-xl" />
            <div className="h-12 w-44 bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
