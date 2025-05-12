import { supabase } from "../supabase"

// Simple function to check if an order has sufficient inventory
export async function checkOrderInventory(orderId: number): Promise<{
  isOk: boolean
  missingIngredients: { name: string; available: number; required: number; unit: string }[]
}> {
  try {
    // Get order items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("menu_item_id, quantity")
      .eq("order_id", orderId)

    if (orderItemsError) throw orderItemsError
    if (!orderItems || orderItems.length === 0) {
      return { isOk: true, missingIngredients: [] }
    }

    // Get recipes for these menu items
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("id, menu_item_id")
      .in(
        "menu_item_id",
        orderItems.map((item) => item.menu_item_id),
      )

    if (recipesError) throw recipesError
    if (!recipes || recipes.length === 0) {
      return { isOk: true, missingIngredients: [] }
    }

    // Map menu items to recipes
    const menuItemToRecipe = recipes.reduce(
      (map, recipe) => {
        map[recipe.menu_item_id] = recipe.id
        return map
      },
      {} as Record<number, number>,
    )

    // Get recipe ingredients
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_id, quantity_for_recipe")
      .in(
        "recipe_id",
        recipes.map((recipe) => recipe.id),
      )

    if (ingredientsError) throw ingredientsError
    if (!recipeIngredients || recipeIngredients.length === 0) {
      return { isOk: true, missingIngredients: [] }
    }

    // Get current inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from("ingredients")
      .select("id, name, quantity, unit")
      .in("id", [...new Set(recipeIngredients.map((ri) => ri.ingredient_id))])

    if (inventoryError) throw inventoryError
    if (!inventory) {
      return { isOk: false, missingIngredients: [] }
    }

    // Map ingredients to inventory
    const inventoryMap = inventory.reduce(
      (map, item) => {
        map[item.id] = { quantity: item.quantity, name: item.name, unit: item.unit || "" }
        return map
      },
      {} as Record<number, { quantity: number; name: string; unit: string }>,
    )

    // Calculate required ingredients
    const requiredIngredients: Record<number, number> = {}

    for (const orderItem of orderItems) {
      const recipeId = menuItemToRecipe[orderItem.menu_item_id]
      if (!recipeId) continue

      const ingredients = recipeIngredients.filter((ri) => ri.recipe_id === recipeId)
      for (const ingredient of ingredients) {
        const requiredQuantity = ingredient.quantity_for_recipe * orderItem.quantity
        requiredIngredients[ingredient.ingredient_id] =
          (requiredIngredients[ingredient.ingredient_id] || 0) + requiredQuantity
      }
    }

    // Check if we have enough inventory
    const missingIngredients = []
    let isOk = true

    for (const [ingredientId, requiredQuantity] of Object.entries(requiredIngredients)) {
      const id = Number(ingredientId)
      const inventoryItem = inventoryMap[id]

      if (!inventoryItem || inventoryItem.quantity < requiredQuantity) {
        isOk = false
        missingIngredients.push({
          name: inventoryItem?.name || `Ingredient #${id}`,
          available: inventoryItem?.quantity || 0,
          required: requiredQuantity,
          unit: inventoryItem?.unit || "",
        })
      }
    }

    return { isOk, missingIngredients }
  } catch (error) {
    console.error("Error checking inventory:", error)
    return { isOk: false, missingIngredients: [] }
  }
}

// Function to update inventory when an order is accepted
export async function updateInventoryForOrder(orderId: number, isIncrement = false): Promise<boolean> {
  try {
    // Get order items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("menu_item_id, quantity")
      .eq("order_id", orderId)

    if (orderItemsError) throw orderItemsError
    if (!orderItems || orderItems.length === 0) return true

    // Get recipes for these menu items
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("id, menu_item_id")
      .in(
        "menu_item_id",
        orderItems.map((item) => item.menu_item_id),
      )

    if (recipesError) throw recipesError
    if (!recipes || recipes.length === 0) return true

    // Map menu items to recipes
    const menuItemToRecipe = recipes.reduce(
      (map, recipe) => {
        map[recipe.menu_item_id] = recipe.id
        return map
      },
      {} as Record<number, number>,
    )

    // Get recipe ingredients
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_id, quantity_for_recipe")
      .in(
        "recipe_id",
        recipes.map((recipe) => recipe.id),
      )

    if (ingredientsError) throw ingredientsError
    if (!recipeIngredients || recipeIngredients.length === 0) return true

    // Calculate required ingredients
    const ingredientQuantities: Record<number, number> = {}

    for (const orderItem of orderItems) {
      const recipeId = menuItemToRecipe[orderItem.menu_item_id]
      if (!recipeId) continue

      const ingredients = recipeIngredients.filter((ri) => ri.recipe_id === recipeId)
      for (const ingredient of ingredients) {
        const requiredQuantity = ingredient.quantity_for_recipe * orderItem.quantity
        ingredientQuantities[ingredient.ingredient_id] =
          (ingredientQuantities[ingredient.ingredient_id] || 0) + requiredQuantity
      }
    }

    // Update inventory for each ingredient
    for (const [ingredientId, quantity] of Object.entries(ingredientQuantities)) {
      const id = Number(ingredientId)

      // Get current quantity
      const { data: currentIngredient, error: getError } = await supabase
        .from("ingredients")
        .select("quantity")
        .eq("id", id)
        .single()

      if (getError) throw getError
      if (!currentIngredient) continue

      // Calculate new quantity
      const newQuantity = isIncrement ? currentIngredient.quantity + quantity : currentIngredient.quantity - quantity

      // Update quantity
      const { error: updateError } = await supabase.from("ingredients").update({ quantity: newQuantity }).eq("id", id)

      if (updateError) throw updateError
    }

    return true
  } catch (error) {
    console.error("Error updating inventory:", error)
    return false
  }
}
