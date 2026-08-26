'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Star,
  Search,
  Building2,
  Ticket,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import DestinationDialog, { DestinationFormData } from '@/components/admin/DestinationDialog'
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog'
import { formatINR } from '@/lib/booking-utils'

export interface DestinationAdminItem {
  id: string
  name: string
  mood: string
  city: string
  state: string
  budget: number
  rating: number
  description: string
  image: string
  latitude: number
  longitude: number
  recommendationScore: number
  _count: {
    hotels: number
    activities: number
    bookings: number
  }
}

export default function DestinationsManager({
  initialDestinations,
}: {
  initialDestinations: DestinationAdminItem[]
}) {
  const [destinations, setDestinations] = useState<DestinationAdminItem[]>(initialDestinations)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<DestinationFormData | null>(null)

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<DestinationAdminItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const reloadDestinations = async () => {
    try {
      const res = await fetch('/api/admin/destinations')
      if (res.ok) {
        const data = await res.json()
        setDestinations(data.destinations || [])
      }
    } catch (e) {
      console.error('Failed to reload destinations', e)
    }
  }

  const handleOpenCreate = () => {
    setSelectedDestination(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (dest: DestinationAdminItem) => {
    setSelectedDestination({
      id: dest.id,
      name: dest.name,
      mood: dest.mood,
      city: dest.city,
      state: dest.state,
      budget: dest.budget,
      rating: dest.rating,
      description: dest.description,
      image: dest.image,
      latitude: dest.latitude,
      longitude: dest.longitude,
      recommendationScore: dest.recommendationScore,
    })
    setDialogOpen(true)
  }

  const handleOpenDelete = (dest: DestinationAdminItem) => {
    setItemToDelete(dest)
    setDeleteError(null)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setDeleteError(null)

    try {
      const res = await fetch(`/api/admin/destinations/${itemToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete destination')
        return
      }

      await reloadDestinations()
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch {
      setDeleteError('An unexpected network error occurred')
    }
  }

  const filtered = destinations.filter((d) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      d.name.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      d.state.toLowerCase().includes(q) ||
      d.mood.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Destinations Management
            </h1>
            <Badge variant="outline" className="text-xs">
              {destinations.length} total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Create, update, or remove travel destinations in the database.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Destination
        </Button>
      </div>

      {/* Table Card */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search destinations by name, city, state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-gray-50/50 dark:bg-white/[0.02]"
            />
          </div>
          <span className="text-xs text-gray-400">
            Showing {filtered.length} of {destinations.length} entries
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-white/[0.04]">
              <tr>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Mood</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Assets</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        <Image src={d.image} alt={d.name} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white line-clamp-1 max-w-[180px]">
                          {d.name}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {d.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-800 dark:text-gray-200 font-medium">{d.city}</div>
                    <div className="text-[11px] text-gray-400">{d.state}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 border-0">
                      {d.mood}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {d.rating.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {formatINR(d.budget)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <span title="Hotels" className="flex items-center gap-0.5">
                        <Building2 className="w-3 h-3 text-emerald-500" /> {d._count.hotels}
                      </span>
                      <span title="Activities" className="flex items-center gap-0.5">
                        <Ticket className="w-3 h-3 text-amber-500" /> {d._count.activities}
                      </span>
                      <span title="Bookings" className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3 text-purple-500" /> {d._count.bookings}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/destinations/${d.id}`} target="_blank">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View Public Page">
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(d)}
                        className="h-7 px-2 text-[11px] rounded-lg"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDelete(d)}
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

      {/* Destination Form Dialog */}
      <DestinationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={reloadDestinations}
        destinationToEdit={selectedDestination}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Destination"
        description="Are you sure you want to permanently delete"
        itemName={itemToDelete?.name}
        errorMessage={deleteError}
      />
    </div>
  )
}
