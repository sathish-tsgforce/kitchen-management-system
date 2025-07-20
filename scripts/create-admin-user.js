// CommonJS version of the admin user creation script
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = require("dotenv").parse(fs.readFileSync(envPath));
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
  console.log("Loaded environment variables from .env.local");
} else {
  console.log(".env.local file not found, falling back to .env");
  require("dotenv").config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or service role key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser(email, password) {
  try {
    if (!email || !password) {
      console.error("Email and password are required");
      console.log("Usage: npm run create-admin -- email@example.com YourPassword123");
      return;
    }

    // Get the Admin role ID
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "Admin")
      .single();

    if (roleError) {
      console.error("Error fetching Admin role:", roleError);
      return;
    }

    if (!roleData) {
      console.error("Admin role not found in the database");
      return;
    }

    const adminRoleId = roleData.id;
    console.log("Found Admin role with ID:", adminRoleId);

    // Create admin user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      display_name: "Admin User",
      password: password,
      email_confirm: true,
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return;
    }

    console.log("Created auth user:", authData.user);

    // Insert the user data in our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        role_id: adminRoleId,
      })
      .select();

    if (userError) {
      console.error("Error inserting user:", userError);
      return;
    }

    console.log("Inserted user data:", userData);
    console.log("Admin user created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

createAdminUser(email, password);