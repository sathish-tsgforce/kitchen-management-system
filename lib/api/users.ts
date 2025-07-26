// API functions for users
import { supabase, supabaseAdmin } from "@/lib/supabase"
import type { User } from "@/lib/types"

// SERVER-SIDE ONLY - This function uses the admin client and should never be called directly from the browser
export async function fetchUsers(): Promise<User[]> {
  try {
    // First, get users from the database with their roles and locations
    const { data: dbUsers, error } = await supabase
      .from("users")
      .select(`
        id,
        role_id,
        role:roles(id, name),
        location_id,
        location:locations(id, name)
      `)

    if (error) throw error
    
    // If we have admin client, get user details from auth
    if (supabaseAdmin) {
      try {
        // Get all users from auth
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (authError) {
          console.error("Error fetching auth users:", authError)
          throw authError
        }
      
      // Combine the data
      return dbUsers.map(dbUser => {
        const authUser = authUsers.users.find(u => u.id === dbUser.id)
        return {
          id: dbUser.id,
          email: authUser?.email || "Unknown",
          name: authUser?.user_metadata?.name || authUser?.email || "Unknown",
          role_id: dbUser.role_id,
          role: dbUser.role,
          location_id: dbUser.location_id,
          location: dbUser.location
        }
      })
      } catch (adminError) {
        console.error("Error using admin client:", adminError)
        console.warn("Falling back to database-only user data")
        // Fall back to database-only data
        return dbUsers.map(user => ({
          id: user.id,
          email: "Unknown (admin access error)",
          name: "Unknown (admin access error)",
          role_id: user.role_id,
          role: user.role,
          location_id: user.location_id,
          location: user.location
        }))
      }
    } else {
      // Fallback if no admin client
      console.warn("No admin client available, user email and name may be missing")
      return dbUsers.map(user => ({
        id: user.id,
        email: "Unknown", // No access to auth data
        name: "Unknown", // No access to auth data
        role_id: user.role_id,
        role: user.role,
        location_id: user.location_id,
        location: user.location
      }))
    }
  } catch (err) {
    console.error("Error fetching users:", err)
    return []
  }
}

export async function fetchRoles() {
  try {
    const { data, error } = await supabase.from("roles").select("*")
    if (error) throw error
    return data
  } catch (err) {
    console.error("Error fetching roles:", err)
    return []
  }
}

export async function createUser(userData: Omit<User, "id">): Promise<User | null> {
  try {
    console.log("Creating new user:", { ...userData, password: "[REDACTED]" })
    
    // Check if we have admin client
    if (!supabaseAdmin) {
      throw new Error("Admin client not available. Cannot create user.")
    }
    
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password || generateRandomPassword(),
      email_confirm: true,
      user_metadata: { name: userData.name }
    })

    if (authError) throw authError

    // Create user record
    const { data, error } = await supabase
      .from("users")
      .insert([{
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role_id: userData.role_id,
        location_id: userData.location_id
      }])
      .select(`
        *,
        role:roles(id, name),
        location:locations(id, name)
      `)
      .single()

    if (error) throw error
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role_id: data.role_id,
      role: data.role?.name,
      location_id: data.location_id,
      location: data.location ? {
        id: data.location.id,
        name: data.location.name
      } : undefined
    }
  } catch (err) {
    console.error("Error creating user:", err)
    throw err
  }
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  try {
    console.log("Updating user with ID:", id, "Data:", userData)
    
    // Update user metadata in auth if we have admin client and name is provided
    if (supabaseAdmin && userData.name) {
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          id,
          { user_metadata: { name: userData.name } }
        )
        
        if (authError) {
          console.warn("Error updating user metadata in auth:", authError)
          // Continue anyway, as we still want to update the database record
        }
      } catch (authErr) {
        console.warn("Exception updating user in auth:", authErr)
        // Continue anyway, as we still want to update the database record
      }
    }
    
    // Update user record in database
    const { data, error } = await supabase
      .from("users")
      .update({
        role_id: userData.role_id,
        location_id: userData.location_id
      })
      .eq("id", id)
      .select(`
        *,
        role:roles(id, name),
        location:locations(id, name)
      `)
      .single()

    if (error) throw error
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role_id: data.role_id,
      role: data.role?.name,
      location_id: data.location_id,
      location: data.location ? {
        id: data.location.id,
        name: data.location.name
      } : undefined
    }
  } catch (err) {
    console.error("Error updating user:", err)
    throw err
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    console.log("Deleting user with ID:", id)
    
    // Delete user from auth if we have admin client
    if (supabaseAdmin) {
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
        if (authError) {
          console.warn("Error deleting user from auth:", authError)
          // Continue anyway, as we still want to delete the database record
        }
      } catch (authErr) {
        console.warn("Exception deleting user from auth:", authErr)
        // Continue anyway, as we still want to delete the database record
      }
    } else {
      console.warn("No admin client available, skipping auth user deletion")
    }

    // Delete user record
    const { error } = await supabase.from("users").delete().eq("id", id)
    if (error) throw error
  } catch (err) {
    console.error("Error deleting user:", err)
    throw err
  }
}

// Helper function to generate a random password
function generateRandomPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}