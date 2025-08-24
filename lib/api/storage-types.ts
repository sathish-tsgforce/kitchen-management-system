// API functions for storage types
import { supabase } from "@/lib/supabase"
import type { StorageType } from "@/lib/types"

export async function fetchStorageTypes(): Promise<StorageType[]> {
  try {
    const { data, error } = await supabase
      .from("storage_types")
      .select("*")
      .order("name")

    if (error) throw error
    return data as StorageType[]
  } catch (err) {
    console.error("Error fetching storage types:", err)
    return []
  }
}

export async function addStorageType(storageType: Omit<StorageType, "id">): Promise<StorageType | null> {
  try {
    // Check if storage type with same name already exists
    const { data: existingData, error: checkError } = await supabase
      .from("storage_types")
      .select("id")
      .eq("name", storageType.name)
      .limit(1)

    if (checkError) {
      console.error("Error checking for existing storage type:", checkError)
    }

    if (existingData && existingData.length > 0) {
      throw new Error(`A storage type with name "${storageType.name}" already exists.`)
    }

    const { data, error } = await supabase
      .from("storage_types")
      .insert([storageType])
      .select()
      .single()

    if (error) {
      console.error("Supabase error details:", error)
      throw error
    }

    return data as StorageType
  } catch (err) {
    console.error("Error adding storage type:", err)
    throw err
  }
}

export async function updateStorageType(id: number, updatedFields: Partial<StorageType>): Promise<StorageType | null> {
  try {
    // Ensure we're not trying to update the ID
    const { id: _, ...fieldsWithoutId } = updatedFields as any

    const { data, error } = await supabase
      .from("storage_types")
      .update(fieldsWithoutId)
      .eq("id", id)
      .select()
      .single()
      
    if (error) throw error
    return data as StorageType
  } catch (err) {
    console.error("Error updating storage type:", err)
    throw err
  }
}

export async function deleteStorageType(id: number): Promise<void> {
  try {
    // Check if storage type is in use by any ingredients
    const { data: ingredientsUsingType, error: checkError } = await supabase
      .from("ingredients")
      .select("id")
      .eq("storage_type_id", id)
      .limit(1)

    if (checkError) {
      console.error("Error checking storage type usage:", checkError)
    }

    if (ingredientsUsingType && ingredientsUsingType.length > 0) {
      throw new Error("Cannot delete storage type that is currently in use by ingredients.")
    }

    const { error } = await supabase
      .from("storage_types")
      .delete()
      .eq("id", id)
      
    if (error) throw error
  } catch (err) {
    console.error("Error deleting storage type:", err)
    throw err
  }
}
