"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"
import { createRecipe, updateRecipe } from "@/lib/api/recipes"
import type { Recipe, Ingredient } from "@/lib/types"
import { validateQuantity } from "@/lib/utils/validation"

interface UseRecipeFormProps {
  initialRecipe?: Recipe | null
  onSave: (recipe: Omit<Recipe, "id" | "name">) => Promise<number | void>
  redirectPath: string
}

export function useRecipeForm({ initialRecipe, onSave, redirectPath }: UseRecipeFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch ingredients with React Query
  const {
    data: ingredients = [],
    isLoading: ingredientsLoading,
  } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const response = await fetch("/api/ingredients")
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      return await response.json()
    },
  })

  // Initialize recipe state with default values or existing recipe
  // Add null check for initialRecipe
  const [recipe, setRecipe] = useState<Omit<Recipe, "id" | "name">>({
    menu_item_id: initialRecipe?.menu_item_id || 0,
    standard_serving_pax: initialRecipe?.standard_serving_pax || 1,
    accessibility_notes: initialRecipe?.accessibility_notes || "",
    ingredients:
      initialRecipe?.ingredients?.map((ing) => ({
        id: ing.id,
        ingredient_id: ing.ingredient_id,
        name: ing.name,
        quantity: ing.quantity,
        custom: ing.ingredient_id === null,
      })) || [],
    steps:
      initialRecipe?.steps?.map((step) => ({
        id: step.id,
        step_number: step.step_number,
        instruction: step.instruction,
        image_url: step.image_url || "",
        audio_url: step.audio_url || "",
      })) || [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [menuItemId, setMenuItemId] = useState<number | null>(initialRecipe?.menu_item_id || null)
  const [standardServingPax, setStandardServingPax] = useState(initialRecipe?.standard_serving_pax || 1)
  const [accessibilityNotes, setAccessibilityNotes] = useState(initialRecipe?.accessibility_notes || "")
  const [recipeIngredients, setRecipeIngredients] = useState<
    Array<{
      id: number
      ingredient_id: number | null
      name: string
      quantity: string
      custom: boolean
    }>
  >(
    initialRecipe?.ingredients.map((ingredient) => ({
      id: ingredient.id,
      ingredient_id: ingredient.ingredient_id,
      name: ingredient.name,
      quantity: ingredient.quantity,
      custom: !ingredient.ingredient_id,
    })) || [],
  )
  const [recipeSteps, setRecipeSteps] = useState<
    Array<{
      id: number
      step_number: number
      instruction: string
      image_url: string
      audio_url: string
    }>
  >(
    initialRecipe?.steps.map((step) => ({
      id: step.id,
      step_number: step.step_number,
      instruction: step.instruction,
      image_url: step.image_url || "",
      audio_url: step.audio_url || "",
    })) || [],
  )

  const updateRecipeField = useCallback((field: keyof Omit<Recipe, "id" | "name">, value: any) => {
    setRecipe((prevRecipe) => ({ ...prevRecipe, [field]: value }))
  }, [])

  // Add a new empty ingredient
  const addIngredient = () => {
    const newIngredient = {
      id: Date.now(),
      ingredient_id: null,
      name: "",
      quantity: "",
      custom: false, // Default to inventory ingredient
    }
    setRecipe((prevRecipe) => ({
      ...prevRecipe,
      ingredients: [...prevRecipe.ingredients, newIngredient],
    }))
  }

  // Update an ingredient field
  const updateIngredient = (index: number, field: string, value: any) => {
    setRecipe((prevRecipe) => {
      const updatedIngredients = [...prevRecipe.ingredients]
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value,
      }
      return { ...prevRecipe, ingredients: updatedIngredients }
    })
  }

  // Handle ingredient selection
  const handleIngredientSelect = (index: number, value: string) => {
    setRecipe((prevRecipe) => {
      const updatedIngredients = [...prevRecipe.ingredients]

      if (value === "custom") {
        // Switch to custom ingredient
        updatedIngredients[index] = {
          ...updatedIngredients[index],
          ingredient_id: null,
          custom: true,
        }
      } else {
        // Select inventory ingredient
        const ingredientId = Number.parseInt(value, 10)
        const selectedIngredient = ingredients.find((i) => i.id === ingredientId)

        updatedIngredients[index] = {
          ...updatedIngredients[index],
          ingredient_id: ingredientId,
          name: selectedIngredient?.name || "",
          custom: false,
        }
      }

      return { ...prevRecipe, ingredients: updatedIngredients }
    })
  }

  // Toggle between custom and inventory ingredient
  const toggleCustomIngredient = (index: number, isCustom: boolean) => {
    setRecipe((prevRecipe) => {
      const updatedIngredients = [...prevRecipe.ingredients]

      updatedIngredients[index] = {
        ...updatedIngredients[index],
        custom: isCustom,
        ingredient_id: isCustom ? null : updatedIngredients[index].ingredient_id,
      }

      return { ...prevRecipe, ingredients: updatedIngredients }
    })
  }

  // Remove an ingredient
  const removeIngredient = (index: number) => {
    setRecipe((prevRecipe) => {
      const updatedIngredients = [...prevRecipe.ingredients]
      updatedIngredients.splice(index, 1)
      return { ...prevRecipe, ingredients: updatedIngredients }
    })
  }

  // Add a new empty step
  const addStep = () => {
    const newStepNumber = recipe.steps.length > 0 ? Math.max(...recipe.steps.map((s) => s.step_number)) + 1 : 1
    const newStep = {
      id: Date.now(),
      step_number: newStepNumber,
      instruction: "",
      image_url: "",
      audio_url: "",
    }
    setRecipe((prevRecipe) => ({ ...prevRecipe, steps: [...prevRecipe.steps, newStep] }))
  }

  // Update a step field
  const updateStep = (index: number, field: string, value: any) => {
    setRecipe((prevRecipe) => {
      const updatedSteps = [...prevRecipe.steps]
      updatedSteps[index] = {
        ...updatedSteps[index],
        [field]: value,
      }
      return { ...prevRecipe, steps: updatedSteps }
    })
  }

  // Remove a step
  const removeStep = (index: number) => {
    setRecipe((prevRecipe) => {
      const updatedSteps = [...prevRecipe.steps]
      updatedSteps.splice(index, 1)

      // Renumber remaining steps
      updatedSteps.forEach((step, i) => {
        step.step_number = i + 1
      })

      return { ...prevRecipe, steps: updatedSteps }
    })
  }

  // Validate the form
  const validateForm = (): boolean => {
    if (!recipe.menu_item_id) {
      toast({
        variant: "destructive",
        title: "Menu item required",
        description: "Please select a menu item for this recipe.",
      })
      return false
    }

    if (recipe.standard_serving_pax <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid serving size",
        description: "Standard serving size must be at least 1.",
      })
      return false
    }

    if (recipe.ingredients.length === 0) {
      toast({
        variant: "destructive",
        title: "Ingredients required",
        description: "Please add at least one ingredient to the recipe.",
      })
      return false
    }

    // Check for empty or invalid ingredients
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ingredient = recipe.ingredients[i]

      if (ingredient.custom && !ingredient.name.trim()) {
        toast({
          variant: "destructive",
          title: "Invalid ingredient",
          description: `Custom ingredient #${i + 1} needs a name.`,
        })
        return false
      }

      if (!ingredient.custom && !ingredient.ingredient_id) {
        toast({
          variant: "destructive",
          title: "Invalid ingredient",
          description: `Ingredient #${i + 1} needs to be selected from inventory.`,
        })
        return false
      }

      if (!ingredient.quantity.trim()) {
        toast({
          variant: "destructive",
          title: "Invalid quantity",
          description: `Ingredient #${i + 1} needs a quantity.`,
        })
        return false
      }

      if (!ingredient.custom && !validateQuantity(ingredient.quantity, ingredient.ingredient_id, ingredients)) {
        toast({
          variant: "destructive",
          title: "Invalid quantity format",
          description: `Ingredient #${i + 1} has an invalid quantity format.`,
        })
        return false
      }
    }

    if (recipe.steps.length === 0) {
      toast({
        variant: "destructive",
        title: "Steps required",
        description: "Please add at least one step to the recipe.",
      })
      return false
    }

    // Check for empty steps
    for (let i = 0; i < recipe.steps.length; i++) {
      if (!recipe.steps[i].instruction.trim()) {
        toast({
          variant: "destructive",
          title: "Invalid step",
          description: `Step #${i + 1} needs instructions.`,
        })
        return false
      }
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSave(recipe)
      router.push(redirectPath)
    } catch (e: any) {
      setError(e.message || "An error occurred while saving the recipe.")
    } finally {
      setLoading(false)
    }
  }

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare recipe data
      const recipeData: Omit<Recipe, "id" | "name"> = {
        menu_item_id: menuItemId!,
        standard_serving_pax: standardServingPax,
        accessibility_notes: accessibilityNotes,
        ingredients: recipeIngredients.map((ingredient) => ({
          id: ingredient.id,
          recipe_id: initialRecipe?.id || 0,
          ingredient_id: ingredient.ingredient_id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          quantity_for_recipe: 0, // This will be calculated in the API
        })),
        steps: recipeSteps.map((step) => ({
          id: step.id,
          recipe_id: initialRecipe?.id || 0,
          step_number: step.step_number,
          instruction: step.instruction,
          image_url: step.image_url,
          audio_url: step.audio_url,
        })),
      }

      if (initialRecipe) {
        // Update existing recipe
        await updateRecipe(initialRecipe.id, recipeData)
        toast({
          title: "Recipe updated",
          description: "Your recipe has been updated successfully.",
        })
      } else {
        // Create new recipe
        const newRecipeId = await createRecipe(recipeData)
        toast({
          title: "Recipe created",
          description: "Your new recipe has been created successfully.",
        })

        // Redirect to the new recipe page
        router.push(`/recipes/${newRecipeId}`)
        return
      }

      // Redirect to the recipe page
      router.push(initialRecipe ? `/recipes/${initialRecipe.id}` : "/")
    } catch (error) {
      console.error("Error saving recipe:", error)
      toast({
        variant: "destructive",
        title: "Error saving recipe",
        description: "There was an error saving your recipe. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Initialize with one empty ingredient and step if creating a new recipe
  useEffect(() => {
    if (!initialRecipe) {
      if (recipe.ingredients.length === 0) {
        addIngredient()
      }
      if (recipe.steps.length === 0) {
        addStep()
      }
    }
  }, [initialRecipe, recipe.ingredients, recipe.steps])

  return {
    recipe,
    loading: loading || ingredientsLoading,
    error,
    ingredients,
    updateRecipeField,
    updateIngredient,
    updateStep,
    addIngredient,
    removeIngredient,
    addStep,
    removeStep,
    handleIngredientSelect,
    toggleCustomIngredient,
    handleSave,
    menuItemId,
    setMenuItemId,
    standardServingPax,
    setStandardServingPax,
    accessibilityNotes,
    setAccessibilityNotes,
    recipeIngredients,
    isSubmitting,
    handleSubmit,
    recipeSteps,
  }
}
