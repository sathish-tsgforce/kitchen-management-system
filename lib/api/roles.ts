// API functions for roles
import { supabase } from "@/lib/supabase"
import type { Role as UserRole } from "@/lib/types"

export async function fetchRoles(): Promise<UserRole[]> {
  try {
    const { data, error } = await supabase.from("roles").select("*")
    if (error) throw error
    return data as UserRole[]
  } catch (err) {
    console.error("Error fetching roles:", err)
    return []
  }
}

export async function getRoleByName(name: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .ilike("name", name)
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      throw error
    }
    
    return data as UserRole
  } catch (err) {
    console.error(`Error fetching role by name "${name}":`, err)
    return null
  }
}