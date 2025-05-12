import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Validate order ID
    const orderId = Number(params.id)
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ isOk: false, error: "Invalid order ID" }, { status: 400 })
    }

    // Get the order with its items
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .single()

      if (orderError) {
        // Check for rate limiting
        if (orderError.message?.includes("Too Many Requests") || orderError.code === 429) {
          return NextResponse.json(
            { isOk: false, error: "Rate limit exceeded. Please try again later." },
            { status: 429 },
          )
        }

        return NextResponse.json({ isOk: false, error: orderError.message }, { status: 500 })
      }

      if (!order) {
        return NextResponse.json({ isOk: false, error: "Order not found" }, { status: 404 })
      }
    } catch (error) {
      console.error("Error fetching order:", error)
      return NextResponse.json({ isOk: false, error: "Error fetching order" }, { status: 500 })
    }

    // Get order items
    let orderItems
    try {
      const { data, error: itemsError } = await supabase
        .from("order_items")
        .select("menu_item_id, quantity")
        .eq("order_id", orderId)

      if (itemsError) {
        // Check for rate limiting
        if (itemsError.message?.includes("Too Many Requests") || itemsError.code === 429) {
          return NextResponse.json(
            { isOk: false, error: "Rate limit exceeded. Please try again later." },
            { status: 429 },
          )
        }

        throw itemsError
      }

      orderItems = data || []
    } catch (error) {
      console.error("Error fetching order items:", error)
      return NextResponse.json({ isOk: false, error: "Error fetching order items" }, { status: 500 })
    }

    // If no items, return success
    if (!orderItems.length) {
      return NextResponse.json({ isOk: true, message: "No items to check" })
    }

    // Get all menu item IDs
    const menuItemIds = orderItems.map((item) => item.menu_item_id)

    // Get recipes for these menu items
    let recipes
    try {
      const { data, error: recipesError } = await supabase
        .from("recipes")
        .select("id, menu_item_id")
        .in("menu_item_id", menuItemIds)

      if (recipesError) {
        // Check for rate limiting
        if (recipesError.message?.includes("Too Many Requests") || recipesError.code === 429) {
          return NextResponse.json(
            { isOk: false, error: "Rate limit exceeded. Please try again later." },
            { status: 429 },
          )
        }

        throw recipesError
      }

      recipes = data || []
    } catch (error) {
      console.error("Error fetching recipes:", error)
      return NextResponse.json({ isOk: false, error: "Error fetching recipes" }, { status: 500 })
    }

    // If no recipes, return success (nothing to check)
    if (!recipes.length) {
      return NextResponse.json({ isOk: true, message: "No recipes to check" })
    }

    // Create a map of menu item ID to recipe ID
    const menuItemToRecipe = recipes.reduce((map, recipe) => {
      map[recipe.menu_item_id] = recipe.id
      return map
    }, {})

    // Get all recipe IDs
    const recipeIds = recipes.map((recipe) => recipe.id)

    // Get recipe ingredients
    let recipeIngredients
    try {
      const { data, error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .select("recipe_id, ingredient_id, quantity_for_recipe")
        .in("recipe_id", recipeIds)

      if (ingredientsError) {
        // Check for rate limiting
        if (ingredientsError.message?.includes("Too Many Requests") || ingredientsError.code === 429) {
          return NextResponse.json(
            { isOk: false, error: "Rate limit exceeded. Please try again later." },
            { status: 429 },
          )
        }

        throw ingredientsError
      }

      recipeIngredients = data || []
    } catch (error) {
      console.error("Error fetching recipe ingredients:", error)
      return NextResponse.json({ isOk: false, error: "Error fetching recipe ingredients" }, { status: 500 })
    }

    // If no recipe ingredients, return success (nothing to check)
    if (!recipeIngredients.length) {
      return NextResponse.json({ isOk: true, message: "No ingredients to check" })
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

    // Get all ingredient IDs
    const ingredientIds = Object.keys(ingredientQuantities).map(Number)

    // If no ingredients needed, return success
    if (!ingredientIds.length) {
      return NextResponse.json({ isOk: true, message: "No ingredients required" })
    }

    // Get current quantities for these ingredients
    let currentIngredients
    try {
      const { data, error: getIngredientsError } = await supabase
        .from("ingredients")
        .select("id, name, quantity, unit")
        .in("id", ingredientIds)

      if (getIngredientsError) {
        // Check for rate limiting
        if (getIngredientsError.message?.includes("Too Many Requests") || getIngredientsError.code === 429) {
          return NextResponse.json(
            { isOk: false, error: "Rate limit exceeded. Please try again later." },
            { status: 429 },
          )
        }

        throw getIngredientsError
      }

      currentIngredients = data || []
    } catch (error) {
      console.error("Error fetching current ingredients:", error)
      return NextResponse.json({ isOk: false, error: "Error fetching current ingredients" }, { status: 500 })
    }

    // Check if there is sufficient quantity for each ingredient
    const missingIngredients = []
    for (const ingredient of currentIngredients) {
      const requiredQuantity = ingredientQuantities[ingredient.id]
      if (ingredient.quantity < requiredQuantity) {
        missingIngredients.push({
          id: ingredient.id,
          name: ingredient.name,
          available: ingredient.quantity,
          required: requiredQuantity,
          missing: requiredQuantity - ingredient.quantity,
          unit: ingredient.unit || "",
        })
      }
    }

    if (missingIngredients.length > 0) {
      return NextResponse.json({
        isOk: false,
        message: "Insufficient inventory",
        missingIngredients,
      })
    }

    return NextResponse.json({
      isOk: true,
      message: "Sufficient inventory",
    })
  } catch (error) {
    console.error("Error checking inventory:", error)
    return NextResponse.json({ isOk: false, error: "Server error" }, { status: 500 })
  }
}
