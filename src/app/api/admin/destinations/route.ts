import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

const destinationSchema = z.object({
  name: z.string().trim().min(1, 'Destination name is required'),
  mood: z.string().trim().min(1, 'Mood is required'),
  state: z.string().trim().min(1, 'State is required'),
  city: z.string().trim().min(1, 'City is required'),
  budget: z.number().int().positive('Budget must be greater than 0'),
  rating: z.number().min(0, 'Rating cannot be negative').max(5, 'Rating maximum is 5'),
  description: z.string().trim().min(1, 'Description is required'),
  image: z.string().trim().min(1, 'Image path or URL is required'),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  recommendationScore: z.number().int().min(0).max(100).optional().default(80),
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

    const destinations = await db.destination.findMany({
      include: {
        _count: {
          select: {
            hotels: true,
            activities: true,
            bookings: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ count: destinations.length, destinations })
  } catch (error) {
    console.error('Admin GET destinations error:', error)
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
    const validation = destinationSchema.safeParse(body)

    if (!validation.success) {
      const firstError = Object.values(validation.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const newDestination = await db.destination.create({
      data: validation.data,
    })

    return NextResponse.json(
      { message: 'Destination created successfully', destination: newDestination },
      { status: 201 }
    )
  } catch (error) {
    console.error('Admin POST destination error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
