import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      )
    }
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Admin client not available" },
        { status: 500 }
      )
    }
    
    // Update user password in auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { password }
    )
    
    if (authError) {
      console.error(`Error updating password for user ${id}:`, authError)
      return NextResponse.json(
        { error: "Failed to update password", details: authError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`Error updating password for user ${params.id}:`, error)
    return NextResponse.json(
      { error: "Failed to update password", details: error.message },
      { status: 500 }
    )
  }
}