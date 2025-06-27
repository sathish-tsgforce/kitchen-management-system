"use client"

import { useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { useRecipes } from "@/lib/hooks/use-recipes"
import { Skeleton } from "@/components/ui/skeleton"
import { useTextSize } from "@/lib/context/text-size-context"

export default function RecipeList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const { data: recipes = [], isLoading, error, refetch } = useRecipes()
  const { textSize } = useTextSize()

  // Helper function to get text size classes
  const getTextSizeClasses = () => {
    switch (textSize) {
      case "large":
        return {
          cardTitle: "text-3xl",
          cardDescription: "text-xl",
          cardLink: "text-xl",
          errorTitle: "text-3xl",
          errorDescription: "text-xl",
          button: "text-xl",
        }
      case "x-large":
        return {
          cardTitle: "text-4xl",
          cardDescription: "text-2xl",
          cardLink: "text-2xl",
          errorTitle: "text-4xl",
          errorDescription: "text-2xl",
          button: "text-2xl",
        }
      default:
        return {
          cardTitle: "text-2xl",
          cardDescription: "text-lg",
          cardLink: "text-lg",
          errorTitle: "text-2xl",
          errorDescription: "text-lg",
          button: "text-lg",
        }
    }
  }

  const textClasses = getTextSizeClasses()

  // Refetch on mount to ensure we have the latest data
  useEffect(() => {
    refetch()
  }, [refetch])

  // Filter recipes based on search query - memoized to prevent unnecessary recalculations
  const filteredRecipes = useMemo(() => {
    return searchQuery
      ? recipes.filter((recipe) => recipe.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : recipes
  }, [recipes, searchQuery])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-2 border-gray-200">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-6 w-2/3" />
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Skeleton className="h-6 w-1/3" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-12 border-2 border-red-200 rounded-lg bg-red-50">
        <h3 className={`font-bold text-red-700 mb-2 ${textClasses.errorTitle}`}>Error loading recipes</h3>
        <p className={`text-red-600 mb-6 ${textClasses.errorDescription}`}>
          There was an error loading the recipes. Please try refreshing the page.
        </p>
      </div>
    )
  }

  if (filteredRecipes.length === 0) {
    return (
      <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className={`font-bold text-gray-700 mb-2 ${textClasses.errorTitle}`}>No recipes found</h3>
        <p className={`text-gray-600 mb-6 ${textClasses.errorDescription}`}>
          {searchQuery ? `No recipes match "${searchQuery}"` : "There are no recipes available yet"}
        </p>
        <Link
          href="/recipes/new"
          className={`bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-medium inline-block focus:outline-none focus:ring-4 focus:ring-green-300 ${textClasses.button}`}
        >
          Create New Recipe
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredRecipes.map((recipe) => (
        <Card key={recipe.id} className="border-2 border-gray-200 hover:border-green-500 transition-colors">
          <CardContent className="p-6">
            <h3 className={`font-bold text-gray-900 mb-2 ${textClasses.cardTitle}`}>{recipe.name}</h3>
            <p className={`text-gray-700 mb-4 ${textClasses.cardDescription}`}>
              Standard serving: {recipe.standard_serving_pax} {recipe.standard_serving_pax === 1 ? "person" : "people"}
            </p>
            <p className={`text-gray-700 ${textClasses.cardDescription}`}>
              {recipe.ingredients.length} ingredients • {recipe.steps.length} steps
            </p>
          </CardContent>
          <CardFooter className="p-6 pt-0 flex justify-between">
            <Link
              href={`/recipes/${recipe.id}`}
              className={`text-green-700 hover:text-green-800 font-medium flex items-center focus:outline-none focus:underline ${textClasses.cardLink}`}
              aria-label={`View ${recipe.name} recipe details`}
            >
              View Details
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
            <Link
              href={`/recipes/${recipe.id}/calculator`}
              className={`text-blue-700 hover:text-blue-800 font-medium flex items-center focus:outline-none focus:underline ${textClasses.cardLink}`}
              aria-label={`Calculate quantities for ${recipe.name}`}
            >
              Calculator
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
