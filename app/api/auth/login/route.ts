import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    console.log(`[API] Login attempt initiated`)

    // Look up the user by username (using the name field)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .ilike("name", username)
      .single()

    if (userError || !userData) {
      console.error("[API] User lookup error:", userError)
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    const email = userData.email
    console.log(`[API] User email resolved`)

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[API] Auth error:", error)
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    console.log(`[API] User authenticated successfully`)

    // Get user data with role
    const { data: userWithRole, error: roleError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        name,
        role_id,
        roles:roles(id, name)
      `)
      .eq("id", data.user.id)
      .single()

    if (roleError) {
      console.error("[API] Role lookup error:", roleError)
      return NextResponse.json({ error: "Failed to retrieve user role" }, { status: 500 })
    }

    if (!userWithRole) {
      console.error("[API] No user data found")
      return NextResponse.json({ error: "User not found in database" }, { status: 404 })
    }

    console.log("[API] User data with role retrieved")

    // Get role name - handle both array and object formats
    let roleName: string

    if (Array.isArray(userWithRole.roles)) {
      roleName = userWithRole.roles[0]?.name || "STAFF"
    } else if (typeof userWithRole.roles === "object" && userWithRole.roles) {
      roleName = userWithRole.roles.name || "STAFF"
    } else {
      // Fallback based on role_id
      roleName = userWithRole.role_id === 1 ? "ADMIN" : userWithRole.role_id === 2 ? "CHEF" : "STAFF"
    }

    console.log("[API] Role name:", roleName)

    // Transform the data
    const user = {
      id: userWithRole.id,
      email: userWithRole.email,
      username: username,
      name: userWithRole.name,
      role: roleName.toUpperCase(),
      roleId: userWithRole.role_id,
    }

    return NextResponse.json({
      user,
      session: data.session,
    })
  } catch (error: any) {
    console.error("[API] Login error:", error)
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 })
  }
}
