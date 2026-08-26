import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const destinationId = searchParams.get('destinationId')
    const search = searchParams.get('search')

    const where: Prisma.BookingWhereInput = {}

    if (status && status !== 'all') {
      where.status = { equals: status }
    }

    if (destinationId && destinationId !== 'all') {
      where.destinationId = { equals: destinationId }
    }

    if (search && search.trim()) {
      const term = search.trim()
      where.OR = [
        { id: { contains: term } },
        { user: { name: { contains: term } } },
        { user: { email: { contains: term } } },
        { destination: { name: { contains: term } } },
        { destination: { city: { contains: term } } },
      ]
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        destination: {
          select: { id: true, name: true, city: true, state: true, image: true },
        },
        hotel: {
          select: { id: true, name: true, pricePerNight: true },
        },
        activities: {
          select: { id: true, name: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ count: bookings.length, bookings })
  } catch (error) {
    console.error('Admin GET bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
