import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // This is an empty middleware that doesn't do anything
  // We're just adding the export to fix the deployment error
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [], // Empty matcher means this middleware won't run on any paths
}
