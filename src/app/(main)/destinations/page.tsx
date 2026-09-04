import { db } from '@/lib/db'
import DestinationsClient from './DestinationsClient'
import { travelPlaces } from '@/data/places'

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

  // Fallback to static seed data if database returns empty
  if (!destinations || destinations.length === 0) {
    destinations = travelPlaces.map((p) => ({
      ...p,
      recommendationScore: p.recommendationScore ?? 85,
    }))
  }

  return <DestinationsClient initialDestinations={destinations} />
}
