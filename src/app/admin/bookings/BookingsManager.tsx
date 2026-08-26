'use client'

import { useState } from 'react'
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Building2,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  formatBookingReference,
  formatINR,
  formatTripDate,
  calculateNights,
} from '@/lib/booking-utils'

export interface BookingAdminItem {
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
  user: {
    id: string
    name: string | null
    email: string
  }
  destination: {
    id: string
    name: string
    city: string
    state: string
    image: string
  }
  hotel: {
    id: string
    name: string
    pricePerNight: number
  } | null
  activities: {
    id: string
    name: string
    price: number
  }[]
}

export default function BookingsManager({
  initialBookings,
}: {
  initialBookings: BookingAdminItem[]
}) {
  const [bookings, setBookings] = useState<BookingAdminItem[]>(initialBookings)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reloadBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings')
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch (e) {
      console.error('Failed to reload bookings', e)
    }
  }

  const handleUpdateStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    setUpdatingId(bookingId)
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update booking status')
        return
      }

      await reloadBookings()
    } catch {
      setErrorMessage('Network error while updating status')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    const ref = formatBookingReference(b.id).toLowerCase()
    return (
      b.id.toLowerCase().includes(q) ||
      ref.includes(q) ||
      (b.user.name && b.user.name.toLowerCase().includes(q)) ||
      b.user.email.toLowerCase().includes(q) ||
      b.destination.name.toLowerCase().includes(q) ||
      b.destination.city.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Customer Bookings
            </h1>
            <Badge variant="outline" className="text-xs">
              {bookings.length} total records
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor, audit, and update lifecycle statuses for all platform bookings.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Table Card */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by ID, user, email, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-gray-50/50 dark:bg-white/[0.02]"
              />
            </div>

            <div className="flex items-center gap-1">
              {['all', 'confirmed', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                      : 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-gray-400">
            Showing {filtered.length} of {bookings.length} bookings
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-white/[0.04]">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Dates & Nights</th>
                  <th className="px-4 py-3">Total (INR)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {filtered.map((b) => {
                  const isConfirmed = b.status === 'confirmed'
                  const isCompleted = b.status === 'completed'
                  const isCancelled = b.status === 'cancelled'
                  const nights = calculateNights(b.checkIn, b.checkOut)
                  const isUpdating = updatingId === b.id

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-gray-900 dark:text-white">
                          {formatBookingReference(b.id)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {formatTripDate(b.createdAt)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {b.user.name || 'Traveler'}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[150px]">
                          {b.user.email}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-violet-500" />
                          {b.destination.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {b.hotel ? b.hotel.name : 'No hotel stay'} • {b.activities.length} acts
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        <div>{formatTripDate(b.checkIn)} → {formatTripDate(b.checkOut)}</div>
                        <div className="text-[11px] text-gray-400">{nights} Nights • {b.guests} Guests</div>
                      </td>

                      <td className="px-4 py-3 font-extrabold text-gray-900 dark:text-white">
                        {formatINR(b.totalPrice)}
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          className={`text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider ${
                            isConfirmed
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : isCompleted
                              ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              : 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                          }`}
                        >
                          {b.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              {!isConfirmed && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                  className="h-6 px-1.5 text-[10px] text-emerald-600 hover:bg-emerald-50"
                                >
                                  Confirm
                                </Button>
                              )}
                              {!isCompleted && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(b.id, 'completed')}
                                  className="h-6 px-1.5 text-[10px] text-blue-600 hover:bg-blue-50"
                                >
                                  Complete
                                </Button>
                              )}
                              {!isCancelled && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                                  className="h-6 px-1.5 text-[10px] text-red-600 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-gray-500">
              No matching bookings found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
