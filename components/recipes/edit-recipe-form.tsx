"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchRecipeById, updateRecipe } from "@/lib/api/recipes"
import { fetchIngredients } from "@/lib/api/ingredients"
import { fetchMenuItems } from "@/lib/api/menu-items"
import RecipeForm from "@/components/recipes/recipe-form/recipe-form"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"

interface EditRecipeFormProps {
  recipeId: number
}

export default function EditRecipeForm({ recipeId }: EditRecipeFormProps) {
  const router = useRouter()
  const [recipe, setRecipe] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [recipeData, ingredientsData, menuItemsData] = await Promise.all([
          fetchRecipeById(recipeId),
          fetchIngredients(),
          fetchMenuItems(),
        ])

        if (!recipeData) {
          throw new Error("Recipe not found")
        }

        setRecipe(recipeData)
        setIngredients(ingredientsData)
        setMenuItems(menuItemsData)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load recipe data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [recipeId])

  const handleSave = async (recipeData) => {
    try {
      setIsSubmitting(true)
      await updateRecipe(recipeId, recipeData)
      toast({
        title: "Recipe updated",
        description: "Your recipe has been updated successfully.",
      })
      router.push(`/recipes/${recipeId}`)
    } catch (err) {
      console.error("Error updating recipe:", err)
      toast({
        variant: "destructive",
        title: "Error updating recipe",
        description: err.message || "Failed to update recipe. Please try again.",
      })
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.push("/recipes")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Return to Recipes
        </button>
      </div>
    )
  }

  return (
    <RecipeForm
      recipe={recipe}
      ingredients={ingredients}
      menuItems={menuItems}
      onSave={handleSave}
      backUrl={`/recipes/${recipeId}`}
      title={`Edit Recipe: ${recipe.name}`}
      isSubmitting={isSubmitting}
    />
  )
}
