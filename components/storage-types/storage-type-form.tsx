"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogClose } from "@/components/ui/dialog"
import { useAddStorageType, useUpdateStorageType } from "@/lib/hooks/use-storage-types"
import type { StorageType } from "@/lib/types"

interface StorageTypeFormProps {
  storageType?: StorageType | null
  onSuccess?: () => void
}

export default function StorageTypeForm({ storageType, onSuccess }: StorageTypeFormProps) {
  const addStorageTypeMutation = useAddStorageType()
  const updateStorageTypeMutation = useUpdateStorageType(storageType?.id || 0)
  
  const [formData, setFormData] = useState({
    name: storageType?.name || "",
    description: storageType?.description || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when storageType prop changes
  useEffect(() => {
    if (storageType) {
      setFormData({
        name: storageType.name,
        description: storageType.description || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
      })
    }
  }, [storageType])

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (storageType) {
        // Update existing storage type
        await updateStorageTypeMutation.mutateAsync(formData)
      } else {
        // Create new storage type
        await addStorageTypeMutation.mutateAsync(formData)
      }
      
      onSuccess?.()
    } catch (error) {
      // Error handling is done in the mutations
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Name *
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Refrigerated, Frozen, Dry Storage"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Optional description for this storage type"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.name.trim()}
        >
          {isSubmitting 
            ? (storageType ? "Updating..." : "Creating...") 
            : (storageType ? "Update Storage Type" : "Create Storage Type")
          }
        </Button>
      </div>
    </form>
  )
}
