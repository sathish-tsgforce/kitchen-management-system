import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Use environment variables for the Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance of the Supabase client for direct import
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable session persistence to avoid multiple auth instances
  },
})

// Server-side only code - this will not be included in client bundles
let supabaseAdmin: ReturnType<typeof createSupabaseClient<Database>> | null = null

// This function should only be called from server components or API routes
export function getAdminClient() {
  if (typeof window !== "undefined") {
    console.error("getAdminClient() should not be called on the client side")
    return null
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
    return null
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  return supabaseAdmin
}
