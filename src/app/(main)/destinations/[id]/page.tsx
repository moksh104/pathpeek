import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import DestinationDetailClient from './DestinationDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const destination = await db.destination.findUnique({
    where: { id },
    select: { name: true, city: true, state: true, description: true },
  })

  if (!destination) {
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

  const destination = await db.destination.findUnique({
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

  if (!destination) {
    notFound()
  }

  return (
    <DestinationDetailClient
      destination={destination}
      hotels={destination.hotels}
      activities={destination.activities}
    />
  )
}
