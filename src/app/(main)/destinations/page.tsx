import { db } from '@/lib/db'
import DestinationsClient from './DestinationsClient'

export const metadata = {
  title: 'All Destinations — PathPeek Travel Portal',
  description: 'Explore curated Indian destinations by mood, budget, and location.',
}

export default async function DestinationsPage() {
  const destinations = await db.destination.findMany({
    orderBy: [
      { recommendationScore: 'desc' },
      { rating: 'desc' },
    ],
  })

  return <DestinationsClient initialDestinations={destinations} />
}
