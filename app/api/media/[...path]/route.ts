import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

// The bucket name
const BUCKET_NAME = "fortitude-culina-media"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Get the file path from the URL
    const path = params.path.join("/")
    console.log("Requested media path:", path)

    // Download the file from Supabase
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).download(path)

    if (error) {
      console.error("Error downloading file:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (!data) {
      console.error("No data returned from Supabase")
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Determine the content type based on the file extension
    const fileExtension = path.split(".").pop()?.toLowerCase() || ""
    let contentType = "application/octet-stream"

    switch (fileExtension) {
      case "mp3":
        contentType = "audio/mpeg"
        break
      case "wav":
        contentType = "audio/wav"
        break
      case "ogg":
        contentType = "audio/ogg"
        break
      case "m4a":
        contentType = "audio/mp4"
        break
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg"
        break
      case "png":
        contentType = "image/png"
        break
      case "gif":
        contentType = "image/gif"
        break
      case "webp":
        contentType = "image/webp"
        break
    }

    // Convert the file data to an ArrayBuffer
    const arrayBuffer = await data.arrayBuffer()

    // Return the file with the appropriate content type
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Error in media proxy:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
