import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key for admin access
// This bypasses RLS policies
const supabaseAdmin = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

// The exact bucket name
const BUCKET_NAME = "fortitude-culina-media"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 })
    }

    console.log(`Deleting file: ${path}`)

    // Delete the file using the admin client
    const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove([path])

    if (error) {
      console.error("Error deleting file:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`File deleted successfully: ${path}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in delete-file API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
