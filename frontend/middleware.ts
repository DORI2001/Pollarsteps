import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow access to signin and signup pages without auth
  if (pathname === '/signin' || pathname === '/signup') {
    return NextResponse.next();
  }

  // Check for token in cookies or headers
  const token = request.cookies.get('auth_token')?.value;

  // If trying to access protected routes without token, redirect to signup
  if (pathname === '/' || pathname.startsWith('/app')) {
    if (!token) {
      return NextResponse.redirect(new URL('/signup', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
