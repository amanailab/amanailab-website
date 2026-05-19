// Reusable shimmer skeleton components for loading states

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-zinc-800/80 rounded ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.06) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.6s ease-in-out infinite',
      }}
    />
  )
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

export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900">
      <SkeletonLine className="w-9 h-9 rounded-xl shrink-0" />
      <SkeletonLine className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-3 w-20" />
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <SkeletonLine className="h-6 w-10" />
        <SkeletonLine className="h-3 w-14" />
      </div>
    </div>
  )
}

export function SessionPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <SkeletonLine className="h-4 w-32 mb-8" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-2">
            <SkeletonLine className="h-6 w-52" />
            <SkeletonLine className="h-3 w-36" />
          </div>
          <SkeletonLine className="h-14 w-16 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <SkeletonLine key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map(i => <SkeletonLine key={i} className="h-16 rounded-2xl" />)}
      </div>
    </div>
  )
}
