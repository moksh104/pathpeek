export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-gray-200 dark:bg-white/[0.04]" />
          <div className="h-4 w-72 rounded bg-gray-200 dark:bg-white/[0.04]" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-gray-200 dark:bg-white/[0.04]" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] space-y-3"
          >
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/[0.04]" />
            <div className="h-8 w-32 rounded bg-gray-200 dark:bg-white/[0.04]" />
            <div className="h-3 w-40 rounded bg-gray-200 dark:bg-white/[0.04]" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5 space-y-4">
        <div className="h-6 w-40 rounded bg-gray-200 dark:bg-white/[0.04]" />
        <div className="h-10 w-full rounded bg-gray-100 dark:bg-white/[0.02]" />
        <div className="h-10 w-full rounded bg-gray-100 dark:bg-white/[0.02]" />
        <div className="h-10 w-full rounded bg-gray-100 dark:bg-white/[0.02]" />
      </div>
    </div>
  )
}
