// API functions for ingredients
import { supabase } from "@/lib/supabase"
import type { Ingredient } from "@/lib/types"

export async function fetchIngredients(): Promise<Ingredient[]> {
  try {
    const { data, error } = await supabase
      .from("ingredients")
      .select(`
        *,
        location:locations(id, name)
      `)

    if (error) throw error
    return data as Ingredient[]
  } catch (err) {
    console.error("Error fetching ingredients:", err)
    return []
  }
}

export async function addIngredient(ingredient: Omit<Ingredient, "id">): Promise<Ingredient | null> {
  try {
    // Ensure we're not sending an ID
    const { id, ...ingredientWithoutId } = ingredient as any

    console.log("Adding ingredient without ID:", ingredientWithoutId)
    
    // Check if an ingredient with the same name exists in the same location
    const { data: existingData, error: checkError } = await supabase
      .from("ingredients")
      .select("id")
      .eq("name", ingredientWithoutId.name)
      .eq("location_id", ingredientWithoutId.location_id)
      .limit(1)

    if (checkError) {
      console.error("Error checking for existing ingredient:", checkError)
    }

    // If ingredient with same name exists in the same location, throw an error
    if (existingData && existingData.length > 0) {
      throw new Error(`An ingredient with name "${ingredientWithoutId.name}" already exists in this location.`)
    }

    // Use insert with onConflict to handle potential duplicates
    const { data, error } = await supabase
      .from("ingredients")
      .insert([ingredientWithoutId])
      .select(`
        *,
        location:locations(id, name)
      `)

    if (error) {
      console.error("Supabase error details:", error)
      throw error
    }

    return data && data.length > 0 ? (data[0] as Ingredient) : null
  } catch (err) {
    console.error("Error adding ingredient:", err)
    throw err
  }
}

export async function updateIngredient(id: number, updatedFields: Partial<Ingredient>): Promise<Ingredient | null> {
  try {
    // Ensure we're not trying to update the ID
    const { id: _, ...fieldsWithoutId } = updatedFields as any

    const { data, error } = await supabase
      .from("ingredients")
      .update(fieldsWithoutId)
      .eq("id", id)
      .select(`
        *,
        location:locations(id, name)
      `)
      .single()
      
    if (error) throw error
    return data as Ingredient
  } catch (err) {
    console.error("Error updating ingredient:", err)
    throw err
  }
}

export async function deleteIngredient(id: number): Promise<void> {
  try {
    const { error } = await supabase.from("ingredients").delete().eq("id", id)
    if (error) throw error
  } catch (err) {
    console.error("Error deleting ingredient:", err)
    throw err
  }
}