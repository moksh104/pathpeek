'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Star,
  MapPin,
  Search,
  Sun,
  Moon,
  Compass,
  ArrowRight,
  X,
  Navigation,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiPlaces, setApiPlaces] = useState<any[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    const savedMode = localStorage.getItem('pathpeek-dark-mode')
    if (savedMode !== null) {
      setIsDarkMode(savedMode === 'true')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('pathpeek-dark-mode', String(isDarkMode))
  }, [isDarkMode])

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
    <div className={`min-h-screen transition-all duration-700 ${isDarkMode ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isDarkMode ? (
          <>
            <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[200px] bg-gradient-to-bl from-violet-900/10 via-purple-900/5 to-transparent" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[180px] bg-gradient-to-tr from-indigo-900/8 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute -top-64 -right-64 w-[800px] h-[800px] rounded-full blur-[200px] bg-gradient-to-bl from-violet-200/20 via-purple-100/10 to-transparent" />
            <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full blur-[180px] bg-gradient-to-tr from-blue-100/15 to-transparent" />
          </>
        )}
      </div>

      <div className="relative z-10">
        <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-500 ${isDarkMode ? 'bg-[#09090b]/90 border-white/[0.03]' : 'bg-white/80 border-gray-100'}`}>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-white/[0.05]' : 'bg-gray-50'} border ${isDarkMode ? 'border-white/[0.08]' : 'border-gray-200'} shadow-sm`}>
                  <Image
                    src="/logo.png"
                    alt="PathPeek Logo"
                    width={28}
                    height={28}
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <h1 className={`text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${isDarkMode ? 'from-white to-gray-400' : 'from-gray-900 to-gray-600'}`}>
                  PathPeek
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <div className={`hidden sm:flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {displayPlaces.length}
                  </span>
                  <span>destinations</span>
                </div>

                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-white/[0.03] hover:bg-white/[0.06] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Discover your next
              <span className="block mt-1 bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                adventure
              </span>
            </h2>
            <p className={`text-lg max-w-md mx-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Curated destinations matching your mood and budget
            </p>
          </div>

          <div className="mb-16 sm:mb-20">
            <div className="mb-10">
              <label className={`block text-sm font-medium mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Select mood
              </label>
              <div className="flex flex-wrap gap-3">
                {moodOptions.map((mood) => {
                  const isSelected = selectedMood === mood.name
                  return (
                    <button
                      key={mood.name}
                      onClick={() => setSelectedMood(isSelected ? null : mood.name)}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-full font-medium transition-all duration-300 ${isSelected
                        ? `bg-gradient-to-r ${mood.color} text-white shadow-lg shadow-violet-500/20`
                        : isDarkMode
                          ? 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200 border border-white/[0.04]'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
                        }`}
                    >
                      <span className="text-lg">{mood.emoji}</span>
                      <span className="text-sm">{mood.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className={`block text-sm font-medium mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Maximum budget
                </label>
                <div className={`rounded-2xl p-6 backdrop-blur-sm ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.04]' : 'bg-white border border-gray-100 shadow-sm'}`}>
                  <div className="flex items-baseline justify-between mb-6">
                    <span className={`text-3xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ₹{budget.toLocaleString('en-IN')}
                    </span>
                    <Badge className={`${isDarkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} border-0 px-3 py-1 text-xs font-medium`}>
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
                  <div className={`flex justify-between text-xs mt-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    <span>₹1,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Search by city or state
                </label>
                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <Input
                    type="text"
                    placeholder="Try 'Gujarat', 'Ahmedabad', 'Goa'..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className={`pl-11 pr-10 h-12 rounded-xl text-sm ${isDarkMode
                      ? 'bg-white/[0.02] border-white/[0.04] text-white placeholder:text-gray-600 focus:border-white/[0.1] focus:ring-0'
                      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:ring-0 shadow-sm'
                      }`}
                  />
                  {citySearch && (
                    <button
                      onClick={() => setCitySearch('')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md ${isDarkMode ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleLocationDetection}
                  disabled={isLocating}
                  className={`w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${isLocating ? 'cursor-not-allowed opacity-60' : ''} ${isDarkMode ? 'bg-violet-500/10 hover:bg-violet-500/15 text-violet-400 border border-violet-500/20' : 'bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-200'}`}
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Detecting location...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Use My Current Location
                    </>
                  )}
                </button>

                {locationSuccess && (
                  <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{locationSuccess}</span>
                  </div>
                )}

                {locationError && (
                  <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{locationError}</span>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {['Gujarat', 'Goa', 'Rishikesh', 'Leh', 'Kerala'].map((city) => (
                    <button
                      key={city}
                      onClick={() => setCitySearch(citySearch === city ? '' : city)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-all ${citySearch.toLowerCase() === city.toLowerCase()
                        ? isDarkMode
                          ? 'bg-violet-500/15 text-violet-400'
                          : 'bg-gray-900 text-white'
                        : isDarkMode
                          ? 'bg-white/[0.02] text-gray-500 hover:bg-white/[0.05]'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
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
            <div className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {isFallback
                  ? 'No exact matches found. Showing nearby or popular destinations.'
                  : 'Showing trending destinations for you.'}
              </span>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {showTrendingFallback
                  ? 'Trending destinations'
                  : selectedMood
                    ? `${selectedMood} escapes`
                    : 'All destinations'}
              </h3>
              {(selectedMood || citySearch) && (
                <button
                  onClick={() => {
                    setSelectedMood(null)
                    setCitySearch('')
                  }}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-500 hover:text-white hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  <X className="w-3.5 h-3.5" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {isInitialLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.04]' : 'bg-white border border-gray-100 shadow-sm'}`}
                >
                  <div className={`h-56 animate-pulse ${isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-100'}`} />
                  <div className="p-5">
                    <div className={`h-4 rounded animate-pulse mb-3 ${isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-100'}`} />
                    <div className={`h-3 rounded animate-pulse w-2/3 ${isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-100'}`} />
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
                    className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]' : 'bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200'}`}
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
                        <Badge className={`backdrop-blur-sm px-3 py-1 text-xs font-medium border-0 ${isDarkMode ? 'bg-white/10 text-white/90' : 'bg-white/90 text-gray-700'}`}>
                          {moodOptions.find(m => m.name === place.mood)?.emoji} {place.mood}
                        </Badge>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h4 className="text-white text-lg font-semibold mb-1">{place.name}</h4>
                        <div className="flex items-center gap-1 text-white/70 text-sm">
                          <MapPin className="w-3.5 h-3.5" />
                          {place.city}, {place.state}
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className={`text-sm mb-4 line-clamp-2 leading-relaxed ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {place.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {place.rating}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className={`text-[10px] uppercase tracking-wider font-medium mb-0.5 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            From
                          </div>
                          <div className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatIndianRupee(place.budget)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewDetails(place)}
                        className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${isDarkMode ? 'bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.06]' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                      >
                        View details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && !showAll && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => setShowAll(true)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/20' : 'bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-200'}`}
                  >
                    Show more destinations ({allDisplayPlaces.length - MAX_INITIAL_DISPLAY} more)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-20 rounded-2xl border ${isDarkMode ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-white border-gray-100'}`}>
              <div className={`w-16 h-16 mx-auto mb-5 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <Search className={`w-6 h-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              </div>
              <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No destinations found
              </h4>
              <p className={`text-sm mb-6 max-w-xs mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Try adjusting your filters to discover more places
              </p>
              <button
                onClick={() => {
                  setSelectedMood(null)
                  setBudget(100000)
                  setCitySearch('')
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.06]' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
              >
                <X className="w-3.5 h-3.5" />
                Reset filters
              </button>
            </div>
          )}

          {/* Nearby Attractions from Geoapify API */}
          {(apiLoading || apiError || apiPlaces.length > 0) && (
            <div className="mt-16">
              <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Nearby Attractions
              </h2>

              {apiLoading && (
                <div className={`flex items-center gap-3 px-5 py-4 rounded-xl ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.04]' : 'bg-white border border-gray-100 shadow-sm'}`}>
                  <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fetching nearby places...</span>
                </div>
              )}

              {apiError && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{apiError}</span>
                </div>
              )}

              {!apiLoading && !apiError && apiPlaces.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apiPlaces.map((place: { properties?: { name?: string; address_line2?: string } }, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]' : 'bg-white border border-gray-100 shadow-sm hover:shadow-lg'}`}
                    >
                      <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {place.properties?.name || 'Unnamed Place'}
                      </h3>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        {place.properties?.address_line2 || 'No address available'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <footer className={`mt-20 border-t ${isDarkMode ? 'border-white/[0.03]' : 'border-gray-100'}`}>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="PathPeek"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                />
                <span className={`text-sm font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  PathPeek
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                © 2024
              </p>
            </div>
          </div>
        </footer>
      </div>

      {selectedPlace && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl ${isDarkMode ? 'bg-[#0f0f12] border border-white/[0.06]' : 'bg-white shadow-2xl'}`}
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
                <Badge className={`mb-2 backdrop-blur-sm px-3 py-1 text-xs font-medium border-0 ${isDarkMode ? 'bg-white/10 text-white/90' : 'bg-white/90 text-gray-700'}`}>
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
              <p className={`text-sm leading-relaxed mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedPlace.description}
              </p>

              <LeafletMap
                destLat={selectedPlace.latitude}
                destLng={selectedPlace.longitude}
                destName={selectedPlace.name}
                isDarkMode={isDarkMode}
              />

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                  <div className={`text-xs uppercase tracking-wider font-medium mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Price
                  </div>
                  <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatIndianRupee(selectedPlace.budget)}
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                  <div className={`text-xs uppercase tracking-wider font-medium mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Rating
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedPlace.rating}
                    </span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                  <div className={`text-xs uppercase tracking-wider font-medium mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Distance
                  </div>
                  <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedPlace.distance} km
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                  <div className={`text-xs uppercase tracking-wider font-medium mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Mood
                  </div>
                  <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedPlace.mood}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.06]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Close
                </button>
                <button
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
