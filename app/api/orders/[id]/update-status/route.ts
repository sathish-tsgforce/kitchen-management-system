import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number(params.id)
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const { status, restoreInventory = false } = body

    if (!status || typeof status !== "string") {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 })
    }

    // Validate status
    const validStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    // If accepting, check inventory directly with Supabase instead of making an HTTP request
    if (status === "accepted") {
      try {
        // Get order items
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("*, menu_items(recipe_id, name)")
          .eq("order_id", orderId)

        if (itemsError) {
          console.error("Error fetching order items:", itemsError)
          return NextResponse.json({ success: false, error: "Error fetching order items" }, { status: 500 })
        }

        // Get recipe ingredients for each menu item
        const recipeIds = orderItems
          .map((item) => item.menu_items?.recipe_id)
          .filter((id): id is number => id !== null && id !== undefined)

        if (recipeIds.length === 0) {
          // No recipes to check, can proceed
          console.log("No recipes to check for inventory")
        } else {
          // Get all recipe ingredients
          const { data: recipeIngredients, error: ingredientsError } = await supabase
            .from("recipe_ingredients")
            .select("*, ingredients(name, unit)")
            .in("recipe_id", recipeIds)

          if (ingredientsError) {
            console.error("Error fetching recipe ingredients:", ingredientsError)
            return NextResponse.json({ success: false, error: "Error fetching recipe ingredients" }, { status: 500 })
          }

          // Get current inventory
          const { data: inventory, error: inventoryError } = await supabase
            .from("ingredients")
            .select("id, name, quantity, unit")

          if (inventoryError) {
            console.error("Error fetching inventory:", inventoryError)
            return NextResponse.json({ success: false, error: "Error fetching inventory" }, { status: 500 })
          }

          // Calculate required ingredients
          const requiredIngredients: Record<number, number> = {}

          for (const orderItem of orderItems) {
            const recipeId = orderItem.menu_items?.recipe_id
            if (!recipeId) continue

            const quantity = orderItem.quantity || 1
            const recipeIngs = recipeIngredients.filter((ri) => ri.recipe_id === recipeId)

            for (const ri of recipeIngs) {
              if (!ri.ingredient_id) continue
              requiredIngredients[ri.ingredient_id] =
                (requiredIngredients[ri.ingredient_id] || 0) + (ri.quantity || 0) * quantity
            }
          }

          // Check if we have enough inventory
          const missingIngredients = []

          for (const [ingredientId, requiredQty] of Object.entries(requiredIngredients)) {
            const inventoryItem = inventory.find((i) => i.id === Number(ingredientId))
            if (!inventoryItem || inventoryItem.quantity < requiredQty) {
              missingIngredients.push({
                name: inventoryItem?.name || `Ingredient #${ingredientId}`,
                available: inventoryItem?.quantity || 0,
                required: requiredQty,
                unit: inventoryItem?.unit || "",
              })
            }
          }

          if (missingIngredients.length > 0) {
            return NextResponse.json(
              {
                success: false,
                error: "Insufficient inventory",
                missingIngredients,
              },
              { status: 400 },
            )
          }
        }
      } catch (error) {
        console.error("Error checking inventory:", error)
        return NextResponse.json({ success: false, error: "Error checking inventory" }, { status: 500 })
      }
    }

    // Update order status
    const { error: updateError } = await supabase.from("orders").update({ status }).eq("id", orderId)

    if (updateError) {
      // Check for rate limiting
      if (updateError.message?.includes("Too Many Requests") || updateError.code === 429) {
        return NextResponse.json(
          { success: false, error: "Rate limit exceeded. Please try again later." },
          { status: 429 },
        )
      }

      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    // Update inventory if needed
    if (status === "accepted") {
      try {
        const updateInventoryResponse = await fetch(
          new URL(`/api/orders/${orderId}/update-inventory`, request.url).toString(),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "decrement" }),
          },
        )

        if (!updateInventoryResponse.ok) {
          console.warn("Error updating inventory, but order status was updated")
        }
      } catch (error) {
        console.error("Error updating inventory:", error)
      }
    } else if (status === "pending" && restoreInventory) {
      try {
        const updateInventoryResponse = await fetch(
          new URL(`/api/orders/${orderId}/update-inventory`, request.url).toString(),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "increment" }),
          },
        )

        if (!updateInventoryResponse.ok) {
          console.warn("Error restoring inventory, but order status was updated")
        }
      } catch (error) {
        console.error("Error restoring inventory:", error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
