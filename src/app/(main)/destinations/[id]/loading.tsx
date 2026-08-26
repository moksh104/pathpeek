export default function DestinationDetailLoading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Skeleton */}
      <div className="h-[420px] w-full bg-gray-200 dark:bg-white/[0.04] animate-pulse" />

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="h-36 rounded-2xl bg-gray-100 dark:bg-white/[0.02] animate-pulse" />
          <div className="h-72 rounded-2xl bg-gray-100 dark:bg-white/[0.02] animate-pulse" />
          <div className="h-64 rounded-2xl bg-gray-100 dark:bg-white/[0.02] animate-pulse" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-80 rounded-2xl bg-gray-100 dark:bg-white/[0.02] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
