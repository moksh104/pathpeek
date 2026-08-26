import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed']),
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

    const existing = await db.booking.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateBookingStatusSchema.safeParse(body)

    if (!validation.success) {
      const firstError = Object.values(validation.error.flatten().fieldErrors).flat()[0] || 'Invalid status'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const updatedBooking = await db.booking.update({
      where: { id },
      data: { status: validation.data.status },
      include: {
        user: { select: { name: true, email: true } },
        destination: { select: { name: true } },
      },
    })

    return NextResponse.json({
      message: `Booking status updated to ${validation.data.status}`,
      booking: updatedBooking,
    })
  } catch (error) {
    console.error('Admin PATCH booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
