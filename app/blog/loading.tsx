import { BlogCardSkeleton } from '@/components/ui/SkeletonCard'

export default function BlogLoading() {
  return (
    <div className="pt-20 pb-16 px-4 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-8 w-48 bg-zinc-800 rounded-xl animate-pulse mb-2" />
        <div className="h-4 w-72 bg-zinc-800 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => <BlogCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
