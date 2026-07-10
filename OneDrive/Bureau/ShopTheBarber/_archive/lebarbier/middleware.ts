import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Clerk middleware configuration for authentication and route protection
 * This middleware handles:
 * - Authentication checks for protected routes
 * - Redirects for authenticated/unauthenticated users
 * - Public route access
 */
export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/forgot-password',
    '/api/webhooks/clerk',
    '/api/health',
  ],
  
  // Routes that require authentication
  // All routes under /dashboard require authentication
  // User profile and settings also require authentication
  
  // Ignore these routes from authentication checks
  ignoredRoutes: [
    '/api/webhooks/clerk',
    '/_next/static(.*)',
    '/_next/image(.*)',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
  
  // Custom redirect logic
  afterAuth(auth, req: NextRequest) {
    const { userId, sessionId } = auth;
    const { pathname } = req.nextUrl;
    
    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (userId && sessionId) {
      if (pathname.startsWith('/sign-in') || 
          pathname.startsWith('/sign-up') || 
          pathname === '/forgot-password') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      
      // If user is on the home page and authenticated, redirect to dashboard
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    
    // If user is not signed in and trying to access protected routes
    if (!userId && !sessionId) {
      if (pathname.startsWith('/dashboard') || 
          pathname.startsWith('/user-profile') ||
          pathname.startsWith('/settings')) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    }
    
    // Allow the request to continue
    return NextResponse.next();
  },
});

export const config = {
  // Matcher configuration for which routes this middleware should run on
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};