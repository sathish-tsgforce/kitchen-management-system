import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or service role key")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log("Setting up database...")
    // Read all .sql files in the schema directory
    const schemaDir = path.join(process.cwd(), "schema")
    const sqlFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith(".sql"))

    for (const file of sqlFiles) {
      const sql = fs.readFileSync(path.join(schemaDir, file), "utf8")
      console.log(`Executing ${file}...`)
      const { error } = await supabase.rpc('execute_sql', { sql });
      if (error) {
        console.error(`Error executing ${file}:`, error)
        throw error
      }
      console.log(`${file} executed successfully.`)
    }

    console.log("All SQL scripts executed!")

  } catch (error) {
    console.error("Setup failed:", error)
    process.exit(1)
  }
}

setupDatabase()
