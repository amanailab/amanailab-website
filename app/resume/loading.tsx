export default function ResumeLoading() {
  return (
    <div className="pt-20 pb-16 px-4 max-w-4xl mx-auto animate-pulse">
      <div className="h-10 w-56 bg-zinc-800 rounded-xl mx-auto mb-3" />
      <div className="h-4 w-72 bg-zinc-800 rounded mx-auto mb-10" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6">
        <div className="h-32 bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-700" />
        <div className="flex gap-2">
          {[1,2].map(i => <div key={i} className="h-10 flex-1 bg-zinc-800 rounded-xl" />)}
        </div>
        <div className="h-10 w-48 bg-zinc-800 rounded-xl mx-auto" />
      </div>
    </div>
  )
}
