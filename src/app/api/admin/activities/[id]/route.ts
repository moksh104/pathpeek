import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

const updateActivitySchema = z.object({
  name: z.string().trim().min(1).optional(),
  price: z.number().int().min(0).optional(),
  duration: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  image: z.string().trim().nullable().optional(),
  destinationId: z.string().min(1).optional(),
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

    const existing = await db.activity.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateActivitySchema.safeParse(body)

    if (!validation.success) {
      const firstError = Object.values(validation.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    if (validation.data.destinationId) {
      const dest = await db.destination.findUnique({
        where: { id: validation.data.destinationId },
      })
      if (!dest) {
        return NextResponse.json({ error: 'Selected destination does not exist' }, { status: 404 })
      }
    }

    const updated = await db.activity.update({
      where: { id },
      data: validation.data,
      include: {
        destination: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
    })

    return NextResponse.json({
      message: 'Activity updated successfully',
      activity: updated,
    })
  } catch (error) {
    console.error('Admin PATCH activity error:', error)
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

    const activity = await db.activity.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Safety check: Prevent deletion if bookings reference this activity
    if (activity._count.bookings > 0) {
      return NextResponse.json(
        {
          error: `This activity cannot be deleted because it is booked in ${activity._count.bookings} existing customer itinerary/itineraries.`,
        },
        { status: 409 }
      )
    }

    await db.activity.delete({
      where: { id },
    })

    return NextResponse.json({
      message: `Activity "${activity.name}" was deleted successfully.`,
    })
  } catch (error) {
    console.error('Admin DELETE activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
