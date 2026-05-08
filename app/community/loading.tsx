import { CommunityCardSkeleton } from '@/components/ui/SkeletonCard'

export default function CommunityLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="h-8 w-56 bg-zinc-800 rounded-xl animate-pulse mb-2" />
        <div className="h-4 w-80 bg-zinc-800 rounded-lg animate-pulse mb-8" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => <CommunityCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )
}
