import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

const hotelSchema = z.object({
  name: z.string().trim().min(1, 'Hotel name is required'),
  pricePerNight: z.number().int().positive('Price per night must be greater than 0'),
  rating: z.number().min(0).max(5, 'Rating must be between 0 and 5'),
  amenities: z.string().trim().min(1, 'Amenities are required'),
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

    const hotels = await db.hotel.findMany({
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

    return NextResponse.json({ count: hotels.length, hotels })
  } catch (error) {
    console.error('Admin GET hotels error:', error)
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
    const validation = hotelSchema.safeParse(body)

    if (!validation.success) {
      const firstError = Object.values(validation.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    // Verify destination exists
    const dest = await db.destination.findUnique({
      where: { id: validation.data.destinationId },
    })

    if (!dest) {
      return NextResponse.json({ error: 'Selected destination does not exist' }, { status: 404 })
    }

    const newHotel = await db.hotel.create({
      data: validation.data,
      include: {
        destination: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
    })

    return NextResponse.json(
      { message: 'Hotel created successfully', hotel: newHotel },
      { status: 201 }
    )
  } catch (error) {
    console.error('Admin POST hotel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
