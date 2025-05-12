import type { Ingredient } from "@/lib/types"

export function validateQuantity(
  quantity: string,
  ingredientId: number | null,
  availableIngredients: Ingredient[],
): boolean {
  if (!quantity) return false

  // For custom ingredients, just make sure there's something
  if (ingredientId === null) return true

  // For inventory ingredients, check if the unit is included
  const ingredient = availableIngredients.find((i) => i.id === ingredientId)
  if (!ingredient) return false

  // Simple validation: check if the quantity includes the unit
  // This is a basic check and could be improved
  const unit = ingredient.unit.toLowerCase()
  return true // For now, let's accept any quantity format
}
