import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Use environment variables for the Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Enhanced createClient function with debugging
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase] Missing environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
    throw new Error("Missing Supabase environment variables")
  }

  console.log("[Supabase] Creating client with URL:", supabaseUrl.substring(0, 30) + "...")

  try {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })

    console.log("[Supabase] Client created successfully")
    return client
  } catch (error) {
    console.error("[Supabase] Error creating client:", error)
    throw error
  }
}

// Create a single instance of the Supabase client for direct import
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable session persistence to avoid multiple auth instances
  },
})

// Create an admin client with service role key for admin operations
export const supabaseAdmin = supabaseServiceKey
  ? createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })
  : null
