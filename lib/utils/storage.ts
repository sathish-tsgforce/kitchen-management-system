/**
 * Uploads a file to Supabase Storage via API route
 * @param file The file to upload
 * @param folderPath The folder path to upload to (e.g., "recipes/images")
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, folderPath = "uploads"): Promise<string> {
  try {
    console.log(`Uploading file to folder: ${folderPath}`)

    // Create form data
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folderPath)

    // Send request to API route
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload file")
    }

    const data = await response.json()
    console.log(`File uploaded successfully: ${data.url}`)
    return data.url
  } catch (error) {
    console.error("Error in uploadFile:", error)
    throw error
  }
}

/**
 * Checks if a URL is a valid Supabase storage URL
 * @param url The URL to check
 * @returns Boolean indicating if the URL is a valid Supabase storage URL
 */
export function isValidStorageUrl(url: string): boolean {
  if (!url) return false

  // Check if it's a string
  if (typeof url !== "string") return false

  // Check if it's a URL
  try {
    new URL(url)
  } catch (e) {
    return false
  }

  // Check if it's a Supabase storage URL
  return url.includes("supabase") && url.includes("storage")
}

/**
 * Deletes a file from Supabase Storage via API route
 * @param url The public URL of the file to delete
 * @returns A boolean indicating success
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    if (!url) return true

    // Validate URL
    if (!isValidStorageUrl(url)) {
      console.warn(`Skipping deletion for invalid URL: ${url}`)
      return true // Return true to avoid breaking the flow
    }

    console.log(`Attempting to delete file: ${url}`)

    // Send request to API route
    const response = await fetch("/api/delete-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to delete file")
    }

    console.log(`File deleted successfully`)
    return true
  } catch (error) {
    console.error("Error in deleteFile:", error)
    // Don't throw the error to prevent breaking the flow
    return false
  }
}
