import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token');
    const { pathname } = request.nextUrl;

    // Protected routes that require authentication
    const protectedRoutes = ['/chat'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // If user is NOT authenticated and trying to access protected route
    if (!token && isProtectedRoute) {
        // Redirect to login page (home page)
        return NextResponse.redirect(new URL('/', request.url));
    }

    // If user IS authenticated and is on the home page, redirect to /chat
    if (token && pathname === '/') {
        return NextResponse.redirect(new URL('/chat', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)',
    ],
};
