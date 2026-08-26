import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const destinationId = searchParams.get('destinationId')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    if (!destinationId) {
      return NextResponse.json(
        { error: 'destinationId query parameter is required' },
        { status: 400 }
      )
    }

    const where: Prisma.HotelWhereInput = {
      destinationId,
    }

    if (minPrice || maxPrice) {
      where.pricePerNight = {}
      if (minPrice) {
        const min = parseInt(minPrice, 10)
        if (!isNaN(min)) where.pricePerNight.gte = min
      }
      if (maxPrice) {
        const max = parseInt(maxPrice, 10)
        if (!isNaN(max)) where.pricePerNight.lte = max
      }
    }

    const hotels = await db.hotel.findMany({
      where,
      orderBy: { rating: 'desc' },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    })

    return NextResponse.json({
      count: hotels.length,
      hotels,
    })
  } catch (error) {
    console.error('Failed to fetch hotels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hotels' },
      { status: 500 }
    )
  }
}
