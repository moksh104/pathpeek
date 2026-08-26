import { db } from '@/lib/db'
import HotelsManager from './HotelsManager'

export default async function AdminHotelsPage() {
  const [hotels, destinations] = await Promise.all([
    db.hotel.findMany({
      include: {
        destination: {
          select: { id: true, name: true, city: true, state: true },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    db.destination.findMany({
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return <HotelsManager initialHotels={hotels} destinations={destinations} />
}
