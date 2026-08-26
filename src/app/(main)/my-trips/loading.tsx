export default function MyTripsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="flex justify-between items-end mb-10 pb-6 border-b border-gray-200 dark:border-white/[0.06]">
        <div className="space-y-2">
          <div className="h-5 w-28 bg-gray-200 dark:bg-white/[0.05] rounded-full animate-pulse" />
          <div className="h-9 w-60 bg-gray-200 dark:bg-white/[0.05] rounded-xl animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-white/[0.05] rounded-xl animate-pulse" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-44 rounded-3xl bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
