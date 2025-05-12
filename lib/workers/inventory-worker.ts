// This is a mock background worker for inventory updates
// In a real application, you would use a proper background job system

import { supabase } from "../supabase"

export async function updateInventoryInBackground(orderId: number, action: "decrement" | "increment") {
  try {
    // Fetch the order
    const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError) throw orderError

    // Fetch order items
    const { data: orderItemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)

    if (itemsError) throw itemsError

    // For each order item, find the recipe and update ingredients
    for (const item of orderItemsData) {
      // Find recipe for menu item
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("menu_item_id", item.menu_item_id)
        .single()

      if (recipeError) continue // Skip if recipe not found

      if (recipeData) {
        // Find recipe ingredients
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .select("*")
          .eq("recipe_id", recipeData.id)

        if (ingredientsError) continue

        // Update each ingredient
        for (const ingredient of ingredientsData) {
          const quantityChange = ingredient.quantity_for_recipe * item.quantity

          if (action === "decrement") {
            // Decrement inventory
            await supabase.rpc("decrement_ingredient_quantity", {
              ingredient_id: ingredient.ingredient_id,
              quantity_to_decrement: quantityChange,
            })
          } else {
            // Increment inventory
            await supabase
              .from("ingredients")
              .update({
                quantity: supabase.raw(`quantity + ${quantityChange}`),
              })
              .eq("id", ingredient.ingredient_id)
          }
        }
      }
    }

    console.log(`Inventory updated for order ${orderId}`)
    return true
  } catch (err) {
    console.error("Error updating inventory:", err)
    return false
  }
}
