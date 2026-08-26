'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, Building2 } from 'lucide-react'
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

export interface HotelFormData {
  id?: string
  name: string
  pricePerNight: number
  rating: number
  amenities: string
  image?: string | null
  destinationId: string
}

interface HotelDialogProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  destinations: { id: string; name: string; city: string }[]
  hotelToEdit?: HotelFormData | null
}

const initialValues: HotelFormData = {
  name: '',
  pricePerNight: 4500,
  rating: 4.6,
  amenities: 'Free WiFi, Complimentary Breakfast, Swimming Pool, Parking',
  image: '/images/gujarat/somnath.jpg',
  destinationId: '',
}

export default function HotelDialog({
  isOpen,
  onClose,
  onSaved,
  destinations,
  hotelToEdit,
}: HotelDialogProps) {
  const [formData, setFormData] = useState<HotelFormData>(initialValues)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hotelToEdit) {
      setFormData(hotelToEdit)
    } else {
      setFormData({
        ...initialValues,
        destinationId: destinations[0]?.id || '',
      })
    }
    setError(null)
  }, [hotelToEdit, isOpen, destinations])

  const isEdit = !!hotelToEdit?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = isEdit ? `/api/admin/hotels/${hotelToEdit.id}` : '/api/admin/hotels'
      const method = isEdit ? 'PATCH' : 'POST'

      const payload = {
        name: formData.name.trim(),
        pricePerNight: Number(formData.pricePerNight),
        rating: Number(formData.rating),
        amenities: formData.amenities.trim(),
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
        setError(data.error || 'Failed to save hotel')
        setIsLoading(false)
        return
      }

      onSaved()
      onClose()
    } catch {
      setError('An unexpected error occurred while saving hotel')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f14]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            {isEdit ? 'Edit Accommodation' : 'Add New Accommodation'}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {isEdit ? 'Update resort or hotel stay details' : 'Register a verified hotel for a destination'}
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
            <Label htmlFor="name" className="text-xs font-semibold">Hotel / Resort Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Taj Lake Palace"
              className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-semibold">Price per Night (INR)</Label>
              <Input
                id="price"
                type="number"
                min={100}
                required
                value={formData.pricePerNight}
                onChange={(e) => setFormData({ ...formData, pricePerNight: parseInt(e.target.value, 10) || 0 })}
                className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rating" className="text-xs font-semibold">Rating (0 - 5.0)</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min={0}
                max={5}
                required
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amenities" className="text-xs font-semibold">Amenities (Comma separated)</Label>
            <Input
              id="amenities"
              required
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              placeholder="e.g. Free WiFi, Breakfast Included, River View, Spa"
              className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image" className="text-xs font-semibold">Image URL or Local Path</Label>
            <Input
              id="image"
              value={formData.image || ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="/images/kerala/houseboat.jpg"
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
              className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : isEdit ? (
                'Update Hotel'
              ) : (
                'Create Hotel'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
