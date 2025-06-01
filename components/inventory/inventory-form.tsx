"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Ingredient } from "@/lib/types"
import { useData } from "@/lib/context/data-context"
import { DialogClose } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

interface InventoryFormProps {
  ingredient?: Ingredient
}

export default function InventoryForm({ ingredient }: InventoryFormProps) {
  const { addIngredient, updateIngredient } = useData()

  const [formData, setFormData] = useState({
    name: ingredient?.name || "",
    quantity: ingredient?.quantity || 0,
    unit: ingredient?.unit || "",
    price: ingredient?.price || 0,
    category: ingredient?.category || "",
    location: ingredient?.location || "",
    threshold_quantity: ingredient?.threshold_quantity || 10,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = ["Vegetables", "Fruits", "Dairy", "Meat", "Seafood", "Grains", "Spices", "Oils", "Other"]
  const locations = ["Mountbatten", "Serangoon", "Queenstown", "Changi", "Jurong", "Punggol"]
  const units = ["g", "kg", "ml", "l", "pcs", "bunch", "tbsp", "tsp", "cup"]

  const handleChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (ingredient) {
        // Update existing ingredient
        await updateIngredient(ingredient.id, formData)
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
          price: formData.price || 0,
          category: formData.category || "",
          location: formData.location || "",
          threshold_quantity: formData.threshold_quantity || 10,
        }

        console.log("Submitting new ingredient:", newIngredientData)

        try {
          await addIngredient(newIngredientData)
          toast({
            title: "Ingredient added",
            description: `${formData.name} has been added to inventory.`,
          })
        } catch (err: any) {
          // Check if it's a duplicate key error
          if (err.message && err.message.includes("duplicate key")) {
            setError(
              `An ingredient with this name already exists. Please use a different name or edit the existing one.`,
            )
            toast({
              title: "Duplicate ingredient",
              description: `An ingredient named "${formData.name}" already exists.`,
              variant: "destructive",
            })
          } else {
            throw err // Re-throw if it's not a duplicate key error
          }
        }
      }
    } catch (err: any) {
      console.error("Error saving ingredient:", err)
      setError(err?.message || "There was an error saving the ingredient.")
      toast({
        title: "Error",
        description: err?.message || "There was an error saving the ingredient. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3 flex-grow">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div className="col-span-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="h-8"
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleChange("quantity", Number.parseFloat(e.target.value) || 0)}
              className="h-8"
              required
            />
          </div>

          <div>
            <Label htmlFor="threshold_quantity" className="text-sm font-medium">
              Threshold
            </Label>
            <Input
              id="threshold_quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.threshold_quantity}
              onChange={(e) => handleChange("threshold_quantity", Number.parseFloat(e.target.value) || 0)}
              className="h-8"
              required
            />
          </div>

          <div>
            <Label htmlFor="unit" className="text-sm font-medium">
              Unit
            </Label>
            <Select value={formData.unit} onValueChange={(value) => handleChange("unit", value)}>
              <SelectTrigger id="unit" className="h-8">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit} value={unit} className="cursor-pointer">
                    {unit}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="cursor-pointer">
                  Custom...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price" className="text-sm font-medium">
              Price
            </Label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange("price", Number.parseFloat(e.target.value) || 0)}
                className="pl-5 h-8"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger id="category" className="h-8">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="cursor-pointer">
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="cursor-pointer">
                  Custom...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location" className="text-sm font-medium">
              Location
            </Label>
            <Select value={formData.location} onValueChange={(value) => handleChange("location", value)}>
              <SelectTrigger id="location" className="h-8">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location} className="cursor-pointer">
                    {location}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="cursor-pointer">
                  Custom...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-3 pt-2 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" className="bg-green-700 hover:bg-green-800" size="sm" disabled={isSubmitting}>
            {isSubmitting
              ? ingredient
                ? "Updating..."
                : "Saving..."
              : ingredient
                ? "Update Ingredient"
                : "Save Ingredient"}
          </Button>
        </div>
      </form>
    </div>
  )
}
