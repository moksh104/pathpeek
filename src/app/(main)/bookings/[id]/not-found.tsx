import Link from 'next/link'
import { CalendarX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BookingNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
          <CalendarX className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
          Booking Not Found
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This booking reference could not be found, or you do not have permission to view it.
        </p>
        <div className="pt-2">
          <Link href="/my-trips">
            <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to My Trips
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
