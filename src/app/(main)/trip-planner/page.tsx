import { db } from '@/lib/db'
import TripPlannerClient from './TripPlannerClient'

export const metadata = {
  title: 'Smart Trip Planner — PathPeek',
  description: 'Plan your itinerary, pick accommodations, and select activities for your Indian vacation.',
}

interface PageProps {
  searchParams: Promise<{ destinationId?: string }>
}

export default async function TripPlannerPage({ searchParams }: PageProps) {
  const { destinationId } = await searchParams

  const destinations = await db.destination.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      image: true,
      mood: true,
      budget: true,
      rating: true,
    },
    orderBy: [
      { recommendationScore: 'desc' },
      { rating: 'desc' },
    ],
  })

  return (
    <TripPlannerClient
      destinations={destinations}
      initialDestinationId={destinationId}
    />
  )
}
