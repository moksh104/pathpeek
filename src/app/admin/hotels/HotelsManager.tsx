'use client'

import { useState } from 'react'
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Star,
  Search,
  MapPin,
  Calendar,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import HotelDialog, { HotelFormData } from '@/components/admin/HotelDialog'
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog'
import { formatINR } from '@/lib/booking-utils'

export interface HotelAdminItem {
  id: string
  name: string
  pricePerNight: number
  rating: number
  amenities: string
  image: string | null
  destinationId: string
  destination: {
    id: string
    name: string
    city: string
    state: string
  }
  _count: {
    bookings: number
  }
}

export default function HotelsManager({
  initialHotels,
  destinations,
}: {
  initialHotels: HotelAdminItem[]
  destinations: { id: string; name: string; city: string }[]
}) {
  const [hotels, setHotels] = useState<HotelAdminItem[]>(initialHotels)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState<HotelFormData | null>(null)

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<HotelAdminItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const reloadHotels = async () => {
    try {
      const res = await fetch('/api/admin/hotels')
      if (res.ok) {
        const data = await res.json()
        setHotels(data.hotels || [])
      }
    } catch (e) {
      console.error('Failed to reload hotels', e)
    }
  }

  const handleOpenCreate = () => {
    setSelectedHotel(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (h: HotelAdminItem) => {
    setSelectedHotel({
      id: h.id,
      name: h.name,
      pricePerNight: h.pricePerNight,
      rating: h.rating,
      amenities: h.amenities,
      image: h.image,
      destinationId: h.destinationId,
    })
    setDialogOpen(true)
  }

  const handleOpenDelete = (h: HotelAdminItem) => {
    setItemToDelete(h)
    setDeleteError(null)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setDeleteError(null)

    try {
      const res = await fetch(`/api/admin/hotels/${itemToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete hotel')
        return
      }

      await reloadHotels()
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch {
      setDeleteError('An unexpected network error occurred')
    }
  }

  const filtered = hotels.filter((h) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      h.name.toLowerCase().includes(q) ||
      h.destination.name.toLowerCase().includes(q) ||
      h.destination.city.toLowerCase().includes(q) ||
      h.amenities.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Accommodations & Hotels
            </h1>
            <Badge variant="outline" className="text-xs">
              {hotels.length} total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage verified stays, room rates, and resort amenities.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Hotel
        </Button>
      </div>

      {/* Table Card */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search hotels by name, location, amenity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-gray-50/50 dark:bg-white/[0.02]"
            />
          </div>
          <span className="text-xs text-gray-400">
            Showing {filtered.length} of {hotels.length} entries
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-white/[0.04]">
              <tr>
                <th className="px-4 py-3">Hotel / Resort</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Price / Night</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Amenities</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {filtered.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {h.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-800 dark:text-gray-200 font-medium">
                      <MapPin className="w-3 h-3 text-violet-500" />
                      {h.destination.name}
                    </div>
                    <div className="text-[11px] text-gray-400">{h.destination.city}</div>
                  </td>
                  <td className="px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatINR(h.pricePerNight)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {h.rating.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                    {h.amenities}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 border-0 flex items-center gap-1 w-fit">
                      <Calendar className="w-3 h-3 text-purple-500" />
                      {h._count.bookings}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(h)}
                        className="h-7 px-2 text-[11px] rounded-lg"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDelete(h)}
                        className="h-7 px-2 text-[11px] rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Hotel Dialog */}
      <HotelDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={reloadHotels}
        destinations={destinations}
        hotelToEdit={selectedHotel}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Accommodation"
        description="Are you sure you want to delete"
        itemName={itemToDelete?.name}
        errorMessage={deleteError}
      />
    </div>
  )
}
