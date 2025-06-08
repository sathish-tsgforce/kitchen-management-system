import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"

// The exact bucket name
const BUCKET_NAME = "fortitude-culina-media"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")
    const url = searchParams.get("url") // Allow passing the full URL as an alternative

    if (!path && !url) {
      return NextResponse.json({ error: "No file path or URL provided" }, { status: 400 })
    }

    let filePath = path

    // If a URL was provided instead of a path, try to extract the path
    if (url && !path) {
      // Try different URL patterns to extract the path
      let extractedPath = null

      // Try signed URL pattern
      const signedMatch = url.match(/\/object\/([^?]+)/)
      if (signedMatch && signedMatch[1]) {
        extractedPath = decodeURIComponent(signedMatch[1])
      }

      // Try public URL pattern
      if (!extractedPath) {
        const publicMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
        if (publicMatch && publicMatch[1]) {
          extractedPath = publicMatch[1]
        }
      }

      // Try direct bucket URL pattern
      if (!extractedPath) {
        const bucketMatch = url.match(new RegExp(`/${BUCKET_NAME}/(.+)`))
        if (bucketMatch && bucketMatch[1]) {
          extractedPath = bucketMatch[1]
        }
      }

      filePath = extractedPath
    }

    if (!filePath) {
      return NextResponse.json({ error: "Could not determine file path" }, { status: 400 })
    }

    console.log(`Getting signed URL for path: ${filePath}`)

    // First check if the file exists
    const { data: existsData, error: existsError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(filePath.split("/").slice(0, -1).join("/") || undefined, {
        search: filePath.split("/").pop() || "",
      })

    if (existsError) {
      console.error("Error checking if file exists:", existsError)
      return NextResponse.json({ error: existsError.message }, { status: 500 })
    }

    const fileExists =
      existsData && existsData.length > 0 && existsData.some((item) => item.name === filePath.split("/").pop())

    if (!fileExists) {
      console.error(`File not found: ${filePath}`)
      // Return the original URL if the file doesn't exist
      return NextResponse.json({ url: url || null, error: "File not found", status: "not_found" })
    }

    // Generate a signed URL that expires in 5 minutes (300 seconds)
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).createSignedUrl(filePath, 300)

    if (error) {
      console.error("Error generating signed URL:", error)
      // Return the original URL if we can't generate a signed URL
      return NextResponse.json({ url: url || null, error: error.message, status: "error" })
    }

    console.log(`Signed URL generated successfully: ${data.signedUrl}`)
    return NextResponse.json({ url: data.signedUrl, status: "success" })
  } catch (error: any) {
    console.error("Error in get-signed-url API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
