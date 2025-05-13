import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("[API] GET /api/roles: Fetching roles")

    const { data, error } = await supabase.from("roles").select("*").order("name")

    if (error) {
      console.error("[API] GET /api/roles: Database error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      return NextResponse.json(
        {
          error: "Failed to fetch roles",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log(`[API] GET /api/roles: Successfully fetched ${data.length} roles`)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[API] GET /api/roles: Unhandled exception:", {
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
