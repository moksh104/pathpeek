import { db } from '@/lib/db'
import BookingsManager from './BookingsManager'

export default async function AdminBookingsPage() {
  const bookings = await db.booking.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      destination: {
        select: { id: true, name: true, city: true, state: true, image: true },
      },
      hotel: {
        select: { id: true, name: true, pricePerNight: true },
      },
      activities: {
        select: { id: true, name: true, price: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <BookingsManager initialBookings={bookings} />
}
