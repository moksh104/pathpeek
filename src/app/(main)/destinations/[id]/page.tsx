import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import DestinationDetailClient from './DestinationDetailClient'
import { travelPlaces } from '@/data/places'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  let destination: { name: string; city: string; state: string; description: string } | null = null
  try {
    destination = await db.destination.findUnique({
      where: { id },
      select: { name: true, city: true, state: true, description: true },
    })
  } catch (err) {
    console.error('Failed to get metadata from db:', err)
  }

  if (!destination) {
    const fallbackPlace = travelPlaces.find((p) => p.id === id)
    if (fallbackPlace) {
      return {
        title: `${fallbackPlace.name} (${fallbackPlace.city}, ${fallbackPlace.state}) — PathPeek`,
        description: fallbackPlace.description,
      }
    }
    return {
      title: 'Destination Not Found — PathPeek',
    }
  }

  return {
    title: `${destination.name} (${destination.city}, ${destination.state}) — PathPeek`,
    description: destination.description,
  }
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { id } = await params

  let destination: any = null
  try {
    destination = await db.destination.findUnique({
      where: { id },
      include: {
        hotels: {
          orderBy: { rating: 'desc' },
        },
        activities: {
          orderBy: { price: 'asc' },
        },
      },
    })
  } catch (err) {
    console.error('Failed to get destination from db:', err)
  }

  if (!destination) {
    const fallbackPlace = travelPlaces.find((p) => p.id === id)
    if (fallbackPlace) {
      destination = {
        ...fallbackPlace,
        recommendationScore: fallbackPlace.recommendationScore ?? 85,
        hotels: [],
        activities: [],
      }
    }
  }

  if (!destination) {
    notFound()
  }

  return (
    <DestinationDetailClient
      destination={destination}
      hotels={destination.hotels || []}
      activities={destination.activities || []}
    />
  )
}
