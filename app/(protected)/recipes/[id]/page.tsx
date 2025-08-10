import { Suspense } from "react"
import { notFound } from "next/navigation"
import RecipeDetails from "@/components/recipes/recipe-details"
import RecipeDetailsSkeleton from "@/components/recipes/recipe-details-skeleton"

interface RecipePageProps {
  params: {
    id: string
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params
  const recipeId = Number.parseInt(id, 10)

  if (isNaN(recipeId)) {
    notFound()
  }

  return (
    <Suspense fallback={<RecipeDetailsSkeleton />}>
      <RecipeDetails recipeId={recipeId} />
    </Suspense>
  )
}
