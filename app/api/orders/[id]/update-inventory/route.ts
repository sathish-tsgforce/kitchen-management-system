import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number.parseInt(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 })
    }

    const body = await request.json()
    const action = body.action // "increment" or "decrement"

    if (action !== "increment" && action !== "decrement") {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // Fetch order items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("menu_item_id, quantity")
      .eq("order_id", orderId)

    if (orderItemsError) {
      console.error("Error fetching order items:", orderItemsError)
      return NextResponse.json({ success: false, error: orderItemsError.message }, { status: 500 })
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ success: true, message: "No items to update" })
    }

    // Get all menu item IDs
    const menuItemIds = orderItems.map((item) => item.menu_item_id)

    // Fetch recipes for these menu items
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("id, menu_item_id")
      .in("menu_item_id", menuItemIds)

    if (recipesError) {
      console.error("Error fetching recipes:", recipesError)
      return NextResponse.json({ success: false, error: recipesError.message }, { status: 500 })
    }

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ success: true, message: "No recipes found for menu items" })
    }

    // Create a map of menu item ID to recipe ID
    const menuItemToRecipe = recipes.reduce((map, recipe) => {
      map[recipe.menu_item_id] = recipe.id
      return map
    }, {})

    // Get all recipe IDs
    const recipeIds = recipes.map((recipe) => recipe.id)

    // Fetch recipe ingredients
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_id, quantity_for_recipe")
      .in("recipe_id", recipeIds)

    if (ingredientsError) {
      console.error("Error fetching recipe ingredients:", ingredientsError)
      return NextResponse.json({ success: false, error: ingredientsError.message }, { status: 500 })
    }

    if (!recipeIngredients || recipeIngredients.length === 0) {
      return NextResponse.json({ success: true, message: "No ingredients found for recipes" })
    }

    // Calculate required quantities for each ingredient
    const ingredientQuantities = {}
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

    // Update each ingredient quantity
    const updateResults = []
    for (const [ingredientId, quantity] of Object.entries(ingredientQuantities)) {
      const id = Number.parseInt(ingredientId)

      // Get current quantity
      const { data: currentIngredient, error: getError } = await supabase
        .from("ingredients")
        .select("quantity")
        .eq("id", id)
        .single()

      if (getError) {
        console.error(`Error getting ingredient ${id}:`, getError)
        updateResults.push({ id, success: false, error: getError.message })
        continue
      }

      if (!currentIngredient) {
        updateResults.push({ id, success: false, error: "Ingredient not found" })
        continue
      }

      // Calculate new quantity
      const newQuantity =
        action === "decrement"
          ? Math.max(0, currentIngredient.quantity - quantity) // Don't go below 0
          : currentIngredient.quantity + quantity

      // Update quantity
      const { error: updateError } = await supabase.from("ingredients").update({ quantity: newQuantity }).eq("id", id)

      if (updateError) {
        console.error(`Error updating ingredient ${id}:`, updateError)
        updateResults.push({ id, success: false, error: updateError.message })
      } else {
        updateResults.push({ id, success: true, newQuantity })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Inventory ${action === "decrement" ? "decremented" : "incremented"} successfully`,
      results: updateResults,
    })
  } catch (error) {
    console.error("Error updating inventory:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
