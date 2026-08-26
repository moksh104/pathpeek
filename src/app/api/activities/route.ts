import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const destinationId = searchParams.get('destinationId')

    if (!destinationId) {
      return NextResponse.json(
        { error: 'destinationId query parameter is required' },
        { status: 400 }
      )
    }

    const activities = await db.activity.findMany({
      where: {
        destinationId,
      },
      orderBy: { price: 'asc' },
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
      count: activities.length,
      activities,
    })
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
