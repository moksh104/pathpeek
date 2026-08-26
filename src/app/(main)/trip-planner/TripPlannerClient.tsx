'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Building2,
  Ticket,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Star,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Check,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  calculateNights,
  calculateTripPricing,
  validateBookingDates,
  formatINR,
} from '@/lib/booking-utils'

export interface DestinationOption {
  id: string
  name: string
  city: string
  state: string
  image: string
  mood: string
  budget: number
  rating: number
}

export interface HotelOption {
  id: string
  name: string
  pricePerNight: number
  rating: number
  amenities: string
  image: string | null
  destinationId: string
}

export interface ActivityOption {
  id: string
  name: string
  price: number
  duration: string
  description: string | null
  image: string | null
  destinationId: string
}

interface TripPlannerProps {
  destinations: DestinationOption[]
  initialDestinationId?: string
}

const steps = [
  { id: 1, name: 'Destination', icon: MapPin },
  { id: 2, name: 'Dates & Guests', icon: CalendarIcon },
  { id: 3, name: 'Stay', icon: Building2 },
  { id: 4, name: 'Activities', icon: Ticket },
  { id: 5, name: 'Review', icon: CheckCircle2 },
]

export default function TripPlannerClient({
  destinations,
  initialDestinationId,
}: TripPlannerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status: authStatus } = useSession()

  // Pre-fill tomorrow and 3 days from now for convenience
  const defaultDates = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const checkOut = new Date()
    checkOut.setDate(checkOut.getDate() + 4)

    return {
      checkIn: tomorrow.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
    }
  }, [])

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(initialDestinationId ? 2 : 1)
  const [selectedDestId, setSelectedDestId] = useState<string>(initialDestinationId || '')
  const [checkIn, setCheckIn] = useState<string>(defaultDates.checkIn)
  const [checkOut, setCheckOut] = useState<string>(defaultDates.checkOut)
  const [guests, setGuests] = useState<number>(2)

  // Hotels & Activities loaded for the chosen destination
  const [hotels, setHotels] = useState<HotelOption[]>([])
  const [activities, setActivities] = useState<ActivityOption[]>([])
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false)

  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set())

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sync selected destination from URL params if changes
  useEffect(() => {
    const paramId = searchParams.get('destinationId')
    if (paramId && paramId !== selectedDestId) {
      setSelectedDestId(paramId)
      setCurrentStep(2)
    }
  }, [searchParams])

  // Fetch hotels & activities whenever destination changes
  useEffect(() => {
    if (!selectedDestId) {
      setHotels([])
      setActivities([])
      return
    }

    const loadDestinationAssets = async () => {
      setLoadingDetails(true)
      try {
        const [hotelsRes, actsRes] = await Promise.all([
          fetch(`/api/hotels?destinationId=${selectedDestId}`),
          fetch(`/api/activities?destinationId=${selectedDestId}`),
        ])

        if (hotelsRes.ok) {
          const hData = await hotelsRes.json()
          setHotels(hData.hotels || [])
        }
        if (actsRes.ok) {
          const aData = await actsRes.json()
          setActivities(aData.activities || [])
        }
      } catch (err) {
        console.error('Failed to load destination assets:', err)
      } finally {
        setLoadingDetails(false)
      }
    }

    loadDestinationAssets()
    // Reset selections on destination change
    setSelectedHotelId(null)
    setSelectedActivityIds(new Set())
  }, [selectedDestId])

  const selectedDestination = useMemo(() => {
    return destinations.find((d) => d.id === selectedDestId) || null
  }, [destinations, selectedDestId])

  const selectedHotel = useMemo(() => {
    return hotels.find((h) => h.id === selectedHotelId) || null
  }, [hotels, selectedHotelId])

  const selectedActivitiesList = useMemo(() => {
    return activities.filter((a) => selectedActivityIds.has(a.id))
  }, [activities, selectedActivityIds])

  const nights = useMemo(() => {
    return calculateNights(checkIn, checkOut)
  }, [checkIn, checkOut])

  const pricing = useMemo(() => {
    return calculateTripPricing(selectedHotel?.pricePerNight, nights, selectedActivitiesList)
  }, [selectedHotel, nights, selectedActivitiesList])

  // Activity toggle
  const toggleActivity = (id: string) => {
    setSelectedActivityIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Validation before advancing steps
  const handleNextStep = () => {
    setErrorMessage(null)

    if (currentStep === 1) {
      if (!selectedDestId) {
        setErrorMessage('Please select a destination to continue.')
        return
      }
    }

    if (currentStep === 2) {
      const dateVal = validateBookingDates(checkIn, checkOut)
      if (!dateVal.isValid) {
        setErrorMessage(dateVal.error || 'Please choose valid travel dates.')
        return
      }
      if (guests < 1 || guests > 20) {
        setErrorMessage('Number of guests must be between 1 and 20.')
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 5))
  }

  const handlePrevStep = () => {
    setErrorMessage(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Confirm and Submit Booking
  const handleConfirmBooking = async () => {
    setErrorMessage(null)

    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=/trip-planner?destinationId=${selectedDestId}`)
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        destinationId: selectedDestId,
        hotelId: selectedHotelId,
        activityIds: Array.from(selectedActivityIds),
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        guests,
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to complete booking. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Redirect to booking receipt
      router.push(`/bookings/${data.booking.id}`)
      router.refresh()
    } catch {
      setErrorMessage('An unexpected network error occurred.')
      setIsSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* ── Progress Stepper Header ───────────────────────── */}
      <div className="mb-10 sm:mb-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <Badge className="mb-2 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 text-xs px-3 py-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Smart Itinerary Builder
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Plan Your Getaway
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize your dates, stay, and activities in 5 simple steps.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-white/[0.08] -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-violet-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    // Allow navigating back or to previous valid steps
                    if (step.id < currentStep || (step.id === 2 && selectedDestId)) {
                      setCurrentStep(step.id)
                    }
                  }}
                  className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-xs sm:text-sm ${
                      isCompleted
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                        : isCurrent
                        ? 'bg-white dark:bg-gray-900 border-2 border-violet-600 text-violet-600 dark:text-violet-400 shadow-md ring-4 ring-violet-500/15'
                        : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/[0.1] text-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`mt-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors hidden sm:block ${
                      isCurrent
                        ? 'text-violet-600 dark:text-violet-400'
                        : isCompleted
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Main Planner Layout (Content + Live Summary) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
        {/* Left Column (8 cols): Active Step UI */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] shadow-sm">
            {/* ── STEP 1: DESTINATION SELECTION ─────────────── */}
            {currentStep === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-violet-500" />
                    Choose Your Destination
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                    Select where you would like to travel from our curated destinations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                    {destinations.map((d) => {
                      const isSelected = selectedDestId === d.id
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDestId(d.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'border-violet-500 bg-violet-50/40 dark:bg-violet-950/20 ring-2 ring-violet-500/20'
                              : 'border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] bg-white dark:bg-white/[0.02]'
                          }`}
                        >
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            <Image src={d.image} alt={d.name} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                              {d.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {d.city}, {d.state}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                                {formatINR(d.budget)}
                              </span>
                              <Badge className="text-[9px] px-1.5 py-0 bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border-0">
                                {d.mood}
                              </Badge>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </>
            )}

            {/* ── STEP 2: DATES & GUESTS ─────────────────────── */}
            {currentStep === 2 && (
              <>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-violet-500" />
                    Travel Dates & Guests
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                    Specify your check-in, check-out, and party size
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedDestination && (
                    <div className="p-3.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={selectedDestination.image}
                            alt={selectedDestination.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Selected Destination</p>
                          <p className="font-bold text-sm text-gray-900 dark:text-white">
                            {selectedDestination.name} ({selectedDestination.city})
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-100/50"
                      >
                        Change
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkIn" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Check-in Date
                      </Label>
                      <Input
                        id="checkIn"
                        type="date"
                        min={todayStr}
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="h-11 rounded-xl bg-gray-50/60 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="checkOut" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Check-out Date
                      </Label>
                      <Input
                        id="checkOut"
                        type="date"
                        min={checkIn || todayStr}
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="h-11 rounded-xl bg-gray-50/60 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08]"
                      />
                    </div>
                  </div>

                  {/* Calculated nights notice */}
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Calculated Trip Duration:</span>
                    <span className="font-bold text-violet-600 dark:text-violet-400">
                      {nights > 0 ? `${nights} Night${nights > 1 ? 's' : ''}` : 'Please choose valid dates'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guests" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Number of Guests
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="guests"
                          type="number"
                          min={1}
                          max={20}
                          value={guests}
                          onChange={(e) => setGuests(parseInt(e.target.value, 10) || 1)}
                          className="pl-10 h-11 rounded-xl bg-gray-50/60 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08]"
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (1 – 20 Travelers)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {/* ── STEP 3: HOTEL SELECTION ─────────────────────── */}
            {currentStep === 3 && (
              <>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-violet-500" />
                    Select Accommodations
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                    Choose an optional stay or skip to continue without a hotel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingDetails ? (
                    <div className="py-12 flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                      Loading verified hotels...
                    </div>
                  ) : hotels.length > 0 ? (
                    <div className="space-y-3">
                      {/* Option: No Hotel (Budget Friendly) */}
                      <div
                        onClick={() => setSelectedHotelId(null)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedHotelId === null
                            ? 'border-violet-500 bg-violet-50/40 dark:bg-violet-950/20 ring-2 ring-violet-500/20'
                            : 'border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            I will arrange my own stay / No hotel needed
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Skip hotel booking and only book curated activities
                          </p>
                        </div>
                        {selectedHotelId === null && (
                          <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Hotel Cards */}
                      {hotels.map((h) => {
                        const isSelected = selectedHotelId === h.id
                        const totalForHotel = h.pricePerNight * nights

                        return (
                          <div
                            key={h.id}
                            onClick={() => setSelectedHotelId(h.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row gap-4 ${
                              isSelected
                                ? 'border-violet-500 bg-violet-50/40 dark:bg-violet-950/20 ring-2 ring-violet-500/20'
                                : 'border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] bg-white dark:bg-white/[0.02]'
                            }`}
                          >
                            <div className="relative w-full sm:w-32 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                              <Image
                                src={h.image || selectedDestination?.image || '/logo.png'}
                                alt={h.name}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-black/60 text-white text-[10px] px-1.5 py-0 border-0 flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  {h.rating.toFixed(1)}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-base text-gray-900 dark:text-white truncate">
                                    {h.name}
                                  </h4>
                                  {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                                      <Check className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                  {h.amenities}
                                </div>
                              </div>

                              <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-gray-100 dark:border-white/[0.04]">
                                <div>
                                  <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                                    {formatINR(h.pricePerNight)}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                    / night
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {formatINR(totalForHotel)} total ({nights} nights)
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No hotels listed for this destination yet. You may proceed without a hotel.
                    </div>
                  )}
                </CardContent>
              </>
            )}

            {/* ── STEP 4: ACTIVITY SELECTION ──────────────────── */}
            {currentStep === 4 && (
              <>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-violet-500" />
                    Curate Your Experiences
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                    Add guided safaris, outdoor activities, or temple walks to your trip
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingDetails ? (
                    <div className="py-12 flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                      Loading activities...
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="space-y-3">
                      {activities.map((act) => {
                        const isSelected = selectedActivityIds.has(act.id)
                        return (
                          <div
                            key={act.id}
                            onClick={() => toggleActivity(act.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-violet-500 bg-violet-50/40 dark:bg-violet-950/20 ring-2 ring-violet-500/20'
                                : 'border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] bg-white dark:bg-white/[0.02]'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                                  {act.name}
                                </h4>
                                <Badge className="text-[10px] px-2 py-0 bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 border-0 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-violet-500" />
                                  {act.duration}
                                </Badge>
                              </div>
                              {act.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                  {act.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/[0.04]">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {act.price > 0 ? formatINR(act.price) : 'Free'}
                              </div>
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-violet-600 text-white'
                                    : 'border border-gray-300 dark:border-white/[0.1] text-gray-400'
                                }`}
                              >
                                {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No activities available for this destination yet.
                    </div>
                  )}
                </CardContent>
              </>
            )}

            {/* ── STEP 5: REVIEW & CONFIRM ───────────────────── */}
            {currentStep === 5 && (
              <>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Review Your Itinerary
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                    Verify all trip details before confirming your mock booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Destination Info */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06]">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedDestination?.image || '/logo.png'}
                        alt={selectedDestination?.name || 'Trip'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <Badge className="text-[10px] px-2 py-0 bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-0">
                        {selectedDestination?.mood} Escape
                      </Badge>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {selectedDestination?.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-violet-500" />
                        {selectedDestination?.city}, {selectedDestination?.state}
                      </p>
                    </div>
                  </div>

                  {/* Travel Parameters */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] text-center text-xs">
                    <div>
                      <span className="text-gray-400 block">Check-in</span>
                      <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">
                        {checkIn}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Check-out</span>
                      <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">
                        {checkOut}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Party</span>
                      <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">
                        {guests} Guest{guests > 1 ? 's' : ''} ({nights}N)
                      </span>
                    </div>
                  </div>

                  {/* Chosen Stay */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Accommodation
                    </h4>
                    <div className="p-3.5 rounded-xl border border-gray-200 dark:border-white/[0.06] flex items-center justify-between text-sm">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {selectedHotel ? selectedHotel.name : 'No hotel selected (Self-arranged)'}
                        </p>
                        {selectedHotel && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatINR(selectedHotel.pricePerNight)} × {nights} nights
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatINR(pricing.hotelCost)}
                      </span>
                    </div>
                  </div>

                  {/* Chosen Activities */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Activities ({selectedActivitiesList.length})
                    </h4>
                    {selectedActivitiesList.length > 0 ? (
                      <div className="space-y-2">
                        {selectedActivitiesList.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 rounded-xl border border-gray-100 dark:border-white/[0.04] flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-gray-200">{act.name}</p>
                              <p className="text-gray-400 text-[11px]">{act.duration}</p>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {formatINR(act.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No extra activities added.</p>
                    )}
                  </div>

                  {/* Auth / Demo notification */}
                  {!session?.user && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                      <span>
                        You are currently browsing as a guest. Clicking Confirm Booking will take you to sign in.
                      </span>
                    </div>
                  )}
                </CardContent>
              </>
            )}

            {/* Stepper Navigation Actions */}
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/[0.04] flex items-center justify-between">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <Button
                  onClick={handleNextStep}
                  className="rounded-xl text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmBooking}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 px-6 h-10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Confirming Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Booking (Mock)
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (4 cols): Sticky Live Cost Summary */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0f0f14]/95 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-white/[0.06]">
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span>Trip Cost Summary</span>
                <Badge variant="outline" className="text-xs font-semibold">
                  Live Estimate
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-sm">
              {/* Destination Tag */}
              {selectedDestination ? (
                <div className="pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <span className="text-gray-500 dark:text-gray-400 block text-xs font-medium">Destination</span>
                  <span className="font-extrabold text-base text-gray-900 dark:text-white">
                    {selectedDestination.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 text-xs block mt-0.5 font-medium">
                    {checkIn} → {checkOut} ({nights}N, {guests} guests)
                  </span>
                </div>
              ) : (
                <div className="text-gray-400 text-sm italic">No destination selected yet.</div>
              )}

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 text-sm">
                  <span>Hotel Stay ({nights} nights)</span>
                  <span className="font-bold text-gray-900 dark:text-white text-base">
                    {formatINR(pricing.hotelCost)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 text-sm">
                  <span>Activities ({selectedActivitiesList.length})</span>
                  <span className="font-bold text-gray-900 dark:text-white text-base">
                    {formatINR(pricing.activityCost)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-500 text-xs">
                  <span>PathPeek Service Fee</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹0 (Free Demo)</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-gray-200/80 dark:border-white/[0.08] flex items-baseline justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                    Total Estimated Cost
                  </div>
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-1">
                    {formatINR(pricing.totalPrice)}
                  </div>
                </div>
              </div>

              {currentStep < 5 && (
                <Button
                  onClick={handleNextStep}
                  className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-md shadow-violet-500/20"
                >
                  Continue to Next Step
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium">
            🔒 Mock Booking Portal for DEVSTORM-2026. No payment required.
          </p>
        </div>
      </div>
    </div>
  )
}
