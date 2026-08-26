'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, MapPin } from 'lucide-react'
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

export interface DestinationFormData {
  id?: string
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
}

const initialValues: DestinationFormData = {
  name: '',
  mood: 'Adventure',
  city: '',
  state: '',
  budget: 15000,
  rating: 4.5,
  description: '',
  image: '/images/gujarat/somnath.jpg',
  latitude: 20.888,
  longitude: 70.401,
  recommendationScore: 85,
}

const moodOptions = ['Peaceful', 'Adventure', 'Romantic', 'Scenic Nature', 'Party']

interface DestinationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  destinationToEdit?: DestinationFormData | null
}

export default function DestinationDialog({
  isOpen,
  onClose,
  onSaved,
  destinationToEdit,
}: DestinationDialogProps) {
  const [formData, setFormData] = useState<DestinationFormData>(initialValues)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (destinationToEdit) {
      setFormData(destinationToEdit)
    } else {
      setFormData(initialValues)
    }
    setError(null)
  }, [destinationToEdit, isOpen])

  const isEdit = !!destinationToEdit?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = isEdit
        ? `/api/admin/destinations/${destinationToEdit.id}`
        : '/api/admin/destinations'

      const method = isEdit ? 'PATCH' : 'POST'

      const payload = {
        name: formData.name.trim(),
        mood: formData.mood,
        city: formData.city.trim(),
        state: formData.state.trim(),
        budget: Number(formData.budget),
        rating: Number(formData.rating),
        description: formData.description.trim(),
        image: formData.image.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        recommendationScore: Number(formData.recommendationScore),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save destination')
        setIsLoading(false)
        return
      }

      onSaved()
      onClose()
    } catch {
      setError('An unexpected error occurred while saving destination')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f14]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-violet-500" />
            {isEdit ? 'Edit Destination' : 'Add New Destination'}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {isEdit ? 'Update metadata for this destination' : 'Create a new travel destination in the Prisma database'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">Destination Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Gir National Park"
                className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mood" className="text-xs font-semibold">Travel Mood</Label>
              <select
                id="mood"
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                className="w-full h-10 rounded-xl px-3 text-sm bg-gray-50/50 dark:bg-[#09090b] border border-gray-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {moodOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold">City / District</Label>
              <Input
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Junagadh"
                className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-xs font-semibold">State</Label>
              <Input
                id="state"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Gujarat"
                className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budget" className="text-xs font-semibold">Estimated Budget (INR)</Label>
              <Input
                id="budget"
                type="number"
                min={500}
                required
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value, 10) || 0 })}
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

            <div className="space-y-1.5">
              <Label htmlFor="latitude" className="text-xs font-semibold">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="longitude" className="text-xs font-semibold">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image" className="text-xs font-semibold">Image URL or Local Path</Label>
            <Input
              id="image"
              required
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="/images/gujarat/somnath.jpg"
              className="h-10 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
            <Textarea
              id="description"
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the experience, highlights, and history..."
              className="rounded-xl bg-gray-50/50 dark:bg-white/[0.03]"
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
              className="rounded-xl text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : isEdit ? (
                'Update Destination'
              ) : (
                'Create Destination'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
