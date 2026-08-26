import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await props.params

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        destination: {
          select: { id: true, name: true, city: true, state: true, image: true, mood: true, description: true },
        },
        hotel: {
          select: { id: true, name: true, pricePerNight: true, rating: true, image: true, amenities: true },
        },
        activities: {
          select: { id: true, name: true, price: true, duration: true, description: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Security check: Only booking owner or admin can view
    if (booking.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to view this booking.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Failed to fetch booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await props.params

    const booking = await db.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Security check: Only booking owner or admin can cancel
    if (booking.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to modify this booking.' },
        { status: 403 }
      )
    }

    // Check status transition rules
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This booking is already cancelled' },
        { status: 400 }
      )
    }

    if (booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Completed trips cannot be cancelled' },
        { status: 400 }
      )
    }

    const updatedBooking = await db.booking.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        destination: { select: { name: true, city: true } },
      },
    })

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    })
  } catch (error) {
    console.error('Failed to cancel booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
