import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key for admin access
const supabaseAdmin = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

// The exact bucket name
const BUCKET_NAME = "fortitude-culina-media"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 })
    }

    console.log(`Attempting to delete file: ${url}`)

    // Extract the file path from the URL
    const pathMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
    if (!pathMatch || !pathMatch[1]) {
      console.warn("Could not extract file path from URL:", url)
      return NextResponse.json({ error: "Invalid file URL format" }, { status: 400 })
    }

    const filePath = pathMatch[1]
    console.log(`Extracted file path: ${filePath}`)

    // Delete the file using the admin client
    const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath])

    if (error) {
      console.error("Error deleting file:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`File deleted successfully: ${filePath}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in delete file API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
