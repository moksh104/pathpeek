export default function TripPlannerLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
        <div className="h-6 w-36 bg-gray-200 dark:bg-white/[0.05] rounded-full mx-auto animate-pulse" />
        <div className="h-9 w-64 bg-gray-200 dark:bg-white/[0.05] rounded-xl mx-auto animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
        <div className="lg:col-span-8 h-96 rounded-2xl bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] animate-pulse" />
        <div className="lg:col-span-4 h-72 rounded-2xl bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] animate-pulse" />
      </div>
    </div>
  )
}
