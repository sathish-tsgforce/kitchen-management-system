"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import IngredientField from "./ingredient-field"
import StepField from "./step-field"
import { deleteFile } from "@/lib/utils/storage"
import type { Recipe, Ingredient, MenuItem } from "@/lib/types"

interface RecipeFormProps {
  recipe?: Recipe | null
  ingredients: Ingredient[]
  menuItems: MenuItem[]
  onSave: (recipe: Omit<Recipe, "id" | "name">) => Promise<number | void>
  backUrl: string
  title: string
  isLoading?: boolean
  isSubmitting?: boolean
}

export default function RecipeForm({
  recipe,
  ingredients,
  menuItems,
  onSave,
  backUrl,
  title,
  isLoading = false,
  isSubmitting = false,
}: RecipeFormProps) {
  const router = useRouter()
  const [menuItemId, setMenuItemId] = useState<number>(recipe?.menu_item_id || 0)
  const [standardServingPax, setStandardServingPax] = useState<number>(recipe?.standard_serving_pax || 1)
  const [accessibilityNotes, setAccessibilityNotes] = useState<string>(recipe?.accessibility_notes || "")
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>(
    recipe?.ingredients.map((ing) => ({
      id: ing.id,
      ingredient_id: ing.ingredient_id,
      name: ing.name,
      quantity: ing.quantity,
    })) || [],
  )
  const [recipeSteps, setRecipeSteps] = useState<any[]>(
    recipe?.steps.map((step) => ({
      id: step.id,
      step_number: step.step_number,
      instruction: step.instruction,
      image_url: step.image_url || "",
      audio_url: step.audio_url || "",
    })) || [],
  )
  const [error, setError] = useState<string | null>(null)
  const [originalSteps, setOriginalSteps] = useState<any[]>([])

  // Store original steps for cleanup on form submission
  useEffect(() => {
    if (recipe?.steps) {
      setOriginalSteps(
        recipe.steps.map((step) => ({
          image_url: step.image_url || "",
          audio_url: step.audio_url || "",
        })),
      )
    }
  }, [recipe])

  // If the data is still loading, show skeleton loaders
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Add a new ingredient
  const addIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      {
        id: Date.now(),
        ingredient_id: null,
        name: "",
        quantity: "",
      },
    ])
  }

  // Update an ingredient field
  const updateIngredient = (index: number, field: string, value: any) => {
    const updatedIngredients = [...recipeIngredients]
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
    }
    setRecipeIngredients(updatedIngredients)
  }

  // Handle ingredient selection
  const handleIngredientSelect = (index: number, value: string) => {
    const updatedIngredients = [...recipeIngredients]
    const ingredientId = Number.parseInt(value, 10)
    const selectedIngredient = ingredients.find((i) => i.id === ingredientId)

    if (selectedIngredient) {
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        ingredient_id: ingredientId,
        name: selectedIngredient.name,
      }
      setRecipeIngredients(updatedIngredients)
    }
  }

  // Remove an ingredient
  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index))
  }

  // Add a new step
  const addStep = () => {
    const nextStepNumber = recipeSteps.length > 0 ? Math.max(...recipeSteps.map((s) => s.step_number)) + 1 : 1
    setRecipeSteps([
      ...recipeSteps,
      {
        id: Date.now(),
        step_number: nextStepNumber,
        instruction: "",
        image_url: "",
        audio_url: "",
      },
    ])
  }

  // Update a step field
  const updateStep = (index: number, field: string, value: any) => {
    const updatedSteps = [...recipeSteps]
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value,
    }
    setRecipeSteps(updatedSteps)
  }

  // Remove a step
  const removeStep = (index: number) => {
    const updatedSteps = recipeSteps.filter((_, i) => i !== index)

    // Renumber steps
    const renumberedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_number: i + 1,
    }))

    setRecipeSteps(renumberedSteps)
  }

  // Clean up unused files
  const cleanupUnusedFiles = async () => {
    // For each original step, check if its files are still used in the updated steps
    for (const originalStep of originalSteps) {
      // Check if image URL is no longer used
      if (originalStep.image_url && !recipeSteps.some((step) => step.image_url === originalStep.image_url)) {
        // Delete the unused image
        await deleteFile(originalStep.image_url)
      }

      // Check if audio URL is no longer used
      if (originalStep.audio_url && !recipeSteps.some((step) => step.audio_url === originalStep.audio_url)) {
        // Delete the unused audio
        await deleteFile(originalStep.audio_url)
      }
    }
  }

  // Validate and save the recipe
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Validate required fields
      if (!menuItemId) {
        setError("Please select a menu item")
        return
      }

      if (standardServingPax <= 0) {
        setError("Standard serving size must be at least 1")
        return
      }

      if (recipeIngredients.length === 0) {
        setError("Please add at least one ingredient")
        return
      }

      // Validate ingredients
      for (const ingredient of recipeIngredients) {
        if (!ingredient.ingredient_id) {
          setError("Please select an ingredient from inventory")
          return
        }
        if (!ingredient.quantity) {
          setError("Please enter a quantity for all ingredients")
          return
        }
      }

      if (recipeSteps.length === 0) {
        setError("Please add at least one step")
        return
      }

      // Validate steps
      for (const step of recipeSteps) {
        if (!step.instruction) {
          setError(`Please enter instructions for step ${step.step_number}`)
          return
        }
      }

      // Prepare recipe data
      const recipeData: Omit<Recipe, "id" | "name"> = {
        menu_item_id: menuItemId,
        standard_serving_pax: standardServingPax,
        accessibility_notes: accessibilityNotes,
        ingredients: recipeIngredients.map((ingredient) => ({
          id: ingredient.id,
          recipe_id: recipe?.id || 0,
          ingredient_id: ingredient.ingredient_id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          quantity_for_recipe: 0, // This will be calculated in the API
        })),
        steps: recipeSteps.map((step) => ({
          id: step.id,
          recipe_id: recipe?.id || 0,
          step_number: step.step_number,
          instruction: step.instruction,
          image_url: step.image_url,
          audio_url: step.audio_url,
        })),
      }

      // Save the recipe
      await onSave(recipeData)

      // Clean up unused files
      if (recipe) {
        await cleanupUnusedFiles()
      }
    } catch (err: any) {
      console.error("Error saving recipe:", err)

      // Check for specific error messages
      if (err.message && err.message.includes("menu item already has a recipe")) {
        setError("This menu item already has a recipe associated with it. Please choose a different menu item.")
      } else {
        setError(err.message || "An error occurred while saving the recipe")
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "An error occurred while saving the recipe",
      })
    }
  }

  // Initialize with one empty ingredient and step if creating a new recipe
  if (recipeIngredients.length === 0) {
    addIngredient()
  }

  if (recipeSteps.length === 0) {
    addStep()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link
        href={backUrl}
        className="inline-flex items-center text-lg text-gray-700 hover:text-gray-900 mb-6 focus:outline-none focus:underline"
        aria-label="Back"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>

          <div className="grid gap-6 mb-8">
            <div className="grid gap-2">
              <Label htmlFor="menu-item" className="text-lg">
                Menu Item
              </Label>
              <Select
                value={menuItemId ? menuItemId.toString() : ""}
                onValueChange={(value) => setMenuItemId(Number.parseInt(value))}
              >
                <SelectTrigger id="menu-item" className="text-lg p-3 h-auto">
                  <SelectValue placeholder="Select menu item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()} className="cursor-pointer">
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Note: Each menu item can only have one recipe associated with it.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="serving-size" className="text-lg">
                Standard Serving Size
              </Label>
              <Input
                id="serving-size"
                type="number"
                min="1"
                value={standardServingPax}
                onChange={(e) => setStandardServingPax(Number.parseInt(e.target.value) || 1)}
                className="text-lg p-3 h-auto"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accessibility-notes" className="text-lg">
                Accessibility Notes
              </Label>
              <Textarea
                id="accessibility-notes"
                value={accessibilityNotes}
                onChange={(e) => setAccessibilityNotes(e.target.value)}
                className="text-lg p-3 min-h-[100px]"
                placeholder="Add any accessibility information or special instructions"
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ingredients</h2>

          {recipeIngredients.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg mb-6">
              <p className="text-lg text-gray-500 mb-4">No ingredients added yet</p>
              <Button onClick={addIngredient} className="bg-green-700 hover:bg-green-800 text-white">
                <Plus className="mr-2 h-5 w-5" />
                Add First Ingredient
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {recipeIngredients.map((ingredient, index) => (
                  <IngredientField
                    key={ingredient.id}
                    index={index}
                    ingredient={ingredient}
                    allIngredients={recipeIngredients}
                    availableIngredients={ingredients}
                    onUpdate={updateIngredient}
                    onSelect={handleIngredientSelect}
                    onRemove={removeIngredient}
                  />
                ))}
              </div>

              <Button onClick={addIngredient} className="mb-8 bg-green-700 hover:bg-green-800 text-white">
                <Plus className="mr-2 h-5 w-5" />
                Add Another Ingredient
              </Button>
            </>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Preparation Steps</h2>

          {recipeSteps.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg mb-6">
              <p className="text-lg text-gray-500 mb-4">No steps added yet</p>
              <Button onClick={addStep} className="bg-green-700 hover:bg-green-800 text-white">
                <Plus className="mr-2 h-5 w-5" />
                Add First Step
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-6 mb-6">
                {recipeSteps.map((step, index) => (
                  <StepField key={step.id} index={index} step={step} onUpdate={updateStep} onRemove={removeStep} />
                ))}
              </div>

              <Button onClick={addStep} className="mb-8 bg-green-700 hover:bg-green-800 text-white">
                <Plus className="mr-2 h-5 w-5" />
                Add Another Step
              </Button>
            </>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-lg font-medium h-auto"
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-5 w-5" />
              {isSubmitting ? "Saving..." : recipe ? "Update Recipe" : "Create Recipe"}
            </Button>
          </div>
        </div>
      </form>
    </main>
  )
}
