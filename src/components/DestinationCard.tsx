'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface DestinationCardProps {
  id: string
  name: string
  city: string
  state: string
  mood: string
  budget: number
  rating: number
  description: string
  image: string
  recommendationScore?: number
  priority?: boolean
}

const moodEmojis: Record<string, string> = {
  Peaceful: '🧘',
  Adventure: '🏔️',
  Romantic: '💕',
  'Scenic Nature': '🌿',
  Party: '🎉',
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function DestinationCard({
  id,
  name,
  city,
  state,
  mood,
  budget,
  rating,
  description,
  image,
  priority = false,
}: DestinationCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const emoji = moodEmojis[mood] || '✨'

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.05] hover:border-violet-300 dark:hover:border-white/[0.12] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <div className="relative h-56 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900" />
        )}

        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-purple-500/10">
            <Image
              src="/logo.png"
              alt="PathPeek"
              width={48}
              height={48}
              className="w-12 h-12 object-contain opacity-40 mix-blend-luminosity"
            />
          </div>
        ) : (
          <Image
            src={image}
            alt={name}
            fill
            priority={priority}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true)
              setImageLoaded(true)
            }}
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Mood Badge */}
        <div className="absolute top-3.5 left-3.5">
          <Badge className="backdrop-blur-md bg-white/80 dark:bg-black/60 text-gray-800 dark:text-white border-0 text-xs px-2.5 py-1 font-medium shadow-sm">
            <span>{emoji}</span>
            <span className="ml-1">{mood}</span>
          </Badge>
        </div>

        {/* Title & Location in Image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white text-lg font-bold line-clamp-1 group-hover:text-violet-200 transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="truncate">
              {city}, {state}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
          {description}
        </p>

        <div className="space-y-4">
          {/* Price & Rating */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {rating.toFixed(1)}
              </span>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                Starting from
              </div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {formatINR(budget)}
              </div>
            </div>
          </div>

          {/* Primary CTA button linking directly to detail page */}
          <Link href={`/destinations/${id}`} className="block w-full">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all bg-gray-900 hover:bg-gray-800 text-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:text-white border border-transparent dark:border-white/[0.08] group-hover:bg-violet-600 dark:group-hover:bg-violet-600 dark:group-hover:border-violet-500">
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
