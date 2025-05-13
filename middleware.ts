import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for these paths
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/") ||
    pathname.includes("/_next/") ||
    pathname.includes("/favicon.ico")
  ) {
    return NextResponse.next()
  }

  // Check for auth cookie - just a basic check to avoid unnecessary redirects
  const hasAuthCookie = request.cookies.has("sb-access-token") || request.cookies.has("sb-refresh-token")

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Allow the request to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
