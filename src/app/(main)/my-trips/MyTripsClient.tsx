'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Building2,
  Ticket,
  ArrowRight,
  Sparkles,
  Compass,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatBookingReference,
  formatINR,
  formatTripDate,
  calculateNights,
} from '@/lib/booking-utils'

export interface MyTripBooking {
  id: string
  userId: string
  destinationId: string
  hotelId: string | null
  checkIn: string | Date
  checkOut: string | Date
  guests: number
  totalPrice: number
  status: string
  createdAt: string | Date
  destination: {
    id: string
    name: string
    city: string
    state: string
    image: string
    mood: string
  }
  hotel: {
    id: string
    name: string
    pricePerNight: number
    rating: number
    image: string | null
  } | null
  activities: {
    id: string
    name: string
    price: number
    duration: string
  }[]
}

export default function MyTripsClient({ bookings }: { bookings: MyTripBooking[] }) {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all')

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true
    return b.status === filter
  })

  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10 pb-6 border-b border-gray-200/80 dark:border-white/[0.06]">
        <div>
          <Badge className="mb-2 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 text-xs px-3 py-1 font-medium">
            <Briefcase className="w-3.5 h-3.5 mr-1" />
            Travel Dashboard
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            My Trips & Bookings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your booked vacations, accommodations, and scheduled experiences.
          </p>
        </div>

        <Link href="/trip-planner">
          <Button className="rounded-xl text-xs h-10 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md shadow-violet-500/20">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Plan New Trip
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      {bookings.length > 0 && (
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                : 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'cancelled'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {filteredBookings.map((b) => {
            const nights = calculateNights(b.checkIn, b.checkOut)
            const ref = formatBookingReference(b.id)
            const isConfirmed = b.status === 'confirmed'

            return (
              <div
                key={b.id}
                className={`group rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-stretch ${
                  isConfirmed
                    ? 'border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-violet-300 dark:hover:border-white/[0.12] shadow-sm hover:shadow-lg'
                    : 'border-red-200/50 dark:border-red-900/30 bg-red-50/10 dark:bg-red-950/5 opacity-80'
                }`}
              >
                {/* Destination Thumbnail */}
                <div className="relative w-full md:w-64 h-48 md:h-auto bg-gray-900 flex-shrink-0">
                  <Image
                    src={b.destination.image}
                    alt={b.destination.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/60 backdrop-blur-md text-white text-[10px] border-0">
                      {b.destination.mood}
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">
                      {b.destination.name}
                    </h3>
                    <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-violet-400" />
                      {b.destination.city}, {b.destination.state}
                    </p>
                  </div>
                </div>

                {/* Booking Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400">
                          {ref}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-400">
                          Booked on {formatTripDate(b.createdAt)}
                        </span>
                      </div>

                      <Badge
                        className={`text-[10px] px-2.5 py-0.5 font-semibold uppercase tracking-wider ${
                          isConfirmed
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                        }`}
                      >
                        {isConfirmed ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Confirmed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Cancelled
                          </span>
                        )}
                      </Badge>
                    </div>

                    {/* Meta Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-violet-500" />
                        <span>
                          {formatTripDate(b.checkIn)} – {formatTripDate(b.checkOut)} ({nights}N)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Users className="w-3.5 h-3.5 text-violet-500" />
                        <span>{b.guests} Guests</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Building2 className="w-3.5 h-3.5 text-violet-500" />
                        <span className="truncate">
                          {b.hotel ? b.hotel.name : 'No hotel (self-stay)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Ticket className="w-3.5 h-3.5 text-violet-500" />
                        <span>{b.activities.length} Experiences</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/[0.04]">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                        Total Amount
                      </span>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatINR(b.totalPrice)}
                      </div>
                    </div>

                    <Link href={`/bookings/${b.id}`}>
                      <Button
                        variant="outline"
                        className="rounded-xl text-xs h-9 px-4 hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:text-violet-600 dark:hover:text-violet-400 border-gray-200 dark:border-white/[0.08]"
                      >
                        <span>View Trip Details</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.01]">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-500 flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {filter === 'all' ? 'No trips booked yet' : `No ${filter} trips`}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-6">
            Start exploring handpicked Indian destinations and build your customized vacation today.
          </p>
          <Link href="/destinations">
            <Button className="rounded-xl text-xs font-semibold h-10 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md shadow-violet-500/20">
              Explore Destinations
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
