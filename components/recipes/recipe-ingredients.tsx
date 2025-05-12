import type { RecipeIngredient } from "@/lib/types"

interface RecipeIngredientsProps {
  ingredients: RecipeIngredient[]
  textSize?: string
}

// Format quantity with space between number and unit
function formatQuantity(quantity: string): string {
  // Extract numeric part and unit part
  const numericMatch = quantity.match(/^[\d.]+/)
  const unitMatch = quantity.match(/[^\d.]+$/)

  if (numericMatch && unitMatch) {
    return `${numericMatch[0]} ${unitMatch[0]}`
  }

  return quantity
}

export default function RecipeIngredients({ ingredients, textSize = "normal" }: RecipeIngredientsProps) {
  // Apply text size classes based on the current text size
  const getTextSizeClass = () => {
    switch (textSize) {
      case "large":
        return "text-xl"
      case "x-large":
        return "text-2xl"
      default:
        return "text-lg"
    }
  }

  const textClass = getTextSizeClass()

  if (ingredients.length === 0) {
    return <p className={`${textClass} text-gray-500`}>No ingredients available for this recipe.</p>
  }

  return (
    <ul className="space-y-3">
      {ingredients.map((ingredient) => (
        <li key={ingredient.id} className={`${textClass} text-gray-800 flex justify-between`}>
          <span className="font-medium">{ingredient.name}</span>
          <span>{formatQuantity(ingredient.quantity)}</span>
        </li>
      ))}
    </ul>
  )
}
