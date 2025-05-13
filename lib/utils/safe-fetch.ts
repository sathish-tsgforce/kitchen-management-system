/**
 * A wrapper around fetch that handles errors and timeouts
 * @param url The URL to fetch
 * @param options Fetch options
 * @param timeout Timeout in milliseconds (default: 10000)
 * @returns An object with data, error, and status
 */
export async function safeFetch(
  url: string,
  options?: RequestInit,
  timeout = 10000,
): Promise<{
  data: any | null
  error: { message: string; details?: string } | null
  status: number | null
}> {
  try {
    // Create an abort controller for the timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Add the abort signal to the options
    const fetchOptions = {
      ...options,
      signal: controller.signal,
    }

    // Perform the fetch
    const response = await fetch(url, fetchOptions)

    // Clear the timeout
    clearTimeout(timeoutId)

    // Check if the response is OK
    if (!response.ok) {
      const contentType = response.headers.get("content-type") || ""
      let errorMessage = `Error: ${response.status} ${response.statusText}`
      let errorDetails = null

      if (contentType.includes("application/json")) {
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
            errorDetails = errorData.details || errorData.hint || null
          }
        } catch (e) {
          console.error("Failed to parse error response:", e)
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }
      } else {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      }

      return {
        data: null,
        error: { message: errorMessage, details: errorDetails },
        status: response.status,
      }
    }

    // Parse the response as JSON
    const data = await response.json()

    return {
      data,
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    // Handle fetch errors
    if (error.name === "AbortError") {
      return {
        data: null,
        error: { message: "Request timed out" },
        status: null,
      }
    }

    return {
      data: null,
      error: { message: error.message },
      status: null,
    }
  }
}
