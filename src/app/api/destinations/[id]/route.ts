import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Destination ID is required' },
        { status: 400 }
      )
    }

    const destination = await db.destination.findUnique({
      where: { id },
      include: {
        hotels: {
          orderBy: { rating: 'desc' },
        },
        activities: {
          orderBy: { price: 'asc' },
        },
      },
    })

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      destination: {
        id: destination.id,
        name: destination.name,
        mood: destination.mood,
        state: destination.state,
        city: destination.city,
        budget: destination.budget,
        rating: destination.rating,
        description: destination.description,
        image: destination.image,
        latitude: destination.latitude,
        longitude: destination.longitude,
        recommendationScore: destination.recommendationScore,
        createdAt: destination.createdAt,
        updatedAt: destination.updatedAt,
      },
      hotels: destination.hotels,
      activities: destination.activities,
    })
  } catch (error) {
    console.error('Failed to fetch destination details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch destination details' },
      { status: 500 }
    )
  }
}
