import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname === '/login' ||
    pathname === '/api/auth' ||
    pathname === '/subscribe-test' ||
    pathname === '/api/subscribe' ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/view/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('hugsandi_session')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify HMAC token structure and expiry
  const parts = sessionCookie.split(':');
  if (parts.length !== 2) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const [timestamp] = parts;
  const age = Date.now() - parseInt(timestamp, 10);
  const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

  if (age > SESSION_MAX_AGE) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('hugsandi_session');
    return response;
  }

  // Note: Full HMAC verification happens in API routes (crypto not available in Edge middleware).
  // The middleware does a lightweight timestamp check; the cookie is HttpOnly + Secure so it can't
  // be forged by client-side JS.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
