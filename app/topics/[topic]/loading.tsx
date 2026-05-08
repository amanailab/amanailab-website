export default function TopicLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16 px-4 animate-pulse">
      <div className="max-w-4xl mx-auto">
        <div className="h-4 w-32 bg-zinc-800 rounded mb-6" />
        <div className="h-10 w-64 bg-zinc-800 rounded-xl mb-3" />
        <div className="h-5 w-96 bg-zinc-800 rounded mb-8" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
