export default function BookingDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 animate-pulse">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/[0.04] mx-auto" />
        <div className="h-6 w-48 rounded bg-gray-200 dark:bg-white/[0.04] mx-auto" />
        <div className="h-8 w-64 rounded bg-gray-200 dark:bg-white/[0.04] mx-auto" />
      </div>

      <div className="rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0f0f14]/95 overflow-hidden">
        <div className="h-48 sm:h-56 bg-gray-200 dark:bg-white/[0.04]" />
        <div className="p-6 sm:p-8 space-y-6">
          <div className="h-20 rounded-2xl bg-gray-100 dark:bg-white/[0.02]" />
          <div className="h-24 rounded-2xl bg-gray-100 dark:bg-white/[0.02]" />
          <div className="h-24 rounded-2xl bg-gray-100 dark:bg-white/[0.02]" />
        </div>
      </div>
    </div>
  )
}
