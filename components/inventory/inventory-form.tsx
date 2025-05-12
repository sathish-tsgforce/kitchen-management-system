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
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = ["Vegetables", "Fruits", "Dairy", "Meat", "Seafood", "Grains", "Spices", "Oils", "Other"]
  const locations = ["Main Kitchen", "Dry Storage", "Refrigerator", "Freezer", "Spice Rack", "Other"]
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
        }

        console.log("Submitting new ingredient:", newIngredientData)

        await addIngredient(newIngredientData)
        toast({
          title: "Ingredient added",
          description: `${formData.name} has been added to inventory.`,
        })
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
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-lg">
            Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="text-lg p-3 h-auto"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-lg">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleChange("quantity", Number.parseFloat(e.target.value) || 0)}
              className="text-lg p-3 h-auto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit" className="text-lg">
              Unit
            </Label>
            <Select value={formData.unit} onValueChange={(value) => handleChange("unit", value)}>
              <SelectTrigger id="unit" className="text-lg p-3 h-auto">
                <SelectValue placeholder="Select unit" />
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
            {formData.unit === "custom" && (
              <Input
                className="mt-2 text-lg p-3 h-auto"
                placeholder="Enter custom unit"
                onChange={(e) => handleChange("unit", e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price" className="text-lg">
            Price
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleChange("price", Number.parseFloat(e.target.value) || 0)}
              className="text-lg p-3 h-auto pl-7"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-lg">
            Category
          </Label>
          <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
            <SelectTrigger id="category" className="text-lg p-3 h-auto">
              <SelectValue placeholder="Select category" />
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
          {formData.category === "custom" && (
            <Input
              className="mt-2 text-lg p-3 h-auto"
              placeholder="Enter custom category"
              onChange={(e) => handleChange("category", e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="location" className="text-lg">
            Storage Location
          </Label>
          <Select value={formData.location} onValueChange={(value) => handleChange("location", value)}>
            <SelectTrigger id="location" className="text-lg p-3 h-auto">
              <SelectValue placeholder="Select location" />
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
          {formData.location === "custom" && (
            <Input
              className="mt-2 text-lg p-3 h-auto"
              placeholder="Enter custom location"
              onChange={(e) => handleChange("location", e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="text-lg p-3 h-auto">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" className="bg-green-700 hover:bg-green-800 text-lg p-3 h-auto" disabled={isSubmitting}>
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
  )
}
