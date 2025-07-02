import { NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log(`[API] GET /api/users/${id}: Fetching user`)

    // Get user from database with role and location
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select(`
        id,
        role_id,
        role:roles(id, name),
        location_id,
        location:locations(id, name, address, is_active)
      `)
      .eq("id", id)
      .single()

    if (dbError) {
      console.error(`[API] GET /api/users/${id}: Database error:`, {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      })

      if (dbError.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json(
        {
          error: "Failed to fetch user",
          details: dbError.message,
          hint: dbError.hint,
          code: dbError.code,
        },
        { status: 500 },
      )
    }

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If we have admin client, get user details from auth
    if (supabaseAdmin) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(id)

        if (authError) {
          console.error(`[API] GET /api/users/${id}: Auth error:`, {
            message: authError.message,
            details: authError.details,
          })

          // Return user with placeholder email/name if auth fails
          return NextResponse.json({
            id: dbUser.id,
            email: "Unable to fetch email",
            name: "Unable to fetch name",
            role_id: dbUser.role_id,
            role: dbUser.role ? dbUser.role[0]?.name : null,
            location_id: dbUser.location_id,
            location: dbUser.location ? dbUser.location[0] : null,
          })
        }

        if (!authUser.user) {
          return NextResponse.json({ error: "User not found in auth system" }, { status: 404 })
        }

        // Combine auth and DB data
        const transformedData = {
          id: dbUser.id,
          email: authUser.user.email,
          name: authUser.user.user_metadata?.name || authUser.user.email,
          role_id: dbUser.role_id,
          role: dbUser.role ? dbUser.role[0]?.name : null,
          location_id: dbUser.location_id,
          location: dbUser.location ? dbUser.location[0] : null,
        }

        console.log(`[API] GET /api/users/${id}: Successfully fetched user`)
        return NextResponse.json(transformedData)
      } catch (authError: any) {
        console.error(`[API] GET /api/users/${id}: Auth error:`, {
          message: authError.message,
          stack: authError.stack,
        })

        // Return user with placeholder email/name if auth fails
        return NextResponse.json({
          id: dbUser.id,
          email: "Unable to fetch email",
          name: "Unable to fetch name",
          role_id: dbUser.role_id,
          role: dbUser.role ? dbUser.role[0]?.name : null,
          location_id: dbUser.location_id,
          location: dbUser.location ? dbUser.location[0] : null,
        })
      }
    } else {
      // No admin client, return user with placeholder email/name
      return NextResponse.json({
        id: dbUser.id,
        email: "Unable to fetch email",
        name: "Unable to fetch name",
        role_id: dbUser.role_id,
        role: dbUser.role ? dbUser.role[0]?.name : null,
        location_id: dbUser.location_id,
        location: dbUser.location ? dbUser.location[0] : null,
      })
    }
  } catch (error: any) {
    const { id } = await params
    console.error(`[API] GET /api/users/${id}: Unhandled exception:`, {
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userData = await request.json()
    console.log(`[API] PATCH /api/users/${id}: Updating user:`, {
      ...userData,
      password: userData.password ? "********" : undefined,
    })

    // Extract fields to update
    const { email, password, name, role_id, location_id } = userData

    // Update auth user if email, password, or name is provided
    if (email !== undefined || password !== undefined || name !== undefined) {
      if (supabaseAdmin) {
        console.log(`[API] PATCH /api/users/${id}: Updating auth user`)
        
        const updateData: any = {}
        if (email !== undefined) updateData.email = email
        if (password !== undefined) updateData.password = password
        if (name !== undefined) updateData.user_metadata = { name }
        
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData)

        if (authError) {
          console.error(`[API] PATCH /api/users/${id}: Auth error:`, {
            message: authError.message,
            details: authError.details,
          })

          return NextResponse.json(
            {
              error: "Failed to update user in auth system",
              details: authError.message,
            },
            { status: 500 },
          )
        }
      } else {
        return NextResponse.json(
          {
            error: "Admin client not available, cannot update user details",
          },
          { status: 500 },
        )
      }
    }

    // Update user in database if role_id or location_id is provided
    if (role_id !== undefined || location_id !== undefined) {
      const updateData: any = {}
      if (role_id !== undefined) updateData.role_id = role_id
      if (location_id !== undefined) updateData.location_id = location_id

      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select(`
          id,
          role_id,
          role:roles(id, name),
          location_id,
          location:locations(id, name, address, is_active)
        `)
        .single()

      if (dbError) {
        console.error(`[API] PATCH /api/users/${id}: Database error:`, {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
        })

        if (dbError.code === "PGRST116") {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json(
          {
            error: "Failed to update user in database",
            details: dbError.message,
            hint: dbError.hint,
            code: dbError.code,
          },
          { status: 500 },
        )
      }

      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    }

    // Get updated user data
    return await GET(request, { params })
  } catch (error: any) {
    const { id } = await params
    console.error(`[API] PATCH /api/users/${id}: Unhandled exception:`, {
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log(`[API] DELETE /api/users/${id}: Deleting user`)

    // Delete user from database
    const { error: dbError } = await supabase.from("users").delete().eq("id", id)

    if (dbError) {
      console.error(`[API] DELETE /api/users/${id}: Database error:`, {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      })

      if (dbError.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json(
        {
          error: "Failed to delete user from database",
          details: dbError.message,
          hint: dbError.hint,
          code: dbError.code,
        },
        { status: 500 },
      )
    }

    // If we have admin client, delete auth user too
    if (supabaseAdmin) {
      console.log(`[API] DELETE /api/users/${id}: Deleting auth user`)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

      if (authError) {
        console.error(`[API] DELETE /api/users/${id}: Auth error:`, {
          message: authError.message,
          details: authError.details,
        })

        return NextResponse.json(
          {
            warning: `User deleted from database but could not be removed from auth system: ${authError.message}`,
          },
          { status: 200 },
        )
      }
    }

    console.log(`[API] DELETE /api/users/${id}: Successfully deleted user`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const { id } = await params
    console.error(`[API] DELETE /api/users/${id}: Unhandled exception:`, {
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