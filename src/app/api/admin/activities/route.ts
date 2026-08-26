import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

const activitySchema = z.object({
  name: z.string().trim().min(1, 'Activity name is required'),
  price: z.number().int().min(0, 'Price must be 0 or positive'),
  duration: z.string().trim().min(1, 'Duration is required'),
  description: z.string().trim().nullable().optional(),
  image: z.string().trim().nullable().optional(),
  destinationId: z.string().min(1, 'Destination is required'),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 })
    }

    const activities = await db.activity.findMany({
      include: {
        destination: {
          select: { id: true, name: true, city: true, state: true },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ count: activities.length, activities })
  } catch (error) {
    console.error('Admin GET activities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 })
    }

    const body = await request.json()
    const validation = activitySchema.safeParse(body)

    if (!validation.success) {
      const firstError = Object.values(validation.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const dest = await db.destination.findUnique({
      where: { id: validation.data.destinationId },
    })

    if (!dest) {
      return NextResponse.json({ error: 'Selected destination does not exist' }, { status: 404 })
    }

    const newActivity = await db.activity.create({
      data: validation.data,
      include: {
        destination: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
    })

    return NextResponse.json(
      { message: 'Activity created successfully', activity: newActivity },
      { status: 201 }
    )
  } catch (error) {
    console.error('Admin POST activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
