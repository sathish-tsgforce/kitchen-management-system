/**
 * A wrapper around fetch that handles errors safely and prevents UI freezes
 * This is critical for preventing the UI from freezing when API calls fail
 */
export async function safeFetch(
  url: string,
  options?: RequestInit,
): Promise<{ data: any; error: any; status: number }> {
  try {
    // Use a timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    let data
    try {
      // Check content type to determine how to parse the response
      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("application/json")) {
        // Parse as JSON if content type is JSON
        const text = await response.text()
        try {
          data = text ? JSON.parse(text) : {}
        } catch (e) {
          console.error("Failed to parse JSON response:", e)
          data = { message: text || "Invalid JSON response" }
        }
      } else {
        // For non-JSON responses, just get the text
        const text = await response.text()
        // Log the first 100 characters to help with debugging
        console.warn(`Non-JSON response (${contentType}):`, text.substring(0, 100))
        data = { message: "Unexpected response format", text: text.substring(0, 100) }
      }
    } catch (e) {
      console.error("Failed to read response:", e)
      data = { message: "Failed to read response" }
    }

    if (!response.ok) {
      return {
        data: null,
        error: data || { message: `HTTP error ${response.status}` },
        status: response.status,
      }
    }

    return { data, error: null, status: response.status }
  } catch (error) {
    // Handle network errors, timeouts, and other exceptions
    console.error("Network or fetch error:", error)
    const isAbortError = error instanceof DOMException && error.name === "AbortError"

    return {
      data: null,
      error: {
        message: isAbortError ? "Request timed out" : error.message || "Network error",
        original: error,
      },
      status: isAbortError ? 408 : 0,
    }
  }
}
