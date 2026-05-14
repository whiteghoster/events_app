import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and required roles
const PROTECTED_ROUTES = {
  '/events/new': ['admin', 'manager'],
  '/events/[id]/edit': ['admin', 'manager'],
  '/users': ['admin'],
  '/catalog': ['admin', 'manager'],
}

// Routes that require authentication (any role)
const AUTH_ROUTES = [
  '/events',
  '/account',
]

// Public routes (no auth needed)
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get auth token and user role from cookies/localStorage (stored in cookie for SSR)
  const token = request.cookies.get('access_token')?.value
  const userRole = request.cookies.get('user_role')?.value
  
  // Check if route is public
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check if user is authenticated
  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Check role-based access for protected routes
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    // Handle dynamic routes like /events/[id]/edit
    const routePattern = route.replace(/\[.*?\]/g, '[^/]+')
    const regex = new RegExp(`^${routePattern}$`)
    
    if (regex.test(pathname)) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect to events list if not authorized
        return NextResponse.redirect(new URL('/events', request.url))
      }
    }
  }
  
  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
  return response
}

// Configure matcher for routes to run middleware on
export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
