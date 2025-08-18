import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

// The exact bucket name
const BUCKET_NAME = "fortitude-culina-media"

// URL validity duration in seconds (7 days)
const URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60

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
    // This bypasses RLS policies
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true, // Use upsert to overwrite if file exists
    })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate a signed URL that expires in 7 days
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, URL_EXPIRY_SECONDS)

    if (signedUrlError) {
      console.error("Error generating signed URL:", signedUrlError)
      return NextResponse.json({ error: signedUrlError.message }, { status: 500 })
    }

    console.log(`File uploaded successfully: ${signedUrlData.signedUrl}`)

    // Return the signed URL
    return NextResponse.json({
      url: signedUrlData.signedUrl,
      path: data.path,
    })
  } catch (error: any) {
    console.error("Error in upload API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
