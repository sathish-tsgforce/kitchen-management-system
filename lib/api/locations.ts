import { createClient } from "@/lib/supabase"
import type { Location } from "@/lib/types"

// Use TypeScript utility types for insert and update operations
type LocationInsert = Omit<Location, 'id'> & { id?: number }
type LocationUpdate = Partial<Location>

export async function getLocations() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("name")

  if (error) {
    console.error("Error fetching locations:", error)
    throw error
  }

  return data
}

export async function getLocation(id: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching location with id ${id}:`, error)
    throw error
  }

  return data
}

export async function createLocation(location: LocationInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("locations")
    .insert(location)
    .select()
    .single()

  if (error) {
    console.error("Error creating location:", error)
    throw error
  }

  return data
}

export async function updateLocation(id: number, location: LocationUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("locations")
    .update(location)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating location with id ${id}:`, error)
    throw error
  }

  return data
}

export async function deleteLocation(id: number) {
  const supabase = createClient()
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(`Error deleting location with id ${id}:`, error)
    throw error
  }

  return true
}