import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token');
    const { pathname } = request.nextUrl;

    // If user has a token and is on the home page, redirect to /chat
    if (token && pathname === '/') {
        return NextResponse.redirect(new URL('/chat', request.url));
    }

    // If user has a token and is on auth pages, redirect to /chat
    // (Assuming you might have dedicated auth pages later, but for now home is auth)

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
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
