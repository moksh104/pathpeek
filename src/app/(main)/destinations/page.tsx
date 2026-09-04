import { db } from '@/lib/db'
import DestinationsClient from './DestinationsClient'

export const metadata = {
  title: 'All Destinations — PathPeek Travel Portal',
  description: 'Explore curated Indian destinations by mood, budget, and location.',
}

export const dynamic = 'force-dynamic'

export default async function DestinationsPage() {
  let destinations: any[] = []
  try {
    destinations = await db.destination.findMany({
      orderBy: [
        { recommendationScore: 'desc' },
        { rating: 'desc' },
      ],
    })
  } catch (error) {
    console.error('Failed to load destinations from database:', error)
  }

  return <DestinationsClient initialDestinations={destinations} />
}
