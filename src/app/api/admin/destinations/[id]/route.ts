import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

const updateDestinationSchema = z.object({
  name: z.string().trim().min(1).optional(),
  mood: z.string().trim().min(1).optional(),
  state: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  budget: z.number().int().positive().optional(),
  rating: z.number().min(0).max(5).optional(),
  description: z.string().trim().min(1).optional(),
  image: z.string().trim().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  recommendationScore: z.number().int().min(0).max(100).optional(),
})

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 })
    }

    const { id } = await props.params

    const existing = await db.destination.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateDestinationSchema.safeParse(body)

    if (!validation.success) {
      const firstError = Object.values(validation.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const updated = await db.destination.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json({
      message: 'Destination updated successfully',
      destination: updated,
    })
  } catch (error) {
    console.error('Admin PATCH destination error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 })
    }

    const { id } = await props.params

    const destination = await db.destination.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            hotels: true,
            activities: true,
            bookings: true,
          },
        },
      },
    })

    if (!destination) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
    }

    // Safety check: Prevent deletion if bookings or dependent records exist
    if (destination._count.bookings > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete destination "${destination.name}" because it has ${destination._count.bookings} existing customer booking(s).`,
        },
        { status: 409 }
      )
    }

    if (destination._count.hotels > 0 || destination._count.activities > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete destination "${destination.name}" because it has ${destination._count.hotels} hotel(s) and ${destination._count.activities} activity record(s) attached. Please delete or reassign them first.`,
        },
        { status: 409 }
      )
    }

    await db.destination.delete({
      where: { id },
    })

    return NextResponse.json({
      message: `Destination "${destination.name}" was deleted successfully.`,
    })
  } catch (error) {
    console.error('Admin DELETE destination error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
