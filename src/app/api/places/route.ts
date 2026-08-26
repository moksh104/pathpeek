import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    if (!lat || !lon) {
        return NextResponse.json(
            { error: "Missing coordinates" },
            { status: 400 }
        )
    }

    const apiKey = process.env.GEOAPIFY_KEY

    const url = `https://api.geoapify.com/v2/places?categories=tourism.sights&filter=circle:${lon},${lat},10000&limit=10&apiKey=${apiKey}`

    try {
        const response = await fetch(url)
        const data = await response.json()
        return NextResponse.json(data)
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch places" },
            { status: 500 }
        )
    }
}
