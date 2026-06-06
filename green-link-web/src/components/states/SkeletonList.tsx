export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-stone-100 bg-white p-4"
        >
          <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded bg-stone-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-stone-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-stone-100" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded bg-stone-100" />
        </div>
      ))}
    </div>
  )
}
