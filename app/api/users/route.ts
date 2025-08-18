import { NextResponse } from "next/server"
import { supabase,supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("[API] GET /api/users: Fetching users with roles")

    // If we have admin client, get user details from auth
    if (supabaseAdmin) {
      try {
        // Get all users from auth
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

        if (authError) {
          console.error("[API] GET /api/users: Auth error:", {
            message: authError.message
          })

          return NextResponse.json(
            {
              error: "Failed to fetch users from auth system",
              details: authError.message,
            },
            { status: 500 },
          )
        }

        // First get all users from the database with their roles and locations
        const { data: dbUsers, error: dbError } = await supabase
          .from("users")
          .select(`
            id,
            role_id,
            role:roles(id, name),
            location_id,
            location:locations(id, name, address, is_active)
          `)

        if (dbError) {
          console.error("[API] GET /api/users: Database error:", {
            message: dbError.message,
            details: dbError.details,
            hint: dbError.hint,
            code: dbError.code,
          })

          return NextResponse.json(
            {
              error: "Failed to fetch users",
              details: dbError.message,
              hint: dbError.hint,
              code: dbError.code,
            },
            { status: 500 },
          )
        }

        // Combine the data
        const combinedUsers = dbUsers.map(dbUser => {
          const authUser = authUsers.users.find(u => u.id === dbUser.id)
          return {
            id: dbUser.id,
            email: authUser?.email || "Unknown",
            name: authUser?.user_metadata?.name || authUser?.email || "Unknown",
            role_id: dbUser.role_id,
            role: dbUser.role ? dbUser.role[0] : null,
            location_id: dbUser.location_id,
            location: dbUser.location && dbUser.location.length > 0 ? dbUser.location[0] : null,
          }
        })

        console.log(`[API] GET /api/users: Successfully fetched ${combinedUsers.length} users`)
        return NextResponse.json(combinedUsers)
      } catch (authError: any) {
        console.error("[API] GET /api/users: Auth error:", {
          message: authError.message,
          stack: authError.stack,
        })

        return NextResponse.json(
          {
            error: "Unauthorized access",
          },
          { status: 401 },
        )
      }
    } else {
      return NextResponse.json(
          {
            error: "Unauthorized access",
          },
          { status: 401 },
        )
    }
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
    console.log("[API] POST /api/users: Creating new user:", {
      ...userData,
      password: userData.password ? "********" : undefined,
    })

    const { email, password, name, role_id, location_id } = userData

    // Validate required fields
    if (!email || !password || !name || role_id === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if we have the admin client available
    if (supabaseAdmin) {
      console.log("[API] POST /api/users: Using admin client to create user")

      // Create user with admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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

      console.log("[API] POST /api/users: User created in auth system:", authData.user.id)

      // Now insert the user into our users table with just role_id and location_id
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          role_id,
          location_id
        })
        .select(`
          id,
          role_id,
          location_id
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
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
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

      // Combine auth and DB data
      const transformedData = {
        id: data.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || authData.user.email,
        role_id: data.role_id,
        location_id: data.location_id
      }

      console.log("[API] POST /api/users: User created successfully:", transformedData)
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

      console.log("[API] POST /api/users: User created in auth system:", authData.user.id)

      // Now insert the user into our users table
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          role_id,
          location_id
        })
        .select(`
          id,
          role_id,
          location_id
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

      // Combine auth and DB data
      const transformedData = {
        id: data.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || authData.user.email,
        role_id: data.role_id,
        location_id: data.location_id
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