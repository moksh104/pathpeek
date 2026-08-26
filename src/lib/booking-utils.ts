/**
 * PathPeek — Booking Utilities & Price Calculations
 */

export interface PriceBreakdown {
  nights: number
  hotelCost: number
  activityCost: number
  totalPrice: number
}

/**
 * Calculates the number of nights between two dates.
 * Returns 0 if invalid or same day.
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = new Date(checkIn)
  const end = new Date(checkOut)

  // Clear time components for accurate day diff
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays > 0 ? diffDays : 0
}

/**
 * Validates travel dates for booking.
 * checkIn must not be in the past (before today 00:00).
 * checkOut must be after checkIn.
 */
export function validateBookingDates(
  checkIn: Date | string,
  checkOut: Date | string
): { isValid: boolean; error?: string } {
  const start = new Date(checkIn)
  const end = new Date(checkOut)

  if (isNaN(start.getTime())) {
    return { isValid: false, error: 'Invalid check-in date' }
  }

  if (isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid check-out date' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDay = new Date(start)
  startDay.setHours(0, 0, 0, 0)

  if (startDay < today) {
    return { isValid: false, error: 'Check-in date cannot be in the past' }
  }

  const nights = calculateNights(start, end)
  if (nights < 1) {
    return { isValid: false, error: 'Check-out date must be at least 1 night after check-in' }
  }

  return { isValid: true }
}

/**
 * Calculates the exact pricing for a trip.
 */
export function calculateTripPricing(
  pricePerNight: number | null | undefined,
  nights: number,
  activities: { price: number }[]
): PriceBreakdown {
  const hotelCost = (pricePerNight || 0) * nights
  const activityCost = activities.reduce((sum, act) => sum + (act.price || 0), 0)
  const totalPrice = hotelCost + activityCost

  return {
    nights,
    hotelCost,
    activityCost,
    totalPrice,
  }
}

/**
 * Generates a human-friendly booking display reference (e.g. PP-7A2F9B).
 */
export function formatBookingReference(bookingId: string): string {
  if (!bookingId) return 'PP-000000'
  const clean = bookingId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const suffix = clean.slice(-6)
  return `PP-${suffix.padStart(6, 'X')}`
}

/**
 * Format Indian currency string.
 */
export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format date for friendly display (e.g. "15 Oct 2026").
 */
export function formatTripDate(date: Date | string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
