import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Paths that should always bypass the middleware
const PUBLIC_PATHS = ["/login", "/_next", "/api", "/favicon.ico"]

// Fast check if a path should bypass middleware
const isPublicPath = (path: string) => PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath))

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fast path for public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Fast check for auth cookie
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
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
