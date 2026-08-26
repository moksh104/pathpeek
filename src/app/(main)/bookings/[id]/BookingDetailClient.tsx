'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Calendar,
  Users,
  MapPin,
  Building2,
  Ticket,
  Clock,
  ArrowRight,
  Printer,
  XCircle,
  Loader2,
  AlertCircle,
  Home,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  formatBookingReference,
  formatINR,
  formatTripDate,
  calculateNights,
} from '@/lib/booking-utils'

export interface BookingDetailProps {
  booking: {
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
      description: string
    }
    hotel: {
      id: string
      name: string
      pricePerNight: number
      rating: number
      image: string | null
      amenities: string
    } | null
    activities: {
      id: string
      name: string
      price: number
      duration: string
      description: string | null
    }[]
  }
  isOwner: boolean
}

export default function BookingDetailClient({ booking: initialBooking }: BookingDetailProps) {
  const router = useRouter()
  const [booking, setBooking] = useState(initialBooking)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const nights = calculateNights(booking.checkIn, booking.checkOut)
  const reference = formatBookingReference(booking.id)
  const isConfirmed = booking.status === 'confirmed'
  const isCancelled = booking.status === 'cancelled'

  const handleCancelBooking = async () => {
    setIsCancelling(true)
    setCancelError(null)

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
      })

      const data = await res.json()

      if (!res.ok) {
        setCancelError(data.error || 'Failed to cancel booking')
        setIsCancelling(false)
        return
      }

      setBooking((prev) => ({ ...prev, status: 'cancelled' }))
      setShowCancelConfirm(false)
      router.refresh()
    } catch {
      setCancelError('Network error while cancelling booking')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Top Status Header */}
      <div className="text-center mb-8 sm:mb-10 space-y-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg ${
            isConfirmed
              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10'
              : 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 ring-8 ring-red-500/10'
          }`}
        >
          {isConfirmed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
        </div>

        <Badge
          className={`text-xs px-3 py-1 font-semibold uppercase tracking-wider ${
            isConfirmed
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
          }`}
        >
          {isConfirmed ? 'Booking Confirmed (Mock)' : 'Booking Cancelled'}
        </Badge>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {isConfirmed ? 'Your Trip is All Set!' : 'Trip Has Been Cancelled'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Booking Reference:{' '}
          <span className="font-mono font-bold text-gray-900 dark:text-white">{reference}</span>
        </p>
      </div>

      {cancelError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{cancelError}</span>
        </div>
      )}

      {/* ── Main Receipt Card ─────────────────────────────── */}
      <Card className="rounded-3xl border-gray-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0f0f14]/95 backdrop-blur-xl shadow-xl overflow-hidden mb-8">
        {/* Destination Banner in Card */}
        <div className="relative h-48 sm:h-56 w-full bg-gray-900">
          <Image
            src={booking.destination.image}
            alt={booking.destination.name}
            fill
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <Badge className="bg-white/80 dark:bg-black/60 text-gray-900 dark:text-white text-[10px] mb-1.5 border-0">
                {booking.destination.mood}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {booking.destination.name}
              </h2>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                {booking.destination.city}, {booking.destination.state}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/60 font-medium">
                Total Paid (Mock)
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {formatINR(booking.totalPrice)}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Trip Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">Check-in</span>
              <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">
                {formatTripDate(booking.checkIn)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Check-out</span>
              <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">
                {formatTripDate(booking.checkOut)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Duration</span>
              <span className="font-bold text-violet-600 dark:text-violet-400 mt-0.5 block">
                {nights} Night{nights > 1 ? 's' : ''}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Travelers</span>
              <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">
                {booking.guests} Guest{booking.guests > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Hotel & Stay Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-violet-500" />
              Accommodations
            </h3>

            {booking.hotel ? (
              <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-gray-900 dark:text-white">
                    {booking.hotel.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatINR(booking.hotel.pricePerNight)} × {nights} nights • {booking.hotel.amenities}
                  </p>
                </div>
                <div className="text-right font-bold text-base text-gray-900 dark:text-white">
                  {formatINR(booking.hotel.pricePerNight * nights)}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.02] text-xs text-gray-500">
                Self-arranged accommodation (No hotel booked).
              </div>
            )}
          </div>

          {/* Activities Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-violet-500" />
              Experiences & Activities ({booking.activities.length})
            </h3>

            {booking.activities.length > 0 ? (
              <div className="space-y-2.5">
                {booking.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl border border-gray-100 dark:border-white/[0.04] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white block">
                        {act.name}
                      </span>
                      <span className="text-gray-400 text-[11px]">{act.duration}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {act.price > 0 ? formatINR(act.price) : 'Free'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.02] text-xs text-gray-500">
                No extra activities included in this booking.
              </div>
            )}
          </div>

          {/* Price Summary Breakdown */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06] space-y-2 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Hotel Stay Subtotal</span>
              <span>{formatINR((booking.hotel?.pricePerNight || 0) * nights)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Activities Subtotal</span>
              <span>
                {formatINR(booking.activities.reduce((sum, a) => sum + a.price, 0))}
              </span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>PathPeek Platform Fee</span>
              <span>₹0 (Hackathon Free Tier)</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-white/[0.04]">
              <span>Grand Total</span>
              <span className="text-violet-600 dark:text-violet-400">
                {formatINR(booking.totalPrice)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Action Buttons ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/my-trips" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium h-10 px-5">
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              View My Trips
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl text-xs h-10 px-4">
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Explore Home
            </Button>
          </Link>
        </div>

        {/* Cancel Button / Modal */}
        {isConfirmed && (
          <div>
            {!showCancelConfirm ? (
              <Button
                variant="ghost"
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                Cancel this booking
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 animate-fade-in">
                <span className="text-xs text-red-700 dark:text-red-300 font-medium">
                  Confirm cancellation?
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  className="text-xs h-8 px-3 rounded-lg"
                >
                  {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, Cancel'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCancelConfirm(false)}
                  className="text-xs h-8 px-2"
                >
                  Keep
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
