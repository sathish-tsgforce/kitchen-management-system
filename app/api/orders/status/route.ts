import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { orderId, newStatus, restoreInventory } = await request.json()

    if (!orderId || !newStatus) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // If accepting an order, check inventory first
    if (newStatus === "accepted") {
      const inventoryResult = await checkOrderInventory(orderId)

      if (!inventoryResult.isOk) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient inventory",
            missingIngredients: inventoryResult.missingIngredients,
          },
          { status: 400 },
        )
      }

      // Update inventory in the background
      updateInventory(orderId, "decrement").catch((err) => {
        console.error("Error updating inventory:", err)
      })
    }

    // If reverting to pending and restoring inventory
    if (newStatus === "pending" && restoreInventory) {
      // Update inventory in the background
      updateInventory(orderId, "increment").catch((err) => {
        console.error("Error restoring inventory:", err)
      })
    }

    // Update order status
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Server-side inventory check
async function checkOrderInventory(orderId: number) {
  try {
    // Fetch order items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("menu_item_id, quantity")
      .eq("order_id", orderId)

    if (orderItemsError) throw orderItemsError
    if (!orderItems || orderItems.length === 0) {
      return { isOk: true, missingIngredients: [] }
    }

    // Get all menu item IDs
    const menuItemIds = orderItems.map((item) => item.menu_item_id)

    // Fetch recipes for these menu items
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("id, menu_item_id")
      .in("menu_item_id", menuItemIds)

    if (recipesError) throw recipesError
    if (!recipes || recipes.length === 0) {
      return { isOk: true, missingIngredients: [] }
    }

    // Create a map of menu item ID to recipe ID
    const menuItemToRecipe = recipes.reduce(
      (map, recipe) => {
        map[recipe.menu_item_id] = recipe.id
        return map
      },
      {} as Record<number, number>,
    )

    // Get all recipe IDs
    const recipeIds = recipes.map((recipe) => recipe.id)

    // Fetch recipe ingredients
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_id, quantity_for_recipe")
      .in("recipe_id", recipeIds)

    if (ingredientsError) throw ingredientsError
    if (!recipeIngredients || recipeIngredients.length === 0) {
      return { isOk: true, missingIngredients: [] }
    }

    // Get all ingredient IDs
    const ingredientIds = [...new Set(recipeIngredients.map((ri) => ri.ingredient_id))]

    // Fetch current inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from("ingredients")
      .select("id, name, quantity, unit")
      .in("id", ingredientIds)

    if (inventoryError) throw inventoryError
    if (!inventory) {
      return { isOk: false, missingIngredients: [] }
    }

    // Create a map of ingredient ID to inventory
    const inventoryMap = inventory.reduce(
      (map, item) => {
        map[item.id] = { quantity: item.quantity, name: item.name, unit: item.unit }
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
      const id = Number.parseInt(ingredientId)
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

// Server-side inventory update
async function updateInventory(orderId: number, action: "increment" | "decrement") {
  try {
    // Fetch order items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("menu_item_id, quantity")
      .eq("order_id", orderId)

    if (orderItemsError) throw orderItemsError
    if (!orderItems || orderItems.length === 0) return

    // Get all menu item IDs
    const menuItemIds = orderItems.map((item) => item.menu_item_id)

    // Fetch recipes for these menu items
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("id, menu_item_id")
      .in("menu_item_id", menuItemIds)

    if (recipesError) throw recipesError
    if (!recipes || recipes.length === 0) return

    // Create a map of menu item ID to recipe ID
    const menuItemToRecipe = recipes.reduce(
      (map, recipe) => {
        map[recipe.menu_item_id] = recipe.id
        return map
      },
      {} as Record<number, number>,
    )

    // Get all recipe IDs
    const recipeIds = recipes.map((recipe) => recipe.id)

    // Fetch recipe ingredients
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_id, quantity_for_recipe")
      .in("recipe_id", recipeIds)

    if (ingredientsError) throw ingredientsError
    if (!recipeIngredients || recipeIngredients.length === 0) return

    // Update inventory for each ingredient
    for (const orderItem of orderItems) {
      const recipeId = menuItemToRecipe[orderItem.menu_item_id]
      if (!recipeId) continue

      const ingredients = recipeIngredients.filter((ri) => ri.recipe_id === recipeId)

      for (const ingredient of ingredients) {
        const quantityChange = ingredient.quantity_for_recipe * orderItem.quantity

        // Use the database function to update inventory
        const { error } = await supabase.rpc(
          action === "decrement" ? "decrement_ingredient_quantity" : "increment_ingredient_quantity",
          {
            ingredient_id: ingredient.ingredient_id,
            quantity_to_change: quantityChange,
          },
        )

        if (error) {
          console.error(`Error ${action}ing ingredient ${ingredient.ingredient_id}:`, error)
        }
      }
    }
  } catch (error) {
    console.error(`Error ${action}ing inventory:`, error)
  }
}
