export default function CareerLoading() {
  return (
    <div className="pt-20 pb-16 px-4 max-w-4xl mx-auto animate-pulse">
      <div className="h-10 w-56 bg-zinc-800 rounded-xl mx-auto mb-3" />
      <div className="h-4 w-80 bg-zinc-800 rounded mx-auto mb-10" />
      <div className="flex gap-2 mb-8 justify-center">
        {[1,2,3,4].map(i => <div key={i} className="h-10 w-32 bg-zinc-800 rounded-xl" />)}
      </div>
      <div className="h-80 bg-zinc-900 border border-zinc-800 rounded-2xl" />
    </div>
  )
}
