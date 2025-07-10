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

      const { data, error } = await supabase
        .from("ingredients")
        .select(`
          *,
          location:locations(id, name)
        `)

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

      console.log("Adding ingredient without ID:", ingredientWithoutId)

      // First check if an ingredient with the same name already exists
      const { data: existingData, error: checkError } = await supabase
        .from("ingredients")
        .select("id")
        .eq("name", ingredientWithoutId.name)
        .limit(1)

      if (checkError) {
        console.error("Error checking for existing ingredient:", checkError)
      }

      // If ingredient with same name exists, update it instead
      if (existingData && existingData.length > 0) {
        const existingId = existingData[0].id
        console.log(
          `Ingredient with name "${ingredientWithoutId.name}" already exists with ID ${existingId}, updating instead`,
        )

        const { error: updateError } = await supabase
          .from("ingredients")
          .update(ingredientWithoutId)
          .eq("id", existingId)

        if (updateError) throw updateError

        // Refresh ingredients to ensure consistency
        await fetchIngredients()
        return
      }

      // Otherwise, insert new ingredient
      const { data, error } = await supabase
        .from("ingredients")
        .insert([ingredientWithoutId])
        .select(`
          *,
          location:locations(id, name)
        `)

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (error) {
        console.error("Error details:", error)
        throw error
      }

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
      const { data, error } = await supabase
        .from("ingredients")
        .update(updatedFields)
        .eq("id", id)
        .select(`
          *,
          location:locations(id, name)
        `)
        .single()

      if (handleRateLimitError(error)) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }

      if (error) throw error

      // Update local state with the returned data that includes location info
      if (data) {
        const updatedIngredients = ingredients.map((ingredient) =>
          ingredient.id === id ? data as Ingredient : ingredient,
        )
        setIngredients(updatedIngredients)
      } else {
        // Fallback to the old way if no data returned
        const updatedIngredients = ingredients.map((ingredient) =>
          ingredient.id === id ? { ...ingredient, ...updatedFields } : ingredient,
        )
        setIngredients(updatedIngredients)
      }

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
    getRecipeById,
    getOrderById,
    refreshData,
    fetchIngredients,
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
