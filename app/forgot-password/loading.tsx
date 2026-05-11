export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse mb-8" />
        <div className="w-12 h-12 bg-zinc-800 rounded-2xl animate-pulse mb-5" />
        <div className="h-7 w-40 bg-zinc-800 rounded animate-pulse mb-2" />
        <div className="h-4 w-56 bg-zinc-800 rounded animate-pulse mb-8" />
        <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse mb-2" />
        <div className="h-11 w-full bg-zinc-800 rounded-xl animate-pulse mb-4" />
        <div className="h-11 w-full bg-zinc-800 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
