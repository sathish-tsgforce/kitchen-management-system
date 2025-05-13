import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Check if roles table exists and get its structure
    const { data: roles, error: rolesError } = await supabase.from("roles").select("*")

    if (rolesError) {
      return NextResponse.json({
        success: false,
        error: "Failed to query roles table",
        details: rolesError,
      })
    }

    // Get a sample user with role join
    const { data: userWithRole, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        name,
        role_id,
        roles:roles(id, name)
      `)
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      roles,
      sampleUserWithRole: userWithRole,
      userError: userError
        ? {
            message: userError.message,
            details: userError.details,
            code: userError.code,
          }
        : null,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "An error occurred during diagnostic check",
      details: error.message,
    })
  }
}
