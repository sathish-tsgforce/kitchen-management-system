// API functions for recipes
import { supabase } from "@/lib/api/supabase"
import type { Recipe, RecipeIngredient, RecipeStep } from "@/lib/types"
import { deleteFile } from "@/lib/utils/storage"

// Helper function to ensure quantity_for_recipe is a valid number
function extractNumericValue(quantityString: string): number {
  if (typeof quantityString === "number") return quantityString

  const numericValue = Number.parseFloat(quantityString.replace(/[^0-9.]/g, ""))
  return !isNaN(numericValue) ? numericValue : 0
}

// Helper function to extract unit part from quantity string
function extractUnitPart(quantityString: string): string {
  return quantityString.replace(/[0-9.]/g, "").trim()
}

// Helper function to delete media files associated with a step
async function deleteStepMediaFiles(step: RecipeStep) {
  try {
    const promises = []

    if (step.image_url) {
      promises.push(deleteFile(step.image_url))
    }

    if (step.audio_url) {
      promises.push(deleteFile(step.audio_url))
    }

    await Promise.all(promises)
  } catch (error) {
    console.error("Error deleting step media files:", error)
    // Continue with deletion even if file cleanup fails
  }
}

export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    console.log("Fetching recipes...")
    const { data: recipesData, error: recipesError } = await supabase.from("recipes").select("*, menu_items(id, name)")

    if (recipesError) {
      console.error("Error fetching recipes:", recipesError)
      throw recipesError
    }

    console.log(`Fetched ${recipesData.length} recipes`)

    const fullRecipes: Recipe[] = []

    for (const recipe of recipesData) {
      // Fetch recipe ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .select("*, ingredients(id, name, unit)")
        .eq("recipe_id", recipe.id)

      if (ingredientsError) {
        console.error("Error fetching ingredients for recipe:", recipe.id, ingredientsError)
        throw ingredientsError
      }

      // Fetch recipe steps
      const { data: stepsData, error: stepsError } = await supabase
        .from("recipe_steps")
        .select("*")
        .eq("recipe_id", recipe.id)
        .order("step_number", { ascending: true })

      if (stepsError) {
        console.error("Error fetching steps for recipe:", recipe.id, stepsError)
        throw stepsError
      }

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

    return fullRecipes
  } catch (err) {
    console.error("Error in fetchRecipes:", err)
    throw err
  }
}

export async function fetchRecipeById(id: number): Promise<Recipe | null> {
  try {
    console.log(`Fetching recipe with ID: ${id}`)
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .select("*, menu_items(id, name)")
      .eq("id", id)
      .single()

    if (recipeError) {
      console.error("Error fetching recipe:", id, recipeError)
      throw recipeError
    }

    if (!recipeData) {
      console.log(`Recipe with ID ${id} not found`)
      return null
    }

    // Fetch recipe ingredients
    const { data: ingredientsData, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select("*, ingredients(id, name, unit)")
      .eq("recipe_id", id)

    if (ingredientsError) {
      console.error("Error fetching ingredients for recipe:", id, ingredientsError)
      throw ingredientsError
    }

    // Fetch recipe steps
    const { data: stepsData, error: stepsError } = await supabase
      .from("recipe_steps")
      .select("*")
      .eq("recipe_id", id)
      .order("step_number", { ascending: true })

    if (stepsError) {
      console.error("Error fetching steps for recipe:", id, stepsError)
      throw stepsError
    }

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

    console.log("Successfully fetched recipe:", fullRecipe.name)
    return fullRecipe
  } catch (err) {
    console.error("Error in fetchRecipeById:", err)
    throw err
  }
}

// Check if a recipe already exists for a menu item
export async function checkRecipeExistsForMenuItem(menuItemId: number): Promise<boolean> {
  try {
    const { data, error, count } = await supabase
      .from("recipes")
      .select("id", { count: "exact" })
      .eq("menu_item_id", menuItemId)

    if (error) {
      console.error("Error checking if recipe exists:", error)
      throw error
    }

    return count !== null && count > 0
  } catch (err) {
    console.error("Error in checkRecipeExistsForMenuItem:", err)
    throw err
  }
}

export async function createRecipe(recipe: Omit<Recipe, "id" | "name">): Promise<number> {
  try {
    console.log("Creating new recipe:", recipe)

    // Check if a recipe already exists for this menu item
    const recipeExists = await checkRecipeExistsForMenuItem(recipe.menu_item_id)
    if (recipeExists) {
      throw new Error(`A recipe already exists for this menu item. Please edit the existing recipe instead.`)
    }

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

    if (recipeError) {
      console.error("Error creating recipe:", recipeError)

      // Handle unique constraint violation with a more user-friendly message
      if (recipeError.code === "23505" && recipeError.message.includes("recipes_menu_item_id_key")) {
        throw new Error("A recipe already exists for this menu item. Please edit the existing recipe instead.")
      }

      throw recipeError
    }

    if (!recipeData || recipeData.length === 0) {
      console.error("Failed to create recipe: No data returned")
      throw new Error("Failed to create recipe")
    }

    const newRecipeId = recipeData[0].id
    console.log(`Created recipe with ID: ${newRecipeId}`)

    // Insert recipe ingredients
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      console.log(`Adding ${recipe.ingredients.length} ingredients to recipe ${newRecipeId}`)

      const recipeIngredients = recipe.ingredients.map((ingredient) => {
        const quantityForRecipe = extractNumericValue(ingredient.quantity)
        console.log(`Ingredient: ${ingredient.name}, Quantity: ${quantityForRecipe}`)

        return {
          recipe_id: newRecipeId,
          ingredient_id: ingredient.ingredient_id,
          quantity_for_recipe: quantityForRecipe,
        }
      })

      const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(recipeIngredients)

      if (ingredientsError) {
        console.error("Error adding ingredients to recipe:", ingredientsError)
        throw ingredientsError
      }
    }

    // Insert recipe steps
    if (recipe.steps && recipe.steps.length > 0) {
      console.log(`Adding ${recipe.steps.length} steps to recipe ${newRecipeId}`)

      const recipeSteps = recipe.steps.map((step) => ({
        recipe_id: newRecipeId,
        step_number: step.step_number,
        instruction: step.instruction,
        image_url: step.image_url || null,
        audio_url: step.audio_url || null,
      }))

      const { error: stepsError } = await supabase.from("recipe_steps").insert(recipeSteps)

      if (stepsError) {
        console.error("Error adding steps to recipe:", stepsError)
        throw stepsError
      }
    }

    console.log("Recipe created successfully")
    return newRecipeId
  } catch (err) {
    console.error("Error in createRecipe:", err)
    throw err
  }
}

export async function updateRecipe(id: number, recipeUpdates: Partial<Recipe>): Promise<void> {
  try {
    console.log(`Updating recipe with ID: ${id}`, recipeUpdates)

    // If menu_item_id is being updated, check if another recipe already uses it
    if (recipeUpdates.menu_item_id !== undefined) {
      const { data, error, count } = await supabase
        .from("recipes")
        .select("id", { count: "exact" })
        .eq("menu_item_id", recipeUpdates.menu_item_id)
        .neq("id", id)

      if (error) {
        console.error("Error checking menu item usage:", error)
        throw error
      }

      if (count !== null && count > 0) {
        throw new Error("This menu item already has a recipe associated with it. Please choose a different menu item.")
      }
    }

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

      console.log("Updating recipe basic info:", updateData)
      const { error: updateError } = await supabase.from("recipes").update(updateData).eq("id", id)

      if (updateError) {
        console.error("Error updating recipe basic info:", updateError)

        // Handle unique constraint violation with a more user-friendly message
        if (updateError.code === "23505" && updateError.message.includes("recipes_menu_item_id_key")) {
          throw new Error(
            "This menu item already has a recipe associated with it. Please choose a different menu item.",
          )
        }

        throw updateError
      }
    }

    // Update ingredients if provided
    if (recipeUpdates.ingredients) {
      console.log(`Updating ${recipeUpdates.ingredients.length} ingredients for recipe ${id}`)

      // Delete existing ingredients
      console.log(`Deleting existing ingredients for recipe ${id}`)
      const { error: deleteIngredientsError } = await supabase.from("recipe_ingredients").delete().eq("recipe_id", id)

      if (deleteIngredientsError) {
        console.error("Error deleting existing ingredients:", deleteIngredientsError)
        throw deleteIngredientsError
      }

      // Insert new ingredients
      if (recipeUpdates.ingredients.length > 0) {
        const recipeIngredients = recipeUpdates.ingredients.map((ingredient) => {
          const quantityForRecipe = extractNumericValue(ingredient.quantity)
          console.log(`Ingredient: ${ingredient.name}, Quantity: ${quantityForRecipe}`)

          return {
            recipe_id: id,
            ingredient_id: ingredient.ingredient_id,
            quantity_for_recipe: quantityForRecipe,
          }
        })

        console.log("Inserting new ingredients:", recipeIngredients)
        const { error: insertIngredientsError } = await supabase.from("recipe_ingredients").insert(recipeIngredients)

        if (insertIngredientsError) {
          console.error("Error inserting new ingredients:", insertIngredientsError)
          throw insertIngredientsError
        }
      }
    }

    // Update steps if provided
    if (recipeUpdates.steps) {
      console.log(`Updating ${recipeUpdates.steps.length} steps for recipe ${id}`)

      // Fetch existing steps to delete their media files
      const { data: existingSteps, error: fetchStepsError } = await supabase
        .from("recipe_steps")
        .select("*")
        .eq("recipe_id", id)

      if (fetchStepsError) {
        console.error("Error fetching existing steps:", fetchStepsError)
        throw fetchStepsError
      }

      // Delete media files for steps that are being removed or updated
      if (existingSteps) {
        for (const step of existingSteps) {
          // Check if this step is being kept (by id)
          const isStepKept = recipeUpdates.steps.some(
            (updatedStep) =>
              updatedStep.id === step.id &&
              updatedStep.image_url === step.image_url &&
              updatedStep.audio_url === step.audio_url,
          )

          if (!isStepKept) {
            await deleteStepMediaFiles(step)
          }
        }
      }

      // Delete existing steps
      console.log(`Deleting existing steps for recipe ${id}`)
      const { error: deleteStepsError } = await supabase.from("recipe_steps").delete().eq("recipe_id", id)

      if (deleteStepsError) {
        console.error("Error deleting existing steps:", deleteStepsError)
        throw deleteStepsError
      }

      // Insert new steps
      if (recipeUpdates.steps.length > 0) {
        const recipeSteps = recipeUpdates.steps.map((step) => ({
          recipe_id: id,
          step_number: step.step_number,
          instruction: step.instruction,
          image_url: step.image_url || null,
          audio_url: step.audio_url || null,
        }))

        console.log("Inserting new steps:", recipeSteps)
        const { error: insertStepsError } = await supabase.from("recipe_steps").insert(recipeSteps)

        if (insertStepsError) {
          console.error("Error inserting new steps:", insertStepsError)
          throw insertStepsError
        }
      }
    }

    console.log("Recipe updated successfully")
  } catch (err) {
    console.error("Error in updateRecipe:", err)
    throw err
  }
}

export async function deleteRecipe(id: number): Promise<void> {
  try {
    console.log(`Deleting recipe with ID: ${id}`)

    // Fetch recipe steps to delete their media files
    const { data: steps, error: stepsError } = await supabase.from("recipe_steps").select("*").eq("recipe_id", id)

    if (stepsError) {
      console.error("Error fetching steps for deletion:", stepsError)
      throw stepsError
    }

    // Delete media files for all steps
    if (steps && steps.length > 0) {
      console.log(`Deleting media files for ${steps.length} steps`)
      for (const step of steps) {
        await deleteStepMediaFiles(step)
      }
    }

    // Delete recipe (cascade will delete ingredients and steps)
    const { error } = await supabase.from("recipes").delete().eq("id", id)

    if (error) {
      console.error("Error deleting recipe:", error)
      throw error
    }

    console.log("Recipe deleted successfully")
  } catch (err) {
    console.error("Error in deleteRecipe:", err)
    throw err
  }
}

// Fetch recipes by menu item ID
export async function fetchRecipeByMenuItemId(menuItemId: number): Promise<Recipe | null> {
  try {
    console.log(`Fetching recipe for menu item ID: ${menuItemId}`)
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .select("id")
      .eq("menu_item_id", menuItemId)
      .single()

    if (recipeError) {
      if (recipeError.code === "PGRST116") {
        // No recipe found for this menu item
        return null
      }
      console.error("Error fetching recipe by menu item ID:", recipeError)
      throw recipeError
    }

    if (!recipeData) {
      return null
    }

    // Use the existing fetchRecipeById function to get the full recipe
    return await fetchRecipeById(recipeData.id)
  } catch (err) {
    console.error("Error in fetchRecipeByMenuItemId:", err)
    throw err
  }
}
