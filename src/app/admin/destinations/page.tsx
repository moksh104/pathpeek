import { db } from '@/lib/db'
import DestinationsManager from './DestinationsManager'

export default async function AdminDestinationsPage() {
  const destinations = await db.destination.findMany({
    include: {
      _count: {
        select: {
          hotels: true,
          activities: true,
          bookings: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return <DestinationsManager initialDestinations={destinations} />
}
