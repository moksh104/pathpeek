import { db } from '@/lib/db'
import UsersManager from './UsersManager'

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <UsersManager initialUsers={users} />
}
