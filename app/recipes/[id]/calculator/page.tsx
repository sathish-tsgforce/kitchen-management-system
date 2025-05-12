"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useRecipe } from "@/lib/hooks/use-recipes"
import { notFound, useParams } from "next/navigation"
import RecipeCalculator from "@/components/recipes/recipe-calculator"
import { Skeleton } from "@/components/ui/skeleton"
import { TextSizeControls } from "@/components/accessibility/text-size-controls"
import { useTextSize } from "@/lib/context/text-size-context"

export default function CalculatorPage() {
  const params = useParams()
  const recipeId = Number.parseInt(params.id as string, 10)
  const { textSize } = useTextSize()

  if (isNaN(recipeId)) {
    notFound()
  }

  // Use the cached recipe data from React Query
  const { data: recipe, isLoading, error } = useRecipe(recipeId)

  // Apply text size classes based on the current text size
  const getTextSizeClasses = () => {
    switch (textSize) {
      case "large":
        return {
          heading: "text-5xl",
          subheading: "text-2xl",
          body: "text-xl",
        }
      case "x-large":
        return {
          heading: "text-6xl",
          subheading: "text-3xl",
          body: "text-2xl",
        }
      default:
        return {
          heading: "text-4xl",
          subheading: "text-lg",
          body: "text-lg",
        }
    }
  }

  const textClasses = getTextSizeClasses()

  if (isLoading) {
    return <CalculatorSkeleton />
  }

  if (error || !recipe) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link
          href={`/recipes/${recipe.id}`}
          className={`inline-flex items-center ${textClasses.body} text-gray-700 hover:text-gray-900 focus:outline-none focus:underline`}
          aria-label="Back to recipe"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Recipe
        </Link>

        <TextSizeControls />
      </div>

      <div className="mb-8">
        <h1 className={`${textClasses.heading} font-bold text-gray-900`}>Serving Calculator: {recipe.name}</h1>
        <p className={`${textClasses.subheading} text-gray-600 mt-2`}>
          Adjust the serving size to calculate ingredient quantities
        </p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
        <RecipeCalculator recipe={recipe} />
      </div>
    </main>
  )
}

function CalculatorSkeleton() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="mb-8">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2" />
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-20 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </main>
  )
}
