'use client'

import { useState, useMemo } from 'react'
import { Search, X, Sparkles, Filter, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import DestinationCard, { formatINR } from '@/components/DestinationCard'

export interface DestinationItem {
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

const moodList = [
  { name: 'All', emoji: '✨' },
  { name: 'Peaceful', emoji: '🧘' },
  { name: 'Adventure', emoji: '🏔️' },
  { name: 'Romantic', emoji: '💕' },
  { name: 'Scenic Nature', emoji: '🌿' },
  { name: 'Party', emoji: '🎉' },
]

export default function DestinationsClient({
  initialDestinations,
}: {
  initialDestinations: DestinationItem[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMood, setSelectedMood] = useState('All')
  const [maxBudget, setMaxBudget] = useState(60000)

  const quickCities = ['Gujarat', 'Goa', 'Rishikesh', 'Kerala', 'Leh', 'Rajasthan']

  const filteredDestinations = useMemo(() => {
    return initialDestinations.filter((dest) => {
      // Mood filter
      if (selectedMood !== 'All' && dest.mood !== selectedMood) {
        return false
      }

      // Budget filter (allows up to +20% flex)
      if (dest.budget > maxBudget * 1.2) {
        return false
      }

      // Search filter (name, city, state, description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesName = dest.name.toLowerCase().includes(query)
        const matchesCity = dest.city.toLowerCase().includes(query)
        const matchesState = dest.state.toLowerCase().includes(query)
        const matchesDesc = dest.description.toLowerCase().includes(query)
        if (!matchesName && !matchesCity && !matchesState && !matchesDesc) {
          return false
        }
      }

      return true
    })
  }, [initialDestinations, selectedMood, maxBudget, searchQuery])

  const handleReset = () => {
    setSearchQuery('')
    setSelectedMood('All')
    setMaxBudget(100000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <Badge className="mb-3 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 text-xs px-3 py-1 font-semibold">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Database-Backed Travel Portal
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.15]">
          Explore All Destinations
        </h1>
        <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
          Browse our curated catalog of {initialDestinations.length} handpicked travel escapes across India.
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06] p-5 sm:p-6 shadow-sm mb-10 space-y-6">
        {/* Search Bar + Quick Chips */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search by destination name, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-11 rounded-xl text-sm bg-gray-50/70 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="lg:col-span-6 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Quick:
            </span>
            {quickCities.map((city) => (
              <button
                key={city}
                onClick={() => setSearchQuery(searchQuery === city ? '' : city)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                  searchQuery.toLowerCase() === city.toLowerCase()
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-gray-700 dark:text-gray-300'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Chips */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
            Travel Mood
          </label>
          <div className="flex flex-wrap gap-2">
            {moodList.map((m) => {
              const isSelected = selectedMood === m.name
              return (
                <button
                  key={m.name}
                  onClick={() => setSelectedMood(m.name)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20'
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/[0.06]'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Budget Slider */}
        <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Max Budget per Person
              </span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
              Up to {formatINR(maxBudget)}
            </div>
          </div>
          <Slider
            value={[maxBudget]}
            onValueChange={(val) => setMaxBudget(val[0])}
            min={2000}
            max={60000}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium mt-2">
            <span>₹2,000</span>
            <span>₹30,000</span>
            <span>₹60,000+</span>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {selectedMood === 'All' ? 'All Destinations' : `${selectedMood} Escapes`}
          </h2>
          <Badge variant="outline" className="text-xs border-gray-300 dark:border-white/[0.1]">
            {filteredDestinations.length} available
          </Badge>
        </div>

        {(selectedMood !== 'All' || searchQuery || maxBudget < 60000) && (
          <button
            onClick={handleReset}
            className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Reset Filters
          </button>
        )}
      </div>

      {/* Destination Grid */}
      {filteredDestinations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredDestinations.map((dest, index) => (
            <DestinationCard
              key={dest.id}
              id={dest.id}
              name={dest.name}
              city={dest.city}
              state={dest.state}
              mood={dest.mood}
              budget={dest.budget}
              rating={dest.rating}
              description={dest.description}
              image={dest.image}
              recommendationScore={dest.recommendationScore}
              priority={index < 3}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.01]">
          <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-500 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            No matching destinations found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, increasing your budget, or clearing your mood filter.
          </p>
          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 transition-colors"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  )
}
