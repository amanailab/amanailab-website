// Reusable shimmer skeleton components for loading states

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`bg-zinc-800 rounded animate-pulse ${className}`} />
}

export function BlogCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="h-44 bg-zinc-800 animate-pulse" />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <SkeletonLine className="h-5 w-20 rounded-full" />
          <SkeletonLine className="h-4 w-16" />
        </div>
        <SkeletonLine className="h-5 w-full" />
        <SkeletonLine className="h-5 w-3/4" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export function QuestionCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SkeletonLine className="h-5 w-16 rounded-full" />
        <SkeletonLine className="h-5 w-12 rounded-full" />
      </div>
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-5/6" />
    </div>
  )
}

export function NewsCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SkeletonLine className="h-5 w-24 rounded-full" />
        <SkeletonLine className="h-4 w-16 ml-auto" />
      </div>
      <SkeletonLine className="h-5 w-full" />
      <SkeletonLine className="h-5 w-4/5" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-3/4" />
      <SkeletonLine className="h-4 w-1/2" />
    </div>
  )
}

export function CommunityCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <SkeletonLine className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1.5 flex-1">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-3 w-20" />
        </div>
        <SkeletonLine className="h-5 w-20 rounded-full" />
      </div>
      <SkeletonLine className="h-5 w-3/4" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-5/6" />
    </div>
  )
}
