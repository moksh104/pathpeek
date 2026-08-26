export default function DestinationsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header Skeleton */}
      <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
        <div className="h-6 w-36 bg-gray-200 dark:bg-white/[0.05] rounded-full mx-auto animate-pulse" />
        <div className="h-10 w-64 bg-gray-200 dark:bg-white/[0.05] rounded-xl mx-auto animate-pulse" />
        <div className="h-4 w-80 bg-gray-100 dark:bg-white/[0.03] rounded-lg mx-auto animate-pulse" />
      </div>

      {/* Filter Box Skeleton */}
      <div className="h-48 rounded-2xl bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] mb-10 animate-pulse" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05]"
          >
            <div className="h-56 bg-gray-200 dark:bg-white/[0.04] animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-white/[0.04] rounded animate-pulse" />
              <div className="h-3 bg-gray-100 dark:bg-white/[0.03] rounded w-2/3 animate-pulse" />
              <div className="h-10 bg-gray-200 dark:bg-white/[0.04] rounded-xl mt-4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
