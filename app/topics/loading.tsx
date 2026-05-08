export default function TopicsLoading() {
  return (
    <div className="pt-20 pb-16 px-4 max-w-5xl mx-auto animate-pulse">
      <div className="h-10 w-48 bg-zinc-800 rounded-xl mx-auto mb-3" />
      <div className="h-4 w-64 bg-zinc-800 rounded mx-auto mb-10" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-28 bg-zinc-900 border border-zinc-800 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
