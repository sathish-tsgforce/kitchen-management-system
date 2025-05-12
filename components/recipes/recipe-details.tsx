"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calculator, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import RecipeIngredients from "@/components/recipes/recipe-ingredients"
import RecipeSteps from "@/components/recipes/recipe-steps"
import DeleteRecipeButton from "@/components/recipes/delete-recipe-button"
import { fetchRecipeById } from "@/lib/api/recipes"
import { useTextSize } from "@/lib/context/text-size-context"
import { TextSizeControls } from "@/components/accessibility/text-size-controls"

interface RecipeDetailsProps {
  recipeId: number
}

export default function RecipeDetails({ recipeId }: RecipeDetailsProps) {
  const router = useRouter()
  const [recipe, setRecipe] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { textSize } = useTextSize()

  useEffect(() => {
    const getRecipe = async () => {
      try {
        setIsLoading(true)
        const data = await fetchRecipeById(recipeId)

        if (!data) {
          throw new Error("Recipe not found")
        }

        setRecipe(data)
      } catch (err) {
        console.error("Error fetching recipe:", err)
        setError(err.message || "Failed to load recipe")
      } finally {
        setIsLoading(false)
      }
    }

    getRecipe()
  }, [recipeId])

  // Apply text size classes based on the current text size
  const getTextSizeClasses = () => {
    switch (textSize) {
      case "large":
        return {
          heading: "text-5xl",
          subheading: "text-3xl",
          body: "text-xl",
          detail: "text-lg",
        }
      case "x-large":
        return {
          heading: "text-6xl",
          subheading: "text-4xl",
          body: "text-2xl",
          detail: "text-xl",
        }
      default:
        return {
          heading: "text-4xl",
          subheading: "text-2xl",
          body: "text-lg",
          detail: "text-base",
        }
    }
  }

  const textClasses = getTextSizeClasses()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <Skeleton className="h-12 w-64" />
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
              <Skeleton className="h-8 w-24 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-6 w-40" />
              </div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <Skeleton className="h-8 w-24 mb-4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <Skeleton className="h-8 w-32 mb-6" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-56" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
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
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/"
          className={`inline-flex items-center ${textClasses.body} text-gray-700 hover:text-gray-900 focus:outline-none focus:underline`}
          aria-label="Back to recipes"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Recipes
        </Link>

        <TextSizeControls />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className={`${textClasses.heading} font-bold text-gray-900`}>{recipe.name}</h1>
        <div className="flex flex-wrap gap-4">
          <Link href={`/recipes/${recipe.id}/calculator`}>
            <Button variant="outline" className="border-blue-700 text-blue-700 hover:bg-blue-50">
              <Calculator className="mr-2 h-5 w-5" />
              <span className={textClasses.detail}>Serving Calculator</span>
            </Button>
          </Link>
          <Link href={`/recipes/${recipe.id}/edit`}>
            <Button variant="outline" className="border-green-700 text-green-700 hover:bg-green-50">
              <Edit className="mr-2 h-5 w-5" />
              <span className={textClasses.detail}>Edit Recipe</span>
            </Button>
          </Link>
          <DeleteRecipeButton recipeId={recipe.id} recipeName={recipe.name} onSuccess={() => router.push("/")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
            <h2 className={`${textClasses.subheading} font-bold text-gray-900 mb-4`}>Details</h2>
            <div className="space-y-4">
              <div>
                <p className={`${textClasses.body} text-gray-700`}>
                  <span className="font-medium">Standard serving:</span> {recipe.standard_serving_pax}{" "}
                  {recipe.standard_serving_pax === 1 ? "person" : "people"}
                </p>
              </div>
              {recipe.accessibility_notes && (
                <div>
                  <p className={`${textClasses.body} font-medium text-gray-900`}>Accessibility Notes:</p>
                  <p className={`${textClasses.body} text-gray-700`}>{recipe.accessibility_notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h2 className={`${textClasses.subheading} font-bold text-gray-900 mb-4`}>Ingredients</h2>
            <RecipeIngredients ingredients={recipe.ingredients} textSize={textSize} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h2 className={`${textClasses.subheading} font-bold text-gray-900 mb-6`}>Preparation Steps</h2>
            <RecipeSteps steps={recipe.steps} textSize={textSize} />
          </div>
        </div>
      </div>
    </main>
  )
}
