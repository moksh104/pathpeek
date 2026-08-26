'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, Ticket } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface ActivityFormData {
  id?: string
  name: string
  price: number
  duration: string
  description?: string | null
  image?: string | null
  destinationId: string
}

interface ActivityDialogProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  destinations: { id: string; name: string; city: string }[]
  activityToEdit?: ActivityFormData | null
}

const initialValues: ActivityFormData = {
  name: '',
  price: 1500,
  duration: '2-3 hours',
  description: '',
  image: '/images/gujarat/somnath.jpg',
  destinationId: '',
}

export default function ActivityDialog({
  isOpen,
  onClose,
  onSaved,
  destinations,
  activityToEdit,
}: ActivityDialogProps) {
  const [formData, setFormData] = useState<ActivityFormData>(initialValues)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (activityToEdit) {
      setFormData(activityToEdit)
    } else {
      setFormData({
        ...initialValues,
        destinationId: destinations[0]?.id || '',
      })
    }
    setError(null)
  }, [activityToEdit, isOpen, destinations])

  const isEdit = !!activityToEdit?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = isEdit
        ? `/api/admin/activities/${activityToEdit.id}`
        : '/api/admin/activities'
      const method = isEdit ? 'PATCH' : 'POST'

      const payload = {
        name: formData.name.trim(),
        price: Number(formData.price),
        duration: formData.duration.trim(),
        description: formData.description ? formData.description.trim() : null,
        image: formData.image ? formData.image.trim() : null,
        destinationId: formData.destinationId,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save activity')
        setIsLoading(false)
        return
      }

      onSaved()
      onClose()
    } catch {
      setError('An unexpected error occurred while saving activity')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f14]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-500" />
            {isEdit ? 'Edit Activity' : 'Add New Activity'}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {isEdit ? 'Update guided experience details' : 'Register a guided excursion, safari, or adventure tour'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="destinationId" className="text-xs font-semibold">Destination</Label>
            <select
              id="destinationId"
              required
              value={formData.destinationId}
              onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
              className="w-full h-10 rounded-xl px-3 text-sm bg-gray-50/50 dark:bg-[#09090b] border border-gray-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.city})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">Activity Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Scuba Diving with PADI Certified Instructor"
              className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-semibold">Price per Person (INR)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })}
                className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-xs font-semibold">Duration</Label>
              <Input
                id="duration"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 3 hours / Half Day"
                className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
            <Textarea
              id="description"
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Overview of the experience, gear provided, and timings..."
              className="rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image" className="text-xs font-semibold">Image URL or Local Path</Label>
            <Input
              id="image"
              value={formData.image || ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="/images/goa/scuba.jpg"
              className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : isEdit ? (
                'Update Activity'
              ) : (
                'Create Activity'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
