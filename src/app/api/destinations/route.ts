import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mood = searchParams.get('mood')
    const budget = searchParams.get('budget')
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const search = searchParams.get('search')

    const where: Prisma.DestinationWhereInput = {}

    if (mood && mood !== 'all') {
      where.mood = { equals: mood }
    }

    if (budget) {
      const budgetNum = parseInt(budget, 10)
      if (!isNaN(budgetNum) && budgetNum > 0) {
        // Flexible budget match (up to budget * 1.3 or less)
        where.budget = { lte: Math.round(budgetNum * 1.3) }
      }
    }

    if (city) {
      where.city = { contains: city }
    }

    if (state) {
      where.state = { contains: state }
    }

    if (search && search.trim()) {
      const searchTerm = search.trim()
      where.OR = [
        { name: { contains: searchTerm } },
        { city: { contains: searchTerm } },
        { state: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ]
    }

    const destinations = await db.destination.findMany({
      where,
      orderBy: [
        { recommendationScore: 'desc' },
        { rating: 'desc' },
      ],
    })

    return NextResponse.json({
      count: destinations.length,
      destinations,
    })
  } catch (error) {
    console.error('Failed to fetch destinations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch destinations' },
      { status: 500 }
    )
  }
}
