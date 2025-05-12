"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import RecipeForm from "./recipe-form/recipe-form"
import { createRecipe, fetchRecipeByMenuItemId } from "@/lib/api/recipes"
import { fetchIngredients } from "@/lib/api/ingredients"
import { fetchMenuItems } from "@/lib/api/menu-items"
import type { Ingredient, MenuItem, Recipe } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function NewRecipeForm() {
  const router = useRouter()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create an empty recipe template
  const emptyRecipe: Recipe = {
    id: 0,
    menu_item_id: 0,
    name: "",
    standard_serving_pax: 1,
    accessibility_notes: "",
    ingredients: [],
    steps: [],
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [ingredientsData, menuItemsData] = await Promise.all([fetchIngredients(), fetchMenuItems()])
        setIngredients(ingredientsData)
        setMenuItems(menuItemsData)
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Could not load ingredients or menu items. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSave = async (recipeData: Omit<Recipe, "id" | "name">) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Check if a recipe already exists for this menu item
      const existingRecipe = await fetchRecipeByMenuItemId(recipeData.menu_item_id)

      if (existingRecipe) {
        setError(
          `A recipe already exists for this menu item (${existingRecipe.name}). Please edit the existing recipe or choose a different menu item.`,
        )
        return
      }

      const newRecipeId = await createRecipe(recipeData)

      toast({
        title: "Recipe created",
        description: "Your new recipe has been created successfully.",
      })

      router.push(`/recipes/${newRecipeId}`)
      return newRecipeId
    } catch (error: any) {
      console.error("Error creating recipe:", error)
      setError(error.message || "There was an error creating your recipe. Please try again.")
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/recipes")} variant="outline">
          Return to Recipes
        </Button>
      </div>
    )
  }

  return (
    <RecipeForm
      recipe={emptyRecipe}
      ingredients={ingredients}
      menuItems={menuItems}
      onSave={handleSave}
      backUrl="/recipes"
      title="Create New Recipe"
      isLoading={isLoading}
      isSubmitting={isSubmitting}
    />
  )
}
