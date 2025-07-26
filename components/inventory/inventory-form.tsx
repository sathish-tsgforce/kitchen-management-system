"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Ingredient, Location } from "@/lib/types"
import { useInventory } from "@/lib/hooks/use-inventory"
import { DialogClose } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/context/auth-context"

interface InventoryFormProps {
  ingredient?: Ingredient
  onSuccess?: () => void
}

export default function InventoryForm({ ingredient, onSuccess }: InventoryFormProps) {
  const { addIngredient, updateIngredient } = useInventory()
  const { user } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])

  const [formData, setFormData] = useState({
    name: ingredient?.name || "",
    quantity: ingredient?.quantity || 0,
    unit: ingredient?.unit || "",
    price: ingredient?.price || 0,
    category: ingredient?.category || "Other",
    location_id: ingredient?.location_id || 0,
    threshold_quantity: ingredient?.threshold_quantity || 10,
    storage_type: ingredient?.storage_type || "Standard",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = ["Vegetables", "Fruits", "Dairy", "Meat", "Seafood", "Grains", "Spices", "Oils", "Sweeteners", "Herbs", "Baking", "Other"]
  const units = ["g", "kg", "ml", "l", "pcs", "bunch", "tbsp", "tsp", "cup"]
  const storageTypes = ["Standard", "Refrigerated", "Frozen", "Dry", "Vacuum Sealed", "Canned"]

  useEffect(() => {
    // Fetch locations
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("is_active", true)
        .order("name")
      
      if (error) {
        console.error("Error fetching locations:", error)
        return
      }
      
      setLocations(data || [])
      
      // For Chef users, set location to their assigned location
      if (user?.role === "Chef" && user?.location_id) {
        setFormData(prev => ({
          ...prev,
          location_id: user.location_id
        }))
      }
      // For other users, set default location if none is selected
      else if (!ingredient?.location_id && data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          location_id: data[0].id
        }))
      }
    }
    
    fetchLocations()
  }, [ingredient?.location_id, user?.role, user?.location_id])

  const handleChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const formatIngredientName = (name: string) => {
    return name
      .trim() // Remove extra spaces at the end
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const handleNameBlur = () => {
    const formattedName = formatIngredientName(formData.name)
    if (formattedName !== formData.name) {
      setFormData({
        ...formData,
        name: formattedName
      })
    }
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
        if (onSuccess) onSuccess()
      } else {
        // Add new ingredient - ensure we're not sending an ID
        const newIngredientData = {
          name: formData.name,
          quantity: formData.quantity,
          unit: formData.unit,
          price: formData.price || 0,
          category: formData.category || "",
          location_id: formData.location_id,
          threshold_quantity: formData.threshold_quantity || 10,
          storage_type: formData.storage_type || "Standard",
        }

        console.log("Submitting new ingredient:", newIngredientData)

        try {
          await addIngredient(newIngredientData)
          toast({
            title: "Ingredient added",
            description: `${formData.name} has been added to inventory.`,
          })
          if (onSuccess) onSuccess()
        } catch (err: any) {
          if (err.message && err.message.includes("already exists in this location")) {
            setError(err.message)
            toast({
              title: "Duplicate ingredient",
              description: `An ingredient named "${formData.name}" already exists in this location.`,
              variant: "destructive",
            })
          } else {
            throw err // Re-throw if it's not a duplicate name error
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
              onBlur={handleNameBlur}
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
            <Select value={formData.category || "Other"} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger id="category" className="h-8">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="cursor-pointer">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location_id" className="text-sm font-medium">
              Location
            </Label>
            {user?.role === "Chef" ? (
              // Read-only location display for Chef users
              <div className="border rounded-md px-3 py-1 h-8 flex items-center text-sm text-gray-700 bg-gray-50">
                {locations.find(loc => loc.id === formData.location_id)?.name || "Loading..."}
              </div>
            ) : (
              // Selectable location dropdown for Admin users
              <Select 
                value={formData.location_id.toString()} 
                onValueChange={(value) => handleChange("location_id", parseInt(value))}
                required
              >
                <SelectTrigger id="location_id" className="h-8">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()} className="cursor-pointer">
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="storage_type" className="text-sm font-medium">
              Storage Type
            </Label>
            <Select value={formData.storage_type || "Standard"} onValueChange={(value) => handleChange("storage_type", value)}>
              <SelectTrigger id="storage_type" className="h-8">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {storageTypes.map((type) => (
                  <SelectItem key={type} value={type} className="cursor-pointer">
                    {type}
                  </SelectItem>
                ))}
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
          <Button type="submit" className="bg-green-800 hover:bg-green-900" size="sm" disabled={isSubmitting}>
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