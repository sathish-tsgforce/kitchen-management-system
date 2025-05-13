import { createClient } from "@/lib/supabase"
import fs from "fs"
import path from "path"

async function setupDatabase() {
  try {
    console.log("Setting up database...")
    const supabase = createClient()

    // Read the SQL files
    const usersRolesSQL = fs.readFileSync(path.join(process.cwd(), "schema", "users-roles.sql"), "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql: usersRolesSQL })

    if (error) {
      console.error("Error setting up database:", error)
      throw error
    }

    console.log("Database setup complete!")

    // Verify roles exist
    const { data: roles, error: rolesError } = await supabase.from("roles").select("*")

    if (rolesError) {
      console.error("Error verifying roles:", rolesError)
      throw rolesError
    }

    console.log("Roles in database:", roles)
  } catch (error) {
    console.error("Setup failed:", error)
    process.exit(1)
  }
}

setupDatabase()
