import { NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  console.log(`[API] DELETE /api/users: Deleting user`)

  try {
    // First, try to delete the user from auth
    let authDeleted = false
    let authError = null

    // Try with admin client first if available
    if (supabaseAdmin) {
      console.log(`[API] DELETE /api/users: Using admin client to delete auth user`)
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
        if (error) {
          console.error(`[API] DELETE /api/users: Admin auth deletion error occurred`)
          authError = error
        } else {
          console.log(`[API] DELETE /api/users: Auth user deleted successfully with admin client`)
          authDeleted = true
        }
      } catch (error) {
        console.error(`[API] DELETE /api/users: Admin auth deletion exception:`, error)
        authError = error
      }
    } else {
      console.log(`[API] DELETE /api/users: Admin client not available, skipping auth deletion`)
      authError = new Error("Admin client not available")
    }

    // Now delete the user from the database
    const { error: dbError } = await supabase.from("users").delete().eq("id", id)

    if (dbError) {
      console.error(`[API] DELETE /api/users: Database deletion error:`, {
        message: dbError.message,
        details: dbError.details,
      })
      return NextResponse.json(
        { error: "Failed to delete user from database", details: dbError.message },
        { status: 500 },
      )
    }

    // Return success with a warning if auth deletion failed
    if (!authDeleted && authError) {
      console.log(`[API] DELETE /api/users: User deleted from database but not from auth`)
      return NextResponse.json({
        success: true,
        warning: "User deleted from database but not from auth system. The auth record may need manual cleanup.",
        authError: authError.message,
      })
    }

    console.log(`[API] DELETE /api/users: User deleted successfully from both auth and database`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[API] DELETE /api/users: Unhandled exception:`, error)
    return NextResponse.json({ error: "Failed to delete user", details: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  console.log(`[API] PATCH /api/users/${id}: Updating user`)

  try {
    const userData = await request.json()
    console.log(`[API] PATCH /api/users/${id}: Update data:`, userData)

    // Update the user in the database
    const { data, error } = await supabase
      .from("users")
      .update({
        name: userData.name,
        role_id: userData.role_id,
      })
      .eq("id", id)
      .select(`
        id,
        email,
        name,
        role_id,
        role:roles(id, name)
      `)
      .single()

    if (error) {
      console.error(`[API] PATCH /api/users/${id}: Database error:`, {
        message: error.message,
        details: error.details,
      })
      return NextResponse.json({ error: "Failed to update user", details: error.message }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedData = {
      id: data.id,
      email: data.email,
      name: data.name,
      role_id: data.role_id,
      role: data.role ? data.role[0]?.name : null,
    }

    console.log(`[API] PATCH /api/users/${id}: User updated successfully:`, transformedData)
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error(`[API] PATCH /api/users/${id}: Unhandled exception:`, error)
    return NextResponse.json({ error: "Failed to update user", details: error.message }, { status: 500 })
  }
}
