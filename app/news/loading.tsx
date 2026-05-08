import { NewsCardSkeleton } from '@/components/ui/SkeletonCard'

export default function NewsLoading() {
  return (
    <div className="pt-20 pb-16 px-4 max-w-5xl mx-auto">
      <div className="h-8 w-48 bg-zinc-800 rounded-xl animate-pulse mb-2" />
      <div className="h-4 w-72 bg-zinc-800 rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <NewsCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
