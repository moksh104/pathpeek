'use client'

import { useState } from 'react'
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  Clock,
  Calendar,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import ActivityDialog, { ActivityFormData } from '@/components/admin/ActivityDialog'
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog'
import { formatINR } from '@/lib/booking-utils'

export interface ActivityAdminItem {
  id: string
  name: string
  price: number
  duration: string
  description: string | null
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

export default function ActivitiesManager({
  initialActivities,
  destinations,
}: {
  initialActivities: ActivityAdminItem[]
  destinations: { id: string; name: string; city: string }[]
}) {
  const [activities, setActivities] = useState<ActivityAdminItem[]>(initialActivities)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<ActivityFormData | null>(null)

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ActivityAdminItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const reloadActivities = async () => {
    try {
      const res = await fetch('/api/admin/activities')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch (e) {
      console.error('Failed to reload activities', e)
    }
  }

  const handleOpenCreate = () => {
    setSelectedActivity(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (act: ActivityAdminItem) => {
    setSelectedActivity({
      id: act.id,
      name: act.name,
      price: act.price,
      duration: act.duration,
      description: act.description,
      image: act.image,
      destinationId: act.destinationId,
    })
    setDialogOpen(true)
  }

  const handleOpenDelete = (act: ActivityAdminItem) => {
    setItemToDelete(act)
    setDeleteError(null)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setDeleteError(null)

    try {
      const res = await fetch(`/api/admin/activities/${itemToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete activity')
        return
      }

      await reloadActivities()
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch {
      setDeleteError('An unexpected network error occurred')
    }
  }

  const filtered = activities.filter((act) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      act.name.toLowerCase().includes(q) ||
      act.destination.name.toLowerCase().includes(q) ||
      act.destination.city.toLowerCase().includes(q) ||
      (act.description && act.description.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Activities & Experiences
            </h1>
            <Badge variant="outline" className="text-xs">
              {activities.length} total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage adventure tours, guided treks, and cultural workshops.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Activity
        </Button>
      </div>

      {/* Table Card */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search activities by name, destination, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-gray-50/50 dark:bg-white/[0.02]"
            />
          </div>
          <span className="text-xs text-gray-400">
            Showing {filtered.length} of {activities.length} entries
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-white/[0.04]">
              <tr>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Price / Person</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {filtered.map((act) => (
                <tr key={act.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900 dark:text-white max-w-[220px] line-clamp-1">
                      {act.name}
                    </div>
                    {act.description && (
                      <div className="text-[11px] text-gray-400 line-clamp-1 max-w-[240px]">
                        {act.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-800 dark:text-gray-200 font-medium">
                      <MapPin className="w-3 h-3 text-violet-500" />
                      {act.destination.name}
                    </div>
                    <div className="text-[11px] text-gray-400">{act.destination.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 border-0 flex items-center gap-1 w-fit">
                      <Clock className="w-3 h-3 text-violet-500" />
                      {act.duration}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {act.price > 0 ? formatINR(act.price) : 'Free'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px] px-2 py-0 flex items-center gap-1 w-fit">
                      <Calendar className="w-3 h-3 text-purple-500" />
                      {act._count.bookings}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(act)}
                        className="h-7 px-2 text-[11px] rounded-lg"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDelete(act)}
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

      {/* Activity Dialog */}
      <ActivityDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={reloadActivities}
        destinations={destinations}
        activityToEdit={selectedActivity}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Activity"
        description="Are you sure you want to delete"
        itemName={itemToDelete?.name}
        errorMessage={deleteError}
      />
    </div>
  )
}
