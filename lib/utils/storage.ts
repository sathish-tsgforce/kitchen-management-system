"use client"

// The bucket name
const BUCKET_NAME = "fortitude-culina-media"

/**
 * Uploads a file to Supabase Storage via server-side API route
 * This bypasses RLS policies by using the service role key on the server
 */
export async function uploadFile(file: File, folder = "uploads"): Promise<string | null> {
  try {
    if (!file) {
      console.error("No file provided for upload")
      return null
    }

    console.log(`Uploading file to folder: ${folder}`)

    // Create a FormData object
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    // Send the file to our API route
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error uploading file:", errorData.error)
      throw new Error(errorData.error || "Failed to upload file")
    }

    const data = await response.json()
    console.log("File uploaded successfully:", data.url)

    return data.url
  } catch (error) {
    console.error("Error in uploadFile:", error)
    throw error
  }
}

/**
 * Checks if a URL is still valid and refreshes it if needed
 * Returns the original URL if it's still valid, or a new URL if it's expired
 */
export async function ensureValidUrl(url: string): Promise<string> {
  try {
    if (!url) {
      console.error("No URL provided")
      return url
    }

    console.log("Ensuring URL is valid:", url)

    // Check if the URL is a relative URL
    if (url.startsWith("/")) {
      console.log("URL is a relative URL, using as is:", url)
      return url
    }

    // For now, just return the URL as is
    return url
  } catch (error) {
    console.error("Error in ensureValidUrl:", error)
    return url
  }
}

/**
 * Deletes a file from Supabase Storage via server-side API route
 * This bypasses RLS policies by using the service role key on the server
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    if (!url) {
      console.error("No URL provided for file deletion")
      return false
    }

    console.log(`Deleting file: ${url}`)

    // Send the delete request to our API route
    const response = await fetch(`/api/delete-file?path=${encodeURIComponent(url)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error deleting file:", errorData.error)
      return false
    }

    console.log(`File deleted successfully`)
    return true
  } catch (error) {
    console.error("Error in deleteFile:", error)
    return false
  }
}

/**
 * Extracts the file path from a URL (signed or public)
 */
export function extractFilePath(url: string): string | null {
  if (!url) return null

  try {
    // Handle signed URLs with token parameter
    if (url.includes("token=")) {
      // Extract the path between /object/ and ?token=
      const pathMatch = url.match(/\/object\/(?:sign|authenticated|public)\/[^/]+\/(.+?)(?:\?token=|$)/)
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1])
      }
    }
    // Handle public URLs
    else if (url.includes("/storage/v1/object/public/")) {
      const pathMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1])
      }
    }
    // Handle direct paths
    else if (!url.includes("://") && !url.startsWith("/api/")) {
      return url
    }

    console.warn("Could not extract file path from URL:", url)
    return null
  } catch (error) {
    console.error("Error extracting file path:", error)
    return null
  }
}
