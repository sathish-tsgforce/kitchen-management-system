import { Suspense } from "react"
import { notFound } from "next/navigation"
import RecipeDetails from "@/components/recipes/recipe-details"
import RecipeDetailsSkeleton from "@/components/recipes/recipe-details-skeleton"

interface RecipePageProps {
  params: {
    id: string
  }
}

export default function RecipePage({ params }: RecipePageProps) {
  const recipeId = Number.parseInt(params.id, 10)

  if (isNaN(recipeId)) {
    notFound()
  }

  return (
    <Suspense fallback={<RecipeDetailsSkeleton />}>
      <RecipeDetails recipeId={recipeId} />
    </Suspense>
  )
}
