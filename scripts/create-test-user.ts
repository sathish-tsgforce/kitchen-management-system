import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or service role key")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
  try {
    // Create a test user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "test@example.com",
      password: "password123",
      email_confirm: true,
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return
    }

    console.log("Created auth user:", authData.user)

    // Insert the user data in our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: "test@example.com",
        name: "Test User",
        role_id: 1, // Admin role
      })
      .select()

    if (userError) {
      console.error("Error inserting user:", userError)
      return
    }

    console.log("Inserted user data:", userData)
    console.log("Test user created successfully!")
    console.log("Email: test@example.com")
    console.log("Password: password123")
  } catch (error) {
    console.error("Error creating test user:", error)
  }
}

createTestUser()
