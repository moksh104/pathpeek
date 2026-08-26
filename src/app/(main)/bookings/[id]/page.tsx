import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import BookingDetailClient from './BookingDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Booking Confirmation (${id.slice(-6).toUpperCase()}) — PathPeek`,
    description: 'View your PathPeek travel booking receipt and itinerary details.',
  }
}

export default async function BookingDetailPage({ params }: PageProps) {
  const user = await getCurrentUser()
  const { id } = await params

  if (!user) {
    redirect(`/auth/login?callbackUrl=/bookings/${id}`)
  }

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      destination: {
        select: { id: true, name: true, city: true, state: true, image: true, mood: true, description: true },
      },
      hotel: {
        select: { id: true, name: true, pricePerNight: true, rating: true, image: true, amenities: true },
      },
      activities: {
        select: { id: true, name: true, price: true, duration: true, description: true },
      },
    },
  })

  if (!booking) {
    notFound()
  }

  // Security: Only owner or admin can view booking
  if (booking.userId !== user.id && user.role !== 'admin') {
    notFound()
  }

  return (
    <BookingDetailClient
      booking={booking}
      isOwner={booking.userId === user.id}
    />
  )
}
