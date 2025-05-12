import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Create a Supabase client with the service role key for admin access
const supabaseAdmin = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

// The exact bucket name
const BUCKET_NAME = "fortitude-culina-media"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "uploads"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Uploading file to bucket: ${BUCKET_NAME}, folder: ${folder}`)

    // Generate a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase using the admin client with service role key
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true, // Use upsert to overwrite if file exists
    })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(data.path)

    console.log(`File uploaded successfully: ${urlData.publicUrl}`)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error: any) {
    console.error("Error in upload API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
