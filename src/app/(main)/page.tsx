'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Star,
  MapPin,
  Search,
  ArrowRight,
  X,
  Navigation,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ExternalLink,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { travelPlaces, moodOptions, type Mood, type TravelPlace } from '@/data/places'
import Image from 'next/image'

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[400px] w-full rounded-xl bg-gray-100 dark:bg-white/[0.03] animate-pulse flex items-center justify-center mb-6">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
})

const MAX_RESULTS_PER_STATE = 8
const MAX_INITIAL_DISPLAY = 6

function matchesPartial(text: string, search: string): boolean {
  const normalizedText = text.toLowerCase().trim()
  const normalizedSearch = search.toLowerCase().trim()
  return normalizedText.includes(normalizedSearch) || normalizedSearch.includes(normalizedText)
}

function matchesBudgetFlexible(placeBudget: number, selectedBudget: number): boolean {
  const minBudget = selectedBudget * 0.7
  const maxBudget = selectedBudget * 1.3
  return placeBudget >= minBudget && placeBudget <= maxBudget
}

function isAffordable(placeBudget: number, selectedBudget: number): boolean {
  return placeBudget <= selectedBudget
}

export default function Home() {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [budget, setBudget] = useState(50000)
  const [citySearch, setCitySearch] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<TravelPlace | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [apiPlaces, setApiPlaces] = useState<any[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (locationSuccess || locationError) {
      const timer = setTimeout(() => {
        setLocationSuccess(null)
        setLocationError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [locationSuccess, locationError])

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set(prev).add(id))
  }, [])

  const handleImageError = useCallback((id: string) => {
    setFailedImages(prev => new Set(prev).add(id))
    setLoadedImages(prev => new Set(prev).add(id))
  }, [])

  const trendingDestinations = useMemo(() => {
    return [...travelPlaces]
      .sort((a, b) => (b.recommendationScore || b.rating * 20) - (a.recommendationScore || a.rating * 20))
      .slice(0, 6)
  }, [])

  const filteredPlaces = useMemo(() => {
    let results: TravelPlace[] = []
    const hasLocationSearch = citySearch.trim().length > 0

    const moodFiltered = selectedMood
      ? travelPlaces.filter(place => place.mood === selectedMood)
      : travelPlaces

    const budgetFiltered = moodFiltered.filter(place =>
      isAffordable(place.budget, budget) || matchesBudgetFlexible(place.budget, budget)
    )

    if (hasLocationSearch) {
      const locationFiltered = budgetFiltered.filter(place => {
        const cityMatch = matchesPartial(place.city, citySearch)
        const stateMatch = matchesPartial(place.state, citySearch)
        return cityMatch || stateMatch
      })
      results = locationFiltered
    } else {
      results = budgetFiltered
    }

    const stateGroups: { [key: string]: TravelPlace[] } = {}
    results.forEach(place => {
      if (!stateGroups[place.state]) {
        stateGroups[place.state] = []
      }
      stateGroups[place.state].push(place)
    })

    const limitedResults: TravelPlace[] = []
    Object.keys(stateGroups).forEach(state => {
      const statePlaces = stateGroups[state]
        .sort((a, b) => (b.recommendationScore || b.rating * 20) - (a.recommendationScore || a.rating * 20))
        .slice(0, MAX_RESULTS_PER_STATE)
      limitedResults.push(...statePlaces)
    })

    limitedResults.sort((a, b) => (b.recommendationScore || b.rating * 20) - (a.recommendationScore || a.rating * 20))

    if (limitedResults.length === 0 && hasLocationSearch) {
      return budgetFiltered
        .sort((a, b) => (b.recommendationScore || b.rating * 20) - (a.recommendationScore || a.rating * 20))
        .slice(0, MAX_RESULTS_PER_STATE)
    }

    return limitedResults
  }, [selectedMood, budget, citySearch])

  const isFallback = filteredPlaces.length === 0 && citySearch.trim().length > 0
  const allDisplayPlaces = filteredPlaces.length > 0 ? filteredPlaces : trendingDestinations
  const showTrendingFallback = filteredPlaces.length === 0
  const displayPlaces = showAll ? allDisplayPlaces : allDisplayPlaces.slice(0, MAX_INITIAL_DISPLAY)
  const hasMore = allDisplayPlaces.length > MAX_INITIAL_DISPLAY

  const formatIndianRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }

  const fetchPlaces = async (lat: number, lon: number) => {
    try {
      setApiLoading(true)
      setApiError(null)
      const res = await fetch(`/api/places?lat=${lat}&lon=${lon}`)
      const data = await res.json()
      setApiPlaces(data.features || [])
    } catch {
      setApiError('Failed to load nearby attractions')
    } finally {
      setApiLoading(false)
    }
  }

  const handleLocationDetection = async () => {
    setIsLocating(true)
    setLocationError(null)
    setLocationSuccess(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { headers: { 'Accept-Language': 'en' } }
          )

          if (!response.ok) {
            throw new Error('Failed to fetch location details')
          }

          const data = await response.json()
          const address = data.address || {}
          const city = address.city || address.town || address.village || address.county || ''
          const state = address.state || ''

          if (city) {
            setCitySearch(city)
            setLocationSuccess(`Location detected: ${city}${state ? `, ${state}` : ''}`)
          } else if (state) {
            setCitySearch(state)
            setLocationSuccess(`Location detected: ${state}`)
          } else {
            setLocationError('Could not determine your city from location')
          }

          fetchPlaces(latitude, longitude)
        } catch {
          setLocationError('Failed to get location details. Please try again.')
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable. Please try again.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.')
            break
          default:
            setLocationError('An unknown error occurred while detecting location.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleViewDetails = (place: TravelPlace) => {
    setSelectedPlace(place)
  }

  const closeModal = () => {
    setSelectedPlace(null)
  }

  return (
    <div className="relative">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[200px] bg-gradient-to-bl from-violet-900/10 via-purple-900/5 to-transparent dark:block hidden" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[180px] bg-gradient-to-tr from-indigo-900/8 to-transparent dark:block hidden" />
      </div>

      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          {/* Hero Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 tracking-tight text-gray-900 dark:text-white leading-[1.1]">
              Discover your next
              <span className="block mt-1 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                adventure
              </span>
            </h1>
            <p className="text-base sm:text-lg max-w-lg mx-auto text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
              Curated travel escapes matching your mood, vibe, and budget across India
            </p>
          </div>

          {/* Controls: Mood + Budget + Location */}
          <div className="mb-14 sm:mb-16">
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-gray-500 dark:text-gray-400">
                Select mood
              </label>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {moodOptions.map((mood) => {
                  const isSelected = selectedMood === mood.name
                  return (
                    <button
                      key={mood.name}
                      onClick={() => setSelectedMood(isSelected ? null : mood.name)}
                      className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-300 ${
                        isSelected
                          ? `bg-gradient-to-r ${mood.color} text-white shadow-lg shadow-violet-500/20`
                          : 'bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-white/[0.06] shadow-sm'
                      }`}
                    >
                      <span className="text-lg">{mood.emoji}</span>
                      <span className="text-xs sm:text-sm">{mood.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Budget Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-gray-500 dark:text-gray-400">
                  Maximum budget
                </label>
                <div className="rounded-2xl p-6 bg-white dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06] shadow-sm">
                  <div className="flex items-baseline justify-between mb-6">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                      ₹{budget.toLocaleString('en-IN')}
                    </span>
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 px-3 py-1 text-xs font-semibold">
                      {filteredPlaces.length} places
                    </Badge>
                  </div>
                  <Slider
                    value={[budget]}
                    onValueChange={(value) => setBudget(value[0])}
                    min={1000}
                    max={100000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs mt-4 text-gray-500 dark:text-gray-400 font-medium">
                    <span>₹1,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>
              </div>

              {/* City / Location Search */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-gray-500 dark:text-gray-400">
                  Search by city or state
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Try 'Gujarat', 'Ahmedabad', 'Goa'..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="pl-11 pr-10 h-12 rounded-xl text-sm bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] shadow-sm"
                  />
                  {citySearch && (
                    <button
                      onClick={() => setCitySearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleLocationDetection}
                  disabled={isLocating}
                  className={`w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isLocating ? 'cursor-not-allowed opacity-60' : ''
                  } bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:hover:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20`}
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Detecting location...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      <span>Use My Current Location</span>
                    </>
                  )}
                </button>

                {locationSuccess && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{locationSuccess}</span>
                  </div>
                )}

                {locationError && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{locationError}</span>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {['Gujarat', 'Goa', 'Rishikesh', 'Leh', 'Kerala'].map((city) => (
                    <button
                      key={city}
                      onClick={() => setCitySearch(citySearch === city ? '' : city)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                        citySearch.toLowerCase() === city.toLowerCase()
                          ? 'bg-gray-900 dark:bg-violet-500/20 text-white dark:text-violet-300'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {(isFallback || showTrendingFallback) && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">
                {isFallback
                  ? 'No exact matches found. Showing nearby or popular destinations.'
                  : 'Showing trending destinations for you.'}
              </span>
            </div>
          )}

          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {showTrendingFallback
                  ? 'Trending Destinations'
                  : selectedMood
                  ? `${selectedMood} Escapes`
                  : 'Curated Destinations'}
              </h2>
              <div className="flex items-center gap-3">
                <Link
                  href="/destinations"
                  className="text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                >
                  Explore All ({travelPlaces.length}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {(selectedMood || citySearch) && (
                  <button
                    onClick={() => {
                      setSelectedMood(null)
                      setCitySearch('')
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* Destination Cards */}
          {isInitialLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] shadow-sm"
                >
                  <div className="h-56 animate-pulse bg-gray-100 dark:bg-white/[0.03]" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 rounded animate-pulse bg-gray-100 dark:bg-white/[0.03]" />
                    <div className="h-3 rounded animate-pulse w-2/3 bg-gray-100 dark:bg-white/[0.03]" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayPlaces.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayPlaces.map((place, index) => (
                  <div
                    key={place.id}
                    className="group relative rounded-2xl overflow-hidden transition-all duration-300 bg-white dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.04] hover:border-violet-300 dark:hover:border-white/[0.08] shadow-sm hover:shadow-xl flex flex-col justify-between"
                  >
                    <div className="relative h-56 overflow-hidden bg-gray-200 dark:bg-gray-800">
                      {!loadedImages.has(place.id) && (
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800" />
                      )}
                      {failedImages.has(place.id) ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                          <Image src="/logo.png" alt="PathPeek Logo" width={48} height={48} className="w-12 h-12 object-contain opacity-50 mix-blend-luminosity" />
                        </div>
                      ) : (
                        <Image
                          src={place.image}
                          alt={place.name}
                          fill
                          loading={index < 6 ? 'eager' : 'lazy'}
                          priority={index < 3}
                          onLoad={() => handleImageLoad(place.id)}
                          onError={() => handleImageError(place.id)}
                          className={`object-cover transition-all duration-500 group-hover:scale-105 ${loadedImages.has(place.id) ? 'opacity-100' : 'opacity-0'}`}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      <div className="absolute top-4 left-4">
                        <Badge className="backdrop-blur-sm px-3 py-1 text-xs font-medium border-0 bg-white/90 dark:bg-black/60 text-gray-800 dark:text-white">
                          {moodOptions.find(m => m.name === place.mood)?.emoji} {place.mood}
                        </Badge>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="text-white text-lg font-semibold mb-1">{place.name}</h3>
                        <div className="flex items-center gap-1 text-white/70 text-sm">
                          <MapPin className="w-3.5 h-3.5" />
                          {place.city}, {place.state}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <p className="text-sm mb-4 line-clamp-2 leading-relaxed text-gray-600 dark:text-gray-400">
                        {place.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {place.rating}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider font-medium mb-0.5 text-gray-400 dark:text-gray-500">
                            From
                          </div>
                          <div className="text-base font-semibold text-gray-900 dark:text-white">
                            {formatIndianRupee(place.budget)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                          onClick={() => handleViewDetails(place)}
                          className="py-2.5 px-3 rounded-xl text-xs font-medium transition-all bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white"
                        >
                          Quick View
                        </button>
                        <Link href={`/destinations/${place.id}`}>
                          <button className="w-full flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all bg-gray-900 hover:bg-gray-800 text-white dark:bg-violet-600 dark:hover:bg-violet-500">
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && !showAll && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => setShowAll(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/15 dark:hover:bg-violet-500/25 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20"
                  >
                    Show more destinations ({allDisplayPlaces.length - MAX_INITIAL_DISPLAY} more)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 rounded-2xl border bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.04]">
              <div className="w-16 h-16 mx-auto mb-5 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/[0.03]">
                <Search className="w-6 h-6 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                No destinations found
              </h3>
              <p className="text-sm mb-6 max-w-xs mx-auto text-gray-500 dark:text-gray-400">
                Try adjusting your filters to discover more places
              </p>
              <button
                onClick={() => {
                  setSelectedMood(null)
                  setBudget(100000)
                  setCitySearch('')
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors bg-gray-900 hover:bg-gray-800 text-white dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
              >
                <X className="w-3.5 h-3.5" />
                Reset filters
              </button>
            </div>
          )}

          {/* Nearby Attractions from Geoapify API */}
          {(apiLoading || apiError || apiPlaces.length > 0) && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Nearby Attractions
              </h2>

              {apiLoading && (
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.04] shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Fetching nearby places...</span>
                </div>
              )}

              {apiError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{apiError}</span>
                </div>
              )}

              {!apiLoading && !apiError && apiPlaces.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apiPlaces.map((place: { properties?: { name?: string; address_line2?: string } }, index: number) => (
                    <div
                      key={index}
                      className="p-4 rounded-2xl transition-all duration-300 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.04] shadow-sm"
                    >
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {place.properties?.name || 'Unnamed Place'}
                      </h3>
                      <p className="text-sm mt-1 text-gray-600 dark:text-gray-500">
                        {place.properties?.address_line2 || 'No address available'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Quick View Modal */}
      {selectedPlace && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0f0f12] border border-gray-200 dark:border-white/[0.06] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64">
              {failedImages.has(selectedPlace.id) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                  <Image src="/logo.png" alt="PathPeek Logo" width={64} height={64} className="w-16 h-16 object-contain opacity-50 mix-blend-luminosity" />
                </div>
              ) : (
                <Image
                  src={selectedPlace.image}
                  alt={selectedPlace.name}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(selectedPlace.id)}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <Badge className="mb-2 backdrop-blur-sm px-3 py-1 text-xs font-medium border-0 bg-white/90 dark:bg-black/60 text-gray-800 dark:text-white">
                  {moodOptions.find(m => m.name === selectedPlace.mood)?.emoji} {selectedPlace.mood}
                </Badge>
                <h3 className="text-white text-2xl font-bold">{selectedPlace.name}</h3>
                <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  {selectedPlace.city}, {selectedPlace.state}
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm leading-relaxed mb-6 text-gray-600 dark:text-gray-400">
                {selectedPlace.description}
              </p>

              <LeafletMap
                destLat={selectedPlace.latitude}
                destLng={selectedPlace.longitude}
                destName={selectedPlace.name}
                isDarkMode={isDarkMode}
              />

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                  <div className="text-xs uppercase tracking-wider font-medium mb-1 text-gray-500">
                    Price
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatIndianRupee(selectedPlace.budget)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                  <div className="text-xs uppercase tracking-wider font-medium mb-1 text-gray-500">
                    Rating
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedPlace.rating}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                  <div className="text-xs uppercase tracking-wider font-medium mb-1 text-gray-500">
                    Distance
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedPlace.distance} km
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                  <div className="text-xs uppercase tracking-wider font-medium mb-1 text-gray-500">
                    Mood
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedPlace.mood}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] text-gray-700 dark:text-white"
                >
                  Close
                </button>
                <Link href={`/destinations/${selectedPlace.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md">
                    <span>Full Details & Hotels</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
