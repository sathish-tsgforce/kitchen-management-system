import { Suspense } from "react"
import { notFound } from "next/navigation"
import EditRecipeForm from "@/components/recipes/edit-recipe-form"

interface EditRecipePageProps {
  params: {
    id: string
  }
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const recipeId = Number.parseInt(params.id, 10)

  if (isNaN(recipeId)) {
    notFound()
  }

  return (
    <Suspense fallback={<div>Loading recipe...</div>}>
      <EditRecipeForm recipeId={recipeId} />
    </Suspense>
  )
}
