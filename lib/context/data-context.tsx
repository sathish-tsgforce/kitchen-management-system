"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "../supabase"
import type { Ingredient, Order, MenuItem, Recipe, RecipeIngredient, RecipeStep, User, Role } from "../types"

interface DataContextType {
  ingredients: Ingredient[]
  orders: Order[]
  menuItems: MenuItem[]
  recipes: Recipe[]
  users: User[]
  roles: Role[]
  chefs: User[] // Users with chef role
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
  assignChef: (orderId: number, chefId: string | null) => Promise<void>
  getRecipeById: (id: number) => Promise<Recipe | null>
  getOrderById: (id: number) => Promise<Order | null>
  refreshData: () => Promise<void>
  fetchIngredients: () => Promise<Ingredient[]>
  fetchOrders: () => Promise<Order[]>
  createRecipe: (recipe: Omit<Recipe, "id" | "name">) => Promise<number>
  updateRecipe: (id: number, recipe: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: number) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// Helper function to handle rate limiting
const handleRateLimitError = (error: any): boolean => {
  return error && (error.message?.includes("Too Many Requests") || error.code === 429 || error.code === "429")
}

// Helper function to add delay when rate limited
const delayOnRateLimit = async (ms = 1000): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Helper function to create a timeout promise
const createTimeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms))
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [chefs, setChefs] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Refs to track data loading status and prevent duplicate fetches
  const dataInitialized = useRef(false)
  const isRefreshing = useRef(false)
  const chefRoleId = useRef<number | null>(null)

  // Cache timestamps to control refetch frequency
  const lastFetchTimes = useRef({
    ingredients: 0,
    orders: 0,
    menuItems: 0,
    recipes: 0,
    users: 0,
    roles: 0,
  })

  // Minimum time between refreshes (in milliseconds)
  const CACHE_DURATION = 5000 // 5 seconds

  // Fetch all data on initial load
  useEffect(() => {
    if (!dataInitialized.current) {
      refreshData()
      dataInitialized.current = true
    }
  }, [])

  // Function to refresh all data with rate limiting protection
  const refreshData = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshing.current) return

    isRefreshing.current = true
    setLoading(true)
    setError(null)

    try {
      // Fetch data in sequence to avoid overwhelming the API
      await fetchRoles()
      await fetchUsers()
      await fetchIngredients()
      await fetchMenuItems()
      await fetchRecipes()
      await fetchOrders()
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError("Failed to load data. Please try again later.")
    } finally {
      setLoading(false)
      isRefreshing.current = false
    }
  }, [])

  // Fetch ingredients with caching
  const fetchIngredients = useCallback(async (): Promise<Ingredient[]> => {
    try {
      // Check if we should use cached data
      const now = Date.now()
      if (ingredients.length > 0 && now - lastFetchTimes.current.ingredients < CACHE_DURATION) {
        return ingredients
      }

      const { data, error } = await supabase.from("ingredients").select("*")

      if (handleRateLimitError(error)) {
        console.warn("Rate limited when fetching ingredients, using cached data")
        return ingredients
      }

      if (error) throw error

      lastFetchTimes.current.ingredients = now
      setIngredients(data as Ingredient[])
      return data as Ingredient[]
    } catch (err) {
      console.error("Error fetching ingredients:", err)
      // If there's an error, return the cached data to avoid breaking the UI
      return ingredients
    }
  }, [ingredients])

  // Fetch users with caching and rate limit handling
  const fetchUsers = useCallback(async () => {
    try {
      // Check if we should use cached data
      const now = Date.now()
      if (users.length > 0 && now - lastFetchTimes.current.users < CACHE_DURATION) {
        return
      }

      // First get the chef role ID if we don't have it yet
      if (chefRoleId.current === null) {
        await getChefRoleId()
      }

      const { data, error } = await supabase.from("users").select("*, roles(name)")

      if (handleRateLimitError(error)) {
        console.warn("Rate limited when fetching users, using cached data")
        return
      }

      if (error) throw error

      const usersData = data as (User & { roles: { name: string } })[]
      setUsers(
        usersData.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role_id: user.role_id,
        })),
      )

      // Filter chefs (users with chef role)
      if (chefRoleId.current) {
        setChefs(
          usersData
            .filter((user) => user.role_id === chefRoleId.current)
            .map((user) => ({
              id: user.id,
              email: user.email,
              name: user.name || user.email,
              role_id: user.role_id,
            })),
        )
      }

      lastFetchTimes.current.users = now
    } catch (err) {
      console.error("Error fetching users:", err)
    }
  }, [users])

  // Fetch roles with caching
  const fetchRoles = useCallback(async () => {
    try {
      // Check if we should use cached data
      const now = Date.now()
      if (roles.length > 0 && now - lastFetchTimes.current.roles < CACHE_DURATION) {
        return
      }

      // Use Promise.race to implement a timeout
      try {
        const result = await Promise.race([
          supabase.from("roles").select("*"),
          createTimeoutPromise(10000), // 10 second timeout
        ])

        const { data, error } = result

        if (handleRateLimitError(error)) {
          console.warn("Rate limited when fetching roles, using cached data")
          return
        }

        if (error) {
          console.error("Error fetching roles:", error)
          // Don't throw the error, just log it and continue with cached data
          return
        }

        setRoles(data as Role[])
        lastFetchTimes.current.roles = now
      } catch (timeoutErr) {
        console.error("Roles fetch timed out:", timeoutErr)
        // Continue with cached data
      }
    } catch (err) {
      console.error("Error fetching roles:", err)
      // If fetch fails, just continue with cached data
      // and avoid breaking the application flow
    }
  }, [roles])

  // Get chef role ID with better error handling
  const getChefRoleId = useCallback(async (): Promise<number | null> => {
    // If we already have the chef role ID, return it
    if (chefRoleId.current !== null) {
      return chefRoleId.current
    }

    try {
      // First try to get the ID from already fetched roles
      if (roles.length > 0) {
        const chefRole = roles.find((role) => role.name.toLowerCase().includes("chef"))

        if (chefRole) {
          chefRoleId.current = chefRole.id
          return chefRole.id
        }
      }

      // If not found in existing roles, try to fetch it
      try {
        const fetchPromise = supabase.from("roles").select("id").ilike("name", "chef").limit(1)
        const result = await Promise.race([
          fetchPromise,
          createTimeoutPromise(5000), // 5 second timeout
        ])

        const { data, error } = result

        if (handleRateLimitError(error)) {
          console.warn("Rate limited when getting chef role ID")
          await delayOnRateLimit()
          return chefRoleId.current || null // Return cached value if available
        }

        if (error) {
          console.error("Error getting chef role ID:", error)
          return chefRoleId.current || null // Return cached value if available
        }

        if (data && data.length > 0) {
          chefRoleId.current = data[0].id
          return data[0].id
        }
      } catch (timeoutErr) {
        console.error("Chef role ID fetch timed out:", timeoutErr)
        // Continue with cached value
      }

      return null
    } catch (err) {
      console.error("Error getting chef role ID:", err)
      return chefRoleId.current || null // Return cached value if available
    }
  }, [roles])

  // Fetch orders with their items, with caching
  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    try {
      // Check if we should use cached data
      const now = Date.now()
      if (orders.length > 0 && now - lastFetchTimes.current.orders < CACHE_DURATION) {
        return orders
      }

      const { data: ordersData, error: ordersError } = await supabase.from("orders").select("*, users(name, email)")

      if (handleRateLimitError(ordersError)) {
        console.warn("Rate limited when fetching orders, using cached data")
        return orders
      }

      if (ordersError) throw ordersError

      const ordersWithItems: Order[] = []

      for (const order of ordersData) {
        try {
          const { data: orderItemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("*, menu_items(name)")
            .eq("order_id", order.id)

          if (handleRateLimitError(itemsError)) {
            console.warn(`Rate limited when fetching items for order ${order.id}, skipping`)
            continue
          }

          if (itemsError) throw itemsError

          const items = orderItemsData.map((item) => ({
            menu_item_id: item.menu_item_id,
            name: item.menu_items?.name || "Unknown Item",
            quantity: item.quantity,
            price: item.price,
          }))

          // Calculate total from items
          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

          // Map "progress" status to "in_progress" for consistency
          const status = order.status === "progress" ? "in_progress" : order.status

          ordersWithItems.push({
            ...order,
            status,
            chef_name: order.users?.name || order.users?.email || null,
            items,
            total,
          } as Order)
        } catch (err) {
          console.error(`Error processing order ${order.id}:`, err)
          // Continue with other orders
        }
      }

      setOrders(ordersWithItems)
      lastFetchTimes.current.orders = now
      return ordersWithItems
    } catch (err) {
      console.error("Error fetching orders:", err)
      return orders
    }
  }, [orders])

  // Fetch menu items with caching
  const fetchMenuItems = useCallback(async () => {
    try {
      // Check if we should use cached data
      const now = Date.now()
      if (menuItems.length > 0 && now - lastFetchTimes.current.menuItems < CACHE_DURATION) {
        return
      }

      const { data, error } = await supabase.from("menu_items").select("*")

      if (handleRateLimitError(error)) {
        console.warn("Rate limited when fetching menu items, using cached data")
        return
      }

      if (error) throw error
      setMenuItems(data as MenuItem[])
      lastFetchTimes.current.menuItems = now
    } catch (err) {
      console.error("Error fetching menu items:", err)
    }
  }, [menuItems])

  // Fetch recipes with caching
  const fetchRecipes = useCallback(async () => {
    try {
      // Check if we should use cached data
      const now = Date.now()
      if (recipes.length > 0 && now - lastFetchTimes.current.recipes < CACHE_DURATION) {
        return
      }

      const { data: recipesData, error: recipesError } = await supabase.from("recipes").select("*, menu_items(name)")

      if (handleRateLimitError(recipesError)) {
        console.warn("Rate limited when fetching recipes, using cached data")
        return
      }

      if (recipesError) throw recipesError

      const fullRecipes: Recipe[] = []

      for (const recipe of recipesData) {
        try {
          // Fetch recipe ingredients
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from("recipe_ingredients")
            .select("*, ingredients(name, unit)")
            .eq("recipe_id", recipe.id)

          if (handleRateLimitError(ingredientsError)) {
            console.warn(`Rate limited when fetching ingredients for recipe ${recipe.id}, skipping`)
            continue
          }

          if (ingredientsError) throw ingredientsError

          // Fetch recipe steps
          const { data: stepsData, error: stepsError } = await supabase
            .from("recipe_steps")
            .select("*")
            .eq("recipe_id", recipe.id)
            .order("step_number", { ascending: true })

          if (handleRateLimitError(stepsError)) {
            console.warn(`Rate limited when fetching steps for recipe ${recipe.id}, skipping`)
            continue
          }

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
        } catch (err) {
          console.error(`Error processing recipe ${recipe.id}:`, err)
          // Continue with other recipes
        }
      }

      setRecipes(fullRecipes)
      lastFetchTimes.current.recipes = now
    } catch (err) {
      console.error("Error fetching recipes:", err)
    }
  }, [recipes])

  // Get a single recipe by ID
  const getRecipeById = useCallback(
    async (id: number): Promise<Recipe | null> => {
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

        if (handleRateLimitError(recipeError)) {
          console.warn(`Rate limited when fetching recipe ${id}`)
          return null
        }

        if (recipeError) throw recipeError
        if (!recipeData) return null

        // Fetch recipe ingredients
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .select("*, ingredients(name, unit)")
          .eq("recipe_id", id)

        if (handleRateLimitError(ingredientsError)) {
          console.warn(`Rate limited when fetching ingredients for recipe ${id}`)
          return null
        }

        if (ingredientsError) throw ingredientsError

        // Fetch recipe steps
        const { data: stepsData, error: stepsError } = await supabase
          .from("recipe_steps")
          .select("*")
          .eq("recipe_id", id)
          .order("step_number", { ascending: true })

        if (handleRateLimitError(stepsError)) {
          console.warn(`Rate limited when fetching steps for recipe ${id}`)
          return null
        }

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
    },
    [recipes],
  )

  // Get a single order by ID
  const getOrderById = useCallback(
    async (id: number): Promise<Order | null> => {
      try {
        // First check if the order is in our state
        const order = orders.find((o) => o.id === id)
        if (order) return order

        // If not in state, fetch from database
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*, users(name, email)")
          .eq("id", id)
          .single()

        if (handleRateLimitError(orderError)) {
          console.warn(`Rate limited when fetching order ${id}`)
          return null
        }

        if (orderError) throw orderError
        if (!orderData) return null

        // Fetch order items
        const { data: orderItemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*, menu_items(name)")
          .eq("order_id", id)

        if (handleRateLimitError(itemsError)) {
          console.warn(`Rate limited when fetching items for order ${id}`)
          return null
        }

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
          chef_name: orderData.users?.name || orderData.users?.email || null,
          items,
          total,
        }

        return fullOrder
      } catch (err) {
        console.error("Error fetching order:", err)
        return null
      }
    },
    [orders],
  )

  // Ingredient operations
  const addIngredient = async (ingredient: Omit<Ingredient, "id">) => {
    try {
      // Ensure we're not sending any id field
      const { id, ...ingredientWithoutId } = ingredient as any

      const { data, error } = await supabase.from("ingredients").insert([ingredientWithoutId]).select()

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (error) throw error

      // Update local state
      if (data && data.length > 0) {
        setIngredients([...ingredients, data[0] as Ingredient])
      }

      // Refresh ingredients to ensure consistency
      await fetchIngredients()
    } catch (err) {
      console.error("Error adding ingredient:", err)
      throw err
    }
  }

  const updateIngredient = async (id: number, updatedFields: Partial<Ingredient>) => {
    try {
      const { error } = await supabase.from("ingredients").update(updatedFields).eq("id", id)

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (error) throw error

      // Update local state
      const updatedIngredients = ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, ...updatedFields } : ingredient,
      )
      setIngredients(updatedIngredients)

      // Refresh ingredients to ensure consistency
      await fetchIngredients()
    } catch (err) {
      console.error("Error updating ingredient:", err)
      throw err
    }
  }

  const deleteIngredient = async (id: number) => {
    try {
      const { error } = await supabase.from("ingredients").delete().eq("id", id)

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (error) throw error

      // Update local state
      const filteredIngredients = ingredients.filter((ingredient) => ingredient.id !== id)
      setIngredients(filteredIngredients)

      // Refresh ingredients to ensure consistency
      await fetchIngredients()
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

      if (handleRateLimitError(orderError)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

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

      if (handleRateLimitError(itemsError)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (itemsError) throw itemsError

      // Refresh orders to include the new one
      await fetchOrders()
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
      if (updatedFields.chef_id !== undefined) orderUpdate.chef_id = updatedFields.chef_id
      if (updatedFields.status) orderUpdate.status = updatedFields.status
      if (updatedFields.notes !== undefined) orderUpdate.notes = updatedFields.notes

      if (Object.keys(orderUpdate).length > 0) {
        const { data, error } = await supabase.from("orders").update(orderUpdate).eq("id", id).select()

        if (handleRateLimitError(error)) {
          throw new Error("Rate limit exceeded. Please try again later.")
        }

        if (error) throw error
      }

      // If items are updated, replace all items
      if (updatedFields.items) {
        // Delete existing items
        const { error: deleteError } = await supabase.from("order_items").delete().eq("order_id", id)

        if (handleRateLimitError(deleteError)) {
          throw new Error("Rate limit exceeded. Please try again later.")
        }

        if (deleteError) throw deleteError

        // Insert new items
        const orderItems = updatedFields.items.map((item) => ({
          order_id: id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
        }))

        const { error: insertError } = await supabase.from("order_items").insert(orderItems)

        if (handleRateLimitError(insertError)) {
          throw new Error("Rate limit exceeded. Please try again later.")
        }

        if (insertError) throw insertError
      }

      // Update local state
      const updatedOrder = await getOrderById(id)
      if (updatedOrder) {
        setOrders(orders.map((order) => (order.id === id ? updatedOrder : order)))
      }
    } catch (err) {
      console.error("Error updating order:", err)
      throw err
    }
  }

  // Replace the deleteOrder function with this implementation
  const deleteOrder = useCallback(
    async (id: number) => {
      try {
        // Update local state immediately to prevent UI freezing
        const filteredOrders = orders.filter((order) => order.id !== id)
        setOrders(filteredOrders)

        // Delete order in the background
        setTimeout(async () => {
          try {
            // Delete order (cascade will delete order items)
            const { error } = await supabase.from("orders").delete().eq("id", id)

            if (handleRateLimitError(error)) {
              console.error("Rate limited when deleting order, will retry")
              await delayOnRateLimit()
              // Retry once
              const { error: retryError } = await supabase.from("orders").delete().eq("id", id)
              if (retryError) {
                console.error("Error deleting order on retry:", retryError)
                // If retry fails, refresh data to ensure UI is in sync
                await fetchOrders()
              }
            } else if (error) {
              console.error("Error deleting order:", error)
              // If error, refresh data to ensure UI is in sync
              await fetchOrders()
            }
          } catch (err) {
            console.error("Error in background deletion:", err)
            // If error, refresh data to ensure UI is in sync
            await fetchOrders()
          }
        }, 0)

        return true
      } catch (err) {
        console.error("Error deleting order:", err)
        return false
      }
    },
    [orders, fetchOrders],
  )

  const completeOrder = async (id: number) => {
    try {
      const { error } = await supabase.from("orders").update({ status: "completed" }).eq("id", id)

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

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

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (error) throw error

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === id ? { ...order, status: "cancelled" } : order))
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error cancelling order:", err)
      throw err
    }
  }

  // Replace the acceptOrder function with this implementation that uses direct queries instead of SQL functions
  const acceptOrder = useCallback(
    async (orderId: number) => {
      try {
        // First update the order status to accepted
        const { error } = await supabase.from("orders").update({ status: "accepted" }).eq("id", orderId)

        if (handleRateLimitError(error)) {
          throw new Error("Rate limit exceeded. Please try again later.")
        }

        if (error) throw error

        // Update local state immediately to prevent UI freezing
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: "accepted" } : order)))

        // Get the order to update inventory
        const order = orders.find((o) => o.id === orderId)
        if (order) {
          // Process inventory updates in the background
          setTimeout(async () => {
            try {
              for (const item of order.items) {
                const recipe = recipes.find((r) => r.menu_item_id === item.menu_item_id)
                if (recipe) {
                  for (const ingredient of recipe.ingredients) {
                    // Get current quantity
                    const { data: currentIngredient, error: getError } = await supabase
                      .from("ingredients")
                      .select("quantity")
                      .eq("id", ingredient.ingredient_id)
                      .single()

                    if (getError) {
                      console.error("Error getting ingredient:", getError)
                      continue
                    }

                    if (!currentIngredient) continue

                    // Calculate new quantity (don't go below 0)
                    const quantityToDecrease = ingredient.quantity_for_recipe * item.quantity
                    const newQuantity = Math.max(0, currentIngredient.quantity - quantityToDecrease)

                    // Update quantity
                    const { error: updateError } = await supabase
                      .from("ingredients")
                      .update({ quantity: newQuantity })
                      .eq("id", ingredient.ingredient_id)

                    if (updateError) {
                      console.error("Error updating ingredient:", updateError)
                    }
                  }
                }
              }
              // Refresh ingredients after inventory update
              await fetchIngredients()
            } catch (err) {
              console.error("Error updating inventory in background:", err)
            }
          }, 0)
        }

        return true
      } catch (err) {
        console.error("Error accepting order:", err)
        return false
      }
    },
    [orders, recipes, fetchIngredients],
  )

  // Set an order to in_progress
  const setOrderInProgress = async (id: number) => {
    try {
      const { error } = await supabase.from("orders").update({ status: "in_progress" }).eq("id", id)

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (error) throw error

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === id ? { ...order, status: "in_progress" } : order))
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error setting order to in progress:", err)
      throw err
    }
  }

  // Replace the revertOrderToPending function with this completely rewritten version
  // that ensures UI updates happen immediately and all database operations are deferred

  const revertOrderToPending = useCallback(
    async (orderId: number, restoreInventory: boolean) => {
      try {
        // Get the order
        const order = orders.find((o) => o.id === orderId)
        if (!order) throw new Error("Order not found")

        // Update local state IMMEDIATELY to prevent UI freezing
        // This is the most important part - update the UI first before any database operations
        setOrders((prevOrders) => prevOrders.map((o) => (o.id === orderId ? { ...o, status: "pending" } : o)))

        // Defer ALL database operations to the next event loop cycle
        setTimeout(async () => {
          try {
            // Update order status in database
            const { error } = await supabase.from("orders").update({ status: "pending" }).eq("id", orderId)

            if (error) {
              console.error("Error updating order status:", error)
              // If there's an error, refresh data to ensure UI is in sync
              await fetchOrders()
              return
            }

            // Restore inventory if requested (only after status update is successful)
            if (restoreInventory && order) {
              try {
                for (const item of order.items) {
                  const recipe = recipes.find((r) => r.menu_item_id === item.menu_item_id)
                  if (recipe) {
                    for (const ingredient of recipe.ingredients) {
                      // Get current quantity
                      const { data: currentIngredient, error: getError } = await supabase
                        .from("ingredients")
                        .select("quantity")
                        .eq("id", ingredient.ingredient_id)
                        .single()

                      if (getError) {
                        console.error("Error getting ingredient:", getError)
                        continue
                      }

                      if (!currentIngredient) continue

                      // Calculate new quantity
                      const quantityToAdd = ingredient.quantity_for_recipe * item.quantity
                      const newQuantity = currentIngredient.quantity + quantityToAdd

                      // Update quantity
                      const { error: updateError } = await supabase
                        .from("ingredients")
                        .update({ quantity: newQuantity })
                        .eq("id", ingredient.ingredient_id)

                      if (updateError) {
                        console.error("Error updating ingredient:", updateError)
                      }
                    }
                  }
                }
                // Refresh ingredients after inventory update
                await fetchIngredients()
              } catch (err) {
                console.error("Error restoring inventory:", err)
                // If there's an error, refresh data to ensure UI is in sync
                await fetchIngredients()
              }
            }
          } catch (err) {
            console.error("Error in background operations:", err)
            // If there's an error, refresh data to ensure UI is in sync
            await fetchOrders()
          }
        }, 0)

        return true
      } catch (err) {
        console.error("Error reverting order to pending:", err)
        return false
      }
    },
    [orders, recipes, fetchIngredients, fetchOrders],
  )

  // Assign a chef to an order
  const assignChef = async (orderId: number, chefId: string | null) => {
    try {
      // Update the chef_id in the database
      const { error } = await supabase.from("orders").update({ chef_id: chefId }).eq("id", orderId)

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (error) throw error

      // Update local state
      const chef = chefs.find((c) => c.id === chefId)
      const chefName = chef ? chef.name || chef.email : null

      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, chef_id: chefId, chef_name: chefName } : order,
      )

      setOrders(updatedOrders)
    } catch (err) {
      console.error("Error assigning chef:", err)
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

      if (handleRateLimitError(recipeError)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

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

        if (handleRateLimitError(ingredientsError)) {
          throw new Error("Rate limit exceeded. Please try again later.")
        }

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

        if (handleRateLimitError(stepsError)) {
          throw new Error("Rate limit exceeded. Please try again later.")
        }

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

        if (handleRateLimitError(updateError)) {
          throw new Error("Rate limit exceeded. Please try again later.")
        }

        if (updateError) throw updateError
      }

      // Update ingredients if provided
      if (recipeUpdates.ingredients) {
        // Delete existing ingredients
        const { error: deleteIngredientsError } = await supabase.from("recipe_ingredients").delete().eq("recipe_id", id)

        if (handleRateLimitError(deleteIngredientsError)) {
          throw new Error("Rate limit exceeded. Please try again later.")
        }

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

          if (handleRateLimitError(insertIngredientsError)) {
            throw new Error("Rate limit exceeded. Please try again later.")
          }

          if (insertIngredientsError) throw insertIngredientsError
        }
      }

      // Update steps if provided
      if (recipeUpdates.steps) {
        // Delete existing steps
        const { error: deleteStepsError } = await supabase.from("recipe_steps").delete().eq("recipe_id", id)

        if (handleRateLimitError(deleteStepsError)) {
          throw new Error("Rate limit exceeded. Please try again later.")
        }

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

          if (handleRateLimitError(insertStepsError)) {
            throw new Error("Rate limit exceeded. Please try again later.")
          }

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

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (error) throw error

      // Update local state
      const updatedRecipes = recipes.filter((recipe) => recipe.id !== id)
      setRecipes(updatedRecipes)
    } catch (err) {
      console.error("Error deleting recipe:", err)
      throw err
    }
  }

  const value = {
    ingredients,
    orders,
    menuItems,
    recipes,
    users,
    roles,
    chefs,
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
    getRecipeById,
    getOrderById,
    refreshData,
    fetchIngredients,
    fetchOrders,
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

// Helper function to check if there is sufficient inventory for an order
const checkOrderInventory = (order: Order, recipes: Recipe[], ingredients: Ingredient[]) => {
  // Create a map of ingredient IDs to quantities
  const ingredientQuantities: { [ingredientId: number]: number } = {}

  // Iterate over the order items
  for (const item of order.items) {
    // Find the recipe for the menu item
    const recipe = recipes.find((r) => r.menu_item_id === item.menu_item_id)
    if (!recipe) {
      return { isOk: false, message: `Recipe not found for menu item ${item.menu_item_id}` }
    }

    // Iterate over the recipe ingredients
    for (const recipeIngredient of recipe.ingredients) {
      // Get the ingredient ID and quantity
      const ingredientId = recipeIngredient.ingredient_id
      const quantity = recipeIngredient.quantity_for_recipe * item.quantity

      // Add the quantity to the ingredient quantities map
      if (ingredientQuantities[ingredientId]) {
        ingredientQuantities[ingredientId] += quantity
      } else {
        ingredientQuantities[ingredientId] = quantity
      }
    }
  }

  // Iterate over the ingredient quantities map
  for (const ingredientId in ingredientQuantities) {
    // Get the ingredient
    const ingredient = ingredients.find((i) => i.id === Number(ingredientId))
    if (!ingredient) {
      return { isOk: false, message: `Ingredient not found for ID ${ingredientId}` }
    }

    // Check if there is sufficient quantity
    if (ingredient.quantity < ingredientQuantities[ingredientId]) {
      return { isOk: false, message: `Insufficient quantity for ingredient ${ingredient.name}` }
    }
  }

  // If all ingredients have sufficient quantity, return true
  return { isOk: true, message: "Sufficient inventory" }
}

// Helper function to update inventory for an order
const updateInventoryForOrder = (order: Order, recipes: Recipe[], ingredients: Ingredient[], add: boolean) => {
  // Iterate over the order items
  for (const item of order.items) {
    // Find the recipe for the menu item
    const recipe = recipes.find((r) => r.menu_item_id === item.menu_item_id)
    if (!recipe) {
      throw new Error(`Recipe not found for menu item ${item.menu_item_id}`)
    }

    // Iterate over the recipe ingredients
    for (const recipeIngredient of recipe.ingredients) {
      // Get the ingredient ID and quantity
      const ingredientId = recipeIngredient.ingredient_id
      const quantity = recipeIngredient.quantity_for_recipe * item.quantity

      // Find the ingredient
      const ingredient = ingredients.find((i) => i.id === ingredientId)
      if (!ingredient) {
        throw new Error(`Ingredient not found for ID ${ingredientId}`)
      }

      // Update the quantity
      ingredient.quantity = add ? ingredient.quantity + quantity : ingredient.quantity - quantity
    }
  }
}
