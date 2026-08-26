import Link from 'next/link'
import { MapPinOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DestinationNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
          <MapPinOff className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
          Destination Not Found
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          The travel destination you are looking for does not exist or may have been updated.
        </p>
        <div className="pt-2">
          <Link href="/destinations">
            <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse All Destinations
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
