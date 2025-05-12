"use client"

import type React from "react"

// Custom hook for inventory form logic
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import type { Ingredient } from "@/lib/types"

interface UseInventoryFormProps {
  ingredient?: Ingredient
  onSave: (ingredient: Ingredient | Omit<Ingredient, "id">) => Promise<void>
}

export function useInventoryForm({ ingredient, onSave }: UseInventoryFormProps) {
  const [formData, setFormData] = useState({
    name: ingredient?.name || "",
    quantity: ingredient?.quantity || 0,
    unit: ingredient?.unit || "",
    price: ingredient?.price || 0,
    category: ingredient?.category || "",
    location: ingredient?.location || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (ingredient) {
        // Update existing ingredient
        await onSave({
          ...ingredient,
          ...formData,
        })
        toast({
          title: "Ingredient updated",
          description: `${formData.name} has been updated successfully.`,
        })
      } else {
        // Add new ingredient - ensure we're not sending an ID
        const newIngredientData = {
          name: formData.name,
          quantity: formData.quantity,
          unit: formData.unit,
          price: formData.price || null,
          category: formData.category || null,
          location: formData.location || null,
        }
        await onSave(newIngredientData)
        toast({
          title: "Ingredient added",
          description: `${formData.name} has been added to inventory.`,
        })
      }
    } catch (err) {
      console.error("Error saving ingredient:", err)
      toast({
        title: "Error",
        description: "There was an error saving the ingredient. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit,
  }
}
