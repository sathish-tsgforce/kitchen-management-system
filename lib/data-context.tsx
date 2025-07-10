"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "./supabase"
import type { Ingredient, Order, MenuItem, Recipe, RecipeIngredient, RecipeStep } from "./types"

// Add these imports at the top
import { checkOrderInventory, updateInventoryForOrder } from "@/lib/utils/inventory-check"

// Update the DataContextType interface to include the new functions
interface DataContextType {
  ingredients: Ingredient[]
  orders: Order[]
  menuItems: MenuItem[]
  recipes: Recipe[]
  loading: boolean
  error: string | null
  addIngredient: (ingredient: Omit<Ingredient, "id">) => Promise<void>
  updateIngredient: (id: number, ingredient: Partial<Ingredient>) => Promise<void>
  deleteIngredient: (id: number) => Promise<void>
  addOrder: (order: Omit<Order, "id">) => Promise<void>
  updateOrder: (id: number, order: Partial<Order>) => Promise<void>
  deleteOrder: (id: number) => Promise<void>
  completeOrder: (id: number) => Promise<void>
  cancelOrder: (id: number) => Promise<void>
  acceptOrder: (id: number) => Promise<void>
  revertOrderToPending: (id: number, restoreInventory: boolean) => Promise<void>
  setOrderInProgress: (id: number) => Promise<void>
  assignChef: (orderId: number, chefId: string) => Promise<void>
  checkInventoryForOrder: (orderId: number) => Promise<{ isOk: boolean; missingIngredients: any[] }>
  getRecipeById: (id: number) => Promise<Recipe | null>
  getOrderById: (id: number) => Promise<Order | null>
  refreshData: () => Promise<void>
  createRecipe: (recipe: Omit<Recipe, "id" | "name">) => Promise<number>
  updateRecipe: (id: number, recipe: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: number) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all data on initial load
  useEffect(() => {
    refreshData()
  }, [])

  // Function to refresh all data
  const refreshData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchIngredients(), fetchMenuItems(), fetchRecipes()])
    } catch (err) {
      setError("Failed to load data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch ingredients
  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase.from("ingredients").select("*")

      if (error) throw error
      setIngredients(data as Ingredient[])
    } catch (err) {
      console.error("Error fetching ingredients:", err)
      // If there's an error, set an empty array to avoid breaking the UI
      setIngredients([])
    }
  }



  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase.from("menu_items").select("*")

      if (error) throw error
      setMenuItems(data as MenuItem[])
    } catch (err) {
      console.error("Error fetching menu items:", err)
      // If there's an error, set an empty array to avoid breaking the UI
      setMenuItems([])
    }
  }

  // Fetch recipes with their ingredients and steps
  const fetchRecipes = async () => {
    try {
      const { data: recipesData, error: recipesError } = await supabase.from("recipes").select("*, menu_items(name)")

      if (recipesError) throw recipesError

      const fullRecipes: Recipe[] = []

      for (const recipe of recipesData) {
        // Fetch recipe ingredients
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .select("*, ingredients(name, unit)")
          .eq("recipe_id", recipe.id)

        if (ingredientsError) throw ingredientsError

        // Fetch recipe steps
        const { data: stepsData, error: stepsError } = await supabase
          .from("recipe_steps")
          .select("*")
          .eq("recipe_id", recipe.id)
          .order("step_number", { ascending: true })

        if (stepsError) throw stepsError

        const recipeIngredients: RecipeIngredient[] = ingredientsData.map((item) => ({
          id: item.id,
          recipe_id: item.recipe_id,
          ingredient_id: item.ingredient_id,
          name: item.ingredients?.name || "Unknown Ingredient",
          quantity: `${item.quantity_for_recipe}${item.ingredients?.unit || ""}`,
          quantity_for_recipe: item.quantity_for_recipe,
        }))

        const recipeSteps: RecipeStep[] = stepsData.map((step) => ({
          id: step.id,
          recipe_id: step.recipe_id,
          step_number: step.step_number,
          instruction: step.instruction,
          image_url: step.image_url,
          audio_url: step.audio_url,
        }))

        fullRecipes.push({
          id: recipe.id,
          menu_item_id: recipe.menu_item_id,
          name: recipe.menu_items?.name || "Unknown Recipe",
          standard_serving_pax: recipe.standard_serving_pax,
          accessibility_notes: recipe.accessibility_notes || undefined,
          ingredients: recipeIngredients,
          steps: recipeSteps,
        })
      }

      setRecipes(fullRecipes)
    } catch (err) {
      console.error("Error fetching recipes:", err)
      // If there's an error, set an empty array to avoid breaking the UI
      setRecipes([])
    }
  }

  // Get a single recipe by ID
  const getRecipeById = async (id: number): Promise<Recipe | null> => {
    try {
      // First check if the recipe is in our state
      const recipe = recipes.find((r) => r.id === id)
      if (recipe) return recipe

      // If not in state, fetch from database
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*, menu_items(name)")
        .eq("id", id)
        .single()

      if (recipeError) throw recipeError
      if (!recipeData) return null

      // Fetch recipe ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .select("*, ingredients(name, unit)")
        .eq("recipe_id", id)

      if (ingredientsError) throw ingredientsError

      // Fetch recipe steps
      const { data: stepsData, error: stepsError } = await supabase
        .from("recipe_steps")
        .select("*")
        .eq("recipe_id", id)
        .order("step_number", { ascending: true })

      if (stepsError) throw stepsError

      const recipeIngredients: RecipeIngredient[] = ingredientsData.map((item) => ({
        id: item.id,
        recipe_id: item.recipe_id,
        ingredient_id: item.ingredient_id,
        name: item.ingredients?.name || "Unknown Ingredient",
        quantity: `${item.quantity_for_recipe}${item.ingredients?.unit || ""}`,
        quantity_for_recipe: item.quantity_for_recipe,
      }))

      const recipeSteps: RecipeStep[] = stepsData.map((step) => ({
        id: step.id,
        recipe_id: step.recipe_id,
        step_number: step.step_number,
        instruction: step.instruction,
        image_url: step.image_url,
        audio_url: step.audio_url,
      }))

      const fullRecipe: Recipe = {
        id: recipeData.id,
        menu_item_id: recipeData.menu_item_id,
        name: recipeData.menu_items?.name || "Unknown Recipe",
        standard_serving_pax: recipeData.standard_serving_pax,
        accessibility_notes: recipeData.accessibility_notes || undefined,
        ingredients: recipeIngredients,
        steps: recipeSteps,
      }

      return fullRecipe
    } catch (err) {
      console.error("Error fetching recipe:", err)
      return null
    }
  }

  // Get a single order by ID
  const getOrderById = async (id: number): Promise<Order | null> => {
    try {
      // First check if the order is in our state
      const order = orders.find((o) => o.id === id)
      if (order) return order

      // If not in state, fetch from database
      const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single()

      if (orderError) throw orderError
      if (!orderData) return null

      // Fetch order items
      const { data: orderItemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*, menu_items(name)")
        .eq("order_id", id)

      if (itemsError) throw itemsError

      const items = orderItemsData.map((item) => ({
        menu_item_id: item.menu_item_id,
        name: item.menu_items?.name || "Unknown Item",
        quantity: item.quantity,
        price: item.price,
      }))

      // Calculate total from items
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      const fullOrder: Order = {
        ...orderData,
        items,
        total,
      }

      return fullOrder
    } catch (err) {
      console.error("Error fetching order:", err)
      return null
    }
  }

  // Ingredient operations
  const addIngredient = async (ingredient: Omit<Ingredient, "id">) => {
    try {
      // Ensure we're not sending any id field
      const { id, ...ingredientWithoutId } = ingredient as any

      const { data, error } = await supabase.from("ingredients").insert([ingredientWithoutId]).select()
      if (error) throw error

      // Update local state
      if (data && data.length > 0) {
        setIngredients([...ingredients, data[0] as Ingredient])
      }
    } catch (err) {
      console.error("Error adding ingredient:", err)
      throw err
    }
  }

  const updateIngredient = async (id: number, updatedFields: Partial<Ingredient>) => {
    try {
      const { error } = await supabase.from("ingredients").update(updatedFields).eq("id", id)
      if (error) throw error

      // Update local state
      const updatedIngredients = ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, ...updatedFields } : ingredient,
      )
      setIngredients(updatedIngredients)
    } catch (err) {
      console.error("Error updating ingredient:", err)
      throw err
    }
  }

  const deleteIngredient = async (id: number) => {
    try {
      const { error } = await supabase.from("ingredients").delete().eq("id", id)
      if (error) throw error

      // Update local state
      const filteredIngredients = ingredients.filter((ingredient) => ingredient.id !== id)
      setIngredients(filteredIngredients)
    } catch (err) {
      console.error("Error deleting ingredient:", err)
      throw err
    }
  }

  // Order operations
  const addOrder = async (order: Omit<Order, "id">) => {
    try {
      // First, insert the order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            date: order.date,
            customer_name: order.customer_name,
            delivery_address: order.delivery_address,
            delivery_date: order.delivery_date,
            kitchen_location: order.kitchen_location,
            chef_id: order.chef_id,
            status: order.status,
            notes: order.notes,
          },
        ])
        .select()

      if (orderError) throw orderError
      if (!orderData || orderData.length === 0) throw new Error("Failed to create order")

      const newOrderId = orderData[0].id

      // Then, insert the order items
      const orderItems = order.items.map((item) => ({
        order_id: newOrderId,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
      if (itemsError) throw itemsError


    } catch (err) {
      console.error("Error adding order:", err)
      throw err
    }
  }

  const updateOrder = async (id: number, updatedFields: Partial<Order>) => {
    try {
      // Update order details
      const orderUpdate: any = {}
      if (updatedFields.customer_name) orderUpdate.customer_name = updatedFields.customer_name
      if (updatedFields.delivery_address) orderUpdate.delivery_address = updatedFields.delivery_address
      if (updatedFields.delivery_date) orderUpdate.delivery_date = updatedFields.delivery_date
      if (updatedFields.kitchen_location) orderUpdate.kitchen_location = updatedFields.kitchen_location
      if (updatedFields.chef_id) orderUpdate.chef_id = updatedFields.chef_id
      if (updatedFields.status) orderUpdate.status = updatedFields.status
      if (updatedFields.notes !== undefined) orderUpdate.notes = updatedFields.notes

      if (Object.keys(orderUpdate).length > 0) {
        const { data, error } = await supabase.from("orders").update(orderUpdate).eq("id", id).select()
        if (error) throw error
      }

      // If items are updated, replace all items
      if (updatedFields.items) {
        // Delete existing items
        const { error: deleteError } = await supabase.from("order_items").delete().eq("order_id", id)
        if (deleteError) throw deleteError

        // Insert new items
        const orderItems = updatedFields.items.map((item) => ({
          order_id: id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
        }))

        const { error: insertError } = await supabase.from("order_items").insert(orderItems)
        if (insertError) throw insertError
      }

      // Update local state
      const updatedOrders = orders.map((order) => {
        if (order.id === id) {
          return { ...order, ...updatedFields }
        }
        return order
      })
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error updating order:", err)
      throw err
    }
  }

  const deleteOrder = async (id: number) => {
    try {
      // Delete order (cascade will delete order items)
      const { error } = await supabase.from("orders").delete().eq("id", id)
      if (error) throw error

      // Update local state
      const filteredOrders = orders.filter((order) => order.id !== id)
      setOrders(filteredOrders)
    } catch (err) {
      console.error("Error deleting order:", err)
      throw err
    }
  }

  const completeOrder = async (id: number) => {
    try {
      const { error } = await supabase.from("orders").update({ status: "completed" }).eq("id", id)
      if (error) throw error

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === id ? { ...order, status: "completed" } : order))
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error completing order:", err)
      throw err
    }
  }

  const cancelOrder = async (id: number) => {
    try {
      const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id)
      if (error) throw error

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === id ? { ...order, status: "cancelled" } : order))
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error cancelling order:", err)
      throw err
    }
  }

  // Create a new recipe
  const createRecipe = async (recipe: Omit<Recipe, "id" | "name">): Promise<number> => {
    try {
      // First, insert the recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .insert([
          {
            menu_item_id: recipe.menu_item_id,
            standard_serving_pax: recipe.standard_serving_pax,
            accessibility_notes: recipe.accessibility_notes,
          },
        ])
        .select()

      if (recipeError) throw recipeError
      if (!recipeData || recipeData.length === 0) throw new Error("Failed to create recipe")

      const newRecipeId = recipeData[0].id

      // Insert recipe ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const recipeIngredients = recipe.ingredients.map((ingredient) => {
          // Parse the quantity string to extract the numeric value
          let quantityForRecipe = 0

          if (ingredient.quantity) {
            // Extract numeric part from the quantity string (e.g., "200g" -> 200)
            const numericValue = Number.parseFloat(ingredient.quantity.replace(/[^0-9.]/g, ""))
            if (!isNaN(numericValue)) {
              quantityForRecipe = numericValue
            }
          }

          return {
            recipe_id: newRecipeId,
            ingredient_id: ingredient.ingredient_id,
            quantity_for_recipe: quantityForRecipe,
          }
        })

        const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(recipeIngredients)

        if (ingredientsError) throw ingredientsError
      }

      // Insert recipe steps
      if (recipe.steps && recipe.steps.length > 0) {
        const recipeSteps = recipe.steps.map((step) => ({
          recipe_id: newRecipeId,
          step_number: step.step_number,
          instruction: step.instruction,
          image_url: step.image_url || null,
          audio_url: step.audio_url || null,
        }))

        const { error: stepsError } = await supabase.from("recipe_steps").insert(recipeSteps)

        if (stepsError) throw stepsError
      }

      // Refresh recipes to include the new one
      await fetchRecipes()

      return newRecipeId
    } catch (err) {
      console.error("Error creating recipe:", err)
      throw err
    }
  }

  // Update an existing recipe
  const updateRecipe = async (id: number, recipeUpdates: Partial<Recipe>) => {
    try {
      // Update recipe basic info
      if (
        recipeUpdates.menu_item_id !== undefined ||
        recipeUpdates.standard_serving_pax !== undefined ||
        recipeUpdates.accessibility_notes !== undefined
      ) {
        const updateData: any = {}
        if (recipeUpdates.menu_item_id !== undefined) updateData.menu_item_id = recipeUpdates.menu_item_id
        if (recipeUpdates.standard_serving_pax !== undefined)
          updateData.standard_serving_pax = recipeUpdates.standard_serving_pax
        if (recipeUpdates.accessibility_notes !== undefined)
          updateData.accessibility_notes = recipeUpdates.accessibility_notes

        const { error: updateError } = await supabase.from("recipes").update(updateData).eq("id", id)

        if (updateError) throw updateError
      }

      // Update ingredients if provided
      if (recipeUpdates.ingredients) {
        // Delete existing ingredients
        const { error: deleteIngredientsError } = await supabase.from("recipe_ingredients").delete().eq("recipe_id", id)

        if (deleteIngredientsError) throw deleteIngredientsError

        // Insert new ingredients
        if (recipeUpdates.ingredients.length > 0) {
          const recipeIngredients = recipeUpdates.ingredients.map((ingredient) => {
            // Parse the quantity string to extract the numeric value
            let quantityForRecipe = 0

            if (ingredient.quantity) {
              // Extract numeric part from the quantity string (e.g., "200g" -> 200)
              const numericValue = Number.parseFloat(ingredient.quantity.replace(/[^0-9.]/g, ""))
              if (!isNaN(numericValue)) {
                quantityForRecipe = numericValue
              }
            }

            return {
              recipe_id: id,
              ingredient_id: ingredient.ingredient_id,
              quantity_for_recipe: quantityForRecipe,
            }
          })

          const { error: insertIngredientsError } = await supabase.from("recipe_ingredients").insert(recipeIngredients)

          if (insertIngredientsError) throw insertIngredientsError
        }
      }

      // Update steps if provided
      if (recipeUpdates.steps) {
        // Delete existing steps
        const { error: deleteStepsError } = await supabase.from("recipe_steps").delete().eq("recipe_id", id)

        if (deleteStepsError) throw deleteStepsError

        // Insert new steps
        if (recipeUpdates.steps.length > 0) {
          const recipeSteps = recipeUpdates.steps.map((step) => ({
            recipe_id: id,
            step_number: step.step_number,
            instruction: step.instruction,
            image_url: step.image_url || null,
            audio_url: step.audio_url || null,
          }))

          const { error: insertStepsError } = await supabase.from("recipe_steps").insert(recipeSteps)

          if (insertStepsError) throw insertStepsError
        }
      }

      // Refresh recipes to reflect changes
      await fetchRecipes()
    } catch (err) {
      console.error("Error updating recipe:", err)
      throw err
    }
  }

  // Delete a recipe
  const deleteRecipe = async (id: number) => {
    try {
      // Delete recipe (cascade will delete ingredients and steps)
      const { error } = await supabase.from("recipes").delete().eq("id", id)

      if (error) throw error

      // Update local state
      const updatedRecipes = recipes.filter((recipe) => recipe.id !== id)
      setRecipes(updatedRecipes)
    } catch (err) {
      console.error("Error deleting recipe:", err)
      throw err
    }
  }

  // Add these functions inside the DataProvider component

  // Accept an order and update inventory
  const acceptOrder = async (id: number) => {
    try {
      // First check if we have enough inventory
      const inventoryCheck = await checkInventoryForOrder(id)

      if (!inventoryCheck.isOk) {
        throw new Error("Insufficient inventory to accept this order")
      }

      // Get the order
      const order = await getOrderById(id)
      if (!order) throw new Error("Order not found")

      // Update inventory by subtracting required ingredients
      const ingredientUpdates = updateInventoryForOrder(order, recipes, ingredients)

      // Update each ingredient in the database
      for (const update of ingredientUpdates) {
        if (update.id !== undefined) {
          await updateIngredient(update.id, { quantity: update.quantity })
        }
      }

      // Update order status
      const { error } = await supabase.from("orders").update({ status: "accepted" }).eq("id", id)
      if (error) throw error

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === id ? { ...order, status: "accepted" } : order))
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error accepting order:", err)
      throw err
    }
  }

  // Set an order to in_progress
  const setOrderInProgress = async (id: number) => {
    try {
      const { error } = await supabase.from("orders").update({ status: "in_progress" }).eq("id", id)
      if (error) throw error

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === id ? { ...order, status: "in_progress" } : order))
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error setting order to in progress:", err)
      throw err
    }
  }

  // Revert an order to pending and optionally restore inventory
  const revertOrderToPending = async (id: number, restoreInventory: boolean) => {
    try {
      // Get the order
      const order = await getOrderById(id)
      if (!order) throw new Error("Order not found")

      // If we need to restore inventory and the order was accepted
      if (restoreInventory && order.status === "accepted") {
        // Update inventory by adding back required ingredients
        const ingredientUpdates = updateInventoryForOrder(order, recipes, ingredients, true)

        // Update each ingredient in the database
        for (const update of ingredientUpdates) {
          if (update.id !== undefined) {
            await updateIngredient(update.id, { quantity: update.quantity })
          }
        }
      }

      // Update order status
      const { error } = await supabase.from("orders").update({ status: "pending" }).eq("id", id)
      if (error) throw error

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === id ? { ...order, status: "pending" } : order))
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error reverting order to pending:", err)
      throw err
    }
  }

  // Assign a chef to an order
  const assignChef = async (orderId: number, chefId: string) => {
    try {
      const { error } = await supabase.from("orders").update({ chef_id: chefId }).eq("id", orderId)
      if (error) throw error

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, chef_id: chefId } : order))
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error assigning chef:", err)
      throw err
    }
  }

  // Check if inventory is sufficient for an order
  const checkInventoryForOrder = async (orderId: number): Promise<{ isOk: boolean; missingIngredients: any[] }> => {
    try {
      const order = await getOrderById(orderId)
      if (!order) throw new Error("Order not found")

      return checkOrderInventory(order, recipes, ingredients)
    } catch (err) {
      console.error("Error checking inventory for order:", err)
      return { isOk: false, missingIngredients: [] }
    }
  }

  // Update the value object to include the new functions
  const value = {
    ingredients,
    orders,
    menuItems,
    recipes,
    loading,
    error,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addOrder,
    updateOrder,
    deleteOrder,
    completeOrder,
    cancelOrder,
    acceptOrder,
    revertOrderToPending,
    setOrderInProgress,
    assignChef,
    checkInventoryForOrder,
    getRecipeById,
    getOrderById,
    refreshData,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
