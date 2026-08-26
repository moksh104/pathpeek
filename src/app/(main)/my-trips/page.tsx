import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import MyTripsClient from './MyTripsClient'

export const metadata = {
  title: 'My Trips & Bookings — PathPeek',
  description: 'View your booked Indian travel destinations, hotel stays, and activity tickets.',
}

export default async function MyTripsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login?callbackUrl=/my-trips')
  }

  const bookings = await db.booking.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      destination: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          image: true,
          mood: true,
        },
      },
      hotel: {
        select: {
          id: true,
          name: true,
          pricePerNight: true,
          rating: true,
          image: true,
        },
      },
      activities: {
        select: {
          id: true,
          name: true,
          price: true,
          duration: true,
        },
      },
    },
  })

  return <MyTripsClient bookings={bookings} />
}
