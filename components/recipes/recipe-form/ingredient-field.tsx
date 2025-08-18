"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Trash2, Search, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Ingredient } from "@/lib/types"

interface IngredientFieldProps {
  index: number
  ingredient: {
    id: number
    ingredient_id: number | null
    name: string
    quantity: string
  }
  allIngredients?: Array<{
    id: number
    ingredient_id: number | null
    name: string
    quantity: string
  }>
  availableIngredients: Ingredient[]
  onUpdate: (index: number, field: string, value: any) => void
  onSelect: (index: number, value: string) => void
  onRemove: (index: number) => void
}

export default function IngredientField({
  index,
  ingredient,
  allIngredients = [],
  availableIngredients,
  onUpdate,
  onSelect,
  onRemove,
}: IngredientFieldProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [filteredIngredients, setFilteredIngredients] = useState(availableIngredients)
  const [numericValue, setNumericValue] = useState("")
  const [quantityError, setQuantityError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedIngredient = ingredient.ingredient_id
    ? availableIngredients.find((item) => item.id === ingredient.ingredient_id)
    : null

  // Get list of already selected ingredient IDs (excluding current ingredient)
  const selectedIngredientIds = allIngredients
    .filter((ing, i) => i !== index && ing.ingredient_id !== null)
    .map((ing) => ing.ingredient_id)

  // Extract numeric value from quantity when ingredient changes
  useEffect(() => {
    if (ingredient.quantity && selectedIngredient) {
      // Extract just the numeric part from the quantity
      const numeric = ingredient.quantity.replace(/[^0-9.]/g, "")
      setNumericValue(numeric)
    } else {
      setNumericValue("")
    }
  }, [ingredient.ingredient_id, ingredient.quantity, selectedIngredient])

  // Update filtered ingredients when search term changes - show only unique names
  useEffect(() => {
    // Create a map to store unique ingredients by name
    const uniqueIngredientsByName = new Map();
    
    // Process all ingredients, keeping only the first occurrence of each name
    availableIngredients.forEach(ingredient => {
      if (!uniqueIngredientsByName.has(ingredient.name.toLowerCase())) {
        uniqueIngredientsByName.set(ingredient.name.toLowerCase(), ingredient);
      }
    });
    
    // Convert the map values back to an array
    const uniqueIngredients = Array.from(uniqueIngredientsByName.values());
    
    if (!searchTerm.trim()) {
      setFilteredIngredients(uniqueIngredients);
    } else {
      const filtered = uniqueIngredients.filter((item) => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIngredients(filtered);
    }
  }, [searchTerm, availableIngredients])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Validate numeric value
  useEffect(() => {
    if (!numericValue) {
      setQuantityError(null)
      return
    }

    const number = Number.parseFloat(numericValue)

    if (isNaN(number)) {
      setQuantityError("Please enter a valid number")
      return
    }

    if (number <= 0) {
      setQuantityError("Quantity must be greater than zero")
      return
    }

    setQuantityError(null)
  }, [numericValue])

  const handleSelectIngredient = (ingredientId: string) => {
    // Check if this ingredient is already selected in another field
    if (selectedIngredientIds.includes(Number(ingredientId))) {
      alert("This ingredient is already added to the recipe. Please select a different ingredient.")
      return
    }

    onSelect(index, ingredientId)
    setIsOpen(false)
    setSearchTerm("")
  }

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNumericValue(value)

    // Only update the parent if we have both a number and a selected ingredient
    if (value && selectedIngredient) {
      // Validate the number
      const number = Number.parseFloat(value)
      if (!isNaN(number) && number > 0) {
        // Combine the number with the unit
        const fullQuantity = `${value}${selectedIngredient.unit}`
        onUpdate(index, "quantity", fullQuantity)
      }
    }
  }

  return (
    <div className="p-4 border-2 border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Ingredient #{index + 1}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-800 hover:bg-red-50"
        >
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Remove ingredient</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2" ref={dropdownRef}>
          <Label htmlFor={`ingredient-search-${index}`} className="text-sm font-medium">
            Select Ingredient
          </Label>

          {/* Searchable Dropdown */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id={`ingredient-search-${index}`}
                type="text"
                placeholder={selectedIngredient ? selectedIngredient.name : "Search ingredients..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setIsOpen(true)
                }}
                onFocus={() => setIsOpen(true)}
                className="pl-8 pr-4 w-full"
              />
            </div>

            {isOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                {filteredIngredients.length > 0 ? (
                  <ul className="py-1">
                    {filteredIngredients.map((item) => {
                      const isAlreadySelected = selectedIngredientIds.includes(item.id)
                      return (
                        <li
                          key={item.id}
                          onClick={() => !isAlreadySelected && handleSelectIngredient(item.id.toString())}
                          className={cn(
                            "px-3 py-2 flex items-center justify-between",
                            ingredient.ingredient_id === item.id && "bg-gray-100",
                            isAlreadySelected ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100",
                          )}
                        >
                          <div className="flex items-center">
                            {ingredient.ingredient_id === item.id && <Check className="mr-2 h-4 w-4 text-green-600" />}
                            <span>{item.name}</span>
                            {isAlreadySelected && <span className="ml-2 text-xs text-red-500">Already added</span>}
                          </div>
                          <span className="text-xs text-gray-500">
                            {item.unit}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No ingredients found</div>
                )}
              </div>
            )}
          </div>

          {selectedIngredient && !isOpen && (
            <p className="text-xs text-gray-500">
              Unit: {selectedIngredient.unit}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`quantity-${index}`} className="text-sm font-medium">
            Quantity
          </Label>
          <div className="relative">
            <Input
              id={`quantity-${index}`}
              type="text"
              inputMode="decimal"
              value={numericValue}
              onChange={handleNumericChange}
              placeholder="Enter amount"
              disabled={!selectedIngredient}
              className={cn("w-full pr-12", quantityError && "border-red-500 focus-visible:ring-red-500")}
            />
            {selectedIngredient && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                {selectedIngredient.unit}
              </div>
            )}
          </div>

          {quantityError ? (
            <p className="text-xs text-red-500 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              {quantityError}
            </p>
          ) : (
            selectedIngredient && (
              <p className="text-xs text-gray-500">Enter numeric value only, unit will be added automatically</p>
            )
          )}
        </div>
      </div>
    </div>
  )
}
