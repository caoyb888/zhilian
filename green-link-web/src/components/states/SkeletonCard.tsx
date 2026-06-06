export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 animate-pulse rounded bg-stone-100" />
        <div className="h-4 w-20 animate-pulse rounded bg-stone-100" />
      </div>
      <div className="h-4 w-full animate-pulse rounded bg-stone-100 mb-2" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100 mb-4" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100 mb-4" />
      <div className="flex flex-wrap gap-1 mb-4">
        <div className="h-5 w-14 animate-pulse rounded bg-stone-100" />
        <div className="h-5 w-16 animate-pulse rounded bg-stone-100" />
      </div>
      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <div className="h-4 w-24 animate-pulse rounded bg-stone-100" />
        <div className="h-8 w-20 animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  )
}
