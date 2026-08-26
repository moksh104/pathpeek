'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  MapPin,
  Calendar,
  Sparkles,
  Compass,
  Building2,
  Ticket,
  Check,
  Plus,
  Loader2,
  AlertCircle,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatINR } from '@/components/DestinationCard'

// Dynamically import LeafletMap with SSR disabled (Leaflet depends on window)
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[400px] w-full rounded-2xl bg-gray-100 dark:bg-white/[0.03] animate-pulse flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
    </div>
  ),
})

export interface HotelData {
  id: string
  name: string
  pricePerNight: number
  rating: number
  amenities: string
  image: string | null
}

export interface ActivityData {
  id: string
  name: string
  price: number
  duration: string
  description: string | null
  image: string | null
}

export interface DestinationDetailProps {
  destination: {
    id: string
    name: string
    mood: string
    state: string
    city: string
    budget: number
    rating: number
    description: string
    image: string
    latitude: number
    longitude: number
    recommendationScore: number
  }
  hotels: HotelData[]
  activities: ActivityData[]
}

const moodEmojis: Record<string, string> = {
  Peaceful: '🧘',
  Adventure: '🏔️',
  Romantic: '💕',
  'Scenic Nature': '🌿',
  Party: '🎉',
}

export default function DestinationDetailClient({
  destination,
  hotels,
  activities,
}: DestinationDetailProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set())
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)

    // Fetch nearby places from Geoapify API route safely
    const fetchNearby = async () => {
      try {
        setLoadingNearby(true)
        const res = await fetch(
          `/api/places?lat=${destination.latitude}&lon=${destination.longitude}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data.features && Array.isArray(data.features)) {
            setNearbyPlaces(data.features.slice(0, 4))
          }
        }
      } catch {
        // Gracefully ignore if Geoapify is unconfigured
      } finally {
        setLoadingNearby(false)
      }
    }

    fetchNearby()
  }, [destination.latitude, destination.longitude])

  const toggleActivity = (id: string) => {
    setSelectedActivityIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const emoji = moodEmojis[destination.mood] || '✨'

  return (
    <div className="min-h-screen pb-20">
      {/* ── 1. Hero Section ──────────────────────────────── */}
      <div className="relative h-[380px] sm:h-[460px] lg:h-[520px] w-full overflow-hidden">
        <Image
          src={destination.image}
          alt={destination.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-6 sm:py-10">
          {/* Top navigation link */}
          <div>
            <Link
              href="/destinations"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 text-xs font-medium border border-white/10 transition-colors"
            >
              ← Back to Destinations
            </Link>
          </div>

          {/* Bottom Hero Info */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/90 dark:bg-black/70 text-gray-900 dark:text-white border-0 backdrop-blur-md text-xs px-3 py-1 font-semibold shadow-sm">
                <span>{emoji}</span>
                <span className="ml-1.5">{destination.mood}</span>
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md text-xs px-3 py-1">
                Score: {destination.recommendationScore}/100
              </Badge>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                {destination.name}
              </h1>
              <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base mt-2">
                <MapPin className="w-4 h-4 text-violet-400" />
                <span>
                  {destination.city}, {destination.state}
                </span>
                <span className="text-white/40">•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-white">
                    {destination.rating.toFixed(1)} / 5.0
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/60 font-medium">
                  Estimated Starting Budget
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {formatINR(destination.budget)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/trip-planner?destinationId=${destination.id}`}>
                  <Button className="h-11 px-6 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/30">
                    <Calendar className="w-4 h-4 mr-2" />
                    Plan My Trip
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Grid ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-12">
            {/* ── 2. About Section ────────────────────────────── */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-violet-500" />
                About this Destination
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-white/[0.02] p-6 rounded-2xl border border-gray-200/80 dark:border-white/[0.06] shadow-sm">
                {destination.description}
              </p>
            </section>

            {/* ── 3. Interactive Leaflet Map ─────────────────── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-violet-500" />
                  Location & Map
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {destination.latitude.toFixed(4)}° N, {destination.longitude.toFixed(4)}° E
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden shadow-sm">
                <LeafletMap
                  destLat={destination.latitude}
                  destLng={destination.longitude}
                  destName={destination.name}
                  isDarkMode={isDarkMode}
                />
              </div>
            </section>

            {/* ── 4. Recommended Hotels ──────────────────────── */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-violet-500" />
                    Recommended Stays
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Handpicked resorts, havelis, and boutique hotels near {destination.city}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {hotels.length} Stays
                </Badge>
              </div>

              {hotels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {hotels.map((hotel) => {
                    const isSelected = selectedHotelId === hotel.id
                    const amenitiesList = hotel.amenities.split(',').map((a) => a.trim())

                    return (
                      <Card
                        key={hotel.id}
                        className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                          isSelected
                            ? 'border-violet-500 shadow-md ring-2 ring-violet-500/20 dark:ring-violet-500/40 bg-violet-50/20 dark:bg-violet-950/10'
                            : 'border-gray-200/80 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] bg-white dark:bg-white/[0.02]'
                        }`}
                      >
                        <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-800">
                          <Image
                            src={hotel.image || destination.image}
                            alt={hotel.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-black/60 text-white backdrop-blur-md text-xs font-semibold px-2 py-0.5 border-0 flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              {hotel.rating.toFixed(1)}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                              {hotel.name}
                            </h3>
                            <div className="text-sm font-extrabold text-violet-600 dark:text-violet-400 mt-1">
                              {formatINR(hotel.pricePerNight)}{' '}
                              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                / night
                              </span>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="flex flex-wrap gap-1">
                            {amenitiesList.slice(0, 3).map((amenity) => (
                              <span
                                key={amenity}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-300"
                              >
                                {amenity}
                              </span>
                            ))}
                            {amenitiesList.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 text-gray-400">
                                +{amenitiesList.length - 3} more
                              </span>
                            )}
                          </div>

                          <Button
                            onClick={() => setSelectedHotelId(isSelected ? null : hotel.id)}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`w-full h-9 rounded-xl text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                : 'border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1.5" />
                                Selected
                              </>
                            ) : (
                              'Select Hotel'
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/[0.06] text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hotels for this location are currently being verified.
                  </p>
                </div>
              )}
            </section>

            {/* ── 5. Experiences & Activities ────────────────── */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-violet-500" />
                    Top Activities & Things to Do
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Guided safaris, cultural workshops, and outdoor adventures
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activities.length} Activities
                </Badge>
              </div>

              {activities.length > 0 ? (
                <div className="space-y-3.5">
                  {activities.map((act) => {
                    const isSelected = selectedActivityIds.has(act.id)
                    return (
                      <div
                        key={act.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50/25 dark:bg-violet-950/15 shadow-sm'
                            : 'border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.1]'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white">
                              {act.name}
                            </h3>
                            <Badge className="bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 border-0 text-[10px] px-2 py-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-violet-500" />
                              {act.duration}
                            </Badge>
                          </div>
                          {act.description && (
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                              {act.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/[0.04]">
                          <div className="text-left sm:text-right">
                            <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                              Price
                            </div>
                            <div className="text-base font-bold text-gray-900 dark:text-white">
                              {formatINR(act.price)}
                            </div>
                          </div>

                          <Button
                            onClick={() => toggleActivity(act.id)}
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                            className={`rounded-xl text-xs h-9 px-3.5 transition-all ${
                              isSelected
                                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                : 'border-gray-200 dark:border-white/[0.08]'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add to Trip
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/[0.06] text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Activities for this destination are currently being curated.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* ── Sidebar Column (4 cols) ─────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Trip Plan Summary Widget */}
            <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0f0f14]/95 backdrop-blur-xl shadow-lg sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Trip Planner Preview
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                  Customize travel dates, verified stay, and experiences
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-sm">
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] space-y-2 border border-gray-100 dark:border-white/[0.04]">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Destination</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[160px]">
                      {destination.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Selected Hotel</span>
                    <span className="font-semibold text-violet-600 dark:text-violet-400 truncate max-w-[160px]">
                      {selectedHotelId
                        ? hotels.find((h) => h.id === selectedHotelId)?.name || '1 selected'
                        : 'None yet'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Activities</span>
                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                      {selectedActivityIds.size} selected
                    </span>
                  </div>
                </div>

                <Link href={`/trip-planner?destinationId=${destination.id}`} className="block w-full">
                  <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium shadow-md shadow-violet-500/20">
                    <span>Continue to Trip Planner</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

                <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
                  Instant calculation and mock confirmation in Trip Planner.
                </p>
              </CardContent>
            </Card>

            {/* Nearby Attractions (Geoapify) */}
            {nearbyPlaces.length > 0 && (
              <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-violet-500" />
                    Nearby Attractions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {nearbyPlaces.map((place: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] text-xs space-y-0.5"
                    >
                      <p className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                        {place.properties?.name || 'Local Landmark'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                        {place.properties?.address_line2 || place.properties?.city || 'Nearby Sight'}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
