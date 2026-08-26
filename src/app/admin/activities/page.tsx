import { db } from '@/lib/db'
import ActivitiesManager from './ActivitiesManager'

export default async function AdminActivitiesPage() {
  const [activities, destinations] = await Promise.all([
    db.activity.findMany({
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

  return <ActivitiesManager initialActivities={activities} destinations={destinations} />
}
