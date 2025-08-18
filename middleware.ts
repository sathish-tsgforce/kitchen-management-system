import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define paths that should be accessible without authentication
const publicPaths = ['/login', '/reset-password']

// Define paths that should bypass middleware completely
const bypassPaths = ['/_next', '/static', '/images', '/fonts', '/favicon', '/api']

// Define file extensions that should bypass middleware
const bypassExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.json', '.woff', '.woff2', '.ttf']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the path should bypass middleware completely
  if (bypassPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Check if the path has a file extension that should bypass middleware
  if (bypassExtensions.some(ext => pathname.includes(ext))) {
    return NextResponse.next()
  }
  
  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Check for auth token in cookies
  const token = request.cookies.get('token')?.value
  
  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}