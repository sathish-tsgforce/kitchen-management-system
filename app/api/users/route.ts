import { NextResponse } from "next/server"
import { supabase, getAdminClient } from "@/lib/supabase"
import { createHash } from "crypto"

// Helper function to hash passwords
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export async function GET() {
  try {
    console.log("[API] GET /api/users: Fetching users with roles")

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        name,
        role_id,
        role:roles(id, name)
      `)
      .order("name")

    if (error) {
      console.error("[API] GET /api/users: Database error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      return NextResponse.json(
        {
          error: "Failed to fetch users",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 },
      )
    }

    // Transform the data to match the expected format
    const transformedData = data.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role_id: user.role_id,
      role: user.role ? user.role[0]?.name : null,
    }))

    console.log(`[API] GET /api/users: Successfully fetched ${transformedData.length} users`)
    return NextResponse.json(transformedData)
  } catch (error: any) {
    console.error("[API] GET /api/users: Unhandled exception:", {
      message: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json()
    console.log("[API] POST /api/users: Creating new user")

    const { email, password, name, role_id } = userData

    // Validate required fields
    if (!email || !password || !name || role_id === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Hash the password for database storage
    // NOTE: This is not for auth, just to satisfy the database constraint
    const hashedPassword = hashPassword(password)

    // Check if we have the admin client available
    const adminClient = getAdminClient()
    if (adminClient) {
      console.log("[API] POST /api/users: Using admin client to create user")

      // Create user with admin client
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-verify the email
        user_metadata: { name },
      })

      if (authError) {
        console.error("[API] POST /api/users: Admin auth error:", {
          message: authError.message,
          details: authError.details,
        })

        return NextResponse.json(
          {
            error: "Failed to create user in auth system",
            details: authError.message,
          },
          { status: 500 },
        )
      }

      if (!authData.user) {
        return NextResponse.json({ error: "Failed to create user in auth system" }, { status: 500 })
      }

      console.log("[API] POST /api/users: User created in auth system")

      // Now insert the user into our users table
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email,
          name,
          role_id,
          password: hashedPassword, // Include the hashed password
        })
        .select(`
          id,
          email,
          name,
          role_id,
          role:roles(id, name)
        `)
        .single()

      if (error) {
        console.error("[API] POST /api/users: Database error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })

        // Try to clean up the auth user if the database insert fails
        try {
          await adminClient.auth.admin.deleteUser(authData.user.id)
          console.log("[API] POST /api/users: Cleaned up auth user after database error")
        } catch (cleanupError) {
          console.error("[API] POST /api/users: Failed to clean up auth user after database error:", cleanupError)
        }

        return NextResponse.json(
          {
            error: "Failed to create user in database",
            details: error.message,
            hint: error.hint,
            code: error.code,
          },
          { status: 500 },
        )
      }

      // Transform the data to match the expected format
      const transformedData = {
        id: data.id,
        email: data.email,
        name: data.name,
        role_id: data.role_id,
        role: data.role ? data.role[0]?.name : null,
      }

      console.log("[API] POST /api/users: User created successfully")
      return NextResponse.json(transformedData)
    } else {
      // Fallback to regular signup if admin client is not available
      console.log("[API] POST /api/users: Admin client not available, using regular signup")

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${new URL(request.url).origin}/login`,
        },
      })

      if (authError) {
        console.error("[API] POST /api/users: Auth error:", {
          message: authError.message,
          details: authError.details,
        })

        return NextResponse.json(
          {
            error: "Failed to create user in auth system",
            details: authError.message,
          },
          { status: 500 },
        )
      }

      if (!authData.user) {
        return NextResponse.json({ error: "Failed to create user in auth system" }, { status: 500 })
      }

      console.log("[API] POST /api/users: User created in auth system")

      // Now insert the user into our users table
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email,
          name,
          role_id,
          password: hashedPassword, // Include the hashed password
        })
        .select(`
          id,
          email,
          name,
          role_id,
          role:roles(id, name)
        `)
        .single()

      if (error) {
        console.error("[API] POST /api/users: Database error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })

        return NextResponse.json(
          {
            error: "Failed to create user in database",
            details: error.message,
            hint: error.hint,
            code: error.code,
          },
          { status: 500 },
        )
      }

      // Transform the data to match the expected format
      const transformedData = {
        id: data.id,
        email: data.email,
        name: data.name,
        role_id: data.role_id,
        role: data.role ? data.role[0]?.name : null,
      }

      console.log("[API] POST /api/users: User created successfully with verification required:", transformedData)
      return NextResponse.json({
        ...transformedData,
        warning:
          "User created but email verification is required. The user will need to verify their email before they can log in.",
      })
    }
  } catch (error: any) {
    console.error("[API] POST /api/users: Unhandled exception:", {
      message: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
