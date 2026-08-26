import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import { calculateNights, calculateTripPricing, validateBookingDates } from '@/lib/booking-utils'

const createBookingSchema = z.object({
  destinationId: z.string().min(1, 'Destination is required'),
  hotelId: z.string().nullable().optional(),
  activityIds: z.array(z.string()).optional().default([]),
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
  guests: z.number().int().min(1, 'At least 1 guest required').max(20, 'Maximum 20 guests allowed'),
})

export async function POST(request: Request) {
  try {
    // 1. Authentication check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to book a trip.' },
        { status: 401 }
      )
    }

    // 2. Request body validation
    const body = await request.json()
    const validation = createBookingSchema.safeParse(body)

    if (!validation.success) {
      const firstError = Object.values(validation.error.flatten().fieldErrors).flat()[0] || 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { destinationId, hotelId, activityIds, checkIn, checkOut, guests } = validation.data

    // 3. Date validation
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const dateValidation = validateBookingDates(checkInDate, checkOutDate)

    if (!dateValidation.isValid) {
      return NextResponse.json({ error: dateValidation.error }, { status: 400 })
    }

    const nights = calculateNights(checkInDate, checkOutDate)

    // 4. Verify Destination exists
    const destination = await db.destination.findUnique({
      where: { id: destinationId },
    })

    if (!destination) {
      return NextResponse.json({ error: 'Destination does not exist' }, { status: 404 })
    }

    // 5. Verify Hotel belongs to Destination (if selected)
    let hotel: { id: string; name: string; pricePerNight: number; destinationId: string } | null = null
    if (hotelId) {
      hotel = await db.hotel.findUnique({
        where: { id: hotelId },
        select: { id: true, name: true, pricePerNight: true, destinationId: true },
      })

      if (!hotel) {
        return NextResponse.json({ error: 'Selected hotel does not exist' }, { status: 404 })
      }

      if (hotel.destinationId !== destinationId) {
        return NextResponse.json(
          { error: 'Selected hotel does not belong to the chosen destination' },
          { status: 400 }
        )
      }
    }

    // 6. Verify Activities belong to Destination
    let activities: { id: string; price: number; name: string; destinationId: string }[] = []
    if (activityIds && activityIds.length > 0) {
      activities = await db.activity.findMany({
        where: {
          id: { in: activityIds },
        },
        select: { id: true, price: true, name: true, destinationId: true },
      })

      if (activities.length !== activityIds.length) {
        return NextResponse.json(
          { error: 'One or more selected activities could not be found' },
          { status: 404 }
        )
      }

      const invalidActivity = activities.find((a) => a.destinationId !== destinationId)
      if (invalidActivity) {
        return NextResponse.json(
          { error: `Activity "${invalidActivity.name}" does not belong to the chosen destination` },
          { status: 400 }
        )
      }
    }

    // 7. Calculate total price securely on the server
    const pricing = calculateTripPricing(hotel?.pricePerNight, nights, activities)

    // 8. Create booking in Prisma
    const newBooking = await db.booking.create({
      data: {
        userId: user.id,
        destinationId,
        hotelId: hotelId || null,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalPrice: pricing.totalPrice,
        status: 'confirmed',
        activities: {
          connect: activityIds.map((id) => ({ id })),
        },
      },
      include: {
        destination: {
          select: { id: true, name: true, city: true, state: true, image: true },
        },
        hotel: {
          select: { id: true, name: true, pricePerNight: true, rating: true, image: true },
        },
        activities: {
          select: { id: true, name: true, price: true, duration: true },
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Booking confirmed successfully',
        booking: newBooking,
        pricing,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create booking:', error)
    return NextResponse.json(
      { error: 'Internal server error while processing booking' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view bookings.' },
        { status: 401 }
      )
    }

    const bookings = await db.booking.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        destination: {
          select: { id: true, name: true, city: true, state: true, image: true, mood: true },
        },
        hotel: {
          select: { id: true, name: true, pricePerNight: true, rating: true, image: true },
        },
        activities: {
          select: { id: true, name: true, price: true, duration: true },
        },
      },
    })

    return NextResponse.json({
      count: bookings.length,
      bookings,
    })
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching bookings' },
      { status: 500 }
    )
  }
}
